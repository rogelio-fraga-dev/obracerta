<!-- Generated: 2026-06-03 | Scope: deps & integrations (Fase 0) | Token estimate: ~500 -->

# Dependencies & Integrations

## Toolchain

```
Node >=22 · pnpm 9.15 (corepack) · Turborepo 2 · TypeScript 5.7
```

## Runtime — apps/api

```
@nestjs/* 11 (common/core/platform-express/config) · rxjs · reflect-metadata
pg (PostgreSQL)        infra adapter (ORM ADR still open)
ioredis (Redis)        infra adapter
zod                    env validation + shared schemas
@obracerta/shared      shared contracts
```

## Runtime — apps/web

```
next 15 · react 19 · react-dom 19
zod                    runtime validation (shared peer)
@obracerta/{shared,ui,design-tokens}
```

## Build/lint tooling

```
tsup (shared/ui/design-tokens build) · @nestjs/cli (api) · next (web)
eslint 9 (flat) + typescript-eslint + eslint-plugin-react(-hooks) + eslint-config-prettier
prettier 3 · tailwindcss 3.4 + postcss + autoprefixer
jest + ts-jest (api) · vitest (shared)
```

## Internal package graph

```
config        (no internal deps)
design-tokens → config(dev)
shared        → config(dev); peer: zod
ui            → config(dev), design-tokens(dev); peer: react/react-dom; deps: clsx, tailwind-merge
api           → shared, config(dev)
web           → shared, ui, design-tokens, config(dev)
```

## External services (behind ports — Fase 1+, NOT wired)

```
Asaas            PaymentGateway (Pix recorrência + avulso)   plan §7.1
WhatsApp Cloud   NotificationProvider (OTP + utility)        plan §7.2
SMS (Zenvia/SNS) OTP fallback                                plan §7.2
Cloudflare R2/S3 object storage (profile photos)            plan §3.2
```

## Infra / deploy

```
Docker Compose (local): postgis/postgis:16-3.4, redis:7-alpine
Deploy: Coolify on São Paulo VPS — infra/docker/Dockerfile.{api,web}, infra/coolify/
CI: .github/workflows/ci.yml (install → lint → typecheck → test → build)
```
