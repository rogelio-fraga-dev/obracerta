# ADR-0001 — Stack de fundação (Fase 0)

- **Status:** Aceito
- **Data:** 2026-06-04
- **Decisores:** Time de engenharia (dono do produto + engenharia)
- **Contexto do roadmap:** Fase 0 — Fundação (`docs/roadmap.md` §8)

> ADR (Architecture Decision Record): registro curto e durável de uma decisão
> arquitetural relevante — o **contexto**, a **decisão** e as **consequências** —
> para que, no futuro, se saiba *por que* o sistema é como é (e não só *como* ele é).

---

## 1. Contexto

O ObraCerta/QuemFaz é um marketplace vertical bilateral para profissionais da
construção civil: reputação verificada, agenda em tempo real, avaliação
dupla-cega, lances sigilosos, busca **geográfica** e **full-text**. Entrega
web-responsiva + PWA instalável (sem app nativo).

Requisitos que pressionam a escolha de stack:

- **Type-safety end-to-end** (front↔back) para reduzir bugs de contrato — é a
  decisão "que sustenta o resto" (load-bearing) do projeto.
- **Busca geográfica** (raio de atendimento) → PostGIS.
- **Busca textual** tolerante a acento/erro de digitação → `pg_trgm` + `unaccent`.
- **Escalável desde já, mas simples de operar** por um time pequeno.
- **Qualidade de portfólio**: arquitetura limpa, observabilidade, CI/CD, docs.
- **Marca não-final**: nome, cores, domínio e e-mail desacoplados via env/tokens.

## 2. Decisão

Adotamos a seguinte stack de fundação:

| Camada | Escolha | Observação |
| --- | --- | --- |
| Monorepo | **Turborepo + pnpm** | Build cacheado por grafo de dependências; workspaces nativos. |
| Linguagem | **TypeScript** (Node ≥ 22) | Único idioma front↔back↔config. |
| Contrato compartilhado | **Zod** em `packages/shared` | Schemas validam em runtime e geram os tipos (`z.infer`). Fonte única. |
| Back-end | **NestJS** (hexagonal/DDD, **monolito modular**) | Saída CommonJS (NodeNext). Domínio sem dependência de framework/ORM. |
| Front-end | **Next.js 15** (App Router) | Route groups `(public)`/`(app)`; o `(app)` vira o PWA. |
| Banco | **PostgreSQL 16 + PostGIS** | Geo (`ST_DWithin`) e extensões `pg_trgm`/`unaccent`. |
| Cache/filas | **Redis** | Sessões, rate-limiting, jobs futuros. |
| **ORM / acesso a dados** | **Drizzle ORM** + `drizzle-kit` (migrations) | Ver §3. |
| Design system | **design-tokens** (CSS vars, fonte única) + **`packages/ui`** (React 19) | Tailwind preset mapeia tokens. |
| Deploy (futuro) | **Coolify** em VPS São Paulo + Cloudflare | Adiado: Fase 0 validada em localhost primeiro. |

### 2.1 Princípios arquiteturais fixados

- **Envelope de resposta único** `{ success, data, error, meta? }` em todo
  endpoint, garantido globalmente via `APP_INTERCEPTOR`/`APP_FILTER` (DI-aware).
- **Validação de env no boot** com Zod (fail-fast); config tipada derivada do
  schema validado.
- **Ports & Adapters**: provedores externos (banco, Asaas, WhatsApp, SMS) ficam
  atrás de *ports*; a regra de negócio depende das interfaces, não das
  implementações.

## 3. Decisão de ORM: Drizzle (em vez de Prisma)

**Escolhido: Drizzle ORM.**

Motivos, na ordem de peso para *este* produto:

1. **PostGIS e `pg_trgm` são centrais e nativos no Drizzle.** A busca geográfica
   (profissionais por raio) e a busca textual são funcionalidades de núcleo. No
   Drizzle, SQL específico de PostGIS entra via o helper `sql\`...\`` **integrado
   à query tipada**. No Prisma, tipos geográficos não são suportados — exigiriam
   `$queryRaw` como "ilhas" de SQL não conferido pelos tipos.
2. **SQL-first alinhado ao objetivo de aprendizado e controle.** O time enxerga
   e escreve o SQL real, sem camada opaca — melhor para depurar performance de
   queries geo/full-text.
3. **Mesma filosofia do Zod já adotado.** O schema é TypeScript puro e o tipo é
   inferido dele (`typeof tabela.$inferSelect`), consistente com o contrato Zod
   do `packages/shared`. Sem linguagem/codegen à parte.
4. **Leve.** Sem query engine separado (binário) como o do Prisma.

**Trade-offs aceitos** (consequências negativas conhecidas):

- Onboarding um pouco mais "mão na massa" que o Prisma.
- Tooling visual (`drizzle-studio`) mais novo que o `prisma studio` maduro.
- Migrations exigem revisão manual do SQL gerado pelo `drizzle-kit` (visto como
  vantagem de controle, não defeito).

**Mitigação:** como o ORM fica atrás de *repository ports* (hexagonal), o custo
de uma eventual troca futura fica contido à camada de infraestrutura.

## 4. Alternativas consideradas

- **Prisma** — DX e migrations maduras, `prisma studio`, ecossistema maior.
  Rejeitado porque PostGIS/geo obriga a sair do ORM (`$queryRaw` não-tipado),
  justamente nas funcionalidades de núcleo do produto.
- **`pg` cru / SQL puro** — controle total, mas sem segurança de tipos no acesso
  a dados nem migrations padronizadas. Mantido apenas como adapter de
  conectividade/health na Fase 0.
- **TypeORM / Sequelize** — mais antigos, type-safety inferior à do Drizzle;
  descartados.

## 5. Consequências

**Positivas**
- Contrato único front↔back; erros de contrato aparecem em compilação.
- Geo e full-text de primeira classe, sem fugir do ORM.
- Time desenvolve fluência em SQL real.
- Fundação reproduzível e cacheada; CI rápida.

**Negativas / pontos de atenção**
- Curva inicial do Drizzle e do padrão hexagonal exige disciplina.
- Migrations precisam de revisão humana do SQL gerado.

## 6. Itens em aberto (fora do escopo deste ADR)

- Modelagem completa de domínio e primeiras migrations → **Fase 1**.
- Estratégia de seed/fixtures de desenvolvimento.
- Provisionamento de VPS/Coolify/Cloudflare → quando sair de localhost.

## 7. Referências

- `docs/roadmap.md` (§4 Modelo de Dados, §8 Roadmap, §13 Próximos passos)
- `apps/api/README.md` (convenção de camadas hexagonais)
- Diagrama C4 inicial (a criar — segundo artefato restante da Fase 0)
