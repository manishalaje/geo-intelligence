from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root():
    res = client.get("/")
    assert res.status_code == 200


def test_recommend_endpoint():
    res = client.get(
        "/recommend/top",
        params={"lat": 12.9716, "lon": 77.5946, "query": "cafe", "limit": 2},
    )
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
