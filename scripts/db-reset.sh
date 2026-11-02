#!/usr/bin/env bash
# Dev only: wipe the local Postgres volume, recreate it, apply migrations.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose down -v
docker compose up -d --wait postgres
(cd backend && npm run migration:run)
