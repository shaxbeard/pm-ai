$ErrorActionPreference = "Stop"

docker rm -f pm-app 2>$null

docker build -t pm-app .
docker run -d --name pm-app --env-file .env -p 8000:8000 pm-app
