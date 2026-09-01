#!/usr/bin/env bash
# Optional: create a DigitalOcean droplet via doctl.
# Prerequisites:
#   brew install doctl   OR   snap install doctl
#   doctl auth init      (paste API token from cloud.digitalocean.com/account/api/tokens)
#
# Usage:
#   export DO_TOKEN=dop_v1_...
#   ./scripts/deploy/create-droplet.sh [droplet-name]
set -euo pipefail

NAME="${1:-lesson-sheets}"
REGION="${DO_REGION:-fra1}"
SIZE="${DO_SIZE:-s-1vcpu-1gb}"
IMAGE="${DO_IMAGE:-ubuntu-24-04-x64}"
SSH_KEY_ID="${DO_SSH_KEY_ID:-}"

if ! command -v doctl >/dev/null 2>&1; then
  echo "doctl not found. Install: https://docs.digitalocean.com/reference/doctl/how-to/install/"
  echo ""
  echo "Or create a droplet manually:"
  echo "  1. https://cloud.digitalocean.com/droplets/new"
  echo "  2. Ubuntu 24.04, Basic 1GB, add SSH key"
  echo "  3. Note the public IPv4 address"
  exit 1
fi

if [[ -z "${DO_TOKEN:-}" ]]; then
  if ! doctl account get >/dev/null 2>&1; then
    echo "Not authenticated. Run: doctl auth init"
    exit 1
  fi
fi

ARGS=(compute droplet create "$NAME" --region "$REGION" --size "$SIZE" --image "$IMAGE")
if [[ -n "$SSH_KEY_ID" ]]; then
  ARGS+=(--ssh-keys "$SSH_KEY_ID")
fi

echo "Creating droplet: $NAME ($SIZE in $REGION)..."
doctl "${ARGS[@]}" --wait --format ID,Name,PublicIPv4,Status

echo ""
echo "SSH: ssh root@\$(doctl compute droplet list --format PublicIPv4 --no-header | head -1)"
echo "Then run bootstrap-server.sh on the server."
