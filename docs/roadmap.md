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
- **Multi-método (decisão revisada, jun/2026):** além do OTP por WhatsApp, o produto oferece **conta normal por e-mail + senha** (hash `scrypt` do `node:crypto`, sem dependência externa; coluna `users.senha_hash` nullable) e **Continuar com Google**. Estado atual: **e-mail/senha e WhatsApp-OTP funcionam local**; **Google é visual** (botão "em breve") — o OAuth real é cablado quando subirmos para a **EC2** (Client ID/Secret + redirect URIs). Endpoints: `POST /auth/login` (e-mail+senha) e `POST /cadastro/email` (cadastro "conta normal"); BFF `/api/auth/{login,register}` seta os cookies httpOnly como nos demais fluxos.

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
  - [~] Lembretes + renovação:
    - [x] **Lembretes de avaliação (D1/D5/D7)**: ao concluir a obra, agenda lembretes para os dois lados; o consumidor notifica **só quem ainda não avaliou** (NotificationProvider). Padrão **produtor (booking) / consumidor (reputation)** via fila compartilhada — evita o ciclo booking↔reputation. Domínio `reminderDelayMs` (TDD, reusa `ONBOARDING_SPEEDUP` p/ testar rápido).
    - [x] **Renovação recorrente + lembrete de plano**: na assinatura, agenda a renovação no início do ciclo seguinte; o job (na `proxima_cobranca`) emite a próxima fatura (`canRenew`), avança a `proxima_cobranca` (+30d) e **reagenda** o ciclo; lembrete (3 dias antes) notifica via `NotificationProvider`. O webhook (4.1) paga a fatura; não pago → VENCIDA (job). Domínio `canRenew`/`planReminderDate` (TDD).
  - [ ] Provedores reais (WhatsApp/SMS/Asaas) atrás das portas — **bloqueado**: precisa de contas sandbox (decisão: sem deploy/contas reais ainda).
- **Entregável:** backend completo, seguro e observável — **fim do backend (não-bloqueado)**. ✅ _Só resta a troca dos adapters fake/console por provedores reais (depende de contas) — feita quando houver deploy._

### Fase 7 — Frontend completo (área logada / PWA) (Sprint 15–17) — **front consolidado**
> Construído **de uma vez**, sobre a API já provada das Fases 2–6 (contratos do `packages/shared`).
> **Design vem dos mockups** (`docs/mockups/*.html`), já destilados em `packages/design-tokens`
> + `packages/ui` — ver **§14**. ⚠️ Os mockups são fonte **só do design** (linguagem visual);
> as **telas, fluxos e escopo** vêm do **PRD + da API**. Onde divergirem, PRD/API ganha.
- [x] **7.0 — Fundação do frontend**:
  - [x] **Padrão BFF + sessão** (parte 1): tokens vivem **só em cookies httpOnly** setados por route handlers do Next (`/api/auth/{request-otp,verify,cadastro,logout}`) — o browser nunca vê token. `lib/session` (cookies `oc_at`/`oc_rt`, `getSession`/`requireSession`); `lib/server-api` (`callApi` público + `serverApi` autenticado com **refresh rotacionado no 401** e retry, persistência best-effort fora do render); `unwrapEnvelope`/`ApiEnvelopeError` no `shared` (TDD, reusado front+back). Fecha a pendência de persistência de sessão adiada da Fase 6. **Provado ao vivo**: request-otp→OTP→verify(novo→registered:false)→cadastro (Set-Cookie httpOnly, user sem tokens)→logout (cookies limpos); validação Zod recusa formato inválido.
  - [x] **Login + app shell** (parte 2): página `/entrar` (OTP) consumindo o BFF (`lib/client` same-origin); **app shell** da área logada (`(app)/layout` com **guarda `requireSession` no servidor** — sem cookie redireciona ao login, não é só esconder UI) + **abas** Início·Pedidos·Obras·Perfil (`prototipo2`) com aba ativa por `usePathname` + logout; `/perfil` faz chamada **autenticada server-side** (`serverApi`→`/auth/me`). Primitivos do DS no `packages/ui`: Input, Field, Card, Badge. Rota `dashboard` (POC Fase 0) substituída por `/inicio`. **Provado ao vivo**: GET `/perfil` sem sessão→307 `/entrar`; login (cookies setados); GET `/perfil` com sessão→200 renderizando WhatsApp/ID via `/auth/me`.
- [x] **7.1 — Onboarding do profissional**: `/cadastro` reescrito sobre o BFF como fluxo multi-step (WhatsApp → código → perfil → atuação → plano → pagamento), na linguagem do `prototipo2`, com os primitivos do DS. Catálogo de planos no `shared` (`professionalPlanCatalog` + `formatCentavos`, TDD travando 0/4900/9900 contra a regra do backend; PRO recomendado §4.2). Handlers BFF **autenticados** (via cookie, `serverApi`): `/api/profile/professional` (PATCH perfil) e `/api/billing/subscribe` (POST assinatura); `handle()` repassa redirects/notFound do Next. Contratante encerra no passo 3; INICIANTE é grátis (sem cobrança); PRO/ESP geram assinatura EM_GRACA + fatura (pagamento por webhook, Fase 4). **Provado ao vivo**: cadastro→cookies→perfil (especialidades/anos/bairro, completude 50%, slug gerado)→assinar PRO (EM_GRACA, R$49, graça +7d).
- [x] **7.2 — Agenda & agendamento** (Fase 2):
  - [x] **Agenda/disponibilidade** (parte 1): cookie de perfil legível (`oc_pf` com `tipo`+`nome`, não-httpOnly — habilita UI ciente de papel sem round-trip) setado no login/cadastro; página `/agenda` (só profissional) com **editor da grade semanal** (faixas por dia, salva via BFF `PUT /availability/me`, idempotente) + **calendário projetado** (Server Component lê `serverApi`, `router.refresh()` após salvar). Início ciente de papel com atalho para a agenda. **Provado ao vivo**: PUT grade (Seg/Qua/Sex) → `/agenda` projeta 2 meses (09–12, 13–18, 08–14).
  - [x] **Pedidos + termos** (parte 2): aba **Pedidos** ciente de papel (lista escopada: contratante vê os que fez + “Novo pedido”; profissional vê os recebidos). `/pedidos/novo` (contratante; prefill `?prof=&esp=` p/ a etapa 7.3 vir do perfil público; `datetime-local`→ISO). `/pedidos/[id]` detalhe + **ações da máquina de estados por papel** (`BookingActions`: aprovar/recusar/iniciar/concluir/cancelar, recusa com motivo categorizado) + **aceite de termos bilateral** (`TermsCard`, append-only, `TERMO_VERSAO_ATUAL` no shared). BFF: `/api/bookings` (criar), `/api/bookings/action` (transição), `/api/terms` (aceite); helpers `booking-ui` (labels/tons + ações por estado×papel, espelhando `booking-state`). **Provado ao vivo**: 2 sessões (P+C) → C cria (PENDENTE) → P aprova→inicia→conclui (CONCLUIDO) → ambos aceitam termos (detalhe renderiza “Concluído” + 2× “Aceito em”, 0 Pendente).
  - [x] **Penalidades/taxa de aceitação** (parte 3): painel de **comportamento** no `/perfil` (só profissional, read-only via `serverApi`): taxa de aceitação (com tom verde/amarelo/vermelho), contadores (pedidos/recusados/expirados), pontos de penalidade e histórico (`/penalties/me/summary` + `/penalties/me`); rótulos `PenaltyReason` no `penalty-ui`. **Provado ao vivo**: recusa por DESISTENCIA → RECUSADO + penalidade `RECUSA_INJUSTIFICADA` (1 pt); `/perfil` renderiza Comportamento (taxa 0%, 1 recusado, “Recusa injustificada”, +1 pts).
- [x] **7.4 — Reputação & moderação** (Fase 3):
  - [x] **Avaliação dupla-cega + direito de resposta** (parte 1): no pedido CONCLUIDO, `ReviewForm` (estrelas 1–5 + comentário, BFF `/api/reviews`) — a nota nasce **oculta** e só revela quando ambos avaliam (ou a janela de 7d fecha). No `/perfil`, "Avaliações recebidas" (reveladas, `/reviews/received`) com **direito de resposta** (`RespostaForm`, 1×/30d, BFF `/api/reviews/respond`). **Provado ao vivo**: C avalia (PENDENTE/oculta, P vê 0) → P avalia → revela (P vê 1 REVELADA) → P responde.
  - [x] **Denúncia + suspensão/apelação** (parte 2): `ReportDialog` reutilizável (entidade REVIEW/USER/PROFILE; motivos catalogados; BFF `/api/reports`) nas avaliações recebidas; seção "Sua conta" no `/perfil` lista as suspensões (`/suspensions/me`) e oferece **apelação** (`AppealForm`, BFF `/api/suspensions/appeal`) nas ATIVA. A **fila do moderador** (resolver denúncia/apelação) fica na 7.6 Admin. **Provado ao vivo**: denúncia → ABERTA; suspensão (inserida) renderiza o painel; apelação → APELADA. _Nota: usuário SUSPENSO não loga (trava 6.1) — o painel depende de token ainda válido; revisar o fluxo de apelação pós-expiração quando a 7.6 expuser a fila._
- [x] **7.5 — Monetização** (Fase 4) _(contratação de plano já saiu na 7.1)_:
  - [x] **Faturas + reembolso** (parte 1): `/cobrancas` (link no Perfil) lista faturas (`/invoices/me`, status/valor/vencimento/método) e reembolsos (`/refunds/me`); `RefundButton` nas faturas **PAGAS** solicita reembolso por motivo CDC §21 (BFF `/api/refunds`); o valor (integral/proporcional) é calculado no backend. **Provado ao vivo**: assinar PRO → fatura PAGA → solicitar reembolso ARREPENDIMENTO → integral R$49,00 SOLICITADO.
  - [x] **Gating por entitlements** (parte 2): painel "Meu plano" no topo de `/cobrancas` — plano vigente (badge) + lista das features conhecidas com **✓ liberada / 🔒 bloqueada** conforme `/me/entitlements` (`FEATURE_UI` mapeia os códigos de domínio a rótulos). **Provado ao vivo**: profissional sem assinatura → `{plano:null, features:[]}` → painel "Sem plano ativo" com as 4 features bloqueadas.
- [x] **7.3 — Busca, perfil público e obras** (Fase 5):
  - [x] **Busca + perfil público** (parte 1): **perfil público** `/[slug]` (SSR, **sem login**, compartilhável; `callApi` GET `/public/p/:slug`) com reputação (estrelas/avaliações/badges), `generateMetadata` real; nome parcial e, no Iniciante, oculto (§24) — **não expõe `userId`**. **Busca** `/buscar` (autenticada, área logada) com **URL como estado** (filtros q/especialidade/geo na query → compartilhável); `serverApi` GET `/search/professionals`; cada resultado linka o perfil e oferece **Agendar** → `/pedidos/novo?prof=<userId>&esp=` (fecha a costura da 7.2 — o `userId` vem da busca, não do perfil público). "Perto de mim" via geolocation. Início do contratante linka a busca. **Provado ao vivo**: `/joana-pintora-silva` (sem login) renderiza especialidades+reputação+CTA (nome oculto p/ Iniciante/EM_GRACA, correto §24); busca por especialidade acha a profissional e gera o link Agendar com `prof=&esp=`.
  - [x] **Obras + lances sigilosos** (parte 2): **novo módulo `cities` na API** (`GET /cities`, read público — dado de referência que faltava para abrir obra; porta+adapter Drizzle, schema `City` no shared). Aba **Obras** (descoberta/FOMO): lista de obras abertas (`/work-orders`), contratante publica via `/obras/nova` (cidade do `/cities`, urgência); `/obras/[id]` detalhe + **lance sigiloso** do profissional (`ObraBid`, valida piso no cliente, backend é a trava) / **propostas + adjudicar** do contratante (`ObraProposals`). BFF: `/api/work-orders`, `/api/proposals`, `/api/proposals/accept`; helper `work-order-ui`. **Provado ao vivo**: C abre obra (ABERTA) → P1+P2 dão lance → **sigilo** (P1 vê 1, dono vê 2) → C adjudica P1 (ACEITA, obra ADJUDICADA, P2 RECUSADA).
- [x] **7.7 — PWA** (Melhoria #3): `app/manifest.ts` (servido em `/manifest.webmanifest`, `display:standalone`, theme/background, start_url `/inicio`, marca via env) + ícone (`public/icon.svg`); **Service Worker** (`public/sw.js`) com estratégia conservadora (navegações network-first + fallback `offline.html`; estáticos com cache; **nunca** cacheia `/api`); `ServiceWorkerRegister` (registra no load) no root layout + `themeColor`/`appleWebApp`; banner **"Adicionar à tela inicial"** (`InstallPrompt`, `beforeinstallprompt`) no app shell. **Provado ao vivo**: manifest/sw.js/icon.svg/offline.html servidos (200); home injeta `rel="manifest"` + `theme-color`. _Push real depende de provedor/VAPID — adiado com o resto dos provedores reais._
- [x] **7.6 — Admin UI** (Melhoria #4) consumindo a API da Fase 6:
  - [x] **Dashboard de saúde + papéis** (parte 1): `/admin` **auto-protegido** (consome `/admin/metrics`; não-admin recebe 403 → "Acesso restrito" — a trava é a API). Renderiza o `HealthSnapshot`: **North Star** (obras avaliadas pelos 2 lados), usuários/ativação/agendamentos, monetização (MRR/churn), moderação, obras. `RolesForm` concede/revoga papéis (ADMIN/MODERADOR/FINANCEIRO) por id (BFF `/api/admin/roles`). **Provado ao vivo**: não-admin → Acesso restrito; admin (semeado) → dashboard; admin concede MODERADOR (confirmado na API).
  - [x] **Filas de moderação/financeiro** (parte 2): **+2 endpoints de listagem na API** (`GET /suspensions/appealed` MOD/ADMIN, `GET /refunds/pending` FIN/ADMIN — porta+adapter+service em moderation/billing). Front: `/admin/moderacao` (denúncias abertas + apelações, componente `Resolver` genérico de 2 botões → BFF) e `/admin/financeiro` (reembolsos pendentes, aprovar/recusar); ambas auto-protegidas (403→restrito). **Provado ao vivo**: moderador resolve denúncia (IMPROCEDENTE) + apelação (REVOGADA); financeiro aprova reembolso (CONCLUIDO); páginas renderizam as filas.
- [x] **7.8 — Qualidade de front**: **E2E Playwright** (chromium + mobile/Pixel 5): páginas públicas, **onboarding completo do profissional pela UI** (OTP lido do Redis → cadastro → atuação → plano grátis → área logada), responsivo (sem overflow em 320/768/1440) e **auditoria WCAG AA** com `@axe-core/playwright` (sem violações sérias/críticas). Correção de a11y: o laranja semântico (`--color-primary`/`--color-orange`) passou para **#c44408** (≥4.5:1 sobre cream e com texto branco) — o `orange-500` #e8560a fica como hero de grande porte. **16/16 testes verdes** (chromium + mobile). _Artefatos do Playwright no `.gitignore`._
- [x] **7.9 — Login multi-método + UI PC-first** (decisão jun/2026, §7.3):
  - **Backend:** cadastro/login por **e-mail + senha** ("conta normal"). Hash `scrypt` (`node:crypto`, sem dep externa, com `timingSafeEqual`) em `auth/domain/password.ts` (TDD); coluna `users.senha_hash` (migration `0010`); `UsersRepository.findByEmail`/`findCredentialsByEmail` + unicidade de e-mail no `UsersService`; `AuthService.loginWithPassword` (mensagem genérica anti-enumeração) e `CadastroService.registerWithPassword` (cria user+perfil+onboarding+auto-login, **sem OTP**). Endpoints `POST /auth/login` e `POST /cadastro/email`; schemas `registerSchema`/`loginSchema` no `shared`.
  - **BFF:** `POST /api/auth/login` e `/api/auth/register` (setam cookies httpOnly).
  - **UI (PC-first):** `/entrar` e `/cadastro` reescritos com **painel de marca split** (`AuthPanel`, colapsa no mobile) + **3 métodos**: e-mail/senha (funcional), WhatsApp-OTP (funcional, mantém o assistente em passos), **Google visual** (`GoogleButton` "em breve"). `MethodTabs` (segmented control acessível). A "conta normal" coleta só o essencial (tipo, nome, e-mail, senha, WhatsApp) e entra — o resto do perfil é completado depois.
  - **Shell responsivo:** área logada agora é **PC-first** — **Sidebar fixa à esquerda no desktop** (`Sidebar`, nav primária + atalhos), **TabBar inferior só no mobile** (`lg:hidden`), conteúdo amplo (`max-w-6xl`). Nav compartilhada (`nav-items.ts`) p/ sidebar e tabbar não divergirem.
  - **Pendente p/ EC2:** OAuth real do Google (credenciais + redirect URIs); validação ao vivo do conjunto (front+back local).
- **Entregável:** ✅ **produto navegável ponta a ponta, instalável (PWA), com E2E + WCAG AA — pronto para piloto.** Resta apenas a troca dos adapters fake/console por provedores reais (WhatsApp/SMS/Asaas + push VAPID + Google OAuth), que depende de contas/deploy.

### Fase 8 — Evolução pós-auditoria (jun/2026) — ✅ **concluída** _(não-bloqueado; resta apenas perf/deploy)_

> Integra o **Plano de Evolução do Produto** (agora consolidado neste documento — ver **§15 Apêndice**)
> e a **auditoria competitiva** (`docs/auditoria-competitiva.md`). Evolução do MVP a partir do feedback do fundador.

**Decisões do fundador (jun/2026):**
- ❌ **Sem pagamento do serviço pela plataforma** (revertido) — monetização = **assinatura/mensalidade**. O valor da
  obra é combinado e pago **diretamente entre as partes**; a ObraCerta **só intermedia a conexão**, não é parte do
  contrato (ToS).
- **Catálogo de profissões fixo** + **foco em obra civil** (removido "Pintor").
- **Empresa contrata direto**, **1 administrador** (sem sub-contas/membros).
- **Sem chat** — apenas **mensagem na proposta** + **contato** (WhatsApp/e-mail/telefone) liberado após o aceite; **foto anexa**.
- Landing com **prova social fake-realista** + **seletor de persona** (toggle estilo quemfaz) + **ilustração SVG**.
- **PWA instalável** (sem app nativo) · **SEO adiado** (pós-marca) · **sem verificação de documento/antecedentes**.

- [x] **8.1 — Catálogo de profissões + filtros**: catálogo fixo no `shared` (`professions.ts`, 16 ofícios de obra civil; +testes); cadastro do profissional com **multi-seleção** (`ProfessionPicker` + "Outra"); filtro de busca por **dropdown do catálogo**.
- [x] **8.2 — Landing nova** (refatorada sobre `mockups/landing_page.html`): **seletor de persona em toggle** (Sou cliente/profissional/empresa, em seção própria estilo quemfaz) que troca o passo-a-passo + CTA; hero estático com cards flutuantes + **ilustração SVG** (`public/illustrations/`); **planos completos** (✓/✗ por plano, dois lados); depoimentos; **FAQ acordeão** (2 colunas); números fake-realistas; **largura ampla (1600px)**; **logo ObraCerta com fundo removido** no header (`scripts/remove-logo-bg.cjs`). **Provado ao vivo**.
- [x] **8.3 — Gating por plano + upgrade no sistema**: entitlements expandidos (`entitlements.ts`: 9 funções reais — receber pedidos, perfil completo, portfólio, analytics, topo, lances) mapeadas por plano; **upgrade dentro do app** (`SubscriptionRepository.changePlan` + `BillingService.changePlan` + `POST /subscriptions/upgrade` + BFF + painel **"Meu plano"** com botões de upgrade em `/cobrancas`); **enforcement real** (`BillingService.can` → bloqueio de lances p/ não-Especialista no `submitProposal` → 403; UI com 🔒 + "Fazer upgrade"). **Provado ao vivo**: Iniciante→Pro→Especialista libera funções; Joana(Pro) lance bloqueado, Pedro(Especialista) aceito.
- [x] **8.4 — Mensagem + contato (Bloco B)**: pedido carrega **mensagem** (`descricao`) + **foto anexa** (upload multipart `POST /bookings/:id/foto` → storage S3/MinIO, só pelo contratante enquanto PENDENTE); após o aceite, **contato liberado** (`GET /bookings/:id/contato` → nome/WhatsApp/e-mail) — double-blind real: `isBookingContactReleased` (shared) libera só em APROVADO/INICIADO/CONCLUIDO. UI: campo de foto no novo pedido + foto e `ContactCard` (wa.me/mailto) no detalhe. +4 testes (`booking.contact.spec`, `booking.test`; 174 API / 21 shared). Migração `0012`. **Provado ao vivo**: foto 201; contato 403 PENDENTE → 200 pós-aceite. Sem chat em tempo real.
- [x] **8.5 — Ferramentas de gestão do profissional**: módulo `professional-tools` (hexagonal) com **orçamento + recibo** (entidade `professional_documents`, tipo ORCAMENTO|RECIBO, itens em jsonb, total recalculado no servidor via `documentTotalCentavos` no shared). **Tier premium**: feature `tools.documents` (ESPECIALISTA) — trava real em `ProfessionalToolsService.createDocument` 403; endpoints `POST/GET /tools/documents[/:id]`. UI: nav "Orçamentos e recibos", `/ferramentas` (lista + 🔒/upgrade p/ não-Especialista), `/ferramentas/novo` (itens dinâmicos + total ao vivo), `/ferramentas/[id]` (visão imprimível). Migração `0013`. +5 testes (177 API / 23 shared). **Provado ao vivo**: PRO 403 → upgrade → ESPECIALISTA cria com total 45000; lista/detalhe OK. _Painel financeiro fica para depois._
- [x] **8.6 — Conta PJ/Empresa**: novo `UserType.EMPRESA` (modelo 1 admin) + `company_profiles` (CNPJ único via índice parcial, razão social, nome fantasia; migração `0014`); cadastro PJ (`registerCompanySchema` com validação de CNPJ + `POST /cadastro/empresa` + BFF + opção "Empresa" no cadastro web com campos CNPJ/razão). **Contrata e publica como contratante** via helper `canHireServices` (shared) aplicado em `openWorkOrder` e `billing.purchase` (booking já não trava o ator). +4 testes (`company.test`: CNPJ + canHireServices; 177 API / 27 shared). **Provado ao vivo**: cadastro EMPRESA 201 (CNPJ duplicado rejeitado) → publica obra 201 (ABERTA). _Plano corporativo = planos de contratante por ora; tier dedicado fica p/ reprecificação._
- [x] **8.7 — Gating restante**: aplicado `booking.receive` (Iniciante **não recebe pedidos**) na mesma receita do gate de lances — trava real em `BookingService.createForContractor` → 403 (`BillingService.can` + `BillingModule` no `BookingModule`); UI da busca esconde "Agendar" e mostra "🔒 Não recebe pedidos" p/ Iniciante (`planoRecebePedidos` em `billing-ui`); +2 testes (`booking.gating.spec`, 172 no total). _**Revertido** pela reprecificação Fase 8+ (receber pedidos virou grátis); o mecanismo do gate `booking.receive` permanece (apenas todos os planos passam a ter a feature)._

- [x] **Portfólio de fotos** (backlog Fase 8+): galeria de obras do profissional. Tabela `portfolio_photos` (FK cascade; migração `0015`); `PortfolioService` com upload gated (feature `profile.portfolio`, PRO+) para storage S3/MinIO, limite de 12 fotos e remoção só pelo dono; endpoints `GET/POST/DELETE /profiles/professional/me/portfolio`. Exibição no perfil público `/[slug]` **gated por plano** (`planAllows`). UI: `PortfolioManager` em `/perfil` (grade + upload com legenda + remover) e galeria no perfil público. +4 testes (`portfolio.gating.spec`; 181 API). **Provado ao vivo**: Iniciante 403; Especialista sobe/lista/aparece no público/remove.

- [x] **Analytics estratégico do admin** (backlog Fase 8+): `GET /admin/analytics` (gated ADMIN) com agregações **read-only** (sem migração): **funil** de conversão (cadastro→perfil→ativação→lance→obra adjudicada com taxas de passagem), **liquidez** do marketplace (obras com ≥1 lance / total, lances por obra, taxa de adjudicação), **receita** (ARPA + **LTV estimado** projetado pela vida útil ≈1/churn, teto 24 meses) e **coorte** de cadastros/mês. Domínio puro testado (`media`, `estimateLtvCentavos` em `metrics-rules`); derivações no `AdminService.analyticsSnapshot`; SQL em `DrizzleAdminMetricsRepository.analytics` (Promise.all). Contrato `analyticsSnapshotSchema` no shared. UI: página `/admin/analytics` (funil + KPIs + `AnalyticsCharts` recharts: barras do funil + linha de coorte) e atalho na home do admin. +13 testes (194 API / 27 shared). **Provado ao vivo**: admin 200 (ARPA R$49, LTV com teto, liquidez 100%); joana 403.

- [x] **Reprecificação de planos** (backlog Fase 8+): novo gating sem mudar preços (R$0/49/99). **Receber pedidos virou grátis** (feature `booking.receive` no INICIANTE — reverte a §8.7); **lances saem a partir do Pro** (`bid.submit` no PRO, antes só ESPECIALISTA); **ferramentas (orçamento/recibo) seguem exclusivas do Especialista** como tier premium. Mudança centralizada no mapa `ENTITLEMENTS` (gating é dado, não código): `MeuPlano` e `/me/entitlements` refletem sozinhos. Ajustados: textos da landing (`_home/Planos.tsx`), catálogo `plans.ts` (`beneficios`), busca (sempre "Agendar"), cópia do cadeado de lances (`ObraBid`), helper morto `planoRecebePedidos` removido. **Correção-chave**: `BillingService.activePlan` agora dá baseline INICIANTE ao profissional sem assinatura (antes `null` → sem features), senão "receber pedido grátis" não teria efeito. +3 testes (`billing.service.baseline.spec`; entitlements/booking atualizados; 197 API). **Provado ao vivo**: pedro (INICIANTE) entitlements = {profile.public, booking.receive}; contratante agenda com Iniciante → 201; joana (PRO) dá lance → 201.

- [x] **8.8 — Correções da auditoria técnica (2026-06-09)** _(multi-agente; detalhe em `docs/auditoria-2026-06-09.md`, mapa em §15.4)_: revisão de código por 3 reviewers (frontend/React, visual+a11y/WCAG, backend).
  - [x] **Backend (10 itens):** sincronização de `professional_profiles.plano`/`contractor_profiles.plano` no billing via porta `PlanSyncPort` (H-1, fecha o bug de plano errado na busca/perfil); reassinatura pós-inadimplência (H-2); `@Roles(ADMIN)` no `/audit/verify` (M-7); remoção de `file: any`/`status as any` (H-3/H-4); extensão de upload via `mimetype` (M-6); unicidade de e-mail no `updateProfile` (L-18); slug fallback com `randomUUID` (L-17); comentário/mensagem do gate `RECEIVE_BOOKINGS` (H-5); limpeza de comentário no admin (M-12). **197/197 testes, typecheck/lint limpos.**
  - [x] **Onda 1 front + WCAG:** `params` Promise nas 3 páginas admin (FE-1); `prefers-reduced-motion` + skip-to-content (A11y-13/20); **bug `ADMIN_NAV`** consolidado (Moderação/Financeiro voltam ao mobile) + `NAV_EMPRESA` + `shortLabel` na TabBar (A11y-29/30/9); `key={id}` em `ferramentas/novo` (FE-9); `finally{setLoading}` nos componentes `catch`-only (FE-12); `role="alert"` no geoError (A11y-17); target ≥24px no "Remover foto" + `Field/Input` no PortfolioManager (A11y-18/7); prop morta `workOrderId` removida (FE-8); botões admin sem ação desabilitados (FE-7); `React.cache` no `getMyRoles` (FE-11); especialidade da obra vira catálogo (FE-14); `ProgressRing role="meter"` (A11y-22); tablist/tabpanel em Planos/ComoFunciona/FAQ (A11y-5/15/16); `alt` na foto do perfil público (A11y-14); contraste do `--color-muted-foreground` (A11y-21).
  - [x] **Onda 2/3 (parcial):** `alert()`→inline acessível em AdminForms (FE-4); `<Suspense>` no SearchFilters (FE-18); **vitrine** — perfil público `/[slug]` redesenhado (header hero + 2 colunas + CTA com foco + empty state, A11y-1/11/14) e cards de busca com Avatar/hierarquia/plano (A11y-3); banner por persona no `/perfil` (A11y-2); `BOOKING_STATUS_UI` no detalhe admin (FE-23).
  - [x] **Contrato/backend (aplicado, com TDD):**
    - **Estado de avaliação (FE-2/3):** `ReceivedReview` (Review + `resposta`/`respostaEm`) no `/reviews/received`; `GET /reviews/booking/:id/mine` (`hasReviewedBooking`); UI esconde os forms após enviar/responder. +3 testes (200 API).
    - **`/work-orders/me` (FE-20):** contratante/empresa veem as próprias obras (todos os status) em vez do feed global.
    - **`ProfileEditCard` (FE-19):** edição de nome/e-mail/foto para contratante/empresa (reusa as actions).
  - [x] **Nota (estrelas) nos cards de busca:** `LEFT JOIN` agregando avaliações REVELADAS por alvo no `/search/professionals` (consistente com a reputação pública); `mediaNota`/`totalAvaliacoes` no `SearchResult`. _(Nota: o seed deixa o único review de profissional OCULTA — para a estrela aparecer na demo, é preciso um review REVELADA de profissional.)_
  - [x] **Onda 4 (DS/dedup):** componente `Select` no DS (6 `<select>` migrados) · gradientes como classes Tailwind (`bg-gradient-*`, 9 inline removidos) · cores dos gráficos via tokens + correção do `hsl(var())` quebrado (A11y-6) · `aria-hidden` em StatCard/EmptyState (A11y-27) · dedup `Fact`/`useAsyncAction`/`TIPO_UI` + `<BackLink>` no admin (FE-13/25/26/27).
  - [x] **Hardening de segurança (jun/2026):** **rate-limit global** na API + **CSP** no Next (fecha as pendências de rate-limiting global e CSP herdadas da 6.1) · **confirmação (re-digitar e-mail) na criação de admin**. **Provado ao vivo.**
  - [ ] **Diferido (perf / deploy — não bloqueia o piloto):**
    - **Perf backend (M-8/9/10/14)** e **`serverApiFormData` (FE-5)** — otimizações, não bugs.
    - **`PAYMENT_WEBHOOK_SECRET` em produção (M-11)** — vai junto com o Asaas (deploy).

> **Landing (jun/2026, pedido do fundador):** header sticky robusto (botões sempre
> visíveis), rodapé multi-coluna, atmosfera de fundo leve, copy do passo-a-passo e
> clareza dos planos do contratante. Ver commit `feat(web): landing — ...`.

- **Entregável:** ✅ **MVP navegável ponta a ponta** — catálogo fixo de profissões, gating por plano com upgrade no app, double-blind de contato (mensagem + foto + contato pós-aceite), ferramentas do profissional (orçamento/recibo), conta PJ/Empresa, portfólio de fotos, analytics estratégico do admin, reprecificação de planos e correções da auditoria técnica. **Verificado ao vivo em localhost.** Resta apenas perf/deploy (otimizações + troca dos adapters fake por provedores reais), que dependem de contas/deploy.

**Backlog Fase 8+:** cobrança real
da mensalidade (Asaas sandbox) · notificações reais (WhatsApp Cloud API + push VAPID) · SEO (pós-marca) ·
seeding de oferta por cidade-piloto (operacional).

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

Não construir agora: chat interno, upload de documentos, geração de contratos, escrow/pagamento de obras, verificação de antecedentes, app nativo iOS/Android, verificação automática de referências. Fases futuras (2027+) quando o volume justificar.

> **Nota (jul/2026):** "senha no login" constava aqui, mas foi **construída** na Fase 7 por
> decisão do fundador (login "conta normal" e-mail+senha, além do OTP). Item removido da
> lista para refletir o estado real.

---

## 13. Próximos Passos Imediatos _(revisado jul/2026 — pós-MVP, demo no ar)_

> Estado: MVP completo (Fases 0–8) + Google/Pix sandbox + paridade de UX com o segmento
> (favoritos, reviews públicas, busca avançada, faixa de preço, checklist de ativação) +
> pacote jul/2026: chat no pedido e na obra, notificações in-app + Web Push, lembretes
> diários, endereços com CEP, galeria de fotos da obra, resumo exportável ("contrato"),
> central de ajuda + suporte, autocomplete de profissional, backup diário e E2E.
> Demo pública na EC2 (`app.<IP>.sslip.io`). **O código deixou de ser o gargalo** —
> os itens abaixo estão em ordem de prioridade.

### 13.1 Proteger o que existe (código, curto)
- [x] ~~**Backup automático do Postgres**~~ _(jul/2026)_ — `pg_dump` diário (cron 03:10 UTC na
      EC2) com retenção local (14) + espelho no MinIO (30d). Scripts em `infra/backup/`
      (backup/restore/instalador). **Limite:** o espelho vive no MESMO host — proteger contra
      perda da EC2 exige S3/R2 externo (quando houver conta, §13.3/13.4).
- [ ] **Deploy via CI** (GitHub Actions builda a imagem → EC2 puxa) — substitui o upload de
      ~630MB da máquina local (`scripts/deploy-ship.sh`) e a dependência do IP liberado no SG.
- [ ] **Monitoramento mínimo** — a API já expõe `/metrics` (Prometheus); plugar Grafana Cloud
      free ou ao menos um uptime-checker apontando pra demo.

### 13.2 Validação com usuários (não-código, o mais valioso)
- [ ] Roteiro de demo + **feedback estruturado da stakeholder** (cadastro → busca → pedido → Pix simulado).
- [ ] **10 entrevistas por persona** (profissional/contratante) — pré-lançamento (§ Pré-lançamento).

### 13.3 Decisão de nome + domínio (destrava a cadeia)
- [ ] Nome definitivo + registro `.com.br`/`.com`. Bloqueia: Google OAuth **real** (tela de
      consentimento exige domínio), e-mail transacional, SEO, Cloudflare, materiais.
      Arquitetura já desacoplada (`NEXT_PUBLIC_BRAND_*`) — trocar é config.

### 13.4 Provedores reais (quando 13.3 sair; tudo já atrás de portas)
- [ ] **Asaas sandbox** — Pix real (UI + pipeline de webhook prontos; trocar o adapter).
- [ ] **WhatsApp Cloud API + SMS fallback** — OTP real.
- [ ] **Google OAuth** — credenciais reais (`GOOGLE_CLIENT_ID/SECRET`; o fluxo já alterna sozinho).
- [x] ~~**Push VAPID**~~ _(jul/2026)_ — Web Push completo (inscrição por aparelho, envio junto
      do inbox, opt-in em /notificacoes); chaves geradas p/ dev e prod. Falta só o
      `PAYMENT_WEBHOOK_SECRET` de produção (M-11).

### 13.5 Qualidade na fila
- [x] ~~**E2E Playwright** dos 2 fluxos críticos~~ _(jul/2026)_ — busca→agendar→aceite→chat→cancela
      e obra→lance→adjudicação→chat (`apps/web/e2e/{pedido,obra}-flow.spec.ts`); specs antigas
      atualizadas; suíte completa verde. Rodar com a stack local no ar: `pnpm --filter @obracerta/web e2e`.
- [ ] Rodada de **review multi-agente** (security/react/database/silent-failure — ver `docs/skills-ecc.md`).
- [ ] Perf diferida do backend (M-8/9/10) + `serverApiFormData` (FE-5).

### 13.6 Polimento visual restante (menor)
- [ ] Dark mode (pós-piloto; tokens já permitem).
- [x] ~~Ilustrações no "Como funciona", toasts, 404 própria, confirmações estilizadas~~ _(jul/2026)_.

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

## 15. Apêndice — Plano de Evolução do Produto (consolidado)

> Este apêndice **incorpora** o antigo `docs/plano-evolucao-produto.md` (removido — este é agora o
> documento único). É a referência detalhada das decisões do fundador (jun/2026) e do racional de escopo
> da **Fase 8**, derivado da auditoria competitiva (`docs/auditoria-competitiva.md`).

### 15.1 Decisões confirmadas pelo fundador (jun/2026)

| # | Decisão |
|---|---------|
| 1 | **❌ SEM pagamento do serviço in-app (revertido jun/2026).** Monetização = **só a assinatura/mensalidade**. A plataforma **não processa o pagamento da obra** — combinado e pago **diretamente** entre as partes. |
| 2 | Plataforma **apenas intermedia a conexão** — **não se responsabiliza** pelos contratos (ToS + UX). |
| 3 | Diferença entre planos é por **funções liberadas** (gating), não por pagamento de serviço. |
| 4 | **Anexar fotos** nas propostas/mensagens. |
| 5 | **Catálogo de profissões fixo no código** · foco em **obra civil** (sem "Pintor"). |
| 6 | **Empresa contrata direto** · **sem sub-contas** · **1 administrador** · perfil guarda infos da empresa (tamanho de equipe etc.). |
| 7 | **Sem chat de verdade** — apenas **mensagem** ligada à proposta/pedido + **opções de contato** (WhatsApp/e-mail/telefone) liberadas após o aceite. |
| 8 | Landing: números **fake sem selo** + **seletor de persona em toggle** + **ilustração SVG** + largura ampla (1600px). |
| 9 | **PWA instalável** (sem app nativo) · **SEO adiado** (pós-marca) · **sem verificação de documento**. |
| 10 | **~~Take rate de 5%~~ — cancelado.** Sem comissão sobre o serviço. Receita = assinatura. |

### 15.2 Reprecificação de planos — **aplicada** (Fase 8+)

Modelo vigente (preços R$0 / R$49 / R$99 inalterados; gating no mapa `entitlements`):

| Recurso | INICIANTE (grátis) | PRO (R$49) | ESPECIALISTA (R$99) |
|---|:---:|:---:|:---:|
| Perfil público / aparecer na busca | ✅ | ✅ | ✅ |
| **Receber pedidos** | ✅ | ✅ | ✅ |
| Perfil completo · portfólio · analytics · busca geo | — | ✅ | ✅ |
| **Dar lances em obras** | — | ✅ | ✅ |
| **Ferramentas (orçamento/recibo)** · topo · busca ilimitada | — | — | ✅ |

Contratante (planos avulsos, 30 dias): BASICO R$19 · COMPLETO R$39 · LANCE R$69. Empresa: usa planos de contratante (tier corporativo dedicado fica para depois).

### 15.3 Mapa de defeitos da auditoria → status

1. Pagamento não cobra de verdade (Asaas fake) → **adiado** (sem deploy/credenciais).
2. Especialidade texto livre → ✅ catálogo fixo (8.1).
3. Landing sem prova social + duplo-CTA → ✅ (8.2).
4. Persona Empresa inexistente → ✅ conta PJ (8.6).
5. Negociação na plataforma (proposta/mensagem/contato) → ✅ (8.4).
6. Sem ferramentas de gestão do profissional → ✅ orçamento/recibo (8.5).
7. "Receber pedidos" trancado no pago travava o seeding → ✅ resolvido (reprecificação: grátis).
8. Admin sem analytics estratégico → ✅ (analytics funil/liquidez/LTV/coorte).
9. Liquidez/cold-start sem plano de seeding → **backlog operacional**.

### 15.4 Auditoria técnica multi-agente (2026-06-09) → ondas de correção

> Detalhe completo (40+ achados com `arquivo:linha` e fix) em `docs/auditoria-2026-06-09.md`.
> Rodada por `react-reviewer` (frontend), `a11y-architect` (visual/UX/WCAG) e `typescript-reviewer`
> (backend). Diferente de §15.3 (defeitos de **produto**), aqui são defeitos de **código/qualidade**.
> Vira a Fase **8.8**. Sequência sugerida por impacto/esforço:

**Onda 1 — Bugs reais + bloqueadores WCAG (rápidos, alto valor):**
- `params` síncronos nas 3 páginas admin (Next 15 — pode quebrar em build) `[FE-1]`
- `prefers-reduced-motion` + skip-to-content no `globals.css`/layout raiz `[A11y-13,20]`
- Bug `ADMIN_NAV` duplicado: TabBar mobile perde Moderação/Financeiro `[A11y-29]`
- `key={i}` → `key={id}` em `ferramentas/novo` (corrompe estado de input) `[FE-9]`
- `setLoading` em `finally` nos 7 componentes `catch`-only `[FE-12]`
- `role="alert"` no geoError da busca; target ≥24px no "Remover foto" `[A11y-17,18]`
- remover `workOrderId` morto de `ObraProposals` `[FE-8]`

**Onda 2 — Estado/UX correto (médio esforço):**
- `jaAvaliou`/`resposta` do Server Component p/ `ReviewForm`+`RespostaForm` (evita re-render e 409) `[FE-2,3]`
- trocar `alert()` de `AdminForms` por feedback inline `[FE-4]`
- conectar (ou desabilitar) botões sem ação no admin `[FE-7]`
- `uploadFotoAction` via `serverApiFormData` com refresh `[FE-5]`
- `<Suspense>` em `SearchFilters` e páginas com fetch múltiplo `[FE-16,18]`
- a11y de tabs/accordion: `role="tabpanel"`/`aria-controls` em FAQ, ComoFunciona, MethodTabs `[A11y-15,16]`; `role="meter"` no ProgressRing `[A11y-22]`

**Onda 3 — Vitrine + diferenciação por persona (produto, maior esforço):**
- Perfil público `/[slug]`: header hero + 2 colunas + bloco de confiança `[A11y-1,11,14]`
- Busca: cards com Avatar + nota + distância; banner contextual no `/perfil` `[A11y-2,3]`
- `ContratanteProfileForm` (edição) + `/work-orders/me` p/ contratante `[FE-19,20]`
- `NAV_EMPRESA` separado de contratante `[A11y-30]`

**Onda 4 — Consistência DS + dedup (manutenção):**
- componente `Select` no DS; `Field`+`Input` no PortfolioManager `[A11y-24,25,7]`
- gradientes como classes Tailwind no preset; `aria-hidden` nos emojis `[A11y-26,27]`
- escurecer `--color-muted-foreground`; cores dos gráficos via tokens `[A11y-21,6]`
- extrair `Fact`/`useAsyncAction`/`TIPO_UI`; usar `<BackLink>` no admin `[FE-13,25,26,27]`

**Backend (typescript-reviewer):** sem CRITICAL (SQLi/XSS/webhook/leak cobertos). Detalhe em §3 de
`docs/auditoria-2026-06-09.md`. Onda backend prioritária:
- **[H-1]** sincronizar `professional_profiles.plano` (e `contractor_profiles.plano`) nas transições de
  assinatura/compra — hoje a coluna alimenta busca/perfil público mas nunca é escrita pelo billing
  (assinante PRO aparece como INICIANTE e some do filtro `?plano=PRO`).
- **[M-11] segurança:** remover o default `"dev-webhook-secret-change-me"` de `PAYMENT_WEBHOOK_SECRET`
  no schema de validação (em prod sem a var, a API aceitaria webhooks com segredo público) — fazer junto
  com a entrada de provedores reais (Asaas).
- **[H-2]** não bloquear nova assinatura após inadimplência; **[M-7]** `@Roles(ADMIN)` no `/audit/verify`;
  **[H-3/H-4]** remover `file: any`/`status as any`; **[M-6]** extensão de upload via `mimetype`;
  **[L-18]** unicidade de e-mail no `updateProfile`.

---

*Documento de planejamento — derivado do material em `/docs`, dos protótipos HTML (`docs/mockups/`, ver §14) e da análise de stack (`~/.claude/plans/voce-acha-que-essa-snappy-island.md`). Consolida o antigo `plano-evolucao-produto.md` (§15). Atualizar conforme decisões de produto.*
