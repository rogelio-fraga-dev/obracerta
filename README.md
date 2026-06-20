# ObraCerta (working name: QuemFaz)

Marketplace vertical bilateral de profissionais da construção civil — reputação verificada, agenda em tempo real, avaliação dupla-cega e lances sigilosos. Web responsivo (mobile-first) + PWA instalável — **sem app nativo**.

> ⚠️ O nome final ainda está em definição. A marca (nome, cores, domínio, e-mail) é **desacoplada** via config + design tokens (env vars `NEXT_PUBLIC_BRAND_*` + tokens), nunca hardcoded. `ObraCerta` é placeholder. Ver `docs/roadmap.md` §1.

## Estado atual — MVP navegável ponta a ponta (Fase 8, em andamento)

O produto já vai **muito além da fundação**. As Fases 0–7 estão concluídas e a Fase 8 (evolução pós-auditoria) está em andamento. Em resumo, o que **existe hoje**:

- **Fase 0–1 — Fundação + Identidade/perfis** ✅ — monorepo, contratos Zod, persistência (Drizzle), cadastro/login, perfil com slug e completude, upload de foto (MinIO).
- **Fase 2 — Agenda e agendamento** ✅ — máquina de estados `agendar→aprovar→iniciar→concluir`, expiração 24h (BullMQ), bloqueio bilateral.
- **Fase 3 — Reputação** ✅ — avaliação dupla-cega, respostas, badges, trilha de eventos, denúncias, suspensões/apelação.
- **Fase 4 — Monetização** ✅ — assinaturas, compras avulsas, faturas, reembolsos (CDC), idempotência de webhook, `entitlements` (gating por plano). Dinheiro em centavos.
- **Fase 5 — Busca, perfil público e obras** ✅ — busca geográfica (PostGIS) + full-text (`pg_trgm`/`unaccent`), perfil público `/[slug]`, obras (`work_orders`) e lances sigilosos (`proposals`).
- **Fase 6 — Admin, hardening e observabilidade** ✅ — dashboard de métricas (North Star), `/metrics` Prometheus, logs estruturados + correlation id, suspensão no login, auto-lift de suspensão (job).
- **Fase 7 — Frontend completo (área logada / PWA)** ✅ — área logada navegável, instalável (PWA), E2E (Playwright) + acessibilidade (WCAG AA).
- **Fase 8 — Evolução pós-auditoria** 🚧 — catálogo fixo de profissões, landing nova, gating + upgrade no app, mensagem+contato pós-aceite (double-blind), ferramentas do profissional (orçamento/recibo), conta PJ/Empresa, portfólio de fotos, analytics estratégico do admin, reprecificação de planos, e correções da auditoria técnica (multi-agente). **Resta apenas perf/deploy** (não bloqueia demo).

> **Integrações reais ainda não cabladas** (dependem de contas/deploy): WhatsApp Cloud API, SMS, Asaas (cobrança), push VAPID e Google OAuth rodam com adapters fake/console em local. **Google = botão "em breve" (visual)**. Sem deploy por enquanto — tudo validado em localhost. Ver `docs/roadmap.md` §8.

## Personas e planos

Três tipos de conta: **PROFISSIONAL**, **CONTRATANTE** e **EMPRESA** (modelo 1 admin). Planos do profissional com gating real por `entitlements`:

| Plano | Preço/mês | Recursos principais |
|-------|-----------|---------------------|
| Iniciante | R$ 0 | Perfil público + **receber pedidos** |
| Pro | R$ 49 | + perfil completo, portfólio, analytics, **dar lances em obras** |
| Especialista | R$ 99 | + **ferramentas** (orçamento/recibo), topo da busca |

Monetização = **assinatura/mensalidade**. O valor da obra é combinado e pago **diretamente entre as partes** — a plataforma só intermedia a conexão (não é parte do contrato).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router, RSC) — `apps/web` |
| Backend | NestJS (Node 22 / TypeScript), modular monolith hexagonal/DDD — `apps/api` |
| ORM | **Drizzle** (SQL-first; PostGIS/`pg_trgm` via `sql`) — 16 migrations |
| Banco | PostgreSQL 16 + PostGIS + pg_trgm + unaccent |
| Cache/Filas | Redis (cache, OTP, BullMQ) |
| Object storage | MinIO local (API S3; R2 em produção) |
| Type-safety | `packages/shared` (tipos + Zod) consumido front↔back |
| Auth | E-mail+senha (scrypt, sem dep externa) · WhatsApp-OTP · Google (visual) |

## Estrutura do monorepo

```
obracerta/
├── apps/
│   ├── web/                 # Next.js 15 — público (SSR) + área logada (PWA) + BFF (route handlers)
│   └── api/                 # NestJS — modular monolith (hexagonal/DDD) + drizzle/ (migrations)
├── packages/
│   ├── shared/              # tipos + schemas Zod compartilhados front↔back
│   ├── ui/                  # Design System (componentes)
│   ├── design-tokens/       # paleta, tipografia, espaçamento (CSS vars + TS)
│   └── config/              # eslint, prettier, tsconfig, tailwind preset
├── infra/
│   ├── docker/              # docker-compose (Postgres + Redis + MinIO) + Dockerfiles
│   ├── coolify/             # manifestos de deploy
│   └── k6/                  # smoke/baseline de carga
└── docs/                    # PRD, roadmap, ADRs, C4, auditorias, mockups
```

### Domínios do backend (`apps/api/src/modules`)

`auth` · `users` · `onboarding` · `profiles` · `public-profile` · `availability` · `booking` · `decline-penalty` · `terms` · `reputation` · `moderation` · `billing` · `entitlements` · `search` · `work-orders` · `cities` · `professional-tools` · `storage` · `notifications` · `admin` · `audit` · `observability` · `health`

### Rotas da web (`apps/web/src/app`)

- **`(public)`** — landing, `cadastro`, `entrar`, perfil público `/[slug]`
- **`(app)`** (logada / PWA) — `inicio`, `buscar`, `agenda`, `pedidos`, `obras`, `cobrancas`, `ferramentas`, `perfil`, `admin`
- **`api/`** — BFF (route handlers que setam cookies httpOnly e encaminham para a API REST)

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

# 3. Subir Postgres + Redis + MinIO
pnpm docker:up

# 4. Aplicar migrations e popular dados de demo
pnpm --filter @obracerta/api db:migrate
pnpm --filter @obracerta/api db:seed

# 5. Rodar tudo em dev (web + api)
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3333 — healthcheck em `GET /health`
- MinIO console: http://localhost:9001
- Credenciais dos usuários de demo: `docs/credenciais-local.txt`

> No Windows, use `127.0.0.1` (não `localhost`) no `DATABASE_URL` — `localhost` pode resolver para IPv6 e quebrar o cliente `pg`.

## Scripts

### Raiz (Turborepo)

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Roda web + api em watch |
| `pnpm build` | Build de todos os pacotes/apps (ordem via Turborepo) |
| `pnpm lint` | ESLint em todo o monorepo |
| `pnpm typecheck` | Type-check de todos os workspaces |
| `pnpm test` | Testes de todos os workspaces |
| `pnpm format` | Prettier (write) |
| `pnpm docker:up` / `docker:down` / `docker:logs` | Postgres + Redis + MinIO |

### API (`pnpm --filter @obracerta/api ...`)

| Comando | Descrição |
|---------|-----------|
| `db:generate` | Gera migration a partir do schema Drizzle |
| `db:migrate` | Aplica migrations |
| `db:push` | Sincroniza schema sem migration (dev) |
| `db:studio` | Drizzle Studio |
| `db:seed` | Popula dados de demo |
| `test` | Unit (Jest) |
| `test:int` | Integração contra Postgres real |

### Web (`pnpm --filter @obracerta/web ...`)

| Comando | Descrição |
|---------|-----------|
| `e2e` | Testes E2E (Playwright) |

## Qualidade

- **Type-safety end-to-end**: schemas Zod em `packages/shared` validam em runtime e geram os tipos — uma mudança de contrato quebra front e back em compile time.
- **Testes**: unitários (domínio puro, TDD) + integração contra Postgres real (API) + E2E (Playwright) + acessibilidade (WCAG AA).
- **Segurança**: rate-limit global, CSP, security headers, validação de webhook (HMAC), confirmação na criação de admin.
- **CI** (`.github/workflows/ci.yml`): install → lint → typecheck → test → build.

## Documentação

- Roadmap (fonte única de organização das fases): [`docs/roadmap.md`](docs/roadmap.md)
- ADRs: [`docs/ADRs/0001-stack.md`](docs/ADRs/0001-stack.md) · Diagrama C4: [`docs/c4-model.md`](docs/c4-model.md)
- Auditorias: [`docs/auditoria-2026-06-09.md`](docs/auditoria-2026-06-09.md) · [`docs/auditoria-competitiva.md`](docs/auditoria-competitiva.md)
- Convenção de camadas da API: [`apps/api/README.md`](apps/api/README.md)
