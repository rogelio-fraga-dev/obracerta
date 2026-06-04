<!-- Generated: 2026-06-03 | Scope: Fase 0 foundation | Token estimate: ~600 -->

# Architecture

Type: **Turborepo + pnpm monorepo**. Stage: **Fase 0** (foundation; no business logic).

## System

```
Browser ──HTTPS──> apps/web (Next.js 15)
                     │  (public) SSR/SSG: landing, /[slug]
                     │  (app)    logged-in area → PWA
                     │
                     └──REST + shared Zod types──> apps/api (NestJS)
                                                     │ hexagonal/DDD modular monolith
                          ┌──────────────┬───────────┴────────┐
                       PostgreSQL 16   Redis            external providers
                       +PostGIS        cache/OTP/       (Fase 1+, behind ports):
                       +pg_trgm        BullMQ            Asaas, WhatsApp, SMS
```

## Type-safety spine

`packages/shared` (Zod schemas + inferred types) is imported by BOTH apps. One contract; a change breaks both at compile time.

## Workspaces

```
apps/web              Next.js 15 App Router — (public) + (app) route groups
apps/api              NestJS modular monolith, hexagonal/DDD
packages/shared       Zod primitives, enums, API envelope, sample User
packages/ui           Design System components (Tailwind + tokens)
packages/design-tokens palette/type/spacing → tokens.css (CSS vars) + TS
packages/config       eslint / prettier / tsconfig bases / tailwind preset
infra/docker          docker-compose (Postgres+Redis), Dockerfiles
infra/coolify         deploy notes (São Paulo VPS)
docs/                 plano, PRD, proposta de valor, codemaps, ADRs
docs/mockups/         protótipos HTML aprovados (landing, prototipo, apresentação, carta)
```

## Build order (Turborepo `^build`)

config → design-tokens → shared → ui → api / web

## Verification gates (CI + local)

`pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test`

See `docs/roadmap.md` for the full plan and phase roadmap.
