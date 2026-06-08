# Auditoria Competitiva — ObraCerta

> Auditoria heurística sênior (UX/UI, Produto, Growth, SaaS, Marketplace) baseada em
> revisão de código/arquitetura/fluxos do estado real do produto em jun/2026.
> **Pré-deploy:** pagamentos e notificações ainda em adapters *fake*; Google login visual.
> Frameworks: AARRR, HEART, JTBD, Hooked, liquidez de marketplace (cold-start/take-rate/leakage).
> Benchmark: GetNinjas, Triider, Thumbtack, Angi/HomeAdvisor, TaskRabbit, Houzz,
> Checkatrade/MyBuilder, Jobber/Housecall Pro, Juntos Somos Mais.

---

## Decisões do fundador (jun/2026) — afetam este documento

Estas decisões já foram tomadas e **redirecionam** as recomendações abaixo:

- ❌ **Sem verificação de documento/antecedentes** por enquanto (risco de confiança aceito conscientemente; revisitar depois).
- ✅ **Pagamento dentro do sistema** para quem contratar via ObraCerta — a plataforma **apenas intermedia**; **não se responsabiliza pelos contratos** entre contratante e profissional.
- ✅ **PWA instalável** como única forma de app (❌ sem app nativo — deixa de ser "gap").
- ⏳ **SEO adiado** para depois da definição de nome/marca (não é prioridade agora).
- ✅ **Conta PJ/Empresa**, **ferramentas de gestão do profissional** e **chat in-app** entram no roadmap.
- ✅ **Catálogo de profissões** na criação do profissional + **filtros** na busca.
- ✅ **Landing** com conteúdo *fake porém realista* (começo de startup) + **imagens** + **seletor de persona**
  (Sou profissional / Procuro um profissional / Sou empresa) que troca o passo-a-passo exibido.

---

## ⚠️ Veredito executivo

Motor de produto **raro**: reputação dupla-cega, lances sigilosos, penalidade por taxa de aceitação,
termos bilaterais com log imutável, arquitetura hexagonal type-safe ponta a ponta — acima da média
dos concorrentes nacionais. **Porém o produto está "largo e raso"** e os riscos que matam marketplaces
deste tipo seguem abertos:

1. **Cold-start / liquidez** — sem seeding de oferta. Monetização *subscription-first* é a barreira mais
   alta justamente para o lado que precisa entrar primeiro (oferta).
2. **Vazamento / desintermediação** — o contato é o WhatsApp; sem pagamento in-app que prenda a transação,
   o "no-chat" só adiciona fricção sem capturar a recompensa. → **Endereçado pela decisão de pagamento in-app + chat gated.**
3. **Confiança/prova** — landing sem prova social e perfil sem portfólio. → **Endereçado pela decisão de landing + (futuro) portfólio.**

E o mais duro: **a monetização ainda não cobra de verdade** (Asaas fake) e **a persona Empresa não existe**.
→ Ambos entram no roadmap aprovado.

---

## 1. Landing Page

**Estado real:** Hero → Dores (3 cards) → Como funciona (2 colunas) → Planos do profissional → CTA final.
CTAs reais para `/cadastro`, mobile-first, gradiente de marca, animações.

- ✅ Proposta clara em <5s.
- ❌ **Duplo-CTA de igual peso** ("Quero contratar" vs "Sou profissional") → paradoxo da escolha. → **Resolvido pelo seletor de persona.**
- ❌ **Zero prova social** (depoimento, número, foto, logo, nota). → **Resolvido com conteúdo fake-realista + imagens.**
- ❌ "Planos do profissional" no caminho do contratante (assusta).
- ❌ Diferenciais como *pills* sem explicação ("Sem chat antes do aceite" soa como limitação).
- ⏳ SEO fraco (sem metadata/schema/programático) — **adiado** até a marca.

**Notas (0–10):** Design 6.5 · Clareza 7.0 · Conversão 4.0 · Autoridade 2.5 · UX 6.5

## 2. Painel Administrativo

**Estado real:** `/admin` (saúde do produto), filas `/admin/moderacao` e `/admin/financeiro`,
gestão `/admin/usuarios|obras|pedidos` (+detalhe), `RolesForm`. RBAC server-side, ADMIN superusuário.

- ✅ Operacional completo + RBAC sólido (acima da média).
- ❌ **KPIs estratégicos faltando:** funil (visitante→cadastro→perfil→1ª transação), coortes D1/D7/D30,
  liquidez (% buscas com resultado, tempo-até-match, oferta/demanda por cidade×especialidade),
  GMV/take rate, LTV/CAC. Hoje responde "o que aconteceu", não "por quê".
- ⚠️ Sem busca/paginação robusta nas listas; sem trilha de auditoria de ações admin na UI (existe `audit_log` no schema).
- ⚠️ Sem 2FA admin, sem rate-limit global aplicado.

## 3. Área do Contratante

- ✅ Onboarding curto; busca com URL-como-estado; máquina de estados + termos + avaliação.
- ❌ **Sem pagamento in-app** (a "contratação" é só agendamento). → **Decidido implementar.**
- ❌ **Persona Empresa inexistente** (cadastro PJ, gestão de equipe/vagas, multi-obra, relatórios). → **Decidido implementar.**
- ❌ Retenção ~0 entre obras (uso episódico) + contato vaza pro WhatsApp.

## 4. Área dos Profissionais

- ✅ Onboarding multi-step, agenda, painel de comportamento (taxa de aceitação + penalidades), lances.
- ❌ **Especialidade é texto livre** (sem catálogo) → dados sujos, busca ruim. → **Decidido: catálogo de profissões.**
- ❌ Sem portfólio/fotos (item nº1 de conversão em construção).
- ⚠️ Reputação começa vazia (cold-start de reputação); lances trancados no plano caro (R$99).
- ❌ **Sem ferramentas de negócio** (orçamento/recibo/financeiro) → baixa stickiness. → **Decidido implementar.**

## 5. Planos e Monetização

**Estado real:** Profissional Iniciante R$0 (não recebe pedidos) · Profissional R$49 · Especialista R$99.
Contratante BASICO. Asaas **fake**.

- ❌ **Subscription-first no lado da oferta** = paga antes de ver retorno (trava o seeding).
- ❌ **"Receber pedidos" trancado no pago** → grátis é inútil como aquisição de oferta.
- ❌ **Sem take rate / pagamento in-app** = GMV inteiro fora da plataforma. → **Decidido implementar pagamento intermediado.**
- ⚠️ Cobrar do contratante PF tende a derrubar demanda; modelos vencedores cobram do profissional.

**Redistribuição sugerida:** receber pedido grátis (limitado) · lances no R$49 (não R$99) ·
tier premium de **ferramentas de gestão** · **take rate** sobre pagamento in-app · plano **B2B Empresa**.

## 6. Gap Analysis (pós-decisões)

| Área | Problema | Impacto | Prioridade | Status decisão |
|---|---|---|---|---|
| Monetização | Pagamento fake (não cobra) | Receita 0 | **Crítico** | ✅ Implementar pagamento intermediado |
| Liquidez | Sem seeding de oferta | Marketplace morto | **Crítico** | Seeding manual cidade-piloto |
| Monetização | "Receber pedidos" trancado; sem lead/credito | Oferta não entra | **Crítico** | Reprecificar planos |
| Confiança | Landing sem prova; perfil sem portfólio | Conversão baixa | **Crítico** | ✅ Landing fake-realista + imagens (portfólio depois) |
| Vazamento | Contato vira WhatsApp; sem pagamento que prenda | Take rate vaza | **Alto** | ✅ Pagamento in-app + chat gated |
| Persona | Empresa/PJ inexistente | B2B descoberto | **Alto** | ✅ Implementar conta PJ |
| Dados | Especialidade texto livre | Busca/filtro ruins | **Alto** | ✅ Catálogo de profissões + filtros |
| Analytics | Admin sem funil/coorte/liquidez | Decisão às cegas | **Alto** | Dashboards estratégicos |
| Onboarding | Duplo-CTA; planos no caminho do contratante | Fricção | **Alto** | ✅ Seletor de persona na landing |
| Retenção | Nada traz contratante de volta | Churn ~100% | **Alto** | Ferramentas pro + chat + (futuro) garantia |
| Ferramentas pro | Sem orçamento/recibo/financeiro | Baixa stickiness | **Médio** | ✅ Implementar gestão do profissional |
| Notificações | WhatsApp/push fake | Sem reengajamento | **Alto** | WhatsApp Cloud API + push PWA (depende de contas) |
| SEO | Sem metadata/schema/programático | Orgânico 0 | **Médio** | ⏳ Adiado até definir marca |
| Verificação | Sem doc/antecedentes | Confiança | — | ❌ Fora de escopo por ora |
| App nativo | Só PWA | Percepção | — | ❌ Decisão: manter só PWA instalável |

## 7. Score Final

| Dimensão | Nota |
|---|---|
| Landing Page | 5.0 |
| UX Geral | 6.0 |
| UI Geral | 6.5 |
| Área do Contratante | 5.5 |
| Área do Profissional | 6.0 |
| Painel Administrativo | 6.5 |
| Modelo de Negócio | 6.0 |
| Monetização | 4.5 |
| Escalabilidade (técnica) | 7.5 |
| Potencial de Mercado | 8.0 |
| **MÉDIA** | **≈ 6.2** |

### Funcionalidades que você TEM e concorrentes normalmente não têm (seus fossos)
Avaliação **dupla-cega** · **lances sigilosos** · **penalidade por taxa de aceitação** ·
**termos bilaterais com log imutável** · **anti-desintermediação deliberada** · **stack type-safe ponta a ponta**.

### Funcionalidades que concorrentes têm e você ainda não (pós-decisão)
Pagamento in-app/escrow (✅ a fazer) · conta PJ (✅) · chat in-app (✅) · ferramentas de gestão pro (✅) ·
catálogo/filtros de profissão (✅) · portfólio de fotos (depois) · pay-per-lead (avaliar) ·
match instantâneo/multi-cotação (avaliar) · SEO programático (⏳) · garantia/seguro (futuro) ·
verificação de documento (❌ fora de escopo) · app nativo (❌ decisão: só PWA).
