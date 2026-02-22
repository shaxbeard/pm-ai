$ErrorActionPreference = "Stop"

docker stop pm-app 2>$null
docker rm pm-app 2>$null
