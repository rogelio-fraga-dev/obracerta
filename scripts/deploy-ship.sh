#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Deploy "build local → ship" — reproduz o método usado no deploy da demo
# (Antigravity): builda as imagens NA SUA MÁQUINA, salva em tar, envia por scp,
# carrega na EC2 e sobe a stack. Não builda no servidor (a EC2 pode ser pequena).
#
# NÃO roda seed — atualização não-destrutiva (preserva os dados que a stakeholder
# já viu). Só aplica migrations novas.
#
# Config em infra/deploy.env (gitignored): DEPLOY_HOST, DEPLOY_KEY, DEPLOY_USER,
# DEPLOY_DIR. Uso:  bash scripts/deploy-ship.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
[ -f infra/deploy.env ] && source infra/deploy.env

DEPLOY_USER="${DEPLOY_USER:-ec2-user}"
# Relativo ao home remoto — NÃO usar ~ (o bash expande p/ o home LOCAL).
DEPLOY_DIR="${DEPLOY_DIR:-obracerta}"
SKIP_BUILD="${SKIP_BUILD:-0}"
ENV_PROD="infra/docker/.env.prod"
COMPOSE="docker compose --env-file $ENV_PROD -f infra/docker/docker-compose.prod.yml"

for v in DEPLOY_HOST DEPLOY_KEY; do
  [ -z "${!v:-}" ] && { echo "✗ Falta $v (defina em infra/deploy.env)." >&2; exit 1; }
done
[ -f "$DEPLOY_KEY" ] || { echo "✗ Chave não encontrada: $DEPLOY_KEY" >&2; exit 1; }
[ -f "$ENV_PROD" ] || { echo "✗ Falta $ENV_PROD (config de produção)." >&2; exit 1; }

# Cópia da chave com permissão 600 (ssh recusa chave "aberta" no Windows/Git Bash).
KEY="$(mktemp)"; cp "$DEPLOY_KEY" "$KEY"; chmod 600 "$KEY"
trap 'rm -f "$KEY"' EXIT

SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"
TARGET="$DEPLOY_USER@$DEPLOY_HOST"

if [ "$SKIP_BUILD" = "1" ]; then
  echo "▶ 1-2/5 SKIP_BUILD=1 — reutilizando tars existentes em deploy-temp/…"
  [ -f deploy-temp/obracerta-api.tar ] && [ -f deploy-temp/obracerta-web.tar ] || {
    echo "✗ Tars não encontrados em deploy-temp/ (rode sem SKIP_BUILD)." >&2; exit 1; }
else
  echo "▶ 1/5 Buildando imagens localmente (api + web)…"
  $COMPOSE build api web

  echo "▶ 2/5 Salvando imagens em tar…"
  mkdir -p deploy-temp
  docker save obracerta-api:latest -o deploy-temp/obracerta-api.tar
  docker save obracerta-web:latest -o deploy-temp/obracerta-web.tar
fi

echo "▶ 3/5 Enviando imagens + infra para a EC2 ($TARGET)…"
$SSH "$TARGET" "mkdir -p ${DEPLOY_DIR}/infra/docker"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new \
  deploy-temp/obracerta-api.tar deploy-temp/obracerta-web.tar "$TARGET:${DEPLOY_DIR}/"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new -r \
  infra/docker/. "$TARGET:${DEPLOY_DIR}/infra/docker/"

echo "▶ 4/5 Carregando imagens e subindo a stack na EC2…"
$SSH "$TARGET" "DEPLOY_DIR='$DEPLOY_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "${DEPLOY_DIR/#\~/$HOME}"
docker load -i obracerta-api.tar
docker load -i obracerta-web.tar
docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml up -d
echo "▶ Aplicando migrations…"
docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml \
  run --rm api sh -lc "pnpm db:migrate"
docker image prune -f >/dev/null
rm -f obracerta-api.tar obracerta-web.tar
docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml ps
REMOTE

echo "▶ 5/5 Limpando tars locais…"
rm -rf deploy-temp

PUBLIC_URL="$(grep -E '^PUBLIC_URL=' "$ENV_PROD" | cut -d= -f2- || true)"
echo "✓ Deploy concluído. Acesse: ${PUBLIC_URL:-https://app.SEU-IP.sslip.io}"
