from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_USER_ID = "user-1"
DEFAULT_USERNAME = "user"
DEFAULT_BOARD_ID = "board-1"
DEFAULT_BOARD_TITLE = "Kanban Studio"

DEFAULT_BOARD_DATA: dict[str, Any] = {
  "columns": [
    {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
    {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
    {
      "id": "col-progress",
      "title": "In Progress",
      "cardIds": ["card-4", "card-5"],
    },
    {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
    {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
  ],
  "cards": {
    "card-1": {
      "id": "card-1",
      "title": "Align roadmap themes",
      "details": "Draft quarterly themes with impact statements and metrics.",
    },
    "card-2": {
      "id": "card-2",
      "title": "Gather customer signals",
      "details": "Review support tags, sales notes, and churn feedback.",
    },
    "card-3": {
      "id": "card-3",
      "title": "Prototype analytics view",
      "details": "Sketch initial dashboard layout and key drill-downs.",
    },
    "card-4": {
      "id": "card-4",
      "title": "Refine status language",
      "details": "Standardize column labels and tone across the board.",
    },
    "card-5": {
      "id": "card-5",
      "title": "Design card layout",
      "details": "Add hierarchy and spacing for scanning dense lists.",
    },
    "card-6": {
      "id": "card-6",
      "title": "QA micro-interactions",
      "details": "Verify hover, focus, and loading states.",
    },
    "card-7": {
      "id": "card-7",
      "title": "Ship marketing page",
      "details": "Final copy approved and asset pack delivered.",
    },
    "card-8": {
      "id": "card-8",
      "title": "Close onboarding sprint",
      "details": "Document release notes and share internally.",
    },
  },
}


def utc_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def get_db_path() -> Path:
  env_path = os.getenv("PM_DB_PATH")
  if env_path:
    return Path(env_path)
  return Path(__file__).resolve().parent / "data" / "pm.db"


def connect(db_path: Path) -> sqlite3.Connection:
  db_path.parent.mkdir(parents=True, exist_ok=True)
  conn = sqlite3.connect(db_path)
  conn.row_factory = sqlite3.Row
  conn.execute("PRAGMA foreign_keys = ON")
  return conn


def init_db(db_path: Path) -> None:
  with connect(db_path) as conn:
    conn.execute(
      """
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      )
      """
    )
    conn.execute(
      """
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
      """
    )
    conn.execute(
      """
      CREATE TABLE IF NOT EXISTS "columns" (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        position INTEGER NOT NULL,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
      """
    )
    conn.execute(
      """
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (column_id) REFERENCES "columns"(id) ON DELETE CASCADE
      )
      """
    )


def ensure_user(
  conn: sqlite3.Connection,
  user_id: str = DEFAULT_USER_ID,
  username: str = DEFAULT_USERNAME,
) -> str:
  existing = conn.execute(
    "SELECT id FROM users WHERE id = ?", (user_id,)
  ).fetchone()
  if existing:
    return existing["id"]
  conn.execute(
    "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
    (user_id, username, utc_now()),
  )
  return user_id


def ensure_board(conn: sqlite3.Connection, user_id: str) -> str:
  username = DEFAULT_USERNAME if user_id == DEFAULT_USER_ID else user_id
  ensure_user(conn, user_id=user_id, username=username)
  existing = conn.execute(
    "SELECT id FROM boards WHERE user_id = ?", (user_id,)
  ).fetchone()
  if existing:
    return existing["id"]
  conn.execute(
    "INSERT INTO boards (id, user_id, title, created_at) VALUES (?, ?, ?, ?)",
    (DEFAULT_BOARD_ID, user_id, DEFAULT_BOARD_TITLE, utc_now()),
  )
  return DEFAULT_BOARD_ID


def seed_default_data(conn: sqlite3.Connection) -> None:
  user_id = ensure_user(conn)
  board_id = ensure_board(conn, user_id)

  existing_columns = conn.execute(
    "SELECT COUNT(1) AS count FROM \"columns\" WHERE board_id = ?",
    (board_id,),
  ).fetchone()
  if existing_columns and existing_columns["count"] > 0:
    return

  insert_board_data(conn, board_id, DEFAULT_BOARD_DATA)


def insert_board_data(
  conn: sqlite3.Connection, board_id: str, board_data: dict[str, Any]
) -> None:
  now = utc_now()
  for column_index, column in enumerate(board_data["columns"]):
    conn.execute(
      """
      INSERT INTO "columns" (id, board_id, title, position)
      VALUES (?, ?, ?, ?)
      """,
      (column["id"], board_id, column["title"], column_index),
    )
    for card_index, card_id in enumerate(column["cardIds"]):
      card = board_data["cards"][card_id]
      conn.execute(
        """
        INSERT INTO cards (id, column_id, title, details, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (card["id"], column["id"], card["title"], card["details"], card_index, now),
      )


def get_board(conn: sqlite3.Connection, user_id: str) -> dict[str, Any]:
  board_id = ensure_board(conn, user_id)
  seed_default_data(conn)

  columns = conn.execute(
    "SELECT id, title FROM \"columns\" WHERE board_id = ? ORDER BY position",
    (board_id,),
  ).fetchall()

  cards = conn.execute(
    """
    SELECT id, column_id, title, details
    FROM cards
    WHERE column_id IN (
      SELECT id FROM \"columns\" WHERE board_id = ?
    )
    ORDER BY position
    """,
    (board_id,),
  ).fetchall()

  cards_by_column: dict[str, list[str]] = {}
  cards_by_id: dict[str, dict[str, str]] = {}
  for row in cards:
    cards_by_column.setdefault(row["column_id"], []).append(row["id"])
    cards_by_id[row["id"]] = {
      "id": row["id"],
      "title": row["title"],
      "details": row["details"],
    }

  return {
    "columns": [
      {
        "id": column["id"],
        "title": column["title"],
        "cardIds": cards_by_column.get(column["id"], []),
      }
      for column in columns
    ],
    "cards": cards_by_id,
  }


def replace_board(
  conn: sqlite3.Connection, user_id: str, board_data: dict[str, Any]
) -> dict[str, Any]:
  board_id = ensure_board(conn, user_id)

  conn.execute(
    "DELETE FROM cards WHERE column_id IN (SELECT id FROM \"columns\" WHERE board_id = ?)",
    (board_id,),
  )
  conn.execute("DELETE FROM \"columns\" WHERE board_id = ?", (board_id,))

  insert_board_data(conn, board_id, board_data)
  return get_board(conn, user_id)
