# @obracerta/api

NestJS modular monolith com arquitetura **hexagonal/DDD** (plan §5/§6). Cada domínio é um módulo com fronteira explícita (portas/adapters), extraível no futuro sem reescrita.

> Fase 0: apenas a fundação. Nenhuma regra de negócio ainda. O único endpoint é o healthcheck.

## Estrutura

```
src/
├── main.ts                     # bootstrap (validation pipe, envelope, filter, CORS)
├── app.module.ts               # raiz do monolito modular
├── config/
│   ├── env.validation.ts       # validação de env com Zod (fail-fast no boot)
│   └── configuration.ts        # config tipada (AppConfig)
├── common/                     # cross-cutting (hexagonal: adaptadores de entrega)
│   ├── filters/                # envelope de erro consistente
│   └── interceptors/           # envelope de sucesso (ApiResponse de @obracerta/shared)
├── infrastructure/             # adapters de saída (driven adapters)
│   ├── database/               # PostgreSQL (pool) — ORM é decisão de ADR aberta
│   └── cache/                  # Redis
└── modules/                    # domínios (bounded contexts)
    └── health/                 # exemplo: controller (entrega) + service (aplicação)
```

## Convenção por domínio (a aplicar nas Fases 1+)

Cada módulo de domínio deve seguir o layering hexagonal:

```
modules/<dominio>/
├── domain/            # entidades, value objects, regras puras, PORTAS (interfaces)
│   ├── <dominio>.entity.ts
│   └── ports/<dominio>.repository.ts   # interface (porta de saída)
├── application/       # casos de uso / services que orquestram o domínio
│   └── <caso-de-uso>.service.ts
├── infrastructure/    # ADAPTERS que implementam as portas (Postgres, APIs externas)
│   └── <dominio>.repository.ts
├── interface/         # ADAPTERS de entrega (controllers HTTP, consumers de fila)
│   ├── <dominio>.controller.ts
│   └── dto/
└── <dominio>.module.ts
```

Regras:

- O **domínio não importa** NestJS, ORM nem libs de infra — só tipos puros + portas.
- **Application** depende de portas (interfaces), nunca de implementações concretas.
- **Infrastructure** implementa as portas; o módulo faz o binding (`provide: PORT, useClass: Adapter`).
- **Interface** (controllers) é fino: valida input, chama um caso de uso, retorna DTO.
- Integrações externas (Asaas, WhatsApp, SMS) ficam atrás de portas (`PaymentGateway`, `NotificationProvider`) — plan §7.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm --filter @obracerta/api dev` | `nest start --watch` |
| `pnpm --filter @obracerta/api build` | `nest build` → `dist/` |
| `pnpm --filter @obracerta/api test` | testes Jest |

## Healthcheck

`GET /health` → envelope de sucesso com status de Postgres e Redis:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 12,
    "dependencies": { "postgres": "up", "redis": "up" }
  },
  "error": null
}
```
