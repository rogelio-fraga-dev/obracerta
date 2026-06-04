# ObraCerta (working name: QuemFaz)

Marketplace vertical bilateral de profissionais da construção civil — reputação verificada, agenda em tempo real, avaliação dupla-cega e lances sigilosos. Web responsivo (mobile-first) + PWA — **sem app nativo**.

> ⚠️ O nome final ainda está em definição. A marca (nome, cores, domínio, e-mail) é **desacoplada** via config + design tokens (env vars + tokens), nunca hardcoded. `ObraCerta` é placeholder. Ver `docs/PLANO_DE_IMPLEMENTACAO.md` §1.

## Estado atual — Fase 0 (Fundação)

Esta é a fundação técnica reproduzível. **Nenhuma regra de negócio implementada ainda** (ver plano §8).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router, RSC) — `apps/web` |
| Backend | NestJS (Node 22 / TypeScript), modular monolith hexagonal/DDD — `apps/api` |
| Banco | PostgreSQL 16 + PostGIS + pg_trgm + unaccent |
| Cache/Filas | Redis |
| Type-safety | `packages/shared` (tipos + Zod) consumido front↔back |

## Estrutura do monorepo

```
obracerta/
├── apps/
│   ├── web/                 # Next.js 15 — público (SSR) + área logada (PWA)
│   └── api/                 # NestJS — modular monolith (hexagonal/DDD)
├── packages/
│   ├── shared/              # tipos + schemas Zod compartilhados front↔back
│   ├── ui/                  # Design System (componentes)
│   ├── design-tokens/       # paleta, tipografia, espaçamento (CSS vars + TS)
│   └── config/              # eslint, prettier, tsconfig, tailwind preset
├── infra/
│   ├── docker/              # docker-compose (Postgres + Redis) + Dockerfiles
│   └── coolify/             # manifestos de deploy
└── docs/                    # PRD, plano, ADRs, C4
```

## Pré-requisitos

- Node.js >= 22 (use `nvm use` — ver `.nvmrc`)
- pnpm >= 9 (`corepack enable` ou `npm i -g pnpm@9.15.0`)
- Docker + Docker Compose

## Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Subir Postgres + Redis
pnpm docker:up

# 4. Rodar tudo em dev (web + api)
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3333 — healthcheck em `GET /health`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Roda web + api em watch |
| `pnpm build` | Build de todos os pacotes/apps (ordem via Turborepo) |
| `pnpm lint` | ESLint em todo o monorepo |
| `pnpm typecheck` | Type-check de todos os workspaces |
| `pnpm test` | Testes de todos os workspaces |
| `pnpm format` | Prettier (write) |
| `pnpm docker:up` / `docker:down` | Sobe/derruba Postgres + Redis |

## Documentação

- Plano de implementação: [`docs/PLANO_DE_IMPLEMENTACAO.md`](docs/PLANO_DE_IMPLEMENTACAO.md)
- ADRs e diagramas C4: `docs/` (a adicionar — ADR-0001 stack, C4 inicial)
