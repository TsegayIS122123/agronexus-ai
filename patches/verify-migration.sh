#!/usr/bin/env bash
# Run from repo root: bash patches/verify-migration.sh
set -e

echo "==> Starting Postgres..."
docker compose up -d postgres

echo "==> Waiting for it to be healthy..."
until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "Postgres is up."

echo "==> Activating venv..."
source .venv/Scripts/activate

echo "==> Running alembic upgrade head..."
cd ai-service
alembic upgrade head
cd ..

echo "==> Re-running the full test suite for good measure..."
PYTHONPATH=ai-service pytest tests -q

echo ""
echo "Done. If both the migration and tests passed above, Step 6 verification is genuinely complete."
