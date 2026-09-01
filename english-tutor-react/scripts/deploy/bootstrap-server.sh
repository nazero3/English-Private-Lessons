#!/usr/bin/env bash
# Run on a fresh Ubuntu 24.04 VPS as root (or with sudo).
# Installs Docker, Compose plugin, and basic firewall rules.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -qq ca-certificates curl git ufw unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

apt-get install -y -qq docker-compose-plugin

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable docker
systemctl start docker

echo ""
echo "Bootstrap complete."
echo "  Docker: $(docker --version)"
echo "  Compose: $(docker compose version)"
echo "  Firewall: $(ufw status | head -1)"
echo ""
echo "Next: clone your repo, run scripts/deploy/setup-env.sh, then scripts/deploy/deploy.sh"
