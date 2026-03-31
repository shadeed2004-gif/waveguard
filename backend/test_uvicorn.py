import threading
import time
import urllib.request
import uvicorn
from main import app
import sys

def ping_server():
    time.sleep(2)  # Wait for server to start
    print("PINGING SERVER...")
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8001/api/buoy?motion=0.2&status=WARNING")
        print("RESP:", req.read().decode())
    except Exception as e:
        print("PING FAILED:", e)

threading.Thread(target=ping_server, daemon=True).start()

print("STARTING SERVER...")
uvicorn.run(app, host="127.0.0.1", port=8001, log_level="debug")
