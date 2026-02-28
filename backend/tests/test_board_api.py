from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import create_app


def build_client(tmp_path: Path) -> TestClient:
  db_path = tmp_path / "pm-test.db"
  app = create_app(db_path)
  return TestClient(app)


def test_get_board_returns_seeded_data(tmp_path: Path) -> None:
  client = build_client(tmp_path)
  response = client.get("/api/board")
  assert response.status_code == 200
  payload = response.json()
  assert len(payload["columns"]) == 5
  assert "card-1" in payload["cards"]


def test_put_board_rejects_missing_card_data(tmp_path: Path) -> None:
  client = build_client(tmp_path)
  payload = {
    "columns": [
      {"id": "col-a", "title": "Todo", "cardIds": ["card-missing"]},
    ],
    "cards": {},
  }
  response = client.put("/api/board", json=payload)
  assert response.status_code == 400


def test_put_board_rejects_unreferenced_card(tmp_path: Path) -> None:
  client = build_client(tmp_path)
  payload = {
    "columns": [
      {"id": "col-a", "title": "Todo", "cardIds": []},
    ],
    "cards": {
      "card-orphan": {"id": "card-orphan", "title": "Orphan", "details": "Not in any column."}
    },
  }
  response = client.put("/api/board", json=payload)
  assert response.status_code == 400


def test_put_board_replaces_data(tmp_path: Path) -> None:
  client = build_client(tmp_path)
  payload = {
    "columns": [
      {"id": "col-a", "title": "Inbox", "cardIds": ["card-1"]},
      {"id": "col-b", "title": "Done", "cardIds": []},
    ],
    "cards": {
      "card-1": {"id": "card-1", "title": "Hello", "details": "World"}
    },
  }

  response = client.put("/api/board", json=payload)
  assert response.status_code == 200
  assert response.json() == payload

  follow_up = client.get("/api/board")
  assert follow_up.status_code == 200
  assert follow_up.json() == payload
