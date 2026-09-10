#!/usr/bin/env bash
# Run from repo root: bash patches/run-ai-service.sh
set -e

echo "==> Starting Postgres (if needed)..."
docker compose up -d postgres

echo "==> Activating repo venv..."
source .venv/Scripts/activate

echo "==> Running migrations (best-effort)..."
cd ai-service
PYTHONPATH=. alembic upgrade head || true
cd ..

echo "==> Starting FastAPI backend..."
cd ai-service
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
