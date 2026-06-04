<!-- Generated: 2026-06-03 | Scope: data layer (Fase 0) | Token estimate: ~450 -->

# Data

## Status

**No schema/migrations exist yet.** The ORM choice (Prisma vs Drizzle) is an **open ADR**
(plan §13). Fase 0 wires raw connectivity only (`pg` pool + `ioredis`) for health checks.
Do not add tables/migrations until the ADR is recorded.

## Stores

```
PostgreSQL 16  transactional + geo (PostGIS) + PT-BR search (pg_trgm/unaccent)
Redis 7        cache, sessions/OTP (short TTL), BullMQ backend
```

Local: `infra/docker/docker-compose.yml`. Extensions enabled by
`infra/docker/initdb/01-extensions.sql` (postgis, pg_trgm, unaccent).

## Connection

```
DATABASE_URL  postgresql://obracerta:obracerta@localhost:5432/obracerta
REDIS_URL     redis://localhost:6379
```

## Planned entities (plan §4 — NOT implemented)

users · cities · professional_profiles · professional_references · contractor_profiles ·
availability · schedule_blocks · booking_requests · terms_acceptances (append-only) ·
reviews (double-blind) · review_responses · badges · reputation_events (append-only) ·
work_orders · proposals · subscriptions · purchases · invoices · refunds · entitlements ·
otp_codes (Redis) · notifications · penalties · account_suspensions · platform_metrics ·
audit_log (append-only, tamper-evident).

## Invariants to honor when modelling

Reputation/reviews/terms/audit are **append-only** (immutability, plan §2.2). CPF never public (LGPD).

## Current shared contracts (`packages/shared`)

Zod: primitives (uuid/email/whatsapp/cpf/slug), enums (UserType, UserStatus, BookingStatus,
ContractorPlan, ProfessionalPlan, WorkUrgency), pagination, API envelope, sample `User`.
