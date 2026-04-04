# 🔌 Flashing the WaveGuard Buoy — Arduino IDE Guide

This guide walks you through installing the required tools, configuring the sketch,
and uploading firmware v4.1.0 to the ESP32 buoy.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Arduino IDE | 2.x (latest) | https://www.arduino.cc/en/software |
| ESP32 board package | ≥ 3.0 | see Step 2 below |
| USB-A to Micro-USB / USB-C cable | — | data cable (not charge-only) |

---

## Step 1 — Install Arduino IDE 2

1. Download the installer for your OS from https://www.arduino.cc/en/software
2. Run the installer and accept the default options.
3. Launch **Arduino IDE 2**.

---

## Step 2 — Add the ESP32 Board Package

1. Open **File → Preferences** (macOS: **Arduino IDE → Preferences**).
2. In **Additional boards manager URLs**, paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Click **OK**.
4. Open **Tools → Board → Boards Manager**.
5. Search for `esp32` (by Espressif Systems) and click **Install**.
   - Version 3.x is recommended.
6. Once installed, close the Boards Manager.

---

## Step 3 — Install Required Libraries

Open **Tools → Manage Libraries** (or `Ctrl+Shift+I`) and install:

| Library | Author | Version |
|---------|--------|---------|
| **Adafruit MPU6050** | Adafruit | ≥ 2.2 |
| **Adafruit Unified Sensor** | Adafruit | ≥ 1.1 |
| **Adafruit BusIO** | Adafruit | ≥ 1.14 |
| **TinyGPS++** *(optional, GPS only)* | Mikal Hart | ≥ 1.0 |
| **TinyGSM** *(optional, GSM fallback)* | Volodymyr Shymanskyy | ≥ 0.11 |

> Install dependencies when prompted — Adafruit MPU6050 requires Adafruit Unified Sensor
> and Adafruit BusIO.

---

## Step 4 — Configure `config.h`

Before flashing, edit `firmware/config.h` with your settings:

```cpp
// WiFi — use the same network as your laptop
#define WIFI_SSID        "YourNetworkName"
#define WIFI_PASSWORD    "YourNetworkPassword"

// Backend — run `ipconfig` (Windows) or `ip addr` (Linux/macOS) to find your IP
#define SERVER_IP        "192.168.1.100"   // ← replace with your laptop's IPv4
#define SERVER_PORT      8005
```

> ⚠️ The ESP32 and the laptop must be on the **same WiFi network**.
> The FastAPI backend must be started with `--host 0.0.0.0 --port 8005`
> (see [`how_to_run.md`](../how_to_run.md)).

---

## Step 5 — Open the Sketch

1. In Arduino IDE, go to **File → Open**.
2. Navigate to `firmware/waveguard_buoy/` and open `waveguard_buoy.ino`.
3. Arduino IDE will open the multi-file sketch. You should see two tabs:
   - `waveguard_buoy.ino` (main sketch)
   - `config.h` (configuration header)

> **Important:** `config.h` must be in the same directory as `waveguard_buoy.ino`.
> Arduino IDE automatically includes all files in the same folder.

---

## Step 6 — Select the Board and Port

1. Plug the ESP32 into your computer via USB.
2. Go to **Tools → Board → esp32 → ESP32 Dev Module** (or your specific variant).
3. Go to **Tools → Port** and select the COM port (Windows: `COMx`, macOS/Linux: `/dev/ttyUSBx` or `/dev/tty.usbserial-x`).

**Recommended Board Settings:**

| Setting | Value |
|---------|-------|
| Board | ESP32 Dev Module |
| Upload Speed | 921600 |
| CPU Frequency | 240 MHz |
| Flash Frequency | 80 MHz |
| Flash Mode | DIO |
| Flash Size | 4 MB |
| Partition Scheme | Default 4MB with spiffs |
| Core Debug Level | None |
| PSRAM | Disabled |

---

## Step 7 — Compile (Verify)

Click the **✓ Verify** button (or `Ctrl+R`) to compile without uploading.

Expected output in the console:
```
Sketch uses 892344 bytes (68%) of program storage space.
Global variables use 49204 bytes (15%) of dynamic memory.
```

> If you see errors about missing libraries, return to Step 3.

---

## Step 8 — Upload

1. Click the **→ Upload** button (or `Ctrl+U`).
2. Watch the console for:
   ```
   Connecting...
   Chip is ESP32-D0WD-V3 (revision v3.1)
   ...
   Leaving...
   Hard resetting via RTS pin...
   ```
3. The ESP32 will reset automatically after flashing.

> **If the upload fails with "Failed to connect":**
> - Hold the **BOOT** button on the ESP32 while clicking Upload, then release it once
>   `Connecting...` appears.
> - Some ESP32 boards require the BOOT button to be held for the first few seconds of upload.

---

## Step 9 — Verify in Serial Monitor

1. Open **Tools → Serial Monitor** (or `Ctrl+Shift+M`).
2. Set baud rate to **115200**.
3. Press the **EN / RESET** button on the ESP32.

You should see:
```
╔══════════════════════════════════════╗
║  WaveGuard Buoy  Firmware v4.1.0   ║
║  Buoy ID: WG-01                       ║
╚══════════════════════════════════════╝
[MPU] MPU-6050 initialised (±2 g, 250 °/s, 21 Hz LPF)
[WiFi] Connecting to YourNetworkName..........
[WiFi] Connected  IP: 192.168.1.42
─────────────────────────────────────
[SENSOR] Avg motion (g): 0.0183
[SENSOR] Wave speed (m/s): 1.0
[SENSOR] ETA (min): 1333.3
[SENSOR] Status: CALM
[HTTP] Sending: http://192.168.1.100:8005/api/buoy?buoy_id=WG-01&...
[HTTP] Response code: 200
[HTTP] Payload: {"success":true,"status":"NORMAL"}
```

A **200** response code confirms the buoy is successfully communicating with the backend.

---

## Troubleshooting

### "Failed to connect to ESP32: Timed out"
- Hold the **BOOT** button while clicking Upload.
- Check that the correct **Port** is selected under Tools.
- Try a different USB cable (some are charge-only).

### "No module named MPU6050" / library errors
- Ensure all three Adafruit libraries (MPU6050, Unified Sensor, BusIO) are installed.
- Restart Arduino IDE after installing libraries.

### WiFi timeout / cannot connect
- Confirm `WIFI_SSID` and `WIFI_PASSWORD` are correct in `config.h`.
- Ensure the ESP32 and laptop are on the same 2.4 GHz network.
  (ESP32 does not support 5 GHz WiFi.)

### HTTP response code -1 or connection refused
- Confirm the FastAPI backend is running: `python -m uvicorn main:app --host 0.0.0.0 --port 8005`
- Confirm `SERVER_IP` in `config.h` matches your laptop's current IPv4 address.
- On Windows: allow Python through the Windows Defender Firewall.

### Built-in LED blinking rapidly (no Serial output)
- The MPU-6050 was not detected. Check I2C wiring (SDA → GPIO21, SCL → GPIO22)
  and confirm the sensor is powered (3.3 V).

---

## Updating the Firmware

To update to a new firmware version:

1. Pull the latest code from the repository.
2. Re-edit `config.h` with your settings (it may have been reset to template values).
3. Repeat Steps 7–9 above.

Firmware version is printed to Serial on every boot and defined in `config.h`:
```cpp
#define FIRMWARE_VERSION "4.1.0"
```
