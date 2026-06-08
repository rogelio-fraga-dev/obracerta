# seed-completo.ps1
# Script para instalar, iniciar infra, rodar o seed completo e inciar o ambiente web+api

Write-Host "Verificando arquivo .env..." -ForegroundColor Cyan
if (-Not (Test-Path -Path ".env")) {
    Write-Host "Copiando .env.example para .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" -Destination ".env"
}

Write-Host "`n1. Instalando dependencias..." -ForegroundColor Cyan
pnpm install

Write-Host "`n2. Subindo infraestrutura via Docker (Postgres + Redis)..." -ForegroundColor Cyan
pnpm docker:up

Write-Host "`n3. Aguardando o banco de dados inicializar..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "`n4. Rodando migrações do banco de dados (Drizzle Push)..." -ForegroundColor Cyan
pnpm --filter @obracerta/api db:push

Write-Host "`n5. Executando o seed completo com Drizzle e TypeScript..." -ForegroundColor Cyan
pnpm --filter @obracerta/api exec tsx src/infrastructure/database/seed-completo.ts

Write-Host "`nSeed concluído! Iniciando o ambiente de desenvolvimento (pnpm dev)..." -ForegroundColor Green
Write-Host "Você pode acessar o frontend em: http://localhost:3000" -ForegroundColor Green
Write-Host "Pressione Ctrl+C a qualquer momento para parar.`n" -ForegroundColor Yellow

pnpm dev
