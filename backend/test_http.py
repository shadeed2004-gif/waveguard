import urllib.request
import urllib.error

try:
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/buoy?motion=0.2&status=WARNING")
    print(req.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("OTHER ERROR:", e)
