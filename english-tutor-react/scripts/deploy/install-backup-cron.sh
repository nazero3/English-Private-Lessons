#!/usr/bin/env bash
# Install weekly DB backup cron (Sundays 03:15).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_SCRIPT="${ROOT}/scripts/deploy/backup-db.sh"
CRON_LINE="15 3 * * 0 cd ${ROOT} && ${BACKUP_SCRIPT} >> ${ROOT}/backups/backup.log 2>&1"

mkdir -p "${ROOT}/backups"

if crontab -l 2>/dev/null | grep -Fq "$BACKUP_SCRIPT"; then
  echo "Backup cron already installed."
  exit 0
fi

(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
echo "Installed weekly backup cron:"
echo "  $CRON_LINE"
