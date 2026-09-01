#!/usr/bin/env bash
# Pull origin/main and rebuild the stack. Run on the VPS (by hand or from CI).
# Does not touch .env.
set -euo pipefail

APP="$(cd "$(dirname "$0")/../.." && pwd)"

if git -C "$APP" rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO="$(git -C "$APP" rev-parse --show-toplevel)"
elif git -C "$APP/.." rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO="$(git -C "$APP/.." rev-parse --show-toplevel)"
else
  echo "Cannot find git root from $APP"
  exit 1
fi

echo "Repo: $REPO"
echo "App:  $APP"

cd "$REPO"
git fetch origin
git checkout main
git pull --ff-only origin main
echo "Now at $(git rev-parse --short HEAD) $(git log -1 --format='%s')"

cd "$APP"
bash scripts/deploy/deploy.sh
