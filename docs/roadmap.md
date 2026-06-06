# QuemFaz — Plano de Implementação do Sistema

> **Versão:** 2.1 · Junho 2026 · Confidencial
> **Base:** PRD v0.1 (26 seções) · Proposta de Valor v0.2 · Design System · Protótipos HTML · Apresentação técnica
> **Mudança v1.0 → v2.0:** stack revisada após análise de mercado (ver `~/.claude/plans/voce-acha-que-essa-snappy-island.md`). Principais decisões: backend **NestJS/TypeScript**, frontend **único Next.js 15**, infra em **região São Paulo**, **WhatsApp Cloud API oficial + fallback SMS**, **Asaas** atrás de abstração, e adição de PostGIS, object storage, fila de jobs durável, observabilidade e camada de segurança/portfólio.
> **Mudança v2.0 → v2.1:** nome de trabalho **QuemFaz** (placeholder — ver §1); reforço de que o produto é **web responsivo (mobile-first) + PWA instalável** — **sem app nativo**; adicionada a **Base de Design (§14)** extraída dos 3 protótipos HTML.
> **Objetivo deste documento:** transformar o discovery feito num plano executável de construção do produto completo — da fundação técnica ao lançamento do MVP em Uberlândia/MG, com visão de evolução pós-lançamento.

---

## 1. Visão Geral

O ObraCerta é um **marketplace vertical bilateral** de profissionais da construção civil, com reputação verificada, agenda em tempo real, avaliação dupla e cega e sistema de lances sigilosos. O modelo é inspirado no Airbnb: a plataforma **conecta** as partes, mas não é parte do contrato de serviço.

**Meta do MVP:** validar o modelo em Uberlândia com profissionais e clientes reais — provar que a reputação retém o profissional e que o cliente paga pela confiança.

**Critérios de sucesso do MVP (do business plan):**
- 50 profissionais ativos por especialidade principal **antes** de abrir para contratantes (resolve "ovo e galinha").
- 300 profissionais pagantes em 12 meses.
- Retenção mensal > 75% após o período de graça.
- NPS > 50 entre contratantes Completo/Lance.
- Zero incidente jurídico grave (proteção via termos de ciência bilaterais).

**North Star Metric:** número de obras concluídas e avaliadas bilateralmente.

**Objetivos de engenharia (definidos pelo dono do projeto):** construir **escalável desde já**, com **foco em segurança** e qualidade de **portfólio**. Isso orienta escolhas por arquitetura limpa (DDD/hexagonal), observabilidade, CI/CD e documentação de arquitetura — sem cair em over-engineering (nada de microserviços no MVP).

> ⚠️ **Pendência de produto (bloqueante de marca, não de código):** o nome final ainda está em definição (`Projeto_Naming_Contexto_Completo.docx`). Todo o código isola marca/domínio em **config + design tokens** (env vars + tokens), nunca hardcoded, para permitir rename sem refatoração. Usamos `ObraCerta` como placeholder.

---

## 2. Princípios de Engenharia

1. **KISS / YAGNI** — construir o MVP do PRD, nada além. Tudo "Fora MVP" (PRD §25) **não entra**: chat interno, upload de docs, contratos, escrow, app nativo, senha, verificação de antecedentes.
2. **Imutabilidade** — histórico de reputação, avaliações e aceites de termos são **append-only**. Nunca sobrescrever.
3. **Arquivos pequenos e coesos** — por domínio/feature, 200–400 linhas típico, 800 máx.
4. **Validação nas fronteiras** — todo input validado (Zod no backend e no frontend, schema compartilhado).
5. **Erros explícitos** — sem falha silenciosa; mensagem amigável na UI, log estruturado no servidor.
6. **TDD** nas regras críticas (agendamento, penalidades, reputação, reembolso). Cobertura mínima 80%.
7. **Marca desacoplada** — nome, cores, domínio e e-mail via config/tokens.
8. **Segurança por padrão** — OWASP ASVS, rate limiting, secrets fora do código, auditoria imutável.

---

## 3. Arquitetura Técnica

### 3.1 Visão de alto nível

```
                        ┌─────────────────────────────┐
                        │   Cloudflare (DNS + CDN +    │
                        │   WAF + proteção DDoS)        │
                        └──────────────┬──────────────┘
                                       │ HTTPS (Let's Encrypt)
                        ┌──────────────▼──────────────┐
                        │  Reverse proxy (Traefik via  │
                        │  Coolify) — VPS São Paulo 8GB │
                        └──────┬───────────────┬───────┘
                               │               │
                ┌──────────────▼──────────────┐│
                │   apps/web — Next.js 15      ││
                │   • rotas públicas SSR/SSG   ││
                │     (landing, perfil público)││
                │   • route group (app) = PWA  ││
                │     client-side (área logada)││
                └──────────────┬───────────────┘
                               │ REST/OpenAPI (tipos via packages/shared)
                ┌──────────────▼──────────────────────────────┐
                │   apps/api — NestJS (Node 22 / TypeScript)   │
                │   Modular monolith + Hexagonal/DDD           │
                │   + BullMQ workers (jobs duráveis)           │
                └──┬─────────┬──────────┬──────────┬──────────┘
                   │         │          │          │
          ┌────────▼──┐ ┌────▼────┐ ┌───▼─────┐ ┌──▼──────────┐
          │PostgreSQL │ │  Redis  │ │ Object  │ │  Provedores │
          │16+PostGIS │ │ cache+  │ │ storage │ │  externos   │
          │+pg_trgm   │ │ BullMQ  │ │ (R2/S3) │ │  (abaixo)   │
          │(gerenciado│ │         │ │ fotos   │ └─────────────┘
          │ ou VPS)   │ └─────────┘ └─────────┘
          └───────────┘
                   Provedores externos (atrás de portas/adapters):
        ┌──────────────┐  ┌────────────────────┐  ┌──────────────┐
        │ Asaas        │  │ WhatsApp Cloud API  │  │ SMS fallback │
        │ (Pix Autom.  │  │ (Meta, oficial)     │  │ (OTP backup) │
        │  + avulso)   │  │ + Evolution (dev)   │  │ Zenvia/SNS   │
        └──────────────┘  └────────────────────┘  └──────────────┘
```

### 3.2 Stack definitiva (revisada)

| Camada | Tecnologia | Papel / nota |
|--------|-----------|--------------|
| **Frontend (único)** | **Next.js 15** (App Router, RSC) | Rotas públicas SSR/SSG (landing, **perfil público** `/[slug]`) + route group `(app)` como **PWA** client-side da área logada. Substitui a divisão Next.js+SPA. |
| **Monorepo** | Turborepo + pnpm + Tailwind | `apps/web`, `apps/api`, `packages/shared` (tipos + **Zod**), `packages/ui`, `packages/design-tokens`, `packages/config`. **Type-safety end-to-end.** |
| **Backend** | **NestJS** (Node 22 / TypeScript) | API REST, regras de negócio, **modular monolith + hexagonal/DDD**. Mesma linguagem do front. |
| **Filas / jobs** | **BullMQ** (sobre Redis) | Jobs duráveis e escaláveis: expiração 24h, lembretes, onboarding, recálculo de badges. Substitui `@Scheduled` em processo. |
| **Banco** | PostgreSQL 16 **+ PostGIS + pg_trgm + unaccent** | Transacional + **geoespacial** (raio de atendimento/bairro) + busca PT-BR com acento/erro de digitação. Preferir **gerenciado** (Neon/Supabase/RDS SP) pela história de backup/PITR/segurança. |
| **Cache/Sessões** | Redis | Cache de busca, sessões/OTP (TTL curto), backend do BullMQ. |
| **Object storage** | Cloudflare R2 ou S3 sa-east-1 | Foto de perfil (resize + checagem básica). Faltava na stack original. |
| **Pagamentos** | **Asaas** (primário) atrás de `PaymentGateway` | Pix Automático na recorrência sem custo extra; Pagar.me como alternativa. |
| **Mensageria** | **WhatsApp Cloud API oficial** atrás de `NotificationProvider` | OTP (~R$0,15) + notificações. Evolution API **só em dev/staging**. **SMS fallback** para OTP (login nunca depende de 1 canal). |
| **Deploy** | Coolify + Docker | CI/CD, zero-downtime, rollback. Self-hosted (história de DevOps). |
| **Infra** | **VPS região São Paulo, 8 GB RAM** | Hostinger Cloud BR / Magalu / Latitude SP. Latência ~5ms (vs ~200ms Hetzner) + LGPD. Caminho de migração para **AWS sa-east-1 (ECS+RDS)** documentado. |
| **CDN / WAF / TLS** | Cloudflare + Let's Encrypt | Cache do perfil público, WAF, DDoS, SSL automático. |

**Custo estimado (revisado):** VPS SP 8GB (~R$80–120/mês) + WhatsApp oficial (OTP ~R$0,15/login, utility ~R$0,05) + taxas Asaas (Pix recorrência ~tarifa padrão; cartão ~2,99% + R$0,49). Postgres gerenciado free tier no início (Neon/Supabase). Cloudflare free.

### 3.3 Estrutura do monorepo

```
obracerta/
├── apps/
│   ├── web/                 # Next.js 15 — público (SSR) + área logada (PWA)
│   │   ├── app/(public)/    #   landing, perfil público /[slug]
│   │   └── app/(app)/       #   área logada (client-side, PWA)
│   └── api/                 # NestJS — modular monolith (hexagonal/DDD)
├── packages/
│   ├── shared/              # tipos + schemas Zod compartilhados front↔back
│   ├── ui/                  # Design System (componentes Tailwind)
│   ├── design-tokens/       # Fraunces + Cabinet Grotesk, paleta, espaçamento
│   └── config/              # eslint, tsconfig, tailwind preset
├── infra/
│   ├── docker/              # Dockerfiles + docker-compose (dev)
│   └── coolify/             # manifestos de deploy
├── docs/                    # PRD, proposta de valor, ADRs, C4, este plano
└── turbo.json
```

---

## 4. Modelo de Dados (entidades principais)

Derivado do PRD. Detalhar em migrations com **Drizzle** (ORM escolhido na Fase 0 — ver ADR-0001). Motivo: SQL-first com suporte natural a PostGIS (busca geo) e `pg_trgm` (full-text), inferência de tipos alinhada à filosofia do Zod já usado no `packages/shared`, e leveza (sem query engine). Migrations via `drizzle-kit`.

### 4.1 Identidade e perfis
- **`users`** — `id`, `nome_completo`, `whatsapp`, `email?`, `cidade_id` (FK — cidade como 1ª classe), `tipo` (PROFISSIONAL | CONTRATANTE), `cpf?` (nunca público), `criado_em`, `status` (ATIVO | SUSPENSO | REMOVIDO).
- **`cities`** — cidade como dimensão de 1ª classe (expansão cidade-a-cidade): `nome`, `uf`, `ativa`.
- **`professional_profiles`** — `especialidades[]`, `anos_experiencia`, `foto_url?`, `bairro`, `geo` (PostGIS point + raio de atendimento), `valores`, `formacao_declarada?`, `completude_pct`, `plano`, `slug_publico`.
- **`professional_references`** — máx. 2, declaradas/não verificadas.
- **`contractor_profiles`** — `plano` (BASICO | COMPLETO | LANCE), `plano_expira_em`.

### 4.2 Agenda e agendamento
- **`availability`** — agenda semanal → base do calendário de 6 meses.
- **`schedule_blocks`** — bloqueios automáticos por período de obra.
- **`booking_requests`** — `status` (PENDENTE | APROVADO | RECUSADO | EXPIRADO | INICIADO | CONCLUIDO | CANCELADO), `expira_em` (24h), `motivo_recusa?`.
- **`terms_acceptances`** — aceites de termo (append-only, data/hora, **auditoria imutável**).

### 4.3 Reputação
- **`reviews`** — dupla-cega: `revelada` (só após ambos), `denunciada`, `criado_em` (imutável).
- **`review_responses`** — direito de resposta (1 por avaliação, 30 dias).
- **`badges`** / **`reputation_events`** (append-only).

### 4.4 Obras e lances
- **`work_orders`** — `urgencia` (URGENTE 48h | NORMAL 7d | FLEXIVEL 15d).
- **`proposals`** — propostas sigilosas.

### 4.5 Monetização / Entitlements
- **`subscriptions`** / **`purchases`** / **`invoices`** / **`refunds`** (4 cenários CDC).
- **`entitlements`** — mapa plano → features liberadas (gating limpo, sem `if` espalhado).

### 4.6 Operação
- **`otp_codes`** (Redis, TTL curto), **`notifications`** (fila/log, idempotente), **`penalties`**, **`account_suspensions`**, **`platform_metrics`**, **`audit_log`** (append-only, tamper-evident).

---

## 5. Domínios do Backend (NestJS — modular monolith)

Cada módulo com fronteira explícita (porta/adapter, hexagonal), controller/service/domain/repository e testes próprios. Módulos extraíveis no futuro sem reescrita.

| Módulo | Responsabilidade | Seções PRD |
|--------|------------------|-----------|
| `auth` | OTP por canal (WhatsApp/SMS/e-mail), JWT, sessões Redis | §6 |
| `users` & `profiles` | Cadastro 4 passos, completude gamificada, slug público | §2, §4, §14 |
| `availability` | Agenda 6 meses, bloqueio automático bilateral | §10 |
| `booking` | Fluxo de agendamento, expiração 24h, **limite de 2 pedidos PENDENTES por especialidade, por contratante** (anti-spam) | §7, §11 |
| `terms` | Termos de ciência bilaterais (append-only) | §7.4, §9, §15 |
| `decline-penalty` | Motivos válidos/bloqueados, escala, taxa de aceitação | §8 |
| `reputation` | Avaliação dupla-cega, revelação simultânea, badges, resposta pública | §12 |
| `moderation` | Denúncia (ocultar + 48h), suspensão automática, apelação | §13 |
| `work-orders` | Obras, urgência, lances sigilosos, piso de dignidade | §16 |
| `search` | Busca full-text (pg_trgm) + **geo (PostGIS)** + filtros por plano | §17 |
| `billing` | Asaas (assinatura + Pix), faturas, expiração avulso, reembolso CDC | §3, §19, §20, §21 |
| `entitlements` | Gating de features por plano | §3, §17 |
| `notifications` | WhatsApp oficial + SMS fallback, reenvios, idempotência | §22 |
| `public-profile` | Perfil público com dados limitados (anti-desintermediação) | §18, §24 |
| `admin` | Dashboard de saúde (ativação, churn, NPS) | Melhoria #4 |
| `onboarding` | Tour, checklist, notificações progressivas D1/D3/D5/D7 | §5 |

**Jobs duráveis (BullMQ):** expiração de pedidos 24h → penalidade; expiração de obras; lembretes de avaliação (D1/D5/D7) e de plano (D25/D28/D30); onboarding (D1/D3/D5/D7); recálculo de badges/completude; snapshot diário de métricas. Filas com retry, idempotência e dead-letter.

---

## 6. Frontend (Next.js 15 único)

> **Execução backend-first (ver §8):** esta seção descreve o front-alvo completo, mas a
> **construção das telas da área logada (PWA) é consolidada na Fase 7**, depois de todo o
> backend pronto. Hoje só a Fase 1 tem front (landing, perfil público, wizard, shell logado).

### 6.1 Rotas públicas (SSR/SSG — SEO)
- **Landing** (de `landing_page.html`): hero+stats, dores, como funciona, fluxos, planos com toggle, FAQ, CTA. Vídeo de onboarding 60–90s (pós-MVP).
- **Tela de escolha de perfil** (§2) com preços visíveis e aviso obrigatório.
- **Perfil público** `/[slug]`: SSR para SEO; dados limitados sem login; foto/nome completo/valores/agenda/referências **bloqueados**; CTA "Crie sua conta…". Cacheado na Cloudflare.

### 6.2 Área logada — route group `(app)` como PWA
- Cadastro 4 passos, login OTP com auto-avanço de dígitos, tour guiado, checklist com barra de completude.
- 4 abas (profissional): Pedidos, Agenda, Perfil (completude + compartilhar), Plano/Faturas.
- Contratante: Busca com filtros (incl. geo/bairro), Agendamentos, Avaliações, Plano.
- **PWA:** manifest + Service Worker, banner "Adicionar à tela inicial", push, splash (Melhoria #3).
- Estado: servidor via TanStack Query; cliente via Zustand; **URL como estado** dos filtros de busca.

### 6.3 Design System (`packages/ui` + `design-tokens`)
- Fraunces (títulos) + Cabinet Grotesk (corpo); paleta orange/dark/cream + semânticas; tokens como CSS custom properties. Reutilizado nativamente entre rotas públicas e PWA.

---

## 7. Integrações (atrás de portas/adapters — hexagonal)

### 7.1 `PaymentGateway` → Asaas (primário)
- Assinatura recorrente do profissional (Pro R$49 / Especialista R$99) com "7 dias de graça" (**nunca** "trial"); **Pix Automático** sem custo extra na recorrência.
- Avulso do contratante (Básico R$19 / Completo R$39 / Lance R$69), **sem** recorrência.
- **Webhooks idempotentes** + reconciliação + máquina de estados de fatura. Pagar.me como adapter alternativo.

### 7.2 `NotificationProvider` → WhatsApp Cloud API oficial (+ SMS fallback)
- OTP (categoria authentication ~R$0,15) + notificações (utility ~R$0,05; service iniciada pelo cliente = R$0).
- **SMS fallback** (Zenvia/Twilio/AWS SNS) para OTP → login resiliente a um canal cair.
- Evolution API **apenas em dev/staging** (economia), nunca como único caminho de produção.
- Eventos e reenvios conforme PRD §22; templates versionados e centralizados; rate-limiting.

### 7.3 `auth` — OTP / Login
- Código de 6 dígitos por WhatsApp/SMS/e-mail, TTL curto no Redis, reenvio, sem senha (§6). Hardening: rate-limit por contato/IP, lockout progressivo.

---

## 8. Roadmap de Implementação (fases / sprints)

Estimativa para 1–2 devs. Cada fase entrega valor verificável. **TDD nas regras críticas.**

> **🧭 Estratégia de execução (decisão do dono, Jun/2026): BACKEND-FIRST.**
> Construímos **todo o backend primeiro** (Fases 2–5 entregues como **API**, com domínio/TDD,
> integração contra Postgres real e boot verificado) e só **depois** construímos **todo o
> frontend de uma vez**, numa **Fase de Frontend dedicada (Fase 7)**. Motivo: contratos estáveis
> no `packages/shared` (type-safety end-to-end) deixam o front ser construído sobre uma API já
> provada, sem retrabalho. O front existente cobre só a **Fase 1** (landing, perfil público,
> wizard de cadastro, shell logado). As telas da área logada (PWA) das Fases 2, 3, 4 e 5 estão
> **adiadas e consolidadas na Fase 7**.

### Fase 0 — Fundação (Sprint 0–1)
- [x] Monorepo (Turborepo + pnpm), lint/format, `packages/config`.
- [x] `apps/api` NestJS (estrutura hexagonal) + `apps/web` Next.js 15 + `packages/shared` (tipos+Zod) — **POC de type-safety end-to-end**.
- [x] PostgreSQL 16 + PostGIS + Redis; Docker Compose local (smoke test `/health` 200, deps `up`, extensões postgis/pg_trgm/unaccent OK). _ORM=Drizzle decidido; migrations na Fase 1._
- [x] Design tokens + Design System base (`packages/ui`).
- [ ] CI (GitHub Actions: lint+test+build) ✅ + Coolify na VPS SP; domínio + SSL + Cloudflare; deploy end-to-end "hello world" _(deploy adiado — validando em localhost primeiro)_.
- [x] **ADR-0001** (stack) + diagrama **C4** inicial.
- **Entregável:** ambiente reproduzível, deploy verde, type-safety provada.

### Fase 1 — Identidade e perfis (Sprint 2–3) ✅
- [x] **Fatia 1.0 — Camada de dados (Drizzle):** schema `cities`/`users` + enums derivados do shared, migrations (`drizzle-kit`), seed, `UsersRepository` (porta) + adapter. _(adiado da Fase 0.)_
- [x] `auth` (OTP + JWT + sessões Redis + rate-limit). `entitlements` base. _SMS/WhatsApp reais via porta — em dev, adapter de console (NotificationsModule); provedores reais quando houver contas sandbox._
- [x] Cadastro 4 passos (profissional/contratante) + escolha de perfil. _Wizard web (`apps/web/(public)/cadastro`) + API `/cadastro`; slug público gerado._
- [x] Perfil + **completude gamificada** (§4.2). Object storage (MinIO/S3) para foto.
- [x] Onboarding: checklist + notificações progressivas D1/D3/D5/D7 (BullMQ). _Tour visual no front é polimento adiado; backend + checklist prontos._
- **Entregável:** usuário se cadastra, loga e completa perfil. ✅ _Verificado ao vivo em localhost (OTP→login, cadastro→perfil+slug, PATCH→completude, upload foto→MinIO, fila de onboarding processada)._

**Decisões/pendências da Fase 1 (para fases seguintes):**
- Coluna `geo` (PostGIS) do `professional_profiles` adiada para a Fase 5 (busca geográfica).
- Persistência de sessão no front (cookie httpOnly) é hardening da Fase 6 — hoje o token fica em memória no wizard.
- Provedores reais de WhatsApp/SMS atrás da porta `NotificationProvider` (trocar adapter, sem mexer no domínio).

### Fase 2 — Agenda e agendamento (Sprint 4–6) ✅ _(API; front adiado)_
- [x] **2.1 — `availability`** (grade semanal → calendário de 6 meses **projetado** em código; bloqueio bilateral; §10). _Domínio puro com TDD (projeção + subtração de intervalos + conflito)._
- [x] **2.2 — `booking`** (máquina de estados agendar→aprovar→iniciar→concluir; expiração 24h via BullMQ; **limite 2/especialidade por contratante** §11; bloqueio bilateral na aprovação reusando `availability`). _Transição guardada e atômica no banco (UPDATE ... WHERE status=esperado)._
- [x] **2.3 — `terms` + `audit_log`** (aceite bilateral append-only; trilha tamper-evident por **hash-chain sha256** com advisory lock no append; §7.4/§9).
- [x] **2.4 — `decline-penalty`** (motivos válidos/penalizáveis + escala por reincidência + taxa de aceitação; §8). _Aplicada no decline (motivo penalizável) e na expiração; tudo auditado._
- [x] **2.0 — Camada de dados** (6 tabelas + contratos Zod + migrations de criação e endurecimento). _Pré-requisito das fatias acima._
- 🔧 **Migration 0004** — gênese do `audit_log` passou a ser garantido por índice único parcial (no máximo um `hash_prev IS NULL`), no lugar do CHECK `seq=1` (que travava reinício da cadeia).
- **Entregável:** ciclo agendar→aprovar→iniciar→concluir com proteção jurídica. ✅ _API verificada ao vivo (typecheck 9/9, testes unit + integração contra Postgres real, boot mapeando as rotas)._

**Decisões/pendências da Fase 2 (para fases seguintes):**
- **Front da Fase 2 ainda não existe** — toda a Fase 2 é **API**. As telas de agenda/pedido/aceite de termos/penalidades entram quando o front desta fase for construído (o front hoje cobre só a Fase 1: landing, perfil público, wizard de cadastro e o shell logado).
- Calendário projetado em **UTC** no domínio; fuso `America/Sao_Paulo` quando o agendamento real exigir casar instantes com horário local.
- Duração do bloqueio na aprovação = **2h placeholder** (contrato só tem `dataServico`); modelar duração de serviço depois.
- Atomicidade cross-tabela na aprovação (status + bloqueio) é uma **saga manual** (bloqueio-primeiro + compensação); endurecer com transação compartilhada é melhoria futura.
- Auditar também os eventos do `booking` (aprovar/iniciar/concluir/cancelar) via `AuditService` — hoje só aceite de termo e penalidade auditam.

### Fase 3 — Reputação (Sprint 7–8) ✅ _(API; front adiado, como na Fase 2)_
- [x] **3.0 — Camada de dados** (6 tabelas + contratos Zod + migration 0005). _Pré-requisito das etapas abaixo: `reviews` (dupla-cega), `review_responses` (resposta), `badges`, `reputation_events` (trilha append-only por-usuário), `reports` (denúncias), `account_suspensions` (suspensão + apelação). Enums espelhados `ReviewStatus`/`ReportStatus`/`SuspensionStatus`; catálogos que evoluem (`badges.codigo`, `reputation_events.tipo`, `reports.motivo`) ficam em `varchar`._
- [x] **3.1 — `reputation`** (avaliação dupla-cega; nota nasce PENDENTE; revelação simultânea no par OU por janela de 7d via BullMQ; média só conta REVELADA; §12). _Domínio puro com TDD (participante/papel, elegibilidade CONCLUIDO, revelar-no-par, média, janela); aplica via BookingService (autorização + estado) e audita (AVALIACAO_CRIADA)._
- [x] **3.2 — Badges + direito de resposta pública** (§12). _Catálogo de badges automáticos no domínio (BEM_AVALIADO, VETERANO) com concessão/revogação reconciliada a cada revelação (preserva badges manuais/legados); direito de resposta 1x/30d do avaliado. badges[] preenchido no `GET /reputation/:userId`; `POST /reviews/responses`. Concessão/revogação/resposta auditadas._
- [x] **3.3 — `moderation`** (denúncia→ocultar avaliação por 48h via BullMQ; decisão procedente/improcedente; suspensão automática por reincidência de strikes + apelação, §13). _Domínio puro com TDD (janela 48h, transição da denúncia, gatilho de suspensão, vigência/apelação); strikes contados cross-tabela (denúncias diretas + avaliações autoradas); oculta/restaura via ReputationService; tudo auditado. Gating por papel admin/moderador adiado para a Fase 6._
- **Entregável:** North Star mensurável. ✅ _API verificada ao vivo (typecheck, unit + integração contra Postgres real, boot mapeando as rotas das 3 etapas)._

**Decisões/pendências da Fase 3 (para as etapas seguintes):**
- **`reputation_events` ainda sem writer dedicado** — a 3.1/3.2 auditam pela trilha global (`audit_log` via `AuditService`: AVALIACAO_CRIADA, BADGE_CONCEDIDO/REVOGADO, RESPOSTA_PUBLICADA). A trilha por-usuário (`reputation_events`) será populada quando houver linha do tempo de reputação a exibir.
- **Janela de avaliação ancorada em `booking.atualizadoEm`** (instante do CONCLUIDO); modelar um `concluido_em` dedicado é refinamento futuro.
- **Lembretes de avaliação (D1/D5/D7)** via BullMQ (§12) ainda não existem — só a revelação por janela.
- **Gating por papel admin/moderador** das ações de moderação (resolver denúncia/apelação) está **adiado para a Fase 6** (módulo `admin`) — hoje só sob JwtAuthGuard.
- **Checar suspensão no login** (bloquear acesso de conta suspensa) é um hook a ligar no `auth` — o `ModerationService.isSuspended` já existe. Expiração da suspensão é **preguiçosa** (avaliada na leitura); um job de varredura é opcional.
- **Front da Fase 2 e 3 inexistente** — tudo é API.

### Fase 4 — Monetização (Sprint 9–10) ✅ _(API; front adiado, como nas Fases 2/3)_
- [x] **4.0 — Camada de dados** (5 tabelas + contratos Zod + migration 0006). _Pré-requisito das etapas abaixo: `subscriptions` (assinatura recorrente do profissional), `purchases` (compra avulsa do contratante), `invoices` (faturas, vínculo exclusivo assinatura×compra via CHECK), `refunds` (estornos CDC), `payment_events` (idempotência de webhook). Enums espelhados `SubscriptionStatus`/`PurchaseStatus`/`InvoiceStatus`/`RefundStatus`/`PaymentMethod`; **dinheiro em centavos (inteiro)**; FKs RESTRICT na cadeia financeira (evidência fiscal); índice único parcial de assinatura vigente por usuário e de (gateway, gateway_id) p/ ligar webhooks. `entitlements` segue como módulo de domínio (sem tabela)._
- [x] **4.1 — `billing`** (recorrência + avulso atrás da porta `PaymentGateway`; webhooks idempotentes). _Domínio puro com TDD (preços por plano em centavos, graça 7d/próxima cobrança/validade avulso, máquina de estados da fatura, reconhecer evento de pagamento); assinar (EM_GRACA + 1ª fatura) e comprar avulso via gateway (dev: adapter fake; prod: Asaas); webhook idempotente (UNIQUE gateway+event_id via `payment_events`) marca fatura PAGA e ativa a origem; valida tipo do usuário e audita. Webhook sem JWT (validação por assinatura HMAC fica na 4.2)._
- [x] **4.2 — Reembolso CDC, expiração e plano efetivo** (§19/§20/§21). _Domínio puro com TDD (4 cenários CDC: arrependimento 7d/cobrança indevida/falha integrais + cancelamento proporcional pro-rata); reembolso solicitar→aprovar (estorna no gateway, fatura ESTORNADA, revoga acesso) ou recusar; jobs BullMQ vencem fatura PENDENTE→VENCIDA e expiram avulso ATIVO→EXPIRADO (transições guardadas); `GET /me/entitlements` resolve o plano vigente (assinatura EM_GRACA/ATIVA ou avulso não-expirado) e lista features via `entitlements`._
- **Entregável:** receita real; planos com gating correto via `entitlements`. ✅ _API verificada ao vivo (typecheck, unit + integração contra Postgres real incl. fluxo de pagamento, idempotência de webhook e reembolso CDC; boot mapeando as rotas)._

**Decisões/pendências da Fase 4 (para fases seguintes):**
- **Asaas real** atrás da porta `PaymentGateway` (hoje adapter fake/console); trocar o provider sem mexer no domínio.
- **Assinatura HMAC do webhook** (hoje aberto, só validação de shape) — hardening (Fase 6).
- **Lembretes de plano D25/D28/D30** (§19) e cobrança recorrente automática (renovação) — jobs ainda não existem; só a expiração da 1ª fatura/avulso.
- **Gating por papel financeiro/admin** das ações de resolver reembolso — adiado para a Fase 6 (módulo `admin`).
- **`refunds.status` APROVADO** não é usado (fluxo direto SOLICITADO→CONCLUIDO/RECUSADO); reservado para processamento assíncrono futuro.

### Fase 5 — Busca, perfil público e obras (Sprint 11–13) — **API** ✅
- [x] **5.0 — Camada de dados** (2 tabelas + coluna geo + contratos Zod + migration 0007). _`work_orders` (obra/pedido de orçamento, urgência, geo, piso de dignidade) e `proposals` (lances sigilosos, 1 por profissional/obra); coluna **`geo` (PostGIS point 4326)** + `raio_atendimento_km` no `professional_profiles` (pendência da Fase 1) com índice **GIST**; enums espelhados `WorkUrgency`/`WorkOrderStatus`/`ProposalStatus`; `geoPointSchema` no shared. SRID 4326 aplicado na escrita/consulta (coluna `geometry(point)` genérica). pg_trgm/GIN da busca entram na 5.1._
- [x] **5.1 — `search`** (pg_trgm + **PostGIS geo** + filtros por especialidade/plano, §17). _Domínio puro com TDD (raio/limite/geo/paginação); SearchRepository com SQL combinando GIN `@>` (especialidade), GIN pg_trgm `ILIKE` (nome) e `ST_DWithin` geográfico (índice GIST, metros via `::geography`, SRID 4326); paginado; `GET /search/professionals`. **Geo validado ponta a ponta** (coluna geometry da 5.0). Cache Redis fica como refinamento._
- [x] **5.2 — `public-profile`** (perfil público com dados limitados, anti-desintermediação §18/§24). _Domínio puro com TDD (nome parcial "João S."; foto/nome ocultos no plano Iniciante — visibilidade reduzida); view pública compõe perfil + identidade + reputação (Fase 3), **nunca** expõe contato/`valores`/agenda/referências; só contas ATIVAS. `GET /public/p/:slug` (sem auth, cacheável). Removido o antigo `/profiles/p/:slug` que vazava `valores`. A página SSR polida é Fase 7._
- [x] **5.3 — `work-orders`** (urgência → expiração; lances sigilosos; piso de dignidade pela média, §16). _Domínio puro com TDD (deadline por urgência 48h/7d/15d; piso = fração da média a partir de 3 lances; sigilo `visibleProposals`; máquinas de estado obra/lance); abrir obra + job BullMQ de expiração; lance ≥ piso (recusa abaixo); listagem com sigilo (dono vê todos, profissional só o seu); adjudicar (obra ADJUDICADA + lance ACEITA + demais RECUSADA). Auditado._
- **Entregável:** descoberta orgânica + FOMO de obras (API), pronta para o front consumir. ✅ _API verificada ao vivo (typecheck, unit + integração contra Postgres real, boot mapeando as rotas das 3 etapas)._

**Decisões/pendências da Fase 5 (para fases seguintes):**
- **Cache Redis** da busca/perfil público (§17) — refinamento adiado.
- **unaccent no índice** da busca (wrapper IMMUTABLE) — hoje o pg_trgm já tolera digitação.
- **Geo de `work_orders`** gravado via Drizzle `geometry` mode 'xy' (sem distance-query ainda); validar quando a busca de obras por raio existir. A busca de profissionais já valida geo (5.1).
- **Piso de dignidade** usa fração (0,7) da média a partir de 3 lances — heurística simples; refinar com dado de mercado depois.
- **Concluir obra** (ADJUDICADA → CONCLUIDA) e cancelar ficam para quando o fluxo pós-adjudicação for necessário.

### Fase 6 — Admin, hardening e observabilidade (Sprint 14) — **backend** 🚧
- [x] **6.0 — Papéis e autorização (roles + RolesGuard)** (migration 0009). _Coluna `roles` text[] em `users` (catálogo `UserRole` ADMIN/MODERADOR/FINANCEIRO no shared); domínio puro `hasAnyRole`/`isAdmin` (TDD); `@Roles(...)` + `RolesGuard` (consulta papéis frescos no banco — revogar vale na hora). **Gating aplicado**: resolver denúncia/apelação e fila de moderação → MODERADOR/ADMIN; resolver reembolso → FINANCEIRO/ADMIN. `AdminModule` (`GET/PUT /admin/users/:id/roles`, só ADMIN); 1º admin semeado no banco. Fecha as brechas deixadas nas Fases 3–4._
- [x] **6.1 — Hardening (parte 1): assinatura HMAC dos webhooks.** _Segredo `PAYMENT_WEBHOOK_SECRET` na config (env validado); domínio puro `webhookSignature`/`verifyWebhookSignature` (HMAC-SHA256, comparação em tempo constante; TDD); `POST /billing/webhook` valida o header `x-webhook-signature` e recusa (401) chamadas sem assinatura/forjadas. **Provado ao vivo**: sem assinatura → 401, válida → 200, forjada → 401._
- [x] **6.1 — Hardening (parte 2): suspensão no login + security headers.** _Domínio puro `canAuthenticate` (só ATIVO; TDD); a moderação **denormaliza** `users.status` (SUSPENSO ao auto-suspender, ATIVO ao deferir apelação) — sem ciclo auth↔moderation, e ainda tira o suspenso de busca/perfil público; o `auth` recusa login/refresh de conta não-ATIVA. Security headers via middleware (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, remove `X-Powered-By`) — **provado ao vivo**. Pendente: auto-lift por tempo (`fim_em`) via job; rate-limiting global; scan de deps; CSP é do front (Fase 7)._
- [x] **6.2 — `admin` (dashboard de saúde)**: API de métricas — Melhoria #4. _Snapshot agregado read-only (`GET /admin/metrics`, só ADMIN): usuários (total/tipo/ativos/suspensos), ativação (perfil + completude≥50%), agendamentos (total/concluídos/taxa), **North Star** (obras avaliadas pelos 2 lados), monetização (assinaturas ativas/canceladas, churn, MRR), moderação (denúncias/suspensões) e obras. Domínio puro `rate` (TDD); `count(*) filter` em consultas paralelas. **Provado ao vivo**: sem token→401, não-admin→403, admin→200 com o snapshot._
- [x] **6.3 — Observabilidade**: métricas + logs estruturados + correlation id; **k6** (artefato). _MetricsRegistry puro (TDD) → `GET /metrics` em formato Prometheus (texto, fora do envelope via `@RawResponse()`); `MetricsInterceptor` global mede duração/status por método+rota e emite log JSON com `requestId`; middleware de **correlation id** (`x-request-id` recebido ou gerado, ecoado); `infra/k6/smoke.js` (smoke/baseline, precisa do binário k6). **Provado ao vivo**: x-request-id gerado/propagado, /metrics refletindo as chamadas, log estruturado por request. OTel/exporter para coletor fica para quando houver deploy._
- [~] **6.4 — Pendências cruzadas** (em andamento):
  - [x] **Auto-lift de suspensão**: job BullMQ agendado no `fim_em`; expira a suspensão (ATIVA→EXPIRADA, guardada) e **reativa a conta** (`users.status=ATIVO`) se não houver outra ATIVA. Fecha o trade-off da 6.1 parte 2. Domínio `canAutoLift` (TDD); processor/fila `suspension-lift`; idempotente.
  - [x] **Writer de `reputation_events`**: ReputationEventRepository (porta+adapter, append-only). O ReputationService grava na trilha por-usuário: `AVALIACAO_REVELADA` (por alvo, na revelação simultânea ou por janela) e `BADGE_CONCEDIDO/REVOGADO` (no recompute). `GET /reputation/:userId/eventos` lê a trilha. Popula a tabela que existia desde a 3.0 sem writer.
  - [ ] Lembretes (avaliação D1/D5/D7, plano D25/D28/D30) + **renovação recorrente** de assinatura.
  - [ ] Provedores reais (WhatsApp/SMS/Asaas) atrás das portas — **bloqueado**: precisa de contas sandbox (decisão: sem deploy/contas reais ainda).
- **Entregável:** backend completo, seguro e observável — **fim do backend**.

### Fase 7 — Frontend completo (área logada / PWA) (Sprint 15–17) — **front consolidado**
> Construído **de uma vez**, sobre a API já provada das Fases 2–6 (contratos do `packages/shared`).
> **Design vem dos mockups** (`docs/mockups/*.html`), já destilados em `packages/design-tokens`
> + `packages/ui` — ver **§14**. ⚠️ Os mockups são fonte **só do design** (linguagem visual);
> as **telas, fluxos e escopo** vêm do **PRD + da API**. Onde divergirem, PRD/API ganha.
- [ ] **Agenda & agendamento** (Fase 2): grade/calendário, criar/gerir pedido, aceite de termos, painel de penalidades/taxa de aceitação.
- [ ] **Reputação & moderação** (Fase 3): avaliação dupla-cega, badges, direito de resposta, denúncia, painel de suspensão/apelação.
- [ ] **Monetização** (Fase 4): escolha/contratação de plano, faturas, reembolso; gating visual por `entitlements`.
- [ ] **Busca, perfil público e obras** (Fase 5): busca com filtros (geo/bairro) + URL como estado, perfil público SSR compartilhável, obras + lances sigilosos.
- [ ] **PWA** (Melhoria #3): manifest + Service Worker, banner "Adicionar à tela inicial", push, splash.
- [ ] **Admin UI** (Melhoria #4) consumindo a API da Fase 6.
- [ ] **Qualidade de front**: **E2E Playwright** (fluxos críticos), auditoria **WCAG AA**, visual/responsivo (320/375/768/1024/1440), reduced-motion.
- **Entregável:** produto navegável ponta a ponta, instalável (PWA), pronto para piloto com 50 profissionais.

### Pré-lançamento (paralelo, não-código)
- Validação com usuários reais (10 entrevistas/perfil) + MVP manual (Wizard of Oz).
- Consulta jurídica (LGPD, termos, CDC). **Decisão final de nome + domínio.**
- Produção do vídeo de onboarding.

---

## 9. Segurança, Privacidade e Conformidade

- **LGPD:** consentimento no cadastro; export/delete de dados; CPF nunca exposto; minimização (nome parcial público); dados em região BR.
- **Anti-desintermediação (§24):** contatos/referências só após aprovação; foto/nome oculto no Iniciante; sem chat interno; termos punem compartilhamento prévio.
- **Proteção jurídica:** termos bilaterais com **registro de aceite imutável** (`audit_log`).
- **Segurança técnica:** validação Zod nas fronteiras; queries parametrizadas (ORM); JWT com rotação; rate-limiting (OTP/busca/endpoints); webhooks verificados por assinatura; secrets em manager/env; HTTPS + headers (HSTS, X-Content-Type-Options...); CSP no Next.js; WAF Cloudflare; Dependabot/Snyk.
- **Mensageria:** rate-limiting + fallback SMS; API oficial elimina risco de ban.

---

## 10. Observabilidade, Testes e Qualidade

- **Observabilidade:** OpenTelemetry (traces) + logs estruturados + métricas (Prometheus/Grafana ou Grafana Cloud free) + healthchecks.
- **Unitários (≥80%):** expiração 24h, limite 2/especialidade, escala de penalidades, revelação dupla-cega, completude, reembolso CDC.
- **Integração:** **Testcontainers** (Postgres+Redis), webhooks Asaas, filas BullMQ.
- **E2E (Playwright):** cadastro→agendamento→aprovação→conclusão→avaliação; busca→perfil; compra de plano.
- **Carga (k6):** sustenta a meta de "escalável".
- **Visual/A11y:** breakpoints 320/375/768/1024/1440; WCAG AA; reduced-motion.
- **Code review obrigatório**; security-review em `billing`/`auth`/`notifications`.
- **Docs de arquitetura:** **ADRs** + diagramas **C4** + README — sinal de senioridade no portfólio.

---

## 11. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Ovo e galinha | 50 profissionais ativos antes de abrir para contratantes |
| Ban de WhatsApp | **API oficial desde o dia 1** + SMS fallback (login nunca cai) |
| Latência para o usuário | VPS em **São Paulo** + Cloudflare CDN |
| Desintermediação | Travas §24 + perfil público limitado + termos |
| Risco jurídico | Termos bilaterais + sem contrato/escrow + auditoria imutável + consulta jurídica |
| Profissional escolhe plano errado | 4 mitigações na tela de entrada (§4.2) |
| FOMO sem escassez real | Meta de 50+ obras ativas antes de ativar o FOMO |
| Nome/domínio indefinido | Marca desacoplada em config; decidir antes da Fase 5 |
| Leilão de preço baixo | Piso de dignidade (média) + propostas sigilosas |
| Jobs não escalam | **BullMQ** durável (retry/idempotência/dead-letter) |

---

## 12. Fora do Escopo do MVP (PRD §25)

Não construir agora: chat interno, upload de documentos, geração de contratos, escrow/pagamento de obras, verificação de antecedentes, senha no login, app nativo iOS/Android, verificação automática de referências. Fases futuras (2027+) quando o volume justificar.

---

## 13. Próximos Passos Imediatos

1. **Decisão de nome + registro de domínio** (`.com.br` + `.com`) — destrava SEO/perfil público.
2. Aprovar este plano (e o refinamento do Ultraplan) e iniciar **Fase 0**.
3. Provisionar **VPS São Paulo (8GB) + Coolify + domínio + Cloudflare**; medir latência real vs. Hetzner.
4. Contas sandbox: **WhatsApp Cloud API (Meta)**, **Asaas**, provedor **SMS** — validar OTP ponta a ponta.
5. POC `packages/shared` (tipos+Zod) consumido por `apps/web` e `apps/api` (type-safety end-to-end).
6. ✅ ORM decidido: **Drizzle** (SQL-first, PostGIS/`pg_trgm` nativos via `sql`, tipos inferidos do schema, leve). Registrar em **ADR-0001**.

---

## 14. Base de Design (mockups → Design System)

> **Regra de ouro:** os mockups são a fonte **só do DESIGN** (linguagem visual). As **telas,
> fluxos, regras e escopo** vêm do **PRD + da API** (contratos do `packages/shared`). Onde um
> mockup divergir do PRD/API (ex.: rótulos de aba, campos), **o PRD/API ganha** — o mockup
> informa apenas a estética. Extrair design, **não** copiar comportamento.

O design já foi **destilado** dos protótipos para o código, que é a fonte de verdade visual:
- **`packages/design-tokens`** (`tokens.css`) — paleta (orange/dark/cream + semânticas), tipografia
  (**Fraunces** títulos + **Cabinet Grotesk** corpo), espaçamento, raios, sombras, durações.
- **`packages/ui`** — componentes do Design System (Tailwind mapeado aos tokens), reutilizados
  entre rotas públicas e PWA.

A Fase 7 (frontend) constrói as telas reais **aplicando esses tokens/componentes**, usando os
mockups como **referência visual**.

### Inventário dos mockups (`docs/mockups/`)

| Arquivo | O que é | Uso como design |
|---------|---------|-----------------|
| `landing_page.html` | Landing pública (hero/dores, como funciona, fluxos contratante×profissional, planos, depoimentos, FAQ, CTA) | Referência visual da **landing** (rotas públicas, §6.1) — já parcialmente construída na Fase 1 |
| `prototipo.html` | Variante/versão anterior da landing (mesma estrutura e título) | Referência visual da **landing**; consolidar com `landing_page.html` |
| `prototipo2.html` | **"Fluxo do Profissional"**: cadastro/onboarding (passos: dados → especialidades → escolha de plano → forma de pagamento → upgrade) + **shell da área logada** com abas (Início · Pedidos · Obras · Perfil) | Referência visual da **área logada / PWA** (§6.2, Fase 7) — linguagem visual das telas internas |
| `apresentacao.html` | Pitch/apresentação de produto | **Não é design de tela** — contexto de produto/narrativa |
| `carta_intencoes.html` | Carta de intenções | **Não é design de tela** — contexto |

> Nota: as abas do mockup (Início/Pedidos/Obras/Perfil) e a navegação do PRD/§6.2
> (Pedidos/Agenda/Perfil/Plano) podem divergir — a navegação final segue o **PRD + os domínios
> de backend já construídos** (Fases 2–4) e o que a API expõe; o mockup define o visual, não o IA.

---

*Documento de planejamento — derivado do material em `/docs`, dos protótipos HTML (`docs/mockups/`, ver §14) e da análise de stack (`~/.claude/plans/voce-acha-que-essa-snappy-island.md`). Atualizar conforme decisões de produto e o plano refinado do Ultraplan.*
