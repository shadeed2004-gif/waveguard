# WaveGuard Deployment Report

**Project:** WaveGuard v4  
**Repository:** https://github.com/shadeed2004-gif/waveguard  
**Frontend URL:** https://waveguard-liart.vercel.app  
**Backend URL:** https://waveguard-backend.onrender.com  
**Deployment Date:** July 2026

---

# 1. Deployment Objective

The objective was to make the WaveGuard system publicly accessible through the internet without requiring local execution.

The deployment architecture consists of:

```text
GitHub
   │
   ├── Frontend (React + Vite)
   │        ↓
   │      Vercel
   │
   └── Backend (FastAPI)
            ↓
          Render
```

---

# 2. Repository Used

GitHub Repository:

https://github.com/shadeed2004-gif/waveguard

Repository Structure:

```text
waveguard/

├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   └── ...
│
├── frontend-react/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── firmware/
│
├── README.md
│
└── .gitignore
```

---

# 3. GitHub Preparation

Before deployment the latest code was pushed to GitHub.

Commands:

```bash
git add .
git commit -m "Apply security hardening and password hashing"
git push origin main
```

Result:

Repository became the single source of truth for deployment.

Both Render and Vercel automatically pull code from GitHub.

---

# 4. Backend Deployment (Render)

## Platform

Render

Purpose:

Hosting FastAPI backend.

---

# 5. Creating Render Service

Steps:

1. Login to Render
2. Click New Web Service
3. Connect GitHub
4. Select repository:

```text
shadeed2004-gif/waveguard
```

5. Select Branch:

```text
main
```

---

# 6. Render Configuration

Service Name:

```text
waveguard-backend
```

Language:

```text
Python 3
```

Region:

```text
Singapore
```

Root Directory:

```text
backend
```

---

# 7. Build Command

Configured:

```bash
pip install -r requirements.txt
```

Render automatically runs this during deployment.

Purpose:

Installs:

- FastAPI
- Uvicorn
- SQLAlchemy
- Passlib
- Requests
- All backend dependencies

---

# 8. Start Command

Configured:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

Explanation:

```text
main:app
│
├── main.py
└── app = FastAPI()
```

Render automatically injects:

```text
$PORT
```

---

# 9. Environment Variables

Configured in Render:

```text
ENVIRONMENT=production
```

```text
FRONTEND_URL=https://waveguard-liart.vercel.app
```

```text
WAVEGUARD_ADMIN_USER=admin
```

```text
WAVEGUARD_ADMIN_PASS=waveguard2024
```

Purpose:

Used for authentication.

---

# 10. Deploying Backend

Clicked:

```text
Deploy Web Service
```

Render:

1. Cloned GitHub repository
2. Opened backend folder
3. Installed requirements
4. Started FastAPI
5. Generated public URL

Generated URL:

```text
https://waveguard-backend.onrender.com
```

---

# 11. Backend Verification

Root URL:

```text
https://waveguard-backend.onrender.com
```

Response:

```json
{
  "detail": "Not Found"
}
```

This is normal because no route exists at "/"

---

Health Endpoint:

```text
https://waveguard-backend.onrender.com/api/health
```

Response:

```json
{
  "status":"ok",
  "service":"WaveGuard API v4"
}
```

Result:

Backend verified operational.

---

# 12. Frontend Deployment (Vercel)

Platform:

Vercel

Purpose:

Host React application.

---

# 13. Creating Vercel Project

Steps:

1. Login to Vercel
2. Import Git Repository
3. Select:

```text
shadeed2004-gif/waveguard
```

---

# 14. Frontend Configuration

Root Directory:

```text
frontend-react
```

Build Command:

```bash
npm run build
```

Install Command:

```bash
npm install
```

Output Directory:

```text
dist
```

---

# 15. Environment Variable Configuration

Added:

```text
VITE_API_URL
```

Value:

```text
https://waveguard-backend.onrender.com
```

Purpose:

Connect frontend to backend.

---

# 16. First Deployment Issue

Problem:

```text
Failed to fetch
```

Reason:

Frontend pointed to wrong backend path.

Result:

Login failed.

---

# 17. Second Deployment Issue

Problem:

```text
404 Not Found
```

Observed in Chrome Network Tab.

Reason:

Incorrect API route.

Frontend attempted:

```text
/login
```

instead of

```text
/api/login
```

Solution:

Updated frontend API configuration.

Committed changes.

Redeployed Vercel.

---

# 18. Third Deployment Issue

Problem:

```text
401 Unauthorized
```

Reason:

Incorrect credentials entered.

Backend logs showed:

```text
POST /api/login
401 Unauthorized
```

After entering correct credentials:

```text
admin
waveguard2024
```

Login succeeded.

---

# 19. Backend Log Analysis

Render Logs Used:

```text
POST /api/login
```

Observed:

```text
401 Unauthorized
```

then

```text
200 OK
```

Meaning:

Authentication system working correctly.

---

# 20. CORS Configuration

Frontend:

```text
https://waveguard-liart.vercel.app
```

Backend:

```text
https://waveguard-backend.onrender.com
```

Because domains differ:

CORS configuration required.

Configured backend to allow:

```text
FRONTEND_URL
```

Result:

Frontend successfully communicates with backend.

---

# 21. Open-Meteo Warning

Observed:

```text
Open-Meteo unreachable: Using fallback.
```

Meaning:

Weather API temporarily unavailable.

Backend automatically switched to fallback values.

System continued functioning.

No deployment action required.

---

# 22. Production URLs

Backend:

```text
https://waveguard-backend.onrender.com
```

Health Check:

```text
https://waveguard-backend.onrender.com/api/health
```

Frontend:

```text
https://waveguard-liart.vercel.app
```

Admin Login:

```text
https://waveguard-liart.vercel.app/admin
```

---

# 23. Current Deployment Status

Frontend:

```text
Status: Operational
```

Backend:

```text
Status: Operational
```

Authentication:

```text
Status: Operational
```

Health Endpoint:

```text
Status: Operational
```

Database:

```text
Status: Operational
```

GitHub Integration:

```text
Status: Operational
```

Auto Deploy:

```text
Status: Enabled
```

---

# 24. Automatic Deployment Workflow

Whenever code is pushed:

```bash
git add .
git commit -m "update"
git push origin main
```

Automatically:

Frontend:

```text
GitHub
   ↓
Vercel
   ↓
Build
   ↓
Deploy
```

Backend:

```text
GitHub
   ↓
Render
   ↓
Build
   ↓
Deploy
```

No manual deployment required.

---

# 25. Running Without Physical Buoy

Current Hardware Status:

```text
ESP32 Not Connected
```

System uses:

- fallback data
- simulated status
- weather API

The platform remains fully usable for:

- UI demonstrations
- Project presentations
- Academic evaluations
- Documentation screenshots

---

# 26. Future Improvements

Planned:

- PostgreSQL database
- Custom domain
- HTTPS custom certificate
- Docker deployment
- CI/CD pipeline
- ESP32 live integration
- Simulation mode
- SMS alert integration
- Email alert integration

---

# 27. Final Deployment Summary

Repository:

https://github.com/shadeed2004-gif/waveguard

Frontend:

https://waveguard-liart.vercel.app

Backend:

https://waveguard-backend.onrender.com

Health Check:

https://waveguard-backend.onrender.com/api/health

Admin Panel:

https://waveguard-liart.vercel.app/admin

Deployment Status:

SUCCESSFULLY DEPLOYED
