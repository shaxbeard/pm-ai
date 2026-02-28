from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from backend.ai import call_openrouter_chat
from backend.db import DEFAULT_USER_ID, connect, get_board, replace_board
from backend.models import AiChatRequest, AiChatResponse, BoardData

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/health")
def health() -> dict[str, object]:
    return {"status": "ok"}


@router.get("/api/board", response_model=BoardData)
def read_board(request: Request) -> dict[str, object]:
    with connect(request.app.state.db_path) as conn:
        return get_board(conn, DEFAULT_USER_ID)


@router.put("/api/board", response_model=BoardData)
def write_board(payload: BoardData, request: Request) -> dict[str, object]:
    card_ids = set(payload.cards.keys())
    referenced_ids: set[str] = set()
    for column in payload.columns:
        for card_id in column.cardIds:
            if card_id not in card_ids:
                raise HTTPException(status_code=400, detail="Card data missing.")
            referenced_ids.add(card_id)
    for card_id in card_ids:
        if card_id not in referenced_ids:
            raise HTTPException(status_code=400, detail="Unreferenced card in payload.")

    with connect(request.app.state.db_path) as conn:
        return replace_board(conn, DEFAULT_USER_ID, payload.model_dump())


@router.post("/api/ai/chat", response_model=AiChatResponse)
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
