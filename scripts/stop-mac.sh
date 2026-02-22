#!/usr/bin/env bash
set -e

docker stop pm-app >/dev/null 2>&1 || true
docker rm pm-app >/dev/null 2>&1 || true
