#!/usr/bin/env bash
# Verify deployment is reachable. Usage:
#   ./scripts/deploy/verify.sh                  # localhost
#   ./scripts/deploy/verify.sh 203.0.113.42   # remote IP or domain
set -euo pipefail

HOST="${1:-127.0.0.1}"
PORT="${2:-80}"
BASE="http://${HOST}:${PORT}"

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
