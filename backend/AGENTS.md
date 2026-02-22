# Backend

FastAPI app used for local Docker runtime.

Key files
- main.py: API app entrypoint, serves exported frontend at /, health, and board APIs
- db.py: SQLite helpers for initializing, seeding, and reading/writing board data
- requirements.txt: Backend dependencies for runtime and tests
- static/: built frontend export served by FastAPI
- tests/: Pytest coverage for board API and database logic