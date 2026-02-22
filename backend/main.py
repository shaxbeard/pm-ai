from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.db import DEFAULT_USER_ID, connect, get_board, get_db_path, init_db, replace_board


class Card(BaseModel):
    id: str
    title: str
    details: str


class Column(BaseModel):
    id: str
    title: str
    cardIds: list[str]


class BoardData(BaseModel):
    columns: list[Column]
    cards: dict[str, Card]


def create_app(db_path: Path | None = None) -> FastAPI:
    app = FastAPI()

    resolved_path = db_path or get_db_path()
    init_db(resolved_path)
    app.state.db_path = resolved_path

    STATIC_DIR = Path(__file__).resolve().parent / "static"

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/board", response_model=BoardData)
    def read_board(request: Request) -> dict[str, object]:
        with connect(request.app.state.db_path) as conn:
            return get_board(conn, DEFAULT_USER_ID)

    @app.put("/api/board", response_model=BoardData)
    def write_board(payload: BoardData, request: Request) -> dict[str, object]:
        card_ids = set(payload.cards.keys())
        for column in payload.columns:
            for card_id in column.cardIds:
                if card_id not in card_ids:
                    raise HTTPException(status_code=400, detail="Card data missing.")

        with connect(request.app.state.db_path) as conn:
            return replace_board(conn, DEFAULT_USER_ID, payload.model_dump())

    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app


app = create_app()
