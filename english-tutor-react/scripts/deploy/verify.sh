#!/usr/bin/env bash
# Verify deployment is reachable. Usage:
#   ./scripts/deploy/verify.sh                  # localhost (HTTP)
#   ./scripts/deploy/verify.sh 203.0.113.42       # remote IP (HTTP)
#   ./scripts/deploy/verify.sh kinz-teach.cloud   # domain (HTTPS if redirect detected)
set -euo pipefail

HOST="${1:-127.0.0.1}"
PORT="${2:-80}"
SCHEME="http"
BASE="http://${HOST}:${PORT}"

# Domain names with TLS usually redirect HTTP → HTTPS (308)
if [[ "$HOST" != "127.0.0.1" && "$HOST" != "localhost" && "$HOST" != *.*.*.* ]]; then
  REDIRECT="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/" || true)"
  if [[ "$REDIRECT" == "301" || "$REDIRECT" == "302" || "$REDIRECT" == "308" ]]; then
    SCHEME="https"
    BASE="https://${HOST}"
    echo "HTTP redirects to HTTPS (${REDIRECT}) — checking ${BASE}"
  fi
fi

echo "Checking ${BASE}/api/health ..."
HEALTH="$(curl -sf "${BASE}/api/health")"
echo "  $HEALTH"

echo "Checking ${BASE}/ (frontend) ..."
STATUS="$(curl -sf -o /dev/null -w '%{http_code}' "${BASE}/")"
if [[ "$STATUS" != "200" ]]; then
  echo "  FAIL: HTTP $STATUS"
  exit 1
fi
echo "  HTTP $STATUS"

echo ""
echo "Deployment looks healthy at ${BASE}"
