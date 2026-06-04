<!-- Generated: 2026-06-03 | Scope: apps/api (Fase 0) | Token estimate: ~600 -->

# Backend (apps/api — NestJS)

Modular monolith, hexagonal/DDD. Output: CommonJS via NodeNext (relative imports use `.js`).

## Routes (Fase 0)

```
GET /health → HealthController.check → HealthService.check
              → PostgresService.ping + RedisService.ping
              200 when ok / 503 when degraded (passthrough res)
```

## Request pipeline (global, registered in AppModule via APP_*)

```
ValidationPipe (whitelist, transform)        [main.ts]
  → ResponseEnvelopeInterceptor  → wraps { success:true, data, error:null }
  → AllExceptionsFilter          → { success:false, data:null, error:{code,message} }
```

## Key files

```
src/main.ts                                   bootstrap (pipe, CORS, port)
src/app.module.ts                             root; ConfigModule + global filter/interceptor
src/config/env.validation.ts                  Zod env schema, fail-fast validateEnv()
src/config/configuration.ts                   typed AppConfig derived from validated env
src/common/interceptors/response-envelope.interceptor.ts
src/common/filters/all-exceptions.filter.ts
src/infrastructure/database/postgres.service.ts   pg Pool + ping (no ORM yet — ADR open)
src/infrastructure/cache/redis.service.ts          ioredis + ping
src/modules/health/                            controller + service + spec
```

## Per-domain convention (Fase 1+)

```
modules/<domain>/
  domain/         entities, value objects, ports (interfaces) — no framework
  application/    use-case services (depend on ports)
  infrastructure/ adapters implementing ports (Postgres, external APIs)
  interface/      controllers/DTOs (thin) and queue consumers
  <domain>.module.ts  binds port → adapter
```
External providers (Asaas/WhatsApp/SMS) sit behind ports. See `apps/api/README.md`.

## Tests

Jest + ts-jest. `*.spec.ts` colocated. Run one: `pnpm --filter @obracerta/api exec jest <path>`.

## Config access

`ConfigService<AppConfig, true>.get("key", { infer: true })`. Keys: nodeEnv, port, corsOrigins, databaseUrl, redisUrl.
