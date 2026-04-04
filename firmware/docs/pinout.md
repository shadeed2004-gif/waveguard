# 📌 WaveGuard Buoy — GPIO Pin Configuration

All pin numbers refer to **ESP32 DevKit (38-pin)** GPIO numbers, not physical pin numbers.

---

## I2C — MPU-6050 Accelerometer / Gyroscope

| ESP32 GPIO | MPU-6050 Pin | Wire Colour (suggestion) | Notes |
|------------|-------------|--------------------------|-------|
| **GPIO 21** (SDA) | SDA | Yellow | Default I2C SDA |
| **GPIO 22** (SCL) | SCL | Green | Default I2C SCL |
| 3V3 | VCC | Red | 3.3 V supply |
| GND | GND | Black | Common ground |
| GND | AD0 | Black | Sets I2C address to 0x68 |
| — | INT | — | Interrupt (not used in firmware) |

> To use address `0x69` instead, connect AD0 to 3V3 and update `MPU6050_ADDR` in `config.h`.

---

## UART2 — GPS Module (Optional, NEO-6M / NEO-8M)

| ESP32 GPIO | GPS Pin | Wire Colour | Notes |
|------------|---------|-------------|-------|
| **GPIO 16** (RX2) | TX | White | GPS transmits → ESP32 receives |
| **GPIO 17** (TX2) | RX | Purple | ESP32 transmits → GPS receives (optional) |
| 3V3 | VCC | Red | 3.3 V supply |
| GND | GND | Black | Common ground |

> The GPS module transmits NMEA sentences at 9600 baud.
> Only the RX2 pin is strictly required; TX2 is included for completeness.

---

## UART1 — GSM SIM800L (Optional, Fallback Connectivity)

| ESP32 GPIO | SIM800L Pin | Wire Colour | Notes |
|------------|------------|-------------|-------|
| **GPIO 26** (RX1) | TXD | White | SIM800L transmits → ESP32 receives |
| **GPIO 27** (TX1) | RXD | Purple | ESP32 transmits → SIM800L receives |
| External 4.2 V | VCC | Red | **⚠️ Requires 3.7–4.2 V @ 2 A — use separate LiPo regulator** |
| GND | GND | Black | Common ground |

> ⚠️ SIM800L peak current draw is ~2 A. Powering it from the ESP32 3V3 pin will cause
> brownouts and resets. Use a dedicated LiPo battery and regulator.

---

## Power Rails

| Rail | Source | Max Current | Connected To |
|------|--------|-------------|--------------|
| 3V3 | ESP32 on-board LDO | 600 mA | MPU-6050, GPS module |
| VIN / 5V | USB or LiPo boost | — | ESP32 VIN |
| External 4.2 V | Separate LiPo reg | 2 A | SIM800L only |

---

## Wiring Diagram (ASCII)

```
                    ┌─────────────────────┐
                    │   ESP32 DevKit v1   │
                    │                     │
   ┌──────────────┐ │  GPIO21 (SDA) ──────┼──── SDA  ┐
   │  MPU-6050    │ │  GPIO22 (SCL) ──────┼──── SCL  ├── MPU-6050
   │  (I2C)       │ │  3V3  ─────────────┼──── VCC  │
   └──────────────┘ │  GND  ─────────────┼──── GND  ┘
                    │                     │
   ┌──────────────┐ │  GPIO16 (RX2) ──────┼──── TX   ┐
   │  NEO-6M GPS  │ │  GPIO17 (TX2) ──────┼──── RX   ├── GPS (optional)
   │  (UART2)     │ │  3V3  ─────────────┼──── VCC  │
   └──────────────┘ │  GND  ─────────────┼──── GND  ┘
                    │                     │
   ┌──────────────┐ │  GPIO26 (RX1) ──────┼──── TXD  ┐
   │  SIM800L GSM │ │  GPIO27 (TX1) ──────┼──── RXD  ├── GSM (optional)
   │  (UART1)     │ │  [4.2V external] ───┼──── VCC  │   external power only!
   └──────────────┘ │  GND  ─────────────┼──── GND  ┘
                    │                     │
                    │  USB / VIN  ────────┼──── 5V supply
                    └─────────────────────┘
```

---

## Default Pin Assignments in `config.h`

```cpp
// I2C (MPU-6050)
#define SDA_PIN     21
#define SCL_PIN     22

// GPS UART2
#define GPS_RX_PIN  16
#define GPS_TX_PIN  17

// GSM UART1
#define GSM_RX_PIN  26
#define GSM_TX_PIN  27
```

All of these can be reassigned in `config.h` if your PCB layout differs.

---

## Notes on ESP32 GPIO Limitations

- **GPIO 34–39** are input-only and cannot be used for TX/SCL/SDA.
- **GPIO 6–11** are connected to the internal flash — do **not** use them.
- **GPIO 0, 2, 12, 15** have boot-strapping functions — use with care.
- SDA and SCL can be remapped to any GPIO via `Wire.begin(SDA_PIN, SCL_PIN)`.
