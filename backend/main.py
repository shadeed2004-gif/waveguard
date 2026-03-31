"""
WaveGuard – Python FastAPI Backend (PRIMARY)
============================================
Runs on http://localhost:8000

Start:  uvicorn main:app --reload --port 8000

Endpoints:
  POST /api/login       ← Admin login → returns session token (rate-limited)
  POST /api/logout      ← Invalidate token
  POST /api/buoy        ← Physical buoy device sends readings (validated)
  POST /api/test-buoy   ← Inject test reading without hardware
  GET  /api/status      ← Frontend polls every 5 s (public, cached 4 s)
  GET  /api/history     ← Last N buoy readings from SQLite
  GET  /api/health      ← Health check
"""

import os
import time
import secrets
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

import httpx
from dotenv import load_dotenv
load_dotenv()  # reads backend/.env

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

import models
import database

# ── Bootstrap ─────────────────────────────────────────────────
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="WaveGuard API", version="4.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Lock down in production (see README)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ── Credentials ────────────────────────────────────────────────
ADMIN_USER = os.getenv("WAVEGUARD_ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("WAVEGUARD_ADMIN_PASS", "waveguard2024")

# Token → expiry timestamp
VALID_TOKENS: Dict[str, float] = {}  # token → unix expiry time
TOKEN_TTL_SECONDS = 8 * 60 * 60     # 8 hour session

# Simple in-process login rate-limiter  (IP → [attempt_timestamps])
LOGIN_ATTEMPTS: dict = defaultdict(list)
MAX_ATTEMPTS   = 5
WINDOW_SECONDS = 60  # sliding window

MAX_HISTORY = 100
DIRECTIONS  = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

# Simple response cache for /api/status  (avoids hammering Open-Meteo)
_status_cache: dict = {"data": None, "expires": 0.0}
STATUS_CACHE_TTL = 4  # seconds — slightly less than frontend 5 s poll


# ── Schemas ────────────────────────────────────────────────────
class LoginPayload(BaseModel):
    username: str
    password: str


class BuoyPayload(BaseModel):
    buoy_id:       str   = Field(..., min_length=1, max_length=32)
    avg_motion:    float = Field(..., ge=0, le=100_000)   # sanity bounds
    wave_speed:    Optional[float] = Field(default=0.0, ge=0, le=50)
    lat:           Optional[float] = Field(default=None, ge=-90, le=90)
    lon:           Optional[float] = Field(default=None, ge=-180, le=180)
    eta:           Optional[float] = Field(default=None, ge=0)  # ETA in minutes
    device_status: Optional[str]   = Field(default=None, max_length=32)  # on-device classification


# ── Auth helpers ───────────────────────────────────────────────
def _purge_expired_tokens():
    now = time.time()
    expired = [t for t, exp in VALID_TOKENS.items() if exp < now]
    for t in expired:
        del VALID_TOKENS[t]


def require_auth(creds: HTTPAuthorizationCredentials = Depends(security)):
    _purge_expired_tokens()
    if creds is None or creds.credentials not in VALID_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
        )
    # Sliding window — refresh expiry on activity
    VALID_TOKENS[creds.credentials] = time.time() + TOKEN_TTL_SECONDS
    return creds.credentials


# ── Classification (matches ESP32 buoy thresholds) ─────────────
DISTANCE_TO_SHORE = 80_000.0  # 80 km in meters


def classify_buoy(avg_motion: float) -> str:
    """Matches ESP32 WaveGuard buoy g-force thresholds.
    Device labels:  CALM  /  MODERATE  /  HIGH WAVE
    System labels:  NORMAL / WATCH     / WARNING
    """
    if avg_motion < 0.05:  return "NORMAL"     # CALM
    if avg_motion < 0.10:  return "WATCH"      # MODERATE
    return "WARNING"                            # HIGH WAVE


def derive_wave_speed(avg_motion: float) -> float:
    """Wave speed from motion level, matches ESP32 buoy logic."""
    if avg_motion < 0.05:  return 1.0   # CALM
    if avg_motion < 0.10:  return 2.0   # MODERATE
    return 4.0                           # HIGH WAVE


def calculate_eta(wave_speed: float) -> float:
    """ETA in minutes from distance to shore, matches ESP32 buoy logic."""
    if wave_speed <= 0:
        return 0.0
    return (DISTANCE_TO_SHORE / wave_speed) / 60.0


def classify_satellite(hs: float, t: float) -> str:
    if hs < 1.5:              return "NORMAL"
    if hs < 2.5:              return "WATCH"
    if hs >= 2.5 and t >= 12: return "WARNING"
    return "WATCH"


def fusion_decision(buoy_status: str, sat_status: str) -> str:
    """Fuse buoy + satellite status.
    If the buoy spikes to WARNING but the satellite says NORMAL, we downgrade
    to WATCH to avoid false alarms (e.g., a boat hitting the buoy).
    Requires both to be elevated to trigger a full WARNING."""
    if buoy_status == "WARNING" and sat_status == "WARNING": return "WARNING"
    if buoy_status == "WARNING" and sat_status == "NORMAL":  return "WATCH"
    if buoy_status == "WARNING": return "WARNING"
    if buoy_status == "WATCH":   return "WATCH"
    if sat_status == "WARNING":  return "WARNING"
    if sat_status == "WATCH":    return "WATCH"
    return "NORMAL"


# ── Satellite fetch (with cache) ───────────────────────────────
async def get_satellite_data(mode: str = "live") -> dict:
    now = time.time()
    # Skip cache for historical mode so it doesn't pollute live data
    if mode == "live" and _status_cache["data"] and _status_cache["expires"] > now:
        return _status_cache["data"]

    hs, t, direction = 1.0, 8.0, "SW"
    swell_h, swell_p = 0.5, 8.0
    is_live = False

    url    = "https://marine-api.open-meteo.com/v1/marine"
    params = {
        "hourly": "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period",
        "timezone": "Asia/Kolkata",
    }
    if mode == "historical":
        # Offshore Kerala (9.0, 75.0) — coastal Kochi returns nulls in historical
        params["latitude"]   = 9.0
        params["longitude"]  = 75.0
        # Monsoon onset 2023 — Hs 2.4-3.0 m, guaranteed stormy data
        params["start_date"] = "2023-06-10"
        params["end_date"]   = "2023-06-13"
    else:
        params["latitude"]      = 10.05
        params["longitude"]     = 76.61
        params["forecast_days"] = 1
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=10.0)
            if resp.status_code == 200:
                d = resp.json()["hourly"]
                if mode == "historical":
                    # Pick the hour with the highest wave height for demo
                    heights = [v for v in d["wave_height"] if v is not None]
                    if heights:
                        peak_idx = d["wave_height"].index(max(heights))
                    else:
                        peak_idx = 0
                else:
                    peak_idx = 0
                hs      = d["wave_height"][peak_idx]       or hs
                t       = d["wave_period"][peak_idx]       or t
                raw_dir = d["wave_direction"][peak_idx]    or 225
                swell_h = d["swell_wave_height"][peak_idx] or swell_h
                swell_p = d["swell_wave_period"][peak_idx] or swell_p
                direction = DIRECTIONS[round(((raw_dir % 360) + 360) % 360 / 45) % 8]
                is_live = True
            else:
                print(f"WARNING: Open-Meteo returned {resp.status_code}. Using fallback.")
    except Exception as e:
        print(f"WARNING: Open-Meteo unreachable: {e}. Using fallback.")

    # In historical/demo mode, force WARNING when Hs is dangerous (≥2.5m)
    # because real Arabian Sea periods rarely hit the 12s WARNING threshold
    sat_class = classify_satellite(hs, t)
    if mode == "historical" and hs >= 2.5:
        sat_class = "WARNING"

    result = {
        "wave_height":       hs,
        "wave_period":       t,
        "wave_direction":    direction,
        "swell_wave_height": swell_h,
        "swell_wave_period": swell_p,
        "satellite_status":  sat_class,
        "is_live_data":      is_live,
        "mode":              mode,
    }
    # Only cache live mode results
    if mode == "live":
        _status_cache["data"]    = result
        _status_cache["expires"] = now + STATUS_CACHE_TTL
    return result


# ── DB write + trim ────────────────────────────────────────────
def _store_reading(data: BuoyPayload, db: Session) -> models.Reading:
    try:
        status_val = classify_buoy(data.avg_motion)
        speed = data.wave_speed if data.wave_speed else derive_wave_speed(data.avg_motion)
        eta   = data.eta if data.eta is not None else calculate_eta(speed)
        row = models.Reading(
            buoy_id       = data.buoy_id,
            avg_motion    = data.avg_motion,
            wave_speed    = speed,
            lat           = data.lat,
            lon           = data.lon,
            eta           = eta,
            device_status = data.device_status,
            buoy_status   = status_val,
            timestamp     = datetime.utcnow(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception as e:
        print(f"!!! DATABASE ERROR: {e}")
        db.rollback()
        raise e


# ── Auth Routes ────────────────────────────────────────────────
@app.post("/api/login")
async def login(body: LoginPayload, request: Request):
    """
    Validates credentials from environment variables.
    Rate-limited to 5 attempts per minute per IP.
    Returns a session token valid for 8 hours.
    """
    ip = request.client.host
    now = time.time()

    # Purge old attempts outside the window
    LOGIN_ATTEMPTS[ip] = [t for t in LOGIN_ATTEMPTS[ip] if now - t < WINDOW_SECONDS]

    if len(LOGIN_ATTEMPTS[ip]) >= MAX_ATTEMPTS:
        wait = int(WINDOW_SECONDS - (now - LOGIN_ATTEMPTS[ip][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {wait}s.",
        )

    LOGIN_ATTEMPTS[ip].append(now)

    if body.username == ADMIN_USER and body.password == ADMIN_PASS:
        token = secrets.token_hex(32)
        VALID_TOKENS[token] = now + TOKEN_TTL_SECONDS
        return {"token": token, "username": body.username}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password.",
    )

@app.post("/api/logout")
async def logout(token: str = Depends(require_auth)):
    VALID_TOKENS.pop(token, None)
    return {"success": True}

@app.post("/api/buoy")
async def receive_buoy(request: Request, db: Session = Depends(database.get_db)):
    try:
        body = await request.json()
        data = BuoyPayload(
            buoy_id       = body.get("buoy_id", "WG-01"),
            avg_motion    = body.get("avg_motion") or body.get("motion", 0.0),
            wave_speed    = body.get("wave_speed") or body.get("speed", 0.0),
            lat           = body.get("lat"),
            lon           = body.get("lon"),
            eta           = body.get("eta"),
            device_status = body.get("device_status") or body.get("status"),
        )
        row = _store_reading(data, db)
        return {"success": True, "status": row.buoy_status}
    except Exception as e:
        print(f"POST ERROR: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/buoy")
async def receive_buoy_get(request: Request, db: Session = Depends(database.get_db)):
    params = dict(request.query_params)
    try:
        data = BuoyPayload(
            buoy_id="WG-01",
            avg_motion=float(params.get("motion", 0.0)),
            wave_speed=float(params.get("speed", 0.0)),
            device_status=params.get("status", "CALM")
        )
        row = _store_reading(data, db)
        print(f"LIVE DATA: {row.buoy_status} (Motion: {row.avg_motion})")
        return {"success": True, "status": row.buoy_status}
    except Exception as e:
        print(f"GET ERROR: {e}")
        return {"success": False, "error": str(e)}



@app.post("/api/test-buoy")
async def test_buoy(
    motion: float = 0.15,
    speed:  float = 0.0,
    eta:    Optional[float] = None,
    device_status: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Inject a simulated reading. Browse http://localhost:8000/docs to use it.
    motion uses g-force scale: 0.03=CALM, 0.07=MODERATE, 0.15=HIGH WAVE"""
    data = BuoyPayload(
        buoy_id="WG-01-TEST", avg_motion=motion,
        wave_speed=speed, eta=eta, device_status=device_status,
    )
    row = _store_reading(data, db)
    return {"success": True, "status": row.buoy_status,
            "motion": row.avg_motion, "speed": row.wave_speed, "eta": row.eta}


# ── Status & History ───────────────────────────────────────────
@app.get("/api/status")
async def get_status(mode: str = "live", db: Session = Depends(database.get_db)):
    """Polled by browser every 5 s. Satellite response is cached for 4 s.
    Pass ?mode=historical to fetch archived stormy data for demo purposes."""
    latest = (db.query(models.Reading)
              .order_by(models.Reading.timestamp.desc())
              .first())

    # ── Stale Data Detection (Check if reading is older than 30s) ──
    buoy_online = False
    if latest:
        time_diff = datetime.now(timezone.utc) - latest.timestamp.replace(tzinfo=timezone.utc)
        if time_diff.total_seconds() < 30:
            buoy_online = True

    buoy_status    = latest.buoy_status    if buoy_online else "OFFLINE"
    avg_motion     = latest.avg_motion     if buoy_online else None
    wave_speed     = latest.wave_speed     if buoy_online else None
    lat            = latest.lat            if buoy_online else None
    lon            = latest.lon            if buoy_online else None
    eta            = latest.eta            if buoy_online else None
    device_status  = latest.device_status  if buoy_online else None
    updated_at     = (latest.timestamp.isoformat() + "Z") if latest else None

    sat = await get_satellite_data(mode=mode)

    fusion_status = (
        fusion_decision(buoy_status, sat["satellite_status"])
        if buoy_online else sat["satellite_status"]
    )

    # Last 50 readings for the live chart (reverse-chono → oldest first)
    history_rows = (db.query(models.Reading)
                    .order_by(models.Reading.timestamp.desc())
                    .limit(50).all())
    history = [
        {"time": r.timestamp.isoformat() + "Z",
         "motion": r.avg_motion, "speed": r.wave_speed or 0,
         "lat": r.lat, "lon": r.lon,
         "eta": r.eta, "device_status": r.device_status,
         "status": r.buoy_status}
        for r in reversed(history_rows)
    ]

    # Compute simple stats for analytics panel
    motions  = [r.avg_motion for r in history_rows]
    warnings = sum(1 for r in history_rows if r.buoy_status == "WARNING")
    watches  = sum(1 for r in history_rows if r.buoy_status == "WATCH")
    peak_motion    = max(motions) if motions else 0
    avg_motion_all = (sum(motions) / len(motions)) if motions else 0

    return {
        "buoy_online":       buoy_online,
        "buoy_status":       buoy_status,
        "device_status":     device_status,
        "satellite_status":  sat["satellite_status"],
        "fusion_status":     fusion_status,
        "avg_motion":        avg_motion,
        "wave_speed":        wave_speed,
        "lat":               lat,
        "lon":               lon,
        "eta":               eta,
        "wave_height":       sat["wave_height"],
        "wave_period":       sat["wave_period"],
        "wave_direction":    sat["wave_direction"],
        "swell_wave_height": sat["swell_wave_height"],
        "swell_wave_period": sat["swell_wave_period"],
        "is_live_data":      sat["is_live_data"],
        "updated_at":        updated_at,
        "history":           history,
        "analytics": {
            "peak_motion":      round(peak_motion, 3),
            "avg_motion":       round(avg_motion_all, 3),
            "warning_count":    warnings,
            "watch_count":      watches,
            "total_readings":   len(history_rows),
        },
    }


@app.get("/api/history")
async def get_history(limit: int = 50, db: Session = Depends(database.get_db)):
    rows = (db.query(models.Reading)
            .order_by(models.Reading.timestamp.desc())
            .limit(min(limit, 200)).all())
    return [
        {"time": r.timestamp.isoformat() + "Z", "motion": r.avg_motion,
         "speed": r.wave_speed, "eta": r.eta, "device_status": r.device_status,
         "status": r.buoy_status, "buoy": r.buoy_id}
        for r in reversed(rows)
    ]


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "WaveGuard API v4",
            "timestamp": datetime.now(timezone.utc).isoformat()}

