#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Deploy/atualização da nuvem — roda na SUA MÁQUINA (Git Bash/WSL/macOS/Linux).
# Conecta na EC2 por SSH, atualiza o código (git pull) e roda a rotina
# infra/docker/update.sh no servidor. Um comando = nuvem atualizada.
#
# Config (em ordem de precedência):
#   1) variáveis de ambiente
#   2) arquivo infra/deploy.env  (NÃO versionado — copie de deploy.env.example)
#
# Necessário: DEPLOY_HOST (IP público), DEPLOY_KEY (caminho do .pem).
# Opcionais:  DEPLOY_USER=ec2-user, DEPLOY_DIR=~/obracerta, DEPLOY_BRANCH=master, SEED=0
#
# Uso:
#   bash scripts/deploy-cloud.sh            # atualização normal
#   SEED=1 bash scripts/deploy-cloud.sh     # + roda o seed (1º deploy)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="$ROOT/infra/deploy.env"
# shellcheck disable=SC1090
[ -f "$CONF" ] && source "$CONF"

DEPLOY_USER="${DEPLOY_USER:-ec2-user}"
DEPLOY_DIR="${DEPLOY_DIR:-~/obracerta}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
SEED="${SEED:-0}"

if [ -z "${DEPLOY_HOST:-}" ] || [ -z "${DEPLOY_KEY:-}" ]; then
  echo "✗ Defina DEPLOY_HOST e DEPLOY_KEY (via env ou infra/deploy.env)." >&2
  echo "  Ex.: cp infra/deploy.env.example infra/deploy.env && edite." >&2
  exit 1
fi
if [ ! -f "$DEPLOY_KEY" ]; then
  echo "✗ Chave SSH não encontrada: $DEPLOY_KEY" >&2
  exit 1
fi

echo "▶ Conectando em $DEPLOY_USER@$DEPLOY_HOST ($DEPLOY_DIR, branch $DEPLOY_BRANCH)…"

ssh -i "$DEPLOY_KEY" -o StrictHostKeyChecking=accept-new "$DEPLOY_USER@$DEPLOY_HOST" \
  "DEPLOY_DIR='$DEPLOY_DIR' DEPLOY_BRANCH='$DEPLOY_BRANCH' SEED='$SEED' bash -s" <<'REMOTE'
set -euo pipefail
cd "${DEPLOY_DIR/#\~/$HOME}"

if [ -d .git ]; then
  echo "▶ git pull ($DEPLOY_BRANCH)…"
  git fetch origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
  git reset --hard "origin/$DEPLOY_BRANCH"
else
  echo "⚠ Sem repositório git aqui — envie o código por scp/tar (ver docs/deploy-ec2.md) antes de atualizar."
fi

bash infra/docker/update.sh

if [ "$SEED" = "1" ]; then
  ENV_FILE="infra/docker/.env.prod"
  # Passa -e só quando a senha está definida (não comentada). Se ausente, o seed
  # usa os padrões (admin@123 / senha@123).
  SEED_ENV=""
  adm="$(grep -E '^SEED_ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2- || true)"
  usr="$(grep -E '^SEED_USER_PASSWORD=' "$ENV_FILE" | cut -d= -f2- || true)"
  [ -n "$adm" ] && SEED_ENV="$SEED_ENV -e SEED_ADMIN_PASSWORD=$adm"
  [ -n "$usr" ] && SEED_ENV="$SEED_ENV -e SEED_USER_PASSWORD=$usr"
  echo "▶ Rodando seed (SEED=1)…"
  # shellcheck disable=SC2086
  docker compose --env-file "$ENV_FILE" -f infra/docker/docker-compose.prod.yml \
    run --rm $SEED_ENV api sh -lc "pnpm db:seed"
fi
REMOTE

echo "✓ Deploy finalizado."
