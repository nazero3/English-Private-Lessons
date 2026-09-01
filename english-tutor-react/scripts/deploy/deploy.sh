#!/usr/bin/env bash
# Deploy or update the stack. Run from english-tutor-react/ directory.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — run: scripts/deploy/setup-env.sh"
  exit 1
fi

# shellcheck disable=SC1091
source .env

COMPOSE_FILES=(-f docker-compose.yml)
if [[ -n "${DOMAIN:-}" ]]; then
  echo "DOMAIN=${DOMAIN} — deploying with Caddy HTTPS"
  COMPOSE_FILES+=(-f docker-compose.prod.yml)
  if [[ -n "${ACME_EMAIL:-}" ]]; then
  export ACME_EMAIL
  fi
  if [[ -n "${CORS_ORIGINS:-}" ]] && [[ "${CORS_ORIGINS}" != *"https://${DOMAIN}"* ]]; then
    echo "Tip: add https://${DOMAIN} to CORS_ORIGINS in .env"
  fi
else
  echo "No DOMAIN set — deploying HTTP on port ${HTTP_PORT:-80} (IP-only mode)"
fi

docker compose "${COMPOSE_FILES[@]}" up -d --build

echo ""
echo "Waiting for API health..."
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${HTTP_PORT:-80}/api/health" >/dev/null 2>&1; then
    echo "Health check OK: http://127.0.0.1:${HTTP_PORT:-80}/api/health"
    exit 0
  fi
  sleep 2
done

echo "Stack started but health check timed out. Check: docker compose logs api nginx"
exit 1
