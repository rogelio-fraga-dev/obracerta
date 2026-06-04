# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

QuemFaz/ObraCerta — a vertical, two-sided marketplace for construction-trade professionals (verified reputation, real-time scheduling, double-blind reviews, sealed bids). Web-responsive (mobile-first) + installable PWA — **no native app**.

**The brand name is not final.** Name, colors, domain and e-mail are decoupled via env vars (`NEXT_PUBLIC_BRAND_*`) and design tokens — never hardcode them. `ObraCerta` is a placeholder.

The authoritative product/engineering plan is `docs/PLANO_DE_IMPLEMENTACAO.md`. The repo is currently at **Fase 0 (foundation)** — infrastructure and contracts only, **no business logic yet**. When implementing features, follow the phase roadmap in §8 of that plan and do not pull "Fora do MVP" items (§12) forward.

## Commands

All commands run from the repo root. Tasks are orchestrated by Turborepo (correct build order is derived from the dependency graph).

```bash
pnpm install              # install workspace deps (pnpm 9, Node >=22)
pnpm dev                  # run web + api in watch mode
pnpm build                # build every package/app in dependency order
pnpm lint                 # ESLint across all workspaces
pnpm typecheck            # tsc --noEmit across all workspaces
pnpm test                 # all workspace tests
pnpm format               # Prettier write

pnpm docker:up            # start Postgres 16 (PostGIS) + Redis locally
pnpm docker:down
```

Scope a command to one workspace with `--filter`:

```bash
pnpm --filter @obracerta/api dev          # nest start --watch
pnpm --filter @obracerta/api test         # jest
pnpm --filter @obracerta/web build        # next build
pnpm --filter @obracerta/shared test      # vitest run
```

Run a single test:

```bash
# API (Jest)
pnpm --filter @obracerta/api exec jest src/modules/health/health.service.spec.ts
pnpm --filter @obracerta/api exec jest -t "reports degraded"

# shared (Vitest)
pnpm --filter @obracerta/shared exec vitest run src/index.test.ts
```

Local run sequence: `cp .env.example .env` → `pnpm docker:up` → `pnpm dev`. Web at `:3000`, API at `:3333` (`GET /health`).

## Architecture

Turborepo + pnpm monorepo. **Type-safety is end-to-end**: `packages/shared` holds Zod schemas + inferred types consumed by *both* the API and the web app, so a contract change breaks both sides at compile time. This is the load-bearing design decision — keep request/response/domain shapes defined there, not duplicated per app.

### Workspaces

- **`apps/api`** — NestJS (Node 22), CommonJS output via NodeNext. **Modular monolith with hexagonal/DDD layering.** See `apps/api/README.md` for the per-domain layer convention (`domain` / `application` / `infrastructure` / `interface`). Key rules: the domain layer imports no framework/ORM; application depends on ports (interfaces); infrastructure implements them; external providers (Asaas, WhatsApp, SMS) sit behind ports. Relative imports use explicit `.js` specifiers (NodeNext).
- **`apps/web`** — Next.js 15 App Router. Two route groups under `src/app/`: `(public)` (SSR/SSG — landing, public profile `/[slug]`) and `(app)` (logged-in area, becomes the PWA). The root `layout.tsx` owns `<html>/<body>`; route-group layouts must not. **Next 15: `params`/`searchParams` are Promises** in async Server Components — `await` them.
- **`packages/shared`** — Zod primitives, domain enums, pagination, the API response envelope, and the sample `User` schema. Built with tsup (dual ESM/CJS + `.d.ts`/`.d.cts`). `zod` is a peer dependency.
- **`packages/design-tokens`** — palette/typography/spacing as the single source of truth, exported both as `tokens.css` (CSS custom properties, the canonical form) and typed JS values.
- **`packages/ui`** — design-system React components (Tailwind classes mapped to tokens). React 19: components take `ref` as a plain prop (no `forwardRef`).
- **`packages/config`** — shared ESLint flat configs (`base`/`nest`/`next`), Prettier config, tsconfig bases (`base`/`nestjs`/`nextjs`/`react-library`), and the Tailwind preset. Everything else extends these.

### Cross-cutting conventions

- **API response envelope** — every endpoint returns `{ success, data, error, meta? }`. The API enforces it globally: `ResponseEnvelopeInterceptor` wraps successes, `AllExceptionsFilter` shapes errors. Both are registered via `APP_INTERCEPTOR`/`APP_FILTER` in `AppModule` (DI-aware) — register new global filters/interceptors the same way, not with `new ...()` in `main.ts`. The matching Zod schema is `apiResponseSchema` in `packages/shared`.
- **Env validation** — `apps/api/src/config/env.validation.ts` validates env with Zod at boot (fail-fast). `configuration.ts` derives the typed `AppConfig` from that validated schema — add new config there, read it via `ConfigService<AppConfig, true>` with `{ infer: true }`.
- **Tailwind theming** — the preset maps theme keys to `var(--color-*)` etc.; the values live in `design-tokens/tokens.css`. Change tokens in the CSS, not in the preset. Apps must include `../../packages/ui/src/**` in their Tailwind `content` so DS classes are generated.
- **ESLint** — `consistent-type-imports` is intentionally **off** for the Nest config: with `emitDecoratorMetadata`, constructor-injected dependencies must be value imports or DI breaks.

### Tooling notes

- pnpm via `corepack` (or `npm i -g pnpm@9.15.0`). On this machine `corepack enable` needs admin; `npm i -g pnpm` is the working fallback.
- The ORM (Prisma vs Drizzle) is an **open ADR decision** (plan §13) — Fase 0 wires raw `pg`/`ioredis` for health checks only. Do not introduce schema/migration code until that ADR is recorded.
- Local infra: `infra/docker/docker-compose.yml` (PostGIS image; `pg_trgm`/`unaccent` enabled by `initdb/01-extensions.sql`). Deploy target is Coolify on a São Paulo VPS (`infra/coolify/`, `infra/docker/Dockerfile.{api,web}`).
- CI (`.github/workflows/ci.yml`): install → lint → typecheck → test → build.
