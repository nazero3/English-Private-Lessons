#!/usr/bin/env bash
# Dump Postgres to backups/lessons-YYYYMMDD-HHMMSS.sql.gz
# Install weekly cron: scripts/deploy/install-backup-cron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${ROOT}/backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/lessons-${STAMP}.sql.gz"

docker compose exec -T db pg_dump -U "${POSTGRES_USER:-lessons}" "${POSTGRES_DB:-lessons}" | gzip > "$OUT"

# Keep last 8 weekly backups
ls -1t "${BACKUP_DIR}"/lessons-*.sql.gz 2>/dev/null | tail -n +9 | xargs -r rm -f

echo "Backup written: $OUT"
