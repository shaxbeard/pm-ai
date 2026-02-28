from __future__ import annotations

import json
import logging
import os
from typing import Any

from openai import OpenAI
from pydantic import ValidationError

from backend.models import AiChatResponse, AiHistoryMessage, BoardData

logger = logging.getLogger(__name__)

AI_RESPONSE_SCHEMA: dict[str, Any] = AiChatResponse.model_json_schema()


def build_ai_messages(
  board: BoardData,
  user_message: str,
  history: list[AiHistoryMessage],
) -> list[dict[str, str]]:
  schema_json = json.dumps(AI_RESPONSE_SCHEMA, indent=2)
  system_prompt = (
    "You are a project management assistant. "
    "Return a JSON object that strictly matches the schema below. "
    "Do not include any extra keys or commentary. "
    "If no board updates are needed, set 'board' to null.\n\n"
    f"Schema:\n{schema_json}"
  )

  messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
  for item in history:
    messages.append({"role": item.role, "content": item.content})

  board_json = json.dumps(board.model_dump(), indent=2)
  user_content = (
    f"User question: {user_message}\n\n"
    f"Current board JSON:\n{board_json}"
  )
  messages.append({"role": "user", "content": user_content})
  return messages


def parse_ai_response(content: str) -> AiChatResponse:
  try:
    payload = json.loads(content)
  except json.JSONDecodeError as exc:
    raise ValueError("AI response was not valid JSON.") from exc

  try:
    return AiChatResponse.model_validate(payload)
  except ValidationError as exc:
    raise ValueError("AI response did not match schema.") from exc


def call_openrouter_chat(
  board: BoardData,
  user_message: str,
  history: list[AiHistoryMessage],
) -> AiChatResponse:
  api_key = os.getenv("OPENROUTER_API_KEY")
  if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY is not set.")

  client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1", timeout=30.0)
  messages = build_ai_messages(board, user_message, history)
  response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=messages,
  )
  content = response.choices[0].message.content or ""
  parsed = parse_ai_response(content)
  logger.info("OpenRouter structured response parsed successfully")
  return parsed
