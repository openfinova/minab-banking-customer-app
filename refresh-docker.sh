#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/../minab-banking" && pwd)"

if [[ ! -f "$COMPOSE_DIR/compose.yml" ]]; then
  echo "Error: compose.yml not found at $COMPOSE_DIR" >&2
  echo "Expected minab-banking as a sibling of minab-banking-customer-app." >&2
  exit 1
fi

cd "$COMPOSE_DIR" 
docker compose build --no-cache customer-app
docker compose up -d customer-app

echo "Customer app rebuilt and running at http://localhost:3001"
