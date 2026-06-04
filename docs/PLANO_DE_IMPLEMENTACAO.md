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

Derivado do PRD. Detalhar em migrations (Prisma ou Drizzle como ORM — decisão de Fase 0; ambos com bom suporte a Postgres/PostGIS).

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
| `booking` | Fluxo de agendamento, expiração 24h, limite 2/especialidade | §7, §11 |
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

### Fase 0 — Fundação (Sprint 0–1)
- [ ] Monorepo (Turborepo + pnpm), lint/format, `packages/config`.
- [ ] `apps/api` NestJS (estrutura hexagonal) + `apps/web` Next.js 15 + `packages/shared` (tipos+Zod) — **POC de type-safety end-to-end**.
- [ ] PostgreSQL 16 + PostGIS + Redis + ORM/migrations; Docker Compose local.
- [ ] Design tokens + Design System base (`packages/ui`).
- [ ] CI (GitHub Actions: lint+test+build) + Coolify na VPS SP; domínio + SSL + Cloudflare; deploy end-to-end "hello world".
- [ ] **ADR-0001** (stack) + diagrama **C4** inicial.
- **Entregável:** ambiente reproduzível, deploy verde, type-safety provada.

### Fase 1 — Identidade e perfis (Sprint 2–3)
- [ ] `auth` (OTP multicanal + JWT/Redis + SMS fallback). `entitlements` base.
- [ ] Cadastro 4 passos (profissional/contratante) + tela de escolha de perfil.
- [ ] Perfil + **completude gamificada** (§4.2). Object storage para foto.
- [ ] Onboarding: tour + checklist + notificações progressivas.
- **Entregável:** usuário se cadastra, loga e completa perfil.

### Fase 2 — Agenda e agendamento (Sprint 4–6)
- [ ] `availability` (6 meses, bloqueio bilateral, §10).
- [ ] `booking` (§7, expiração 24h via BullMQ, limite 2/especialidade §11).
- [ ] `terms` (termo bilateral, append-only, §7.4/§9) + `audit_log`.
- [ ] `decline-penalty` (§8).
- **Entregável:** ciclo agendar→aprovar→iniciar→concluir com proteção jurídica.

### Fase 3 — Reputação (Sprint 7–8)
- [ ] `reputation` (dupla-cega, revelação simultânea, janela 7d + lembretes, §12).
- [ ] Badges + direito de resposta pública.
- [ ] `moderation` (denúncia→ocultar+48h; suspensão automática + apelação, §13).
- **Entregável:** North Star mensurável.

### Fase 4 — Monetização (Sprint 9–10)
- [ ] `billing` Asaas (recorrência + Pix avulso, webhooks idempotentes).
- [ ] Faturas, expiração de avulso (D25/D28/D30 + bloqueio, §19), gestão de plano (§20), reembolso CDC (§21).
- **Entregável:** receita real; planos com gating correto via `entitlements`.

### Fase 5 — Busca, perfil público e obras (Sprint 11–13)
- [ ] `search` (pg_trgm + **PostGIS geo** + filtros por plano, §17; cache Redis).
- [ ] `public-profile` SSR (URL compartilhável, anti-desintermediação §18/§24).
- [ ] `work-orders` (urgência + lances sigilosos + piso de dignidade, §16).
- **Entregável:** descoberta orgânica (SEO) + FOMO de obras + aquisição por compartilhamento.

### Fase 6 — PWA, admin e hardening (Sprint 14–15)
- [ ] PWA instalável (manifest, SW, push, banner) — Melhoria #3.
- [ ] `admin` dashboard de saúde — Melhoria #4.
- [ ] **Hardening**: auditoria OWASP, rate-limiting, security headers + CSP, scan de deps; **observabilidade** (OpenTelemetry + métricas + logs); **E2E Playwright** + **carga k6**; auditoria WCAG.
- **Entregável:** produto pronto para piloto com 50 profissionais.

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
6. Escolher ORM (Prisma vs Drizzle) e registrar **ADR**.

---

*Documento de planejamento — derivado do material em `/docs`, dos protótipos HTML e da análise de stack (`~/.claude/plans/voce-acha-que-essa-snappy-island.md`). Atualizar conforme decisões de produto e o plano refinado do Ultraplan.*
