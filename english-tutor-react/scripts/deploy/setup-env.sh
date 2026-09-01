#!/usr/bin/env bash
# Create .env with production secrets. Run from english-tutor-react/ directory.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  echo ".env already exists — not overwriting."
  echo "Delete it first if you want a fresh file."
  exit 1
fi

JWT_SECRET="$(openssl rand -hex 32)"
POSTGRES_PASSWORD="$(openssl rand -hex 16)"

cp .env.example .env

if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
  sed -i '' "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env
else
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env
fi

echo "Created .env with random JWT_SECRET and POSTGRES_PASSWORD."
echo ""
echo "Before going live:"
echo "  1. Set SEED_DEMO_USERS=false after first login"
echo "  2. Set DOMAIN and ACME_EMAIL when you have a domain"
echo "  3. Set CORS_ORIGINS=https://your-domain.com"
