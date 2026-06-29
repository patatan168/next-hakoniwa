#!/usr/bin/env bash
set -euo pipefail

IMAGE="${DOCKER_BUILD_IMAGE:-node:24.14.1-alpine}"
WORKDIR="/app"

VOL_NODE_MODULES="hakoniwa-build-node-modules"
VOL_NPM_CACHE="hakoniwa-build-npm-cache"

cleanup() {
  docker volume rm "$VOL_NODE_MODULES" "$VOL_NPM_CACHE" >/dev/null 2>&1 || true
  docker builder prune -f >/dev/null 2>&1 || true
  docker container prune -f >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker volume inspect "$VOL_NODE_MODULES" >/dev/null 2>&1 || docker volume create "$VOL_NODE_MODULES" >/dev/null

docker volume inspect "$VOL_NPM_CACHE" >/dev/null 2>&1 || docker volume create "$VOL_NPM_CACHE" >/dev/null

docker run --rm \
  -v "$PWD":$WORKDIR \
  -v "$VOL_NODE_MODULES":$WORKDIR/node_modules \
  -v "$VOL_NPM_CACHE":/root/.npm \
  -w $WORKDIR \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e DB_TYPE=mysql \
  -e DB_CONNECTION_STRING=mysql://dummy:dummy@localhost:3306/hakoniwa \
  -e NEXT_PUBLIC_ORIGIN_URL=http://localhost \
  "$IMAGE" sh -ec 'apk add --no-cache libc6-compat git python3 make g++ && git init && npm ci --no-audit --progress=false && npm run build'
