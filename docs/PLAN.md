# High level steps for project

This plan expands each phase into concrete checklist items, plus tests and success criteria. All checklists should be kept up to date as work progresses.

Part 1: Plan

Checklist
- [ ] Expand this plan with detailed steps, tests, and success criteria for each part
- [ ] Create a frontend/AGENTS.md describing the existing frontend structure and key files
- [ ] Confirm plan with user before implementation

Tests
- [ ] None (planning only)

Success criteria
- [ ] Plan is detailed, unambiguous, and approved by the user
- [ ] frontend/AGENTS.md exists and reflects the current frontend

Part 2: Scaffolding

Checklist
- [x] Add Dockerfile and docker-related config for running backend + serving static assets
- [x] Create backend FastAPI app scaffold in backend/
- [x] Add minimal static HTML served at /
- [x] Add a minimal API endpoint (e.g., GET /api/health) and confirm it responds
- [x] Add start/stop scripts for Mac, PC, Linux in scripts/

Tests
- [x] Manual smoke test: container starts and serves HTML at /
- [x] Manual smoke test: GET /api/health returns 200 and expected payload

Success criteria
- [x] Running container serves the HTML page at /
- [x] API responds successfully inside the container
- [x] Start/stop scripts work on their target OS

Part 3: Add in Frontend

Checklist
- [x] Configure frontend static build output for serving by the backend
- [x] Serve built frontend at /
- [x] Ensure Kanban demo renders correctly
- [x] Add/extend unit tests for frontend logic
- [x] Add/extend integration tests for key UI flows

Tests
- [x] Frontend unit tests via Vitest
- [x] Frontend integration tests via Playwright

Success criteria
- [x] Built frontend is served at /
- [x] Kanban demo visible and usable
- [x] Unit + integration tests pass

Part 4: Add in a fake user sign in experience

Checklist
- [x] Add login UI gate for / with dummy credentials (user/password)
- [x] Add logout path returning user to login screen
- [x] Ensure Kanban is only visible after login
- [x] Add/extend tests for login/logout and access control

Tests
- [x] Vitest: auth-related UI logic
- [x] Playwright: login/logout flows and access gating

Success criteria
- [x] Unauthenticated users see login screen only
- [x] Correct credentials allow access to Kanban
- [x] Logout works and clears access
- [x] Tests pass

Part 5: Database modeling

Checklist
- [x] Propose SQLite schema covering users, boards, columns, cards
- [x] Save schema as JSON in docs/
- [x] Document database approach in docs/
- [x] Get user sign-off on schema and approach

Tests
- [ ] None (design only)

Success criteria
- [x] JSON schema exists and is documented
- [x] User approves schema

Part 6: Backend

Checklist
- [x] Implement SQLite initialization (create db if missing)
- [x] Add CRUD API routes for board, columns, cards
- [x] Support per-user data isolation
- [x] Add backend unit tests for routes and data access

Tests
- [x] Pytest unit tests for API and DB logic

Success criteria
- [x] API supports read/write for Kanban data
- [x] Database is created automatically when missing
- [x] Backend tests pass

Part 7: Frontend + Backend

Checklist
- [ ] Replace frontend demo data with backend API calls
- [ ] Ensure drag/drop and edits persist
- [ ] Handle loading/error states simply
- [ ] Add integration tests covering API-backed flows

Tests
- [ ] Vitest: frontend data and state logic
- [ ] Playwright: end-to-end flows against running backend

Success criteria
- [ ] Kanban persists via backend
- [ ] UI remains responsive and correct
- [ ] Tests pass

Part 8: AI connectivity

Checklist
- [ ] Add backend OpenRouter client
- [ ] Call model with a simple "2+2" prompt
- [ ] Log/return basic response for verification
- [ ] Add a backend test or manual verification step

Tests
- [ ] Manual smoke test: AI call returns expected answer

Success criteria
- [ ] OpenRouter call succeeds with expected response

Part 9: Structured Outputs for Kanban updates

Checklist
- [ ] Define JSON schema for AI response (message + optional board updates)
- [ ] Send board JSON, user question, and history to AI
- [ ] Validate and parse structured output
- [ ] Add backend tests for parsing and validation

Tests
- [ ] Pytest unit tests for schema validation and response handling

Success criteria
- [ ] AI returns structured output matching schema
- [ ] Parsed updates are valid and safe to apply
- [ ] Tests pass

Part 10: AI chat UI

Checklist
- [ ] Add sidebar chat UI to frontend
- [ ] Send chat to backend and render AI responses
- [ ] Apply AI-driven Kanban updates and refresh UI
- [ ] Add UI tests for chat and update flows

Tests
- [ ] Vitest: chat UI state and reducers
- [ ] Playwright: full chat flow and board update

Success criteria
- [ ] Chat works end-to-end
- [ ] AI updates reflect in Kanban automatically
- [ ] Tests pass