# ⚡ WaveGuard Buoy — Power Budget Analysis

Power consumption breakdown for the ESP32-based marine buoy to estimate battery life
and select the appropriate power source.

---

## Component Current Draw

| Component | Mode | Typical Current | Notes |
|-----------|------|-----------------|-------|
| ESP32 DevKit | Active (WiFi TX) | 240 mA | Peak during WiFi burst |
| ESP32 DevKit | Active (WiFi idle) | 80 mA | WiFi on, not transmitting |
| ESP32 DevKit | Light sleep | 0.8 mA | WiFi off, CPU sleeping |
| ESP32 DevKit | Deep sleep | 0.01 mA | Minimum power state |
| MPU-6050 | Normal operation | 3.9 mA | Accelerometer + gyro active |
| MPU-6050 | Sleep mode | 0.005 mA | Gyro off, accel cycling |
| NEO-6M GPS | Acquisition | 45 mA | Searching for satellites |
| NEO-6M GPS | Tracking (fix) | 25 mA | Locked onto satellites |
| NEO-6M GPS | Power-save | 11 mA | 1 Hz update rate |
| SIM800L GSM | Idle (registered) | 18 mA | Connected to network |
| SIM800L GSM | Data burst (GPRS) | 350 mA peak | 50 mA average during transfer |

---

## Current Configuration Power Budget

### Mode A — WiFi + MPU-6050 (no GPS, no GSM)

This is the default shipping configuration defined in `config.h`.

| Phase | Duration (ms) | Current (mA) | mAs consumed |
|-------|--------------|--------------|--------------|
| Sample 20 readings (active) | 200 | 84 | 16.8 |
| Compute + build HTTP request | 10 | 84 | 0.84 |
| WiFi transmit & receive | 500 | 240 | 120 |
| Idle (waiting for next cycle) | 4290 | 80 | 343.2 |
| **Total per 5 s cycle** | 5000 | — | **480.84 mAs** |

Average current = 480.84 mAs ÷ 5 s = **~96 mA**

### Mode B — WiFi + MPU-6050 + GPS

| Phase | Duration (ms) | Current (mA) | mAs consumed |
|-------|--------------|--------------|--------------|
| GPS poll window | 10000 | 109 | 1090 |
| Sample + compute + transmit | 710 | 324 | 230 |
| Idle | 4290 | 104 | 446 |
| **Total per 5 s cycle** | 15000 | — | **1766 mAs** |

Average current (GPS included in cycle) = **~118 mA**

> GPS extends the effective cycle time to ~15 s (10 s GPS + 5 s idle).

---

## Battery Life Estimates

### LiPo 3.7 V 2000 mAh (7.4 Wh)

| Mode | Avg Current | Estimated Runtime |
|------|-------------|-------------------|
| WiFi + MPU only | 96 mA | **~20.8 hours** |
| WiFi + MPU + GPS | 118 mA | **~16.9 hours** |
| WiFi + MPU + GSM | ~130 mA | **~15.4 hours** |

### LiPo 3.7 V 5000 mAh (18.5 Wh)

| Mode | Avg Current | Estimated Runtime |
|------|-------------|-------------------|
| WiFi + MPU only | 96 mA | **~52 hours** |
| WiFi + MPU + GPS | 118 mA | **~42 hours** |

---

## Recommendations for Extended Deployment

### Option 1 — Light Sleep Between Readings

Enable ESP32 light sleep during the idle phase (~4.3 s per cycle) to reduce idle
current from 80 mA to ~1 mA. This requires disabling `--reload` in uvicorn and
accepting slightly slower reconnect times.

Estimated average current reduction: **80 mA → ~20 mA** (WiFi must be briefly
reinitialised each cycle).

### Option 2 — Solar + LiPo

A 5 W solar panel (Voc ≈ 6 V) with a TP4056 charge controller provides continuous
operation in sunny coastal environments. Expected charge current: ~800 mA in direct
sunlight.

### Option 3 — Extend Transmission Interval

Increasing `SEND_INTERVAL_MS` from 5000 to 30000 (30 s) reduces WiFi burst
frequency and saves proportionally. The backend `buoy_online` stale-data window
is 30 s — keep the interval below this for real-time detection.

---

## USB Power Supply (Desk / Lab Deployment)

When powered via USB (5 V, 500 mA minimum), the on-board LDO provides a stable 3V3
rail for all sensors. USB supply current:

| Config | ESP32 (VIN) | Sensors | Total |
|--------|------------|---------|-------|
| WiFi only | 240 mA peak | — | ~240 mA peak / 80 mA avg |
| + MPU-6050 | +4 mA | | ~84 mA avg |
| + GPS | +45 mA | | ~130 mA avg |

A **1 A USB charger** is recommended for stable operation with all modules active.

> ⚠️ SIM800L cannot be powered from USB via the ESP32 3V3 pin. It requires a
> dedicated 4.2 V / 2 A supply. See [`pinout.md`](pinout.md) for details.
