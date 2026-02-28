from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.db import get_db_path, init_db
from backend.routes import router


def create_app(db_path: Path | None = None) -> FastAPI:
    app = FastAPI()

    resolved_path = db_path or get_db_path()
    init_db(resolved_path)
    app.state.db_path = resolved_path

    app.include_router(router)

    static_dir = Path(__file__).resolve().parent / "static"
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

    return app


app = create_app()
