#!/usr/bin/env bash
# Run from repo root: bash patches/run-frontend.sh
set -e

echo "==> Activating repo venv (not strictly needed for frontend, kept for consistency)..."
source .venv/Scripts/activate

echo "==> Starting Next.js frontend..."
cd frontend
npm run dev
