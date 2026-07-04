#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Restore de um dump gerado pelo pg-backup.sh. DESTRUTIVO: o dump usa
# --clean --if-exists, então dropa e recria os objetos ao aplicar.
#
# Uso (na EC2):
#   CONFIRM=yes bash infra/backup/pg-restore.sh ~/backups/obracerta-YYYYmmdd-HHMMSS.sql.gz
# ─────────────────────────────────────────────────────────────
set -euo pipefail

FILE="${1:-}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/obracerta}"
ENV_PROD="$DEPLOY_DIR/infra/docker/.env.prod"
COMPOSE="docker compose --env-file $ENV_PROD -f $DEPLOY_DIR/infra/docker/docker-compose.prod.yml"

[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "✗ Informe o arquivo .sql.gz do backup." >&2; exit 1; }
[ "${CONFIRM:-}" = "yes" ] || { echo "✗ Restore é destrutivo. Rode com CONFIRM=yes." >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_PROD"

echo "▶ Restaurando $FILE em $POSTGRES_DB…"
gunzip -c "$FILE" | $COMPOSE exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q
echo "✓ Restore concluído. Reinicie a API para limpar caches: $COMPOSE restart api"
