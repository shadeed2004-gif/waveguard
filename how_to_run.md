# WaveGuard – How to Run (Complete Guide)

> **WaveGuard** is a Smart Near-Shore Swell Surge Early Warning System.
> The application has two parts: a **Python FastAPI backend** and a **React + Tailwind frontend**.

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your system:

| Tool       | Required Version | Check Command        | Download Link                          |
|------------|------------------|----------------------|----------------------------------------|
| **Python** | 3.9 or higher    | `python --version`   | https://www.python.org/downloads/      |
| **Node.js**| 18 or higher     | `node --version`     | https://nodejs.org/                    |
| **npm**    | 9 or higher      | `npm --version`      | (comes with Node.js)                   |
| **pip**    | 21 or higher     | `pip --version`      | (comes with Python)                    |

> [!NOTE]
> On Windows, use **PowerShell** or **Command Prompt** for all commands.
> On macOS/Linux, use your default **Terminal**.

---

## 📂 Project Structure

```
waveguardV4/
├── backend/                    ← Python FastAPI server
│   ├── main.py                 ← Main application (endpoints & logic)
│   ├── database.py             ← SQLAlchemy database connection
│   ├── models.py               ← Database models (Reading table)
│   ├── requirements.txt        ← Python dependencies
│   ├── .env                    ← Admin credentials (environment vars)
│   └── waveguard.db            ← SQLite database (auto-created)
│
├── frontend-react/             ← React + Tailwind CSS frontend
│   ├── src/                    ← React components & pages
│   ├── public/assets/          ← Image assets (logos, backgrounds)
│   ├── package.json            ← Node.js dependencies
│   ├── vite.config.js          ← Vite bundler + API proxy config
│   └── index.html              ← HTML entry point
│
├── how_to_run.md               ← This file
```

---

## 🔧 First-Time Setup (One-Time Only)

### Step 1: Create a Python Virtual Environment

Open a terminal at the project root (`waveguardV4/`):

```bash
# Create a virtual environment named "venv"
python -m venv venv
```

### Step 2: Activate the Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

> You should see `(venv)` appear at the beginning of your terminal prompt.

### Step 3: Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

This installs the following Python packages:

| Package          | Version   | Purpose                          |
|------------------|-----------|----------------------------------|
| `fastapi`        | 0.115.0   | Web framework (REST API)         |
| `uvicorn`        | 0.30.6    | ASGI server to run FastAPI       |
| `httpx`          | 0.27.2    | Async HTTP client (satellite API)|
| `sqlalchemy`     | 2.0.35    | Database ORM (SQLite)            |
| `python-dotenv`  | 1.0.1     | Load `.env` file for credentials |

### Step 4: Install Frontend Dependencies

```bash
cd frontend-react
npm install
cd ..
```

This installs the following Node.js packages:

| Package             | Purpose                           |
|---------------------|-----------------------------------|
| `react` + `react-dom` | UI component library            |
| `react-router-dom`  | Client-side routing              |
| `react-leaflet` + `leaflet` | Interactive maps           |
| `tailwindcss`       | Utility-first CSS framework (v4) |
| `vite`              | Fast build tool & dev server     |
| `@tailwindcss/vite` | Tailwind CSS Vite plugin         |

---

## 🚀 Running the Application

You need **two terminals** — one for the backend and one for the frontend.

### Terminal 1: Start the Backend Server

You have two choices for running the backend based on whether you are using a physical hardware buoy or just testing logically.

#### Option A: Running in Local Testing/Simulator Mode (Default)
If you do not have the physical ESP32 buoy powered on, and you only want to test the UI or inject mock data, start the server normally. It will only accept connections from your own laptop:

```bash
# Navigate to the backend folder
cd backend

# Activate virtual environment (if not already active)
# Windows PowerShell:
..\venv\Scripts\Activate.ps1
# Windows CMD:
..\venv\Scripts\activate.bat
# macOS/Linux:
source ../venv/bin/activate

# Start the server (binds to 127.0.0.1 by default)
python -m uvicorn main:app --reload --port 8005
```

#### Option B: Running with REAL-TIME Physical Buoy Connection 🚨
If you want to receive active data from the physical ESP32 hardware buoy over Wi-Fi, you **must** bind the backend to `0.0.0.0` so it accepts network connections:

```bash
# Navigate to backend and activate venv as seen above...

# Start the server to accept network connections 
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8005
```

> **[IMPORTANT] Firewall Alert (Windows):** If a Windows Defender Firewall popup appears when running with `0.0.0.0`, you **MUST click "Allow access"** for private networks, otherwise the ESP32 data will be blocked from reaching your laptop. Also, ensure your laptop and the ESP32 buoy are connected to the **same Wi-Fi network**.

**Expected output (for both options):**
```
INFO:     Uvicorn running on http://0.0.0.0:8005 (or 127.0.0.1)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

> ✅ The backend is now running. 
>
> The `--reload` flag enables hot-reloading: the server will auto-restart when you edit Python files.

### Terminal 2: Start the Frontend Dev Server

```bash
# Navigate to the frontend-react folder
cd frontend-react

# Start the Vite development server
npm run dev
```

**Expected output:**
```
  VITE v8.0.3  ready in 2293 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

> ✅ The frontend is now running at **http://localhost:3000**
>
> Vite provides instant hot module replacement (HMR) — changes to React components appear instantly in the browser.

---

## 📡 How to Connect the Physical ESP32 Buoy

Once your backend is running with `--host 0.0.0.0 --port 8005` (Option B above), your laptop is ready to receive data from the ESP32.

### 1. Find your Laptop's IP Address
Open a new terminal or command prompt and type `ipconfig`.
Look for **IPv4 Address** (e.g., `10.38.178.14`).

### 2. Update your ESP32 Arduino Code
In your ESP32 firmware, set the target URL to point to your laptop's IP address and the **8005 port**.

If you are using `http.GET()` in your ESP32 code, the URL structure should look exactly like this:
```cpp
// Replace 10.38.178.14 with YOUR actual IPv4 Address
String url = "http://10.38.178.14:8005/api/buoy?motion=" + String(avg_motion) + "&speed=" + String(calculated_speed) + "&status=" + status_string;
```

### 3. Flash & Verify
1. Upload the code to your ESP32.
2. Open the **Arduino IDE Serial Monitor** (115200 baud).
3. Wait for the Wi-Fi connected message.
4. When the ESP32 transmits, you will see an `HTTP Response Code: 200`.

**The moment the ESP32 successfully sends data, the WaveGuard React Dashboard will automatically update!**

---

## 🌐 Accessing the Application

Once both servers are running, open your browser:

| Page               | URL                          | Description                                       |
|--------------------|------------------------------|---------------------------------------------------|
| **Public Portal**  | http://localhost:3000/       | Bilingual (English/Malayalam) coastal safety page  |
| **Admin Login**    | http://localhost:3000/admin  | Admin dashboard (login required)                  |
| **API Docs**       | http://localhost:8005/docs   | Interactive Swagger UI for all API endpoints       |
| **API Health**     | http://localhost:8005/api/health | Quick health check                             |

### Admin Login Credentials

| Field    | Value            |
|----------|------------------|
| Username | `admin`          |
| Password | `waveguard2024`  |

> These credentials are configured in `backend/.env` and can be changed there.

---

## 🔄 How the Two Servers Connect

```
┌─────────────────────┐        ┌─────────────────────┐
│   FRONTEND (React)  │        │   BACKEND (FastAPI)  │
│   http://localhost:  │        │   http://localhost:  │
│        3000         │        │        8005          │
│                     │ /api/* │                      │
│   Vite Dev Server   ├───────►│   Uvicorn ASGI       │
│   (serves React UI) │ proxy  │   (serves API +      │
│                     │        │    satellite data)    │
└─────────────────────┘        └─────────────────────┘
```

The Vite dev server is configured to **proxy** all `/api/*` requests to the backend:

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8005',
      changeOrigin: true,
    },
  },
}
```

This means:
- `http://localhost:3000/api/status` → proxied to → `http://localhost:8005/api/status`
- `http://localhost:3000/api/login` → proxied to → `http://localhost:8005/api/login`
- All other routes (e.g., `/`, `/admin`) are served by React Router

---

## 🧪 Testing the Backend API

### Health Check

```bash
curl http://localhost:8005/api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "WaveGuard API v4",
  "timestamp": "2026-03-30T18:00:00.000000"
}
```

### Inject a Test Buoy Reading

Without the physical ESP32 buoy, you can inject simulated data:

```bash
# Normal reading (motion = 0.02, CALM)
curl -X POST "http://localhost:8005/api/test-buoy?motion=0.02&device_status=CALM"

# Watch-level reading (motion = 0.07, MODERATE)
curl -X POST "http://localhost:8005/api/test-buoy?motion=0.07&device_status=MODERATE"

# Warning-level reading (motion = 0.15, HIGH WAVE)
curl -X POST "http://localhost:8005/api/test-buoy?motion=0.15&device_status=HIGH%20WAVE"
```

Or use the **Swagger UI** at http://localhost:8005/docs and try the `/api/test-buoy` endpoint interactively.

### Check Current Status

```bash
curl http://localhost:8005/api/status
```

This returns the full system state including buoy data, satellite data, fusion decision, and analytics.

---

## 📡 API Endpoints Reference

| Method | Endpoint          | Auth Required | Description                               |
|--------|-------------------|---------------|-------------------------------------------|
| POST   | `/api/login`      | No            | Admin login → returns session token       |
| POST   | `/api/logout`     | Yes (Bearer)  | Invalidate session token                  |
| POST   | `/api/buoy`       | No            | Physical buoy device sends readings       |
| POST   | `/api/test-buoy`  | No            | Inject test reading (no hardware needed)  |
| GET    | `/api/status`     | No            | Full system status (polled every 5 sec)   |
| GET    | `/api/history`    | No            | Last N buoy readings from SQLite          |
| GET    | `/api/health`     | No            | Health check endpoint                     |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

```env
WAVEGUARD_ADMIN_USER=admin
WAVEGUARD_ADMIN_PASS=waveguard2024
```

You can change these values to set custom admin credentials.

### Frontend (`frontend-react/vite.config.js`)

| Setting            | Default                   | Purpose                         |
|--------------------|---------------------------|---------------------------------|
| `server.port`      | `3000`                    | Frontend dev server port        |
| `proxy.target`     | `http://127.0.0.1:8005`   | Backend server URL for API calls|

---

## 🛑 Stopping the Servers

- **Backend:** Press `Ctrl + C` in Terminal 1
- **Frontend:** Press `Ctrl + C` in Terminal 2

---

## ❓ Troubleshooting

### "Module not found" or "No module named fastapi"

The virtual environment is not activated. Run:
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

### "npm: command not found"

Node.js is not installed. Download from https://nodejs.org/

### "Backend Offline" shown in the admin dashboard

The backend server is not running or the frontend proxy failed. Make sure Terminal 1 has the backend started on port 8005.

### "EADDRINUSE: port 3000 already in use"

Another process is using port 3000. Either stop that process or change the port in `vite.config.js`.

### "Cannot connect to API" in the browser console

Ensure both servers are running:
- Backend on port **8005**
- Frontend on port **3000**

The Vite proxy only works when the backend is reachable at `http://127.0.0.1:8005`.

### PowerShell Execution Policy Error

If you get an error when activating the virtual environment in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Leaflet Map Shows Grey Tiles

This is a known Leaflet rendering issue. Simply resize the browser window or switch to another panel and back.

---

## 📝 Quick Start (TL;DR)

```bash
# Terminal 1 – Backend
cd waveguardV4/backend
..\venv\Scripts\Activate.ps1          # activate venv (Windows)
pip install -r requirements.txt        # first time only
python -m uvicorn main:app --reload --port 8005

# Terminal 2 – Frontend
cd waveguardV4/frontend-react
npm install                            # first time only
npm run dev

# Open browser → http://localhost:3000
```

---

*WaveGuard – Smart Near-Shore Swell Surge Early Warning System*
*Kanayannur, Kerala, India · Academic Prototype 2024–25*
