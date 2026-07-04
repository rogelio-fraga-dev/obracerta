#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Backup diário do Postgres (roadmap §13.1). Roda NA EC2 via cron:
#   pg_dump (dentro do container) → gzip → ~/backups (retém 14)
#   → espelho no MinIO, bucket `backups` (retém 30 dias).
#
# Proteção contra: corrupção de dados, migration destrutiva, delete acidental.
# NÃO protege contra perda do host (disco/EC2) — para isso, o próximo passo do
# roadmap é espelhar num S3/R2 externo quando houver conta.
#
# Instalação: bash infra/backup/install-backup-cron.sh (na EC2, no dir do deploy)
# Uso manual: bash infra/backup/pg-backup.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Diretório do deploy (onde está infra/docker/.env.prod). Default: ~/obracerta.
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/obracerta}"
ENV_PROD="$DEPLOY_DIR/infra/docker/.env.prod"
COMPOSE="docker compose --env-file $ENV_PROD -f $DEPLOY_DIR/infra/docker/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
LOCAL_RETENTION="${LOCAL_RETENTION:-14}"   # quantos dumps ficam no disco
MINIO_RETENTION_DAYS="${MINIO_RETENTION_DAYS:-30}"
MINIO_BUCKET="backups"

[ -f "$ENV_PROD" ] || { echo "✗ $ENV_PROD não encontrado." >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_PROD"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="obracerta-$STAMP.sql.gz"

echo "▶ [$(date -Is)] pg_dump → $BACKUP_DIR/$FILE"
$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" --clean --if-exists "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/$FILE"

# Sanidade: um dump vazio/mínimo indica falha silenciosa.
SIZE=$(stat -c%s "$BACKUP_DIR/$FILE")
if [ "$SIZE" -lt 1024 ]; then
  echo "✗ Dump suspeito ($SIZE bytes) — abortando antes de rotacionar." >&2
  exit 1
fi
echo "✓ Dump ok ($SIZE bytes)"

# Retenção local: mantém os N mais recentes.
ls -1t "$BACKUP_DIR"/obracerta-*.sql.gz 2>/dev/null | tail -n "+$((LOCAL_RETENTION + 1))" \
  | xargs -r rm -f

# Espelho no MinIO (rede interna do compose) via container mc descartável.
NETWORK="obracerta-prod_internal"
echo "▶ Espelhando no MinIO (bucket $MINIO_BUCKET)…"
docker run --rm --network "$NETWORK" -v "$BACKUP_DIR:/backups:ro" --entrypoint sh \
  minio/mc:latest -c "
    mc alias set local http://minio:9000 '$S3_ACCESS_KEY' '$S3_SECRET_KEY' >/dev/null &&
    mc mb -p local/$MINIO_BUCKET >/dev/null 2>&1 || true &&
    mc cp /backups/$FILE local/$MINIO_BUCKET/ &&
    mc rm --recursive --force --older-than ${MINIO_RETENTION_DAYS}d local/$MINIO_BUCKET/ 2>/dev/null || true
  "

echo "✓ [$(date -Is)] Backup concluído: $FILE (local: $LOCAL_RETENTION últimos · MinIO: ${MINIO_RETENTION_DAYS}d)"
