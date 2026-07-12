// ═══════════════════════════════════════════════════════════
//   WAVEGUARD — FIRMWARE v4.1.0
//   Smart Near-Shore Swell Surge Early-Warning Buoy
//   Target: ESP32 (any 38-pin variant)
//
//   Fixes in v4.1.0:
//     • URL encoding for status string (spaces → %20)
//     • HTTP timeout now respects HTTP_TIMEOUT_MS from config.h
//     • GPS byte diagnostics in Serial output
//     • Detailed connection error codes in Serial log
//
//   Libraries required (install via Arduino Library Manager):
//     • Adafruit MPU6050 (+ Adafruit Unified Sensor, Adafruit BusIO)
//     • TinyGPS++ (optional — only if GPS_ENABLED in config.h)
//     • TinyGSM  (optional — only if GSM_ENABLED  in config.h)
// ═══════════════════════════════════════════════════════════

#include "config.h"

// Compile-time guard: fail if placeholder credentials are still set in config.h.
// String literal indexing is valid in constexpr contexts (C++11).
static_assert(
  !(WIFI_SSID[0] == 'Y' && WIFI_SSID[1] == 'O' && WIFI_SSID[2] == 'U' && WIFI_SSID[3] == 'R'),
  "config.h: WIFI_SSID is still set to the placeholder. Set your real network SSID."
);
static_assert(
  !(SERVER_IP[0] == 'Y' && SERVER_IP[1] == 'O' && SERVER_IP[2] == 'U' && SERVER_IP[3] == 'R'),
  "config.h: SERVER_IP is still set to the placeholder. Set your laptop's IPv4 address."
);

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#ifdef GPS_ENABLED
  #include <TinyGPS++.h>
  HardwareSerial gpsSerial(2);   // UART2
  TinyGPSPlus   gps;
  float g_lat = 0.0f;
  float g_lon = 0.0f;
#endif

#ifdef GSM_ENABLED
  // TinyGSM must be included before any WiFi usage is disabled
  #define TINY_GSM_MODEM_SIM800
  #include <TinyGsmClient.h>
  HardwareSerial gsmSerial(1);
  TinyGsm        modem(gsmSerial);
  TinyGsmClient  gsmClient(modem);
#endif

// ── Globals ──────────────────────────────────────────────────
Adafruit_MPU6050 mpu;
unsigned long    lastSendTime = 0;

// ── Helper: URL-encode a string (spaces → %20, etc.) ─────────
String urlEncode(const String &src) {
  String encoded = "";
  for (int i = 0; i < src.length(); i++) {
    char c = src.charAt(i);
    if (isAlphaNumeric(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else {
      char buf[4];
      snprintf(buf, sizeof(buf), "%%%02X", (unsigned char)c);
      encoded += buf;
    }
  }
  return encoded;
}

// ── WiFi ─────────────────────────────────────────────────────
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  if (DEBUG_SERIAL) {
    Serial.print("[WiFi] Connecting to ");
    Serial.print(WIFI_SSID);
  }

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT_MS) {
      if (DEBUG_SERIAL) Serial.println("\n[WiFi] Timeout — could not connect.");
      return;
    }
    delay(500);
    if (DEBUG_SERIAL) Serial.print('.');
  }

  if (DEBUG_SERIAL) {
    Serial.println();
    Serial.print("[WiFi] Connected  IP: ");
    Serial.println(WiFi.localIP());
  }
}

// ── GPS (optional) ────────────────────────────────────────────
#ifdef GPS_ENABLED
void updateGPS() {
  unsigned long start    = millis();
  unsigned long deadline = GPS_FIX_TIMEOUT_S * 1000UL;
  int           bytesRead = 0;

  while (millis() - start < deadline) {
    while (gpsSerial.available()) {
      char c = gpsSerial.read();
      bytesRead++;
      gps.encode(c);
    }
  }

  if (DEBUG_SERIAL) {
    Serial.print("[GPS] Bytes read: ");
    Serial.print(bytesRead);
    Serial.print("  Satellites: ");
    Serial.print(gps.satellites.value());
    Serial.print("  Fix valid: ");
    Serial.println(gps.location.isValid() ? "YES" : "NO");
  }

  if (gps.location.isValid()) {
    g_lat = (float)gps.location.lat();
    g_lon = (float)gps.location.lng();
  }
}
#endif

// ── GSM fallback (optional) ───────────────────────────────────
#ifdef GSM_ENABLED
void connectGSM() {
  gsmSerial.begin(GSM_BAUD, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  delay(3000);  // modem boot
  if (DEBUG_SERIAL) Serial.println("[GSM] Initialising modem...");
  modem.restart();

  String modemInfo = modem.getModemInfo();
  if (DEBUG_SERIAL) {
    Serial.print("[GSM] Modem: ");
    Serial.println(modemInfo);
  }

  if (!modem.gprsConnect(GSM_APN, GSM_USER, GSM_PASS)) {
    if (DEBUG_SERIAL) Serial.println("[GSM] GPRS connect failed.");
  } else {
    if (DEBUG_SERIAL) Serial.println("[GSM] GPRS connected.");
  }
}
#endif

// ── MPU-6050 ─────────────────────────────────────────────────
bool initMPU() {
  Wire.begin(SDA_PIN, SCL_PIN);
  if (!mpu.begin(MPU6050_ADDR)) {
    if (DEBUG_SERIAL) Serial.println("[MPU] ERROR: sensor not found on I2C bus.");
    return false;
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  if (DEBUG_SERIAL) Serial.println("[MPU] MPU-6050 initialised (±2 g, 250 °/s, 21 Hz LPF).");
  return true;
}

// ── Read average g-force magnitude ───────────────────────────
float readAvgMotion() {
  float sum = 0.0f;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Magnitude of the acceleration vector minus 1 g (gravity)
    float ax = a.acceleration.x / 9.81f;
    float ay = a.acceleration.y / 9.81f;
    float az = a.acceleration.z / 9.81f;
    float magnitude = sqrtf(ax * ax + ay * ay + az * az);
    sum += fabsf(magnitude - 1.0f);   // remove DC gravity component

    delay(SAMPLE_INTERVAL_MS);
  }
  return sum / SAMPLE_COUNT;
}

// ── Classify wave state ───────────────────────────────────────
String classifyMotion(float avgMotion) {
  if (avgMotion < THRESHOLD_CALM)     return "CALM";
  if (avgMotion < THRESHOLD_MODERATE) return "MODERATE";
  return "HIGH WAVE";
}

// ── Derive wave speed (m/s) ───────────────────────────────────
float deriveWaveSpeed(float avgMotion) {
  if (avgMotion < THRESHOLD_CALM)     return SPEED_CALM_MS;
  if (avgMotion < THRESHOLD_MODERATE) return SPEED_MODERATE_MS;
  return SPEED_HIGH_WAVE_MS;
}

// ── Calculate ETA to shore (minutes) ─────────────────────────
float calculateETA(float waveSpeed) {
  if (waveSpeed <= 0.0f) return 0.0f;
  return (DISTANCE_TO_SHORE_M / waveSpeed) / 60.0f;
}

// ── Send data to backend ──────────────────────────────────────
void sendReading(float avgMotion, float waveSpeed, float eta, const String &statusStr) {
  String encodedStatus = urlEncode(statusStr);

  // Build query-string URL
  String url = "";
  if (SERVER_PORT == 443) {
    url = "https://";
    url += SERVER_IP;
    url += API_ENDPOINT;
  } else {
    url = "http://";
    url += SERVER_IP;
    if (SERVER_PORT != 80) {
      url += ":";
      url += SERVER_PORT;
    }
    url += API_ENDPOINT;
  }
  url += "?buoy_id=";    url += BUOY_ID;
  url += "&motion=";     url += String(avgMotion, 4);
  url += "&speed=";      url += String(waveSpeed, 2);
  url += "&eta=";        url += String(eta, 1);
  url += "&status=";     url += encodedStatus;

#ifdef GPS_ENABLED
  if (g_lat != 0.0f || g_lon != 0.0f) {
    url += "&lat="; url += String(g_lat, 6);
    url += "&lon="; url += String(g_lon, 6);
  }
#endif

  if (DEBUG_SERIAL) {
    Serial.println("[HTTP] Sending: " + url);
  }

  HTTPClient http;
  WiFiClientSecure secureClient;
  
  if (SERVER_PORT == 443) {
    secureClient.setInsecure(); // Skip SSL cert validation for simplicity in IoT
    http.begin(secureClient, url);
  } else {
    http.begin(url);
  }
  http.setTimeout(HTTP_TIMEOUT_MS);
  
  // Add authentication header
  http.addHeader("X-Buoy-Key", BUOY_API_KEY);

  int httpCode = http.GET();

  if (DEBUG_SERIAL) {
    if (httpCode > 0) {
      Serial.print("[HTTP] Response code: ");
      Serial.println(httpCode);
      if (httpCode == HTTP_CODE_OK) {
        Serial.println("[HTTP] Payload: " + http.getString());
      }
    } else {
      // Detailed error diagnostics (v4.1.0 fix)
      Serial.print("[HTTP] Error: ");
      Serial.print(httpCode);
      Serial.print(" — ");
      Serial.println(HTTPClient::errorToString(httpCode));
    }
  }

  http.end();
}

// ── setup() ──────────────────────────────────────────────────
void setup() {
#if DEBUG_SERIAL
  Serial.begin(SERIAL_BAUD);
  delay(500);
  // Fixed-width banner — version and buoy ID are printed on separate lines
  // so border alignment is not affected by string length changes.
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║        WaveGuard Buoy Firmware       ║");
  Serial.print(  "║  Version: "); Serial.print(FIRMWARE_VERSION);
  Serial.println("                        ║");
  Serial.print(  "║  Buoy ID: "); Serial.print(BUOY_ID);
  Serial.println("                       ║");
  Serial.println("╚══════════════════════════════════════╝");
#endif

  // Initialise I2C sensor
  if (!initMPU()) {
    // Halt and blink built-in LED to signal sensor fault
    pinMode(LED_BUILTIN, OUTPUT);
    while (true) {
      digitalWrite(LED_BUILTIN, HIGH); delay(200);
      digitalWrite(LED_BUILTIN, LOW);  delay(200);
    }
  }

#ifdef GPS_ENABLED
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  if (DEBUG_SERIAL) Serial.println("[GPS] UART2 started at " + String(GPS_BAUD) + " baud.");
#endif

#ifdef GSM_ENABLED
  connectGSM();
#else
  connectWiFi();
#endif
}

// ── loop() ───────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
#ifndef GSM_ENABLED
  if (WiFi.status() != WL_CONNECTED) {
    if (DEBUG_SERIAL) Serial.println("[WiFi] Lost connection — reconnecting...");
    connectWiFi();
  }
#endif

  unsigned long now = millis();
  if (now - lastSendTime < SEND_INTERVAL_MS) return;
  lastSendTime = now;

#ifdef GPS_ENABLED
  updateGPS();
#endif

  // Sample accelerometer
  float avgMotion = readAvgMotion();
  float waveSpeed = deriveWaveSpeed(avgMotion);
  float eta       = calculateETA(waveSpeed);
  String statusStr = classifyMotion(avgMotion);

  if (DEBUG_SERIAL) {
    Serial.println("─────────────────────────────────────");
    Serial.print("[SENSOR] Avg motion (g): "); Serial.println(avgMotion, 4);
    Serial.print("[SENSOR] Wave speed (m/s): "); Serial.println(waveSpeed, 1);
    Serial.print("[SENSOR] ETA (min): "); Serial.println(eta, 1);
    Serial.print("[SENSOR] Status: "); Serial.println(statusStr);
  }

  sendReading(avgMotion, waveSpeed, eta, statusStr);
}
