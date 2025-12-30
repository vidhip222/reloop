import os

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint() -> None:
    os.environ["APP_ENV"] = "test"
    client = TestClient(create_app())
    response = client.get("/health", headers={"Authorization": "Bearer test"})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
