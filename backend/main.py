import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from openai import OpenAI

from backend.ai import call_openrouter_chat
from backend.db import DEFAULT_USER_ID, connect, get_board, get_db_path, init_db, replace_board
from backend.models import AiChatRequest, AiChatResponse, BoardData

logger = logging.getLogger(__name__)


def call_openrouter_test() -> None:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set.")

    client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": "2+2"}],
    )
    message = response.choices[0].message.content
    logger.info("OpenRouter test response: %s", message)


def create_app(db_path: Path | None = None) -> FastAPI:
    app = FastAPI()

    resolved_path = db_path or get_db_path()
    init_db(resolved_path)
    app.state.db_path = resolved_path

    STATIC_DIR = Path(__file__).resolve().parent / "static"

    @app.get("/api/health")
    def health(ai_test: bool = False) -> dict[str, object]:
        if ai_test:
            try:
                call_openrouter_test()
            except Exception as exc:
                logger.exception("OpenRouter test failed")
                raise HTTPException(status_code=500, detail="OpenRouter test failed.") from exc
            return {"status": "ok", "ai_tested": True}

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

    @app.post("/api/ai/chat", response_model=AiChatResponse)
    def ai_chat(payload: AiChatRequest) -> dict[str, object]:
        try:
            response = call_openrouter_chat(
                payload.board,
                payload.message,
                payload.history,
            )
        except ValueError as exc:
            logger.exception("AI response did not match schema")
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except Exception as exc:
            logger.exception("AI chat failed")
            raise HTTPException(status_code=500, detail="AI chat failed.") from exc

        return response.model_dump()

    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app


app = create_app()
