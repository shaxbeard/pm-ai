# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Project Management MVP web app with a Kanban board and AI chat sidebar. Single hardcoded user (`user`/`password`), one board per user, runs in Docker locally.

- **Frontend**: Next.js (static export) served by the backend
- **Backend**: FastAPI + SQLite, serves the frontend at `/`
- **AI**: OpenRouter API using model `openai/gpt-oss-120b`

## Commands

### Frontend (run from `frontend/`)
```bash
npm install          # Install dependencies
npm run dev          # Dev server on localhost:3000
npm run build        # Static export for production
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:unit:watch  # Unit tests in watch mode
npm run test:e2e     # Playwright E2E tests (requires running dev server)
npm run test:all     # Unit + E2E
```

Run a single unit test file:
```bash
npx vitest run src/components/KanbanBoard.test.tsx
```

### Backend (run from project root)
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Run backend tests:
```bash
pytest backend/tests/
pytest backend/tests/test_board_api.py  # single file
```

### Docker (production)
```bash
./scripts/start-mac.sh   # Build and run on port 8000
./scripts/stop-mac.sh    # Stop container
```

## Architecture

### Data Flow
1. Frontend (`KanbanBoard.tsx`) fetches board state from `GET /api/board` on mount
2. Drag-and-drop updates are persisted via `PUT /api/board` (full board replacement)
3. AI chat sends `POST /api/ai/chat` with message, history, and full board state; response may include an updated board that the frontend applies

### Backend (`backend/`)
- `main.py` — FastAPI app, routes, static file serving
- `db.py` — SQLite helpers; auto-creates DB with default user/board/columns/cards on first access
- `models.py` — Pydantic schemas (`BoardData`, `AiChatRequest`, `AiChatResponse`)
- `ai.py` — OpenRouter integration; structured output enforced via schema validation
- Database: `backend/data/pm.db` (SQLite, path overridable via `PM_DB_PATH` env var)

**API endpoints:**
- `GET /api/board` — fetch board
- `PUT /api/board` — replace entire board state
- `POST /api/ai/chat` — AI chat with optional board mutation in response
- `GET /api/health` — health check

### Frontend (`frontend/src/`)
- `app/page.tsx` → renders `<AppShell>` which handles auth, then renders `<KanbanBoard>`
- `components/KanbanBoard.tsx` — main board UI, drag-and-drop (@dnd-kit), API calls, AI chat state
- `components/ChatSidebar.tsx` — AI chat UI panel
- `components/KanbanColumn.tsx`, `KanbanCard.tsx` — draggable primitives
- `lib/kanban.ts` — pure business logic: `moveCard()`, `createId()`, TypeScript types

### Environment
- `OPENROUTER_API_KEY` — required in `.env` at project root

## Coding Standards

From `AGENTS.md`:
1. Use latest library versions and idiomatic approaches
2. Keep it simple — never over-engineer, no unnecessary defensive programming, no extra features
3. Be concise; no emojis ever
4. When hitting issues, identify root cause before fixing — prove with evidence, then fix the root cause

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991`
- Dark Navy: `#032147`
- Gray Text: `#888888`

## Planning Docs

The project plan and database schema are in `docs/`. Review `docs/PLAN.md` before starting new work.
