#!/usr/bin/env bash
# Full first-time server deploy after git clone. Run as a user with docker access.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${EUID}" -eq 0 ]]; then
  echo "Run bootstrap as root first, then run this script as a normal user in the docker group."
  echo "  sudo bash scripts/deploy/bootstrap-server.sh"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker not available. Add your user to the docker group:"
  echo "  sudo usermod -aG docker \$USER && newgrp docker"
  exit 1
fi

[[ -f .env ]] || bash scripts/deploy/setup-env.sh
bash scripts/deploy/deploy.sh
bash scripts/deploy/install-backup-cron.sh

IP="$(curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo ""
echo "Deployed. Verify from your laptop:"
echo "  bash scripts/deploy/verify.sh ${IP}"
echo ""
echo "Before sharing with teachers:"
echo "  1. Set DOMAIN + ACME_EMAIL in .env for HTTPS"
echo "  2. Set CORS_ORIGINS=https://your-domain.com"
echo "  3. Set SEED_DEMO_USERS=false and redeploy"
echo "  4. Change demo passwords in the manager dashboard"
