import json

import pytest

from backend.ai import AI_RESPONSE_SCHEMA, build_ai_messages, parse_ai_response
from backend.models import AiHistoryMessage, BoardData


def sample_board() -> BoardData:
  payload = {
    "columns": [
      {"id": "col-a", "title": "Todo", "cardIds": ["card-1"]},
      {"id": "col-b", "title": "Done", "cardIds": []},
    ],
    "cards": {
      "card-1": {
        "id": "card-1",
        "title": "Draft status update",
        "details": "Share milestones with the team.",
      }
    },
  }
  return BoardData.model_validate(payload)


def test_schema_includes_message_property() -> None:
  assert "properties" in AI_RESPONSE_SCHEMA
  assert "message" in AI_RESPONSE_SCHEMA["properties"]


def test_parse_ai_response_with_message_only() -> None:
  content = json.dumps({"message": "All set", "board": None})
  parsed = parse_ai_response(content)
  assert parsed.message == "All set"
  assert parsed.board is None


def test_parse_ai_response_with_board_update() -> None:
  board = sample_board()
  content = json.dumps({"message": "Updated", "board": board.model_dump()})
  parsed = parse_ai_response(content)
  assert parsed.message == "Updated"
  assert parsed.board is not None
  assert parsed.board.model_dump() == board.model_dump()


def test_parse_ai_response_rejects_invalid_payload() -> None:
  content = json.dumps({"board": None})
  with pytest.raises(ValueError, match="schema"):
    parse_ai_response(content)


def test_parse_ai_response_rejects_invalid_json() -> None:
  with pytest.raises(ValueError, match="JSON"):
    parse_ai_response("not valid json {{{")


def test_build_ai_messages_with_no_history() -> None:
  board = sample_board()
  messages = build_ai_messages(board, "What should I do next?", [])

  assert len(messages) == 2
  assert messages[0]["role"] == "system"
  assert messages[1]["role"] == "user"
  assert "What should I do next?" in messages[1]["content"]
  assert "Current board JSON" in messages[1]["content"]


def test_build_ai_messages_includes_history_and_board() -> None:
  board = sample_board()
  history = [AiHistoryMessage(role="user", content="What is next?")]
  messages = build_ai_messages(board, "Move card-1 to done", history)

  assert messages[0]["role"] == "system"
  assert messages[1]["role"] == "user"
  assert "What is next?" in messages[1]["content"]
  assert messages[-1]["role"] == "user"
  assert "Move card-1 to done" in messages[-1]["content"]
  assert "Current board JSON" in messages[-1]["content"]
