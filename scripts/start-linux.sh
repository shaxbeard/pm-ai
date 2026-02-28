#!/usr/bin/env bash
set -e

docker rm -f pm-app >/dev/null 2>&1 || true

docker build -t pm-app .
mkdir -p "$(pwd)/data"
docker run -d --name pm-app --env-file .env -p 8000:8000 \
  -v "$(pwd)/data:/app/backend/data" pm-app
