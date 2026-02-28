# Code Review

Reviewed against the full codebase as of Part 10 completion. Findings are grouped by severity. MVP-accepted trade-offs (hardcoded credentials, single user, no CSRF) are noted where relevant but not actioned.

---

## Bugs

### 1. Login does not persist the session (AppShell.tsx)

`handleSubmit` calls `setIsAuthed(true)` but never writes to `localStorage`. On a page refresh the user is immediately returned to the login screen because `readAuthState()` reads from `localStorage` and finds nothing.

`handleLogout` correctly calls `window.localStorage.removeItem(AUTH_KEY)`, so the remove-on-logout path is wired up but the set-on-login path is missing.

**Action:** Add `window.localStorage.setItem(AUTH_KEY, "true")` in `handleSubmit` after the credentials check passes.

---

### 2. Save errors are never cleared on success (KanbanBoard.tsx)

`saveBoard` sets `setError(...)` on failure but never calls `setError("")` on success. If a save fails (e.g. a transient network error) the error banner stays visible for all future operations even after the problem is resolved.

**Action:** Add `setError("")` at the start of `saveBoard`, before the fetch call.

---

## Code Quality

### 3. Duplicate OpenRouter client in main.py

`call_openrouter_test()` in `main.py` constructs its own `OpenAI` client and makes a raw chat call, duplicating logic that already lives in `ai.py`. The `/api/health?ai_test=true` endpoint only exists for smoke-testing AI connectivity.

**Action:** Either delete `call_openrouter_test` and the `ai_test` health route (they serve no production purpose), or move the function into `ai.py` and import it.

---

### 4. `get_board` runs seed logic on every read (db.py)

`get_board` calls `seed_default_data` unconditionally on each request. `seed_default_data` itself is idempotent (it early-returns if columns already exist), but it issues a `COUNT` query against the database on every GET. For an MVP this is harmless, but the seeding concern is separate from reading.

**Action:** Call `seed_default_data` only from `init_db`, not from `get_board`. Seeding once at startup is the right moment.

---

### 5. Orphaned cards are accepted silently (main.py)

`write_board` validates that every `cardId` referenced by a column exists in the `cards` map, but the reverse is not checked. Cards present in `cards` but not referenced by any column are silently stored and are then unreachable. An AI response that returns malformed board state could leave the DB with dead rows.

**Action:** After the existing validation loop, add a check that every key in `payload.cards` appears in at least one column's `cardIds`. Raise 400 if any orphans are found.

---

### 6. `initialData` exported from production code (kanban.ts)

`initialData` is a hardcoded board fixture that is only used in tests (`KanbanBoard.test.tsx`). Exporting it from the shared `kanban.ts` library couples production code to test fixtures.

**Action:** Move `initialData` into the test file (or a `src/test/fixtures.ts`) and remove the export from `kanban.ts`.

---

## Testing

### 7. No test for the orphan-card validation path (test_board_api.py)

The `PUT /api/board` route will return 400 if a `cardId` in a column is missing from `cards`. There is no test exercising this path.

**Action:** Add a test that sends a payload where a column references a card ID not present in `cards`, and asserts a 400 response.

---

### 8. Vitest global types not declared in tsconfig (tsconfig.json)

`vitest.config.ts` sets `globals: true`, which injects `expect`, `describe`, `it`, etc. at runtime, but the TypeScript compiler has no corresponding type declaration. The IDE reports `Cannot find name 'expect'` for test files even though tests run correctly.

**Action:** Add `"types": ["vitest/globals"]` to the `compilerOptions` in `tsconfig.json`, or add a `/// <reference types="vitest/globals" />` triple-slash directive to `src/test/setup.ts`.

---

## Infrastructure

### 9. No .dockerignore

Without a `.dockerignore`, `COPY backend /app/backend` sends the entire backend directory to the Docker daemon, including `tests/`, `__pycache__/`, and any local `data/*.db` files. This inflates the build context and copies test code into the image.

**Action:** Add a `.dockerignore` at the project root. At minimum exclude:
```
**/__pycache__
**/*.py[cod]
backend/data/
backend/tests/
frontend/node_modules/
frontend/.next/
frontend/out/
**/.DS_Store
```

---

### 10. Database is not volume-mounted

The SQLite file lives at `/app/backend/data/pm.db` inside the container. Any data entered through the UI is lost when the container is removed or rebuilt.

**Action:** Mount the data directory as a host volume in the start scripts, e.g.:
```bash
docker run -d --name pm-app --env-file .env \
  -v "$(pwd)/data:/app/backend/data" \
  -p 8000:8000 pm-app
```
Update all three platform start scripts accordingly.

---

### 11. No timeout on OpenRouter API calls (ai.py)

`call_openrouter_chat` makes a blocking HTTP call with no timeout configured on the `OpenAI` client. A slow or hung upstream response will hold the request open indefinitely.

**Action:** Pass a `timeout` parameter when constructing the client, e.g. `OpenAI(..., timeout=30.0)`.

---

## Minor / UX

### 12. Chat messages do not auto-scroll (ChatSidebar.tsx)

As messages accumulate, the message list does not scroll to reveal new entries. The user must scroll manually to see the latest AI response.

**Action:** Add a `useEffect` in `ChatSidebar` (or `KanbanBoard`) that scrolls the message container to the bottom whenever `messages` changes. Use a `ref` on the message list container.

---

### 13. NewCardForm inputs have no aria-label (NewCardForm.tsx)

The title and details inputs in `NewCardForm` use `placeholder` text for identification but have no `aria-label`. Placeholders disappear once the user starts typing and are not announced usefully by screen readers.

**Action:** Add `aria-label="Card title"` and `aria-label="Card details"` to the respective inputs.
