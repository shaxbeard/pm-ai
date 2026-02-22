# Backend

FastAPI app used for local Docker runtime.

Key files
- main.py: API app entrypoint, serves exported frontend at / and a health endpoint at /api/health
- requirements.txt: FastAPI and Uvicorn dependencies for the container
- static/: built frontend export served by FastAPI