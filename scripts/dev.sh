#!/usr/bin/env bash
# Avvia backend (wrangler pages dev) e frontend (ng serve) insieme, in un solo comando.
# Porte fisse per evitare conflitti tra sessioni: 4201 (FE) e 8788 (BE) per lo sviluppo
# normale; una sessione Claude che deve avviare la propria istanza per verifiche usa invece
# 4202/8789 (vedi README.md) e non tocca mai queste.
set -euo pipefail
cd "$(dirname "$0")/.."

# L'Angular CLI installato richiede una versione di Node più recente di quella di default in
# molte shell (vedi .nvmrc). "nvm install" (non "nvm use") perché non basta attivarla: se non
# è mai stata scaricata su questa macchina "nvm use" fallisce in silenzio e si continua con la
# versione sbagliata — "nvm install" la scarica se manca e poi la attiva, in un solo passo.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm install >/dev/null
else
  echo "Attenzione: nvm non trovato in $HOME/.nvm — verifica a mano che 'node -v' corrisponda a $(cat .nvmrc)." >&2
fi

npm run build

# "wrangler pages dev" a volte muore da solo dopo un po' (osservato: errori ECONNREFUSED sul
# proxy di Angular verso /api, backend sparito ma il frontend ancora acceso) — invece di
# lasciare che l'intera sessione richieda un riavvio manuale, lo si tiene vivo in un loop: se
# il processo termina per qualunque motivo, riparte da solo dopo un secondo. Il frontend non
# viene mai toccato, si accorge solo di qualche richiesta fallita nel frattempo.
(
  while true; do
    npm run dev:api
    echo "[dev.sh] il backend si è fermato, lo riavvio..." >&2
    sleep 1
  done
) &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  pkill -P "$API_PID" 2>/dev/null || true
  # "npm run dev:api" scala in altri processi ancora (wrangler, poi workerd): il modo
  # affidabile di essere sicuri che la porta sia libera per il prossimo avvio è liberarla
  # direttamente, non inseguire l'albero dei processi.
  lsof -ti:8788 -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm --prefix web start
