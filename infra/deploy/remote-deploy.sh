#!/usr/bin/env bash
# Passo remoto do deploy — executado NA EC2 (via AWS SSM pelo CI, ou à mão).
# Roda como ec2-user, com o cwd já no repo e o git já atualizado. Puxa as imagens
# do GHCR e sobe o stack SEM buildar. Idempotente.
#
# Uso manual:
#   cd ~/obracerta && git pull origin master && \
#     GHCR_API_IMAGE=ghcr.io/<owner>/obracerta-api:latest \
#     GHCR_WEB_IMAGE=ghcr.io/<owner>/obracerta-web:latest \
#     bash infra/deploy/remote-deploy.sh
set -euo pipefail

: "${GHCR_API_IMAGE:?defina GHCR_API_IMAGE (ex.: ghcr.io/<owner>/obracerta-api:latest)}"
: "${GHCR_WEB_IMAGE:?defina GHCR_WEB_IMAGE (ex.: ghcr.io/<owner>/obracerta-web:latest)}"

COMPOSE=(docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml)

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
