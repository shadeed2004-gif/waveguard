# 📡 Connecting Physical Hardware to the Live Website

By default, the `how_to_run.md` guide assumes you are running the backend and frontend locally on your laptop (e.g., `192.168.1.100:8005`). 

However, since your project is now successfully deployed to **Render** and **Vercel**, you can connect your physical ESP32 buoy directly to the live system! This allows you to deploy the buoy into the ocean and monitor it from anywhere in the world.

Follow these steps to configure your firmware for the live deployed environment.

---

## Step 1: Find your live Backend details

You need two pieces of information from your deployed backend:
1. **The Live URL**: `waveguard-backend.onrender.com`
2. **The API Key**: The secure `WAVEGUARD_BUOY_API_KEY` you configured in your Render environment variables.

---

## Step 2: Edit your `config.h` file

Open `firmware/config.h` (or copy `config.h.example` to `config.h` if you haven't already). Make the following changes:

### A. Connect to a Mobile Hotspot / Router
Update the WiFi credentials to match a 4G hotspot or outdoor router the buoy can reach from the water:
```cpp
#define WIFI_SSID        "YOUR_HOTSPOT_NAME"
#define WIFI_PASSWORD    "YOUR_HOTSPOT_PASSWORD"
```

### B. Point to Render (Live Backend)
Change `SERVER_IP` to your Render domain. Do **NOT** include `http://` or `https://` in the string.
Change `SERVER_PORT` to `443` (this tells the firmware to automatically use secure HTTPS instead of standard HTTP).

```cpp
#define SERVER_IP        "waveguard-backend.onrender.com"
#define SERVER_PORT      443
#define API_ENDPOINT     "/api/buoy"
```

### C. Add the Security Key
Enter the exact same API key you set in your Render environment variables:
```cpp
#define BUOY_API_KEY     "your_super_secret_api_key_here"
```

---

## Step 3: Flash the Firmware

1. Open `firmware/waveguard_buoy/waveguard_buoy.ino` in the Arduino IDE.
2. Select your ESP32 board and COM port.
3. Click **Upload**.

---

## Step 4: Verify the Connection

1. Open the **Serial Monitor** in Arduino IDE (Baud rate: `115200`).
2. You should see the ESP32 connect to WiFi.
3. Every 5 seconds (or whatever you set `SEND_INTERVAL_MS` to), you will see an HTTP request:

```text
[HTTP] Sending: https://waveguard-backend.onrender.com/api/buoy?buoy_id=WG-01&motion=0.03&speed=1.00&eta=1333.3&status=CALM
[HTTP] Response code: 200
[HTTP] Payload: {"success":true,"message":"Data accepted and fused with satellite data"}
```

If you receive a **Response code: 200**, the buoy is successfully pushing data to the internet!

### Troubleshooting
- **Response code: 403 Forbidden**: Your `BUOY_API_KEY` in `config.h` does not match the Render environment variable.
- **Response code: -1 (Connection Refused)**: Make sure `SERVER_PORT` is set to `443`. Render does not accept standard port 80 HTTP traffic for APIs easily without redirects.
- **No WiFi**: Ensure your 4G hotspot is emitting a 2.4GHz network. The ESP32 cannot connect to 5GHz WiFi networks.

---

## You're Live! 🌊

Once connected, open your public dashboard on your phone or laptop anywhere in the world:
[https://waveguard-liart.vercel.app](https://waveguard-liart.vercel.app)

You will see the live readings streaming directly from your hardware in the ocean.
