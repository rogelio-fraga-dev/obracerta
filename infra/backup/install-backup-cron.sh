#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Instala o cron diário de backup na EC2 (03:10 UTC ≈ 00:10 em São Paulo).
# Idempotente: substitui a entrada anterior se existir.
#
# Uso (na EC2): bash infra/backup/install-backup-cron.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/obracerta}"
SCRIPT="$DEPLOY_DIR/infra/backup/pg-backup.sh"
LOG="$HOME/backups/backup.log"

[ -f "$SCRIPT" ] || { echo "✗ $SCRIPT não encontrado (rode o deploy antes)." >&2; exit 1; }
chmod +x "$SCRIPT"
mkdir -p "$HOME/backups"

ENTRY="10 3 * * * DEPLOY_DIR=$DEPLOY_DIR bash $SCRIPT >> $LOG 2>&1"
# `crontab -l` falha quando não há crontab e `grep -v` falha sem match — ambos
# são estados normais aqui, não erros (por isso o `|| true` sob set -e).
EXISTING="$(crontab -l 2>/dev/null | grep -v "pg-backup.sh" || true)"
printf '%s\n%s\n' "$EXISTING" "$ENTRY" | sed '/^$/d' | crontab -

echo "✓ Cron instalado:"
crontab -l | grep "pg-backup.sh" || { echo "✗ Entrada não encontrada." >&2; exit 1; }
