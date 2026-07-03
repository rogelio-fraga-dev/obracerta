#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Rotina de atualização — roda NA EC2, dentro de ~/obracerta.
# Rebuilda as imagens, sobe os containers, aplica migrations e
# espera a API ficar saudável. Idempotente. NÃO roda seed (o seed
# é só no 1º deploy — ver docs/deploy-ec2.md).
#
# Uso (na EC2):  bash infra/docker/update.sh
# Normalmente chamado pelo scripts/deploy-cloud.sh (da sua máquina).
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ENV_FILE="infra/docker/.env.prod"
COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
COMPOSE="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ Falta $ENV_FILE — copie de infra/docker/.env.prod.example e preencha." >&2
  exit 1
fi

echo "▶ 1/4 Build + subir containers (pode levar 3–6 min no 1º build)…"
$COMPOSE up -d --build

echo "▶ 2/4 Aplicando migrations…"
$COMPOSE run --rm api sh -lc "pnpm db:migrate"

echo "▶ 3/4 Aguardando a API ficar saudável…"
for i in $(seq 1 30); do
  status="$($COMPOSE ps api --format '{{.Health}}' 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    echo "  API saudável."
    break
  fi
  if [ "$i" = "30" ]; then
    echo "✗ API não ficou saudável a tempo. Veja: $COMPOSE logs api" >&2
    exit 1
  fi
  sleep 3
done

echo "▶ 4/4 Limpando imagens órfãs…"
docker image prune -f >/dev/null

echo
$COMPOSE ps
# shellcheck disable=SC1090
PUBLIC_URL="$(grep -E '^PUBLIC_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
echo
echo "✓ Atualização concluída. Acesse: ${PUBLIC_URL:-https://app.SEU-IP.sslip.io}"
