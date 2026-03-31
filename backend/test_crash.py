from fastapi.testclient import TestClient
from main import app
import traceback

try:
    client = TestClient(app)
    response = client.get('/api/buoy?motion=0.2&status=WARNING')
    print("!!! STATUS:", response.status_code)
    print("!!! TEXT:", response.text)
except Exception as e:
    print("!!! CRASH:")
    traceback.print_exc()
