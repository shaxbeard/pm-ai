from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


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


class AiHistoryMessage(BaseModel):
  role: Literal["user", "assistant"]
  content: str


class AiChatRequest(BaseModel):
  message: str
  history: list[AiHistoryMessage] = []
  board: BoardData


class AiChatResponse(BaseModel):
  message: str
  board: BoardData | None = None
