#!/usr/bin/env bash
set -euo pipefail

branch="${1:-main}"
attempts="${DEPLOY_DB_RETRY_COUNT:-20}"
sleep_seconds="${DEPLOY_DB_RETRY_INTERVAL:-5}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the deployment host" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required on the deployment host" >&2
  exit 1
fi

if [ ! -d .git ]; then
  echo "deploy.sh must run from the repository root on the server" >&2
  exit 1
fi

echo "[deploy] syncing branch ${branch}"
git fetch origin "${branch}"
git checkout "${branch}"
git pull --ff-only origin "${branch}"

echo "[deploy] rebuilding services"
docker compose up -d --build

echo "[deploy] applying database migrations"
success=0
for attempt in $(seq 1 "${attempts}"); do
  if docker compose exec -T backend npx prisma migrate deploy; then
    success=1
    break
  fi
  echo "[deploy] migration attempt ${attempt}/${attempts} failed, retrying in ${sleep_seconds}s"
  sleep "${sleep_seconds}"
done

if [ "${success}" -ne 1 ]; then
  echo "[deploy] migrations failed after ${attempts} attempts" >&2
  exit 1
fi

echo "[deploy] current service status"
docker compose ps
