#!/usr/bin/env bash
# Avvia backend (wrangler pages dev) e frontend (ng serve) insieme, in un solo comando.
# Porte fisse per evitare conflitti tra sessioni: 4201 (FE) e 8788 (BE) per lo sviluppo
# normale; una sessione Claude che deve avviare la propria istanza per verifiche usa invece
# 4202/8789 (vedi README.md) e non tocca mai queste.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

npm run dev:api &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm --prefix web start
