# 🛜 WaveGuard Firmware

ESP32 firmware for the WaveGuard marine buoy. Reads the MPU-6050 accelerometer,
classifies sea-state, and HTTP-POSTs telemetry to the FastAPI backend every 5 s.

---

## Directory Layout

```
firmware/
├── config.h                    ← Central configuration (WiFi, API, pins, thresholds)
├── waveguard_buoy/
│   └── waveguard_buoy.ino      ← Main Arduino sketch (v4.1.0)
├── docs/
│   ├── pinout.md               ← GPIO pin assignments & wiring diagram
│   └── power_budget.md         ← Power consumption analysis
├── README.md                   ← This file
└── FLASHING.md                 ← Step-by-step flashing guide
```

---

## Hardware Bill of Materials

| # | Component | Model | Qty | Notes |
|---|-----------|-------|-----|-------|
| 1 | Microcontroller | ESP32 DevKit (38-pin) | 1 | Any 38-pin variant works |
| 2 | IMU | MPU-6050 | 1 | I2C, ±2 g accelerometer |
| 3 | GPS module *(optional)* | NEO-6M / NEO-8M | 1 | UART, 9600 baud |
| 4 | GSM module *(optional)* | SIM800L | 1 | UART fallback, needs SIM card |
| 5 | Power supply | LiPo 3.7 V 2000 mAh | 1 | ~8 h runtime, see power_budget.md |
| 6 | Waterproof enclosure | IP67 box | 1 | ≥ 100 × 60 × 35 mm |

---

## Quick Setup

1. **Configure** — copy `config.h` values for your network and server IP
2. **Flash** — follow [`FLASHING.md`](FLASHING.md) (Arduino IDE 2.x)
3. **Verify** — open Serial Monitor at 115200 baud; you should see:

```
╔══════════════════════════════════════╗
║  WaveGuard Buoy  Firmware v4.1.0   ║
║  Buoy ID: WG-01                       ║
╚══════════════════════════════════════╝
[MPU] MPU-6050 initialised (±2 g, 250 °/s, 21 Hz LPF)
[WiFi] Connecting to YourSSID..........
[WiFi] Connected  IP: 192.168.1.42
─────────────────────────────────────
[SENSOR] Avg motion (g): 0.0231
[SENSOR] Wave speed (m/s): 1.0
[SENSOR] ETA (min): 1333.3
[SENSOR] Status: CALM
[HTTP] Response code: 200
```

---

## Configuration Reference

All settings live in `firmware/config.h`. The most important ones:

| Constant | Default | Description |
|----------|---------|-------------|
| `BUOY_ID` | `"WG-01"` | Unique device identifier sent with every reading |
| `WIFI_SSID` | `"YOUR_WIFI_SSID"` | **Must be set** — your shared WiFi network |
| `WIFI_PASSWORD` | `"YOUR_WIFI_PASSWORD"` | **Must be set** |
| `SERVER_IP` | `"192.168.1.100"` | **Must be set** — laptop's IPv4 address |
| `SERVER_PORT` | `8005` | FastAPI backend port |
| `SEND_INTERVAL_MS` | `5000` | Transmission interval (ms) |
| `THRESHOLD_CALM` | `0.05` | g-force below which sea state = CALM |
| `THRESHOLD_MODERATE` | `0.10` | g-force below which sea state = MODERATE |

> ⚠️ Never commit `config.h` with real credentials. Add it to `.gitignore` on
> development machines — only the template version lives in the repository.

---

## Data Flow

```
MPU-6050 (I2C)
     │  20 samples × 10 ms
     ▼
 readAvgMotion()   → g-force magnitude (DC-gravity removed)
     │
     ▼
classifyMotion()   → "CALM" / "MODERATE" / "HIGH WAVE"
deriveWaveSpeed()  → 1 / 2 / 4 m/s
calculateETA()     → minutes to shore (80 km default)
     │
     ▼
 HTTP GET  /api/buoy?buoy_id=WG-01&motion=…&speed=…&eta=…&status=…
     │
     ▼
 FastAPI backend   → fusion with Open-Meteo satellite data → alert decision
     │
     ▼
 React Dashboard   → live gauges, map, history chart
```

---

## Alert Thresholds

These match the backend's `classify_buoy()` function in `backend/main.py`:

| g-force | Device label | Backend label | Dashboard colour |
|---------|-------------|---------------|-----------------|
| `< 0.05 g` | CALM | NORMAL | 🟢 Green |
| `0.05 – 0.09 g` | MODERATE | WATCH | 🟡 Amber |
| `≥ 0.10 g` | HIGH WAVE | WARNING | 🔴 Red |

---

## Changelog

### v4.1.0 (current)
- URL-encode the `status` query parameter to handle spaces (`HIGH%20WAVE`)
- HTTP timeout now reads from `HTTP_TIMEOUT_MS` in `config.h` (default 8 s)
- GPS diagnostics: byte count and satellite count printed to Serial
- Detailed HTTP error codes via `HTTPClient::errorToString()`

### v4.0.0
- Initial release with WiFi, MPU-6050, and backend integration
