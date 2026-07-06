#!/usr/bin/env bash
# Passo remoto do deploy — executado NA EC2 (via AWS SSM pelo CI, ou à mão).
# Roda como ec2-user, com o cwd já no repo e o git já atualizado. Puxa as imagens
# do GHCR e sobe o stack SEM buildar. Idempotente.
#
# Uso manual:
#   cd ~/obracerta && git fetch origin master -q && git reset --hard FETCH_HEAD && \
#     GHCR_API_IMAGE=ghcr.io/<owner>/obracerta-api:latest \
#     GHCR_WEB_IMAGE=ghcr.io/<owner>/obracerta-web:latest \
#     bash infra/deploy/remote-deploy.sh
set -euo pipefail

: "${GHCR_API_IMAGE:?defina GHCR_API_IMAGE (ex.: ghcr.io/<owner>/obracerta-api:latest)}"
: "${GHCR_WEB_IMAGE:?defina GHCR_WEB_IMAGE (ex.: ghcr.io/<owner>/obracerta-web:latest)}"

COMPOSE=(docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml)

# ── Bootstrap de segredos (idempotente) ─────────────────────────────────────
# A API agora FALHA o boot em produção se PAYMENT_WEBHOOK_SECRET estiver no
# default de dev (anti-fraude de webhook). Gera um segredo forte na primeira
# subida e persiste no .env.prod — nunca versionado, nunca no log.
ENV_PROD=infra/docker/.env.prod
if ! grep -q '^PAYMENT_WEBHOOK_SECRET=' "$ENV_PROD" 2>/dev/null; then
  echo "PAYMENT_WEBHOOK_SECRET=$(openssl rand -hex 32)" >> "$ENV_PROD"
  echo "▶ PAYMENT_WEBHOOK_SECRET gerado e persistido em $ENV_PROD (primeira subida)."
elif grep -q '^PAYMENT_WEBHOOK_SECRET=dev-webhook-secret-change-me$' "$ENV_PROD"; then
  # Valor de exemplo copiado do template — troca por um segredo real.
  sed -i "s|^PAYMENT_WEBHOOK_SECRET=dev-webhook-secret-change-me$|PAYMENT_WEBHOOK_SECRET=$(openssl rand -hex 32)|" "$ENV_PROD"
  echo "▶ PAYMENT_WEBHOOK_SECRET estava no valor de exemplo — rotacionado."
fi

echo "▶ 1/4 Pullando imagens do GHCR…"
docker pull "$GHCR_API_IMAGE"
docker pull "$GHCR_WEB_IMAGE"

echo "▶ 2/4 Subindo o stack (sem build)…"
# O env do shell tem precedência sobre o --env-file na interpolação do compose,
# então usa exatamente as imagens pullada acima.
export GHCR_API_IMAGE GHCR_WEB_IMAGE
"${COMPOSE[@]}" up -d --no-build

echo "▶ 3/4 Aplicando migrations…"
"${COMPOSE[@]}" run --rm api sh -lc "pnpm db:migrate"

echo "▶ 4/4 Limpando imagens antigas…"
docker image prune -f > /dev/null

echo "✓ Deploy concluído."
"${COMPOSE[@]}" ps
