$ErrorActionPreference = "Stop"

docker rm -f pm-app 2>$null

docker build -t pm-app .
New-Item -ItemType Directory -Force -Path ".\data" | Out-Null
docker run -d --name pm-app --env-file .env -p 8000:8000 `
  -v "${PWD}\data:/app/backend/data" pm-app
