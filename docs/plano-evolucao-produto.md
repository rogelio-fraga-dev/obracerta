# Plano de Evolução do Produto — ObraCerta

> **✅ INTEGRADO AO ROADMAP** — este plano agora vive como **Fase 8** em `docs/roadmap.md`
> (fonte canônica de fases). Este documento é mantido como **referência detalhada** das decisões e do escopo.
> Progresso atual: 8.1 (catálogo+filtros), 8.2 (landing), 8.3 (gating+upgrade) **concluídos**;
> 8.4 (mensagem+contato), 8.5 (ferramentas pro), 8.6 (conta PJ) **pendentes**.
> Documento derivado da auditoria (`docs/auditoria-competitiva.md`) + decisões de jun/2026.

---

## 0. Decisões confirmadas pelo fundador

| # | Decisão |
|---|---|
| 1 | **❌ SEM pagamento in-app (REVERTIDO jun/2026).** A monetização é **só a mensalidade/assinatura**. A plataforma **não processa o pagamento do serviço** — o valor da obra é combinado e pago **diretamente** entre as partes. |
| 2 | Plataforma **apenas intermedia a conexão** — **não se responsabiliza** pelos contratos entre contratante e profissional (vai pra ToS + UX) |
| 3 | Diferença entre planos é por **funções liberadas (free vs pro)**, não por pagamento de serviço |
| 4 | **Anexar fotos já** (nas propostas/mensagens) |
| 5 | **Catálogo de profissões fixo no código** · **foco em obra civil** (removido "Pintor" do catálogo e da landing) |
| 6 | **Empresa contrata direto** · **sem sub-contas/membros** · **apenas 1 administrador** · perfil guarda infos da empresa (tamanho de equipe etc.) |
| 7 | **Sem chat de verdade.** Apenas **mensagem**: contratante manda proposta + mensagem → profissional responde + **opções de contato** (WhatsApp, e-mail, telefone) |
| 8 | Landing: números **fake sem selo** + **seletor de persona em toggle** (estilo quemfaz, em seção própria) + **ilustração SVG** + largura ampla (1600px) |
| 9 | **PWA instalável** (sem app nativo) · **SEO adiado** (pós-marca) · **sem verificação de documento** |
| 10 | **~~Take rate de 5%~~ — CANCELADO.** Sem comissão sobre o serviço. Receita = assinatura. |

---

## 1. Landing — seletor de persona + passo-a-passo + visual

**Escopo:**
- **Seletor de persona** no topo (3 cards): `Procuro um profissional` · `Sou profissional` · `Sou empresa`.
  Ao escolher, a seção "Como funciona" troca para o **passo-a-passo daquela persona** e o **CTA se adapta**.
- **Conteúdo fake-realista SEM selo** (ex.: "+180 profissionais", "1.200+ avaliações", "4.8 média", "12 cidades",
  3 depoimentos com nomes/ofícios realistas).
- **Imagens:** ilustrações **SVG na identidade** (laranja/cream/dark) — hero, ícones de persona, passos, provas.

**Impacto:** só `apps/web` (`(public)/page.tsx` + `(public)/_home/`) + assets SVG em `public/`. Sem backend.

## 2. Catálogo de profissões + filtros

**Escopo:**
- Catálogo **fixo** no `packages/shared` (pedreiro, pintor, eletricista, encanador, marceneiro, gesseiro,
  serralheiro, azulejista, impermeabilizador, piscineiro, soldador, paisagista, vidraceiro, telhadista,
  marido de aluguel, limpeza pós-obra…).
- Cadastro do profissional: **multi-seleção do catálogo** (+ "Outra" texto livre) — substitui o input atual.
- Busca: **filtros** por profissão, cidade, nota mínima, urgência + ordenação.

**Impacto:** `shared` (catálogo/schema), `apps/api` (busca por categoria), `apps/web` (cadastro + filtros `/buscar`).

## 3. Conta PJ / Empresa (simplificada)

**Escopo (reduzido conforme decisão):**
- Tipo de usuário **EMPRESA** (PJ) com CNPJ, razão social — **um único login/administrador** (sem sub-contas/membros).
- **Perfil da empresa** com campos informativos: **tamanho da equipe**, área de atuação, cidade, descrição, contato.
- **Empresa contrata direto** (igual contratante PF) e pode publicar obras p/ lances (reusa módulo existente).
- **Plano corporativo** (cobrança PJ).

**Impacto:** `shared` (tipo EMPRESA + schema empresa), `apps/api` (perfil empresa — sem gestão de equipe/sub-contas),
`apps/web` (cadastro PJ + perfil). Bem mais simples que o desenho anterior.

## 4. Pagamento in-app — ❌ CANCELADO (revertido jun/2026)

**Decisão atual:** **não** haverá pagamento do serviço pela plataforma (sem Asaas para o serviço, sem take rate).
A **monetização é só a assinatura/mensalidade** (planos do profissional; planos de acesso do contratante).
O valor da obra é combinado e pago **diretamente entre contratante e profissional**, fora da plataforma.

> A assinatura em si (cobrança do plano Pro/Especialista) continua sendo via gateway quando formos cobrar de verdade,
> mas **não** há intermediação do pagamento do serviço contratado.

## 5. Ferramentas de gestão do profissional

**Escopo (MVP):** **orçamento/cotação** (criar → enviar → aceitar) + **recibo** de serviço concluído +
(depois) **painel financeiro** alimentado pelo pagamento in-app. Candidato a **tier premium**.

**Impacto:** `apps/api` (módulo `quotes`/recibos), `apps/web` (telas pro), `shared`. Financeiro depende de §4.

## 6. Mensagem + contato (substitui o "chat")

**Decisão:** **não** haverá chat. Apenas troca de **mensagem ligada à proposta/pedido** + **opções de contato**.

**Escopo:**
- Ao contratar/propor: contratante envia **proposta + mensagem** (com **foto anexa**).
- Profissional **responde** (mensagem + foto).
- Após o aceite, aparecem as **opções de contato**: **WhatsApp, e-mail, telefone** (botões diretos).
- Sem tempo real, sem thread contínua de chat — é a mensagem da negociação + o contato liberado.

**Impacto:** `apps/api` (campo de mensagem/resposta na proposta/pedido + upload de foto via storage que já existe),
`apps/web` (UI da proposta com mensagem + anexo + botões de contato), `shared` (schemas). Bem mais simples que chat.

## 7. Reprecificação de planos (a validar — não implementar sem ok)

| Recurso | Hoje | Proposto |
|---|---|---|
| Aparecer na busca | Grátis | Grátis |
| Receber pedidos | R$49 | Grátis (limite/mês) |
| Lances em obras | R$99 | R$49 |
| Funções no pagamento/mensagem (anexos, contatos, etc.) | — | **Limitadas no free, completas no pro** |
| Ferramentas de gestão (orçamento/recibo/financeiro) | — | Premium |
| Plano Empresa (PJ) | — | Corporativo |
| Taxa sobre pagamento in-app | — | 5% pago pelo contratante (§4) |

## 8. Top 10 defeitos — atualizado

1. Pagamento não cobra de verdade (Asaas fake) → §4.
2. Sem pagamento in-app PIX/cartão → §4.
3. Especialidade texto livre (sem catálogo) → §2.
4. Landing sem prova social + duplo-CTA → §1.
5. Persona Empresa inexistente → §3.
6. Negociação não acontece na plataforma (proposta/mensagem/contato) → §6.
7. Sem ferramentas de gestão do profissional → §5.
8. "Receber pedidos" trancado no pago trava o seeding → §7.
9. Admin sem analytics estratégico (funil/coorte/liquidez) → backlog.
10. Liquidez/cold-start sem plano de seeding → backlog (operacional).

## 9. Sequência sugerida

**Bloco A (rápido, sem dependência externa):**
1. Catálogo de profissões + filtros (§2).
2. Landing nova (persona + passo-a-passo + imagens SVG + fake-realista) (§1).

**Bloco B (negociação):**
3. Proposta + mensagem + foto + contato (WhatsApp/e-mail/telefone) (§6).
4. ~~Pagamento in-app~~ — **cancelado** (monetização = assinatura).
5. Ferramentas pro: orçamento + recibo (§5).

**Bloco C:**
6. Conta PJ/Empresa (§3).

**Backlog:** analytics admin · reprecificação aplicada · notificações reais · portfólio · SEO (pós-marca).

## 10. Para começar, preciso só de:
1. **Decisão do modelo da taxa** (§4 — A/B/C + quem paga). Te expliquei as opções.
2. **Ordem** (Bloco A→B→C ou outra).
3. **Credenciais Asaas sandbox** quando chegar no Bloco B.
