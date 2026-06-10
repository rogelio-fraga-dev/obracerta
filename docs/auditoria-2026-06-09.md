# Auditoria técnica multi-agente — 2026-06-09

> **Status (2026-06-10):** aplicados os 10 itens de backend + a Onda 1 de front/WCAG
> (ver `roadmap.md` §8.8). Restante (Onda 2/3/4 — UX, vitrine, dedup, perf) pendente.
> Tudo verificado: typecheck API+web limpos, 197/197 testes, lint limpo.


> Auditoria de código rodada por 3 reviewers especializados em paralelo sobre o estado
> pós-Fase 8 do ObraCerta/QuemFaz. A execução original (09/06 23:07) foi cortada pelo
> limite de sessão antes de concluir o reviewer de backend e antes de consolidar; este
> documento recupera e consolida os achados.
>
> - **Frontend (código React/Next)** — `react-reviewer` ✅ 20 achados
> - **Visual / UX / Acessibilidade (WCAG 2.2 AA)** — `a11y-architect` ✅ 20 achados
> - **Backend (API + shared)** — `typescript-reviewer` — re-executado em 2026-06-10 (ver §3)
>
> Mapeamento para o roadmap em `docs/roadmap.md` §15.4.

---

## 1. Frontend — código (react-reviewer)

### CRITICAL

1. **`params` síncronos em Server Components admin (Next.js 15)** — `apps/web/src/app/(app)/admin/usuarios/[id]/page.tsx:7`, `admin/pedidos/[id]/page.tsx:7`, `admin/obras/[id]/page.tsx:8`.
   As 3 páginas de detalhe admin tipam `params` como `{ id: string }` e acessam `params.id` sem `await`. No Next 15 `params`/`searchParams` são `Promise` — comportamento indefinido (pode retornar `undefined` silenciosamente). **Fix:** `params: Promise<{ id: string }>` + `const { id } = await params`, como já fazem `ObraDetailPage`/`PedidoDetailPage`/`DocumentoDetailPage`.

2. **`ReviewForm` reaparece após enviar (estado inconsistente + 409)** — `pedidos/[id]/page.tsx:119`, `pedidos/[id]/_components/ReviewForm.tsx`.
   O form de avaliação é sempre renderizado em `status === "CONCLUIDO"`; não há GET para saber se já avaliou. O `enviado` é só local — em `router.refresh()`/nova navegação reaparece, e um 2º envio dá 409. **Fix:** passar `jaAvaliou: boolean` do Server Component (`GET /reviews/booking/:id`) e renderizar um badge "Avaliação enviada".

3. **`RespostaForm` reaparece por sessão (mesma lacuna)** — `perfil/page.tsx:219`, `perfil/_components/RespostaForm.tsx`.
   `AvaliacoesRecebidas` não carrega se cada review já tem resposta; o form remonta com `enviado=false`. **Fix:** incluir `resposta: string | null` no tipo `Review` e ocultar o form quando `resposta !== null`.

### HIGH

4. **`alert()` como feedback de UX em admin** — `perfil/_components/AdminForms.tsx:43,45,84,87,129,132,165,168` (8×). Bloqueia thread, não acessível, quebra o padrão visual. **Fix:** estado de sucesso/erro inline (`<Badge tone="success">` / `<p role="alert">`), como em `PortfolioManager`/`BookingActions`.
5. **`uploadFotoAction` bypassa o refresh token → 401 silencioso** — `perfil/actions.ts:25-42`. Usa `getSession()` + `fetch` direto, pulando o retry/refresh do `serverApi`. **Fix:** variante `serverApiFormData(method, path, formData)` reaproveitando o refresh.
6. **`NovoPedidoPage` é Client Component inteiro** — `pedidos/novo/page.tsx:1`. Lê `prof`/`esp` via `useSearchParams` (exige Suspense) e manda validação ao cliente. **Fix:** Server Component lê `searchParams` e passa props p/ um `NovoPedidoForm` client.
7. **Botões de ação sem ação no admin (UI enganosa)** — `admin/usuarios/[id]/page.tsx:101-110`, `admin/obras/[id]/page.tsx:95`. "Suspender Usuário", "Editar Papéis", "Ver Histórico", "Forçar Cancelamento" são `<Button>` sem `onClick`/action. **Fix:** conectar à ação real (a `RolesForm` já existe) ou `disabled` + "Em breve".
8. **`workOrderId` morto em `ObraProposals`** — `obras/[id]/_components/ObraProposals.tsx:15-21`. Prop declarada e nunca usada. **Fix:** remover da interface.
9. **`key={i}` em lista editável** — `ferramentas/novo/page.tsx:121` (também `[slug]/page.tsx:105`, `ferramentas/[id]/page.tsx:64`). Em `ferramentas/novo` a lista de itens é add/remove → índice como key associa estado do `<Input>` ao slot errado. **Fix:** `id` único (`crypto.randomUUID()`) no `addItem`; nos outros, usar `item.id`/`item.url`.
10. **`BookingStepper` com mapeamento de status desalinhado** — `pedidos/[id]/_components/BookingStepper.tsx:3-16`. `ACEITO` aparece em `BOOKING_STATUS_UI` mas não nos `STEPS`; risco de `null` para pedido válido. **Fix:** consolidar nomes de estado em `@obracerta/shared` e importar em stepper + actions.
11. **`getMyRoles()` faz HTTP a cada render do layout (waterfall)** — `(app)/layout.tsx:19`, `inicio/page.tsx:42`, `perfil/page.tsx:32`. 2-3 chamadas a `/auth/me*` em cascata por request. **Fix:** `React.cache()` para deduplicar na mesma request.

### MEDIUM

12. **`setLoading` sem `finally` (botão pode travar)** — `AppealForm.tsx:28`, `ferramentas/novo/page.tsx:76`, `NovaObraForm.tsx:45`, `ObraBid.tsx:103`, `pedidos/novo/page.tsx:51`, `BookingActions.tsx:47`, `admin/_components/Resolver.tsx:37` (7×). `setLoading(false)` só no `catch`. **Fix:** `finally { setLoading(false) }`.
13. **`Fact` duplicado (13 linhas, bit-a-bit)** — `pedidos/[id]/page.tsx:126-138` e `obras/[id]/page.tsx:118-130`. **Fix:** extrair p/ `_shell/Fact.tsx`.
14. **`NovaObraForm` — "Especialidade" é Input livre** — `obras/nova/_components/NovaObraForm.tsx:75-79`. Gera fragmentação ("pintor"/"Pintor"). **Fix:** reusar `ProfessionPicker`/`professionCatalog` como na busca.
15. **`WhatsappSignup` — megacomponente de ~250 linhas / 6 passos** — `(public)/cadastro/page.tsx:211-433`. **Fix:** extrair sub-componentes por step com `onNext`.
16. **Ausência de Suspense/error boundaries com múltiplas fetches** — `inicio/page.tsx`, `perfil/page.tsx`, `cobrancas/page.tsx`. `InicioPage` usa `.catch(() => [])` (zeros silenciosos). **Fix:** `<Suspense>` + `react-error-boundary` por seção; distinguir "indisponível" de "zerado".
17. **`CreateAdminForm` cria admin sem confirmação** — `AdminForms.tsx:155-208`. Sem "tem certeza?"/re-auth; risco de escalonamento via XSS. **Fix:** modal de confirmação ou rota dedicada protegida.
18. **`SearchFilters` usa `useSearchParams` sem Suspense** — `buscar/_components/SearchFilters.tsx:13-23`. Risco de hidratação/warning no build. **Fix:** envolver em `<Suspense>`.
19. **Perfil do contratante sem edição** — `perfil/page.tsx:29-93`. Não edita nome/email/foto/WhatsApp. **Fix:** `ContratanteProfileForm` (RHF + `updateProfileAction`).
20. **Obras: contratante vê feed geral em vez das suas** — `obras/page.tsx:13-91`. `GET /work-orders` sem filtro de autor. **Fix:** endpoint `/work-orders/me` p/ contratante.
21. **`RolesForm` não pré-popula papéis atuais** — `admin/_components/RolesForm.tsx`. Salvar substitui por conjunto vazio acidentalmente. **Fix:** buscar papéis atuais ao digitar `userId`.
22. **`fotoUrl` renderizado sem validação de origem** — `pedidos/[id]/page.tsx:106-113`. `<img src={booking.fotoUrl}>` sem `remotePatterns`. **Fix:** `next/image` + `remotePatterns` no `next.config`.
23. **Status cru no detalhe admin** — `admin/pedidos/[id]/page.tsx:28-40`. `{pedido.status}` em vez de `BOOKING_STATUS_UI[...].label`. **Fix:** usar o mapper.
24. **`MethodTabs` sem `role="tabpanel"`** — `(public)/_auth/MethodTabs.tsx:22-49`. (também coberto pela a11y).

### LOW

25. **`useAsyncAction` duplicado** — `entrar/page.tsx:66-81` e `cadastro/page.tsx:67-82`. **Fix:** extrair p/ `lib/use-async-action.ts`.
26. **`TIPO_UI` duplicado** — `ferramentas/page.tsx:8-11` e `ferramentas/[id]/page.tsx:12-15`. **Fix:** extrair p/ `lib/document-ui.ts`.
27. **`BackLink` reimplementado em HTML cru no admin** — 3 páginas admin. **Fix:** usar `_shell/BackLink.tsx`.
28. **Contratante não edita/cancela obra publicada** — `obras/[id]/page.tsx`. **Fix:** ação de cancelar quando `tipo === "CONTRATANTE"` e `status === "ABERTA"`.
29. **`obras/page.tsx` sem try/catch → tela em branco** — `obras/page.tsx:16`. **Fix:** `try/catch` + `EmptyState`.
30. **`Pedidos` lista flat sem agrupamento** — `pedidos/page.tsx:57-87`. **Fix:** agrupar "Ativos" vs "Histórico".

---

## 2. Visual / UX / Acessibilidade (a11y-architect)

### Qualidade visual / Anti-template

1. **CRITICAL — Perfil público `/[slug]` é o pior ofensor** (dor relatada pelo fundador): coluna estreita `max-w-2xl` só com avatar+nome+estrelas+grid de fotos; sem profundidade, sem diferenciação por persona, vitrine parecendo estado vazio. **Fix:** header com `--gradient-hero`, foto grande (96-120px), nome em `font-display`, seção de confiança (estrelas/nº obras/anos/plano), CTA sticky/lateral; layout 2 colunas no desktop.
2. **HIGH — Perfil interno `/perfil` não diferencia personas** (`perfil/page.tsx:46-93`). **Fix:** banner contextual por persona (como `/inicio:79-99`).
3. **HIGH — Busca `/buscar` é lista de texto sem hierarquia** (`buscar/page.tsx:53-84`): sem avatar, nota ou distância em destaque; Especialista igual a Iniciante. **Fix:** card com Avatar, estrelas+contagem, badge de plano com hierarquia, chips de especialidade.
4. **HIGH — Landing: hero visual ausente no mobile** (`(public)/page.tsx:68-99`): cards `hidden lg:block`; `gap-10` dos stats aperta em 375px. **Fix:** 1 HERO_CARD compacto no mobile; `gap-6 sm:gap-10`.
5. **MEDIUM — Planos: toggle sem `role="tablist"`/`aria-selected`** (`_home/Planos.tsx:138-151`). Inconsistente com `ComoFunciona`.
6. **MEDIUM — Gráficos admin com cores hardcoded** (`admin/_components/AdminCharts.tsx:55,83,84`): `#3b82f6`/`#f97316`/`#22c55e` fora dos tokens; `hsl(var(--border))` pode não resolver (tokens são hex). **Fix:** importar `colors` de `@obracerta/design-tokens`.
7. **MEDIUM — `PortfolioManager`: file input sem `<label>`** (`PortfolioManager.tsx:88,92`) — viola WCAG 1.3.1/3.3.2. **Fix:** `Field` + `Input` do DS.
8. **LOW — `/cobrancas`: hierarquia fraca** (`cobrancas/page.tsx`).

### Responsividade

9. **HIGH — TabBar labels `text-[11px]`** (`_shell/TabBar.tsx:38`): "Buscar profissionais" trunca em 320px; <12px é problemático (WCAG 1.4.4). **Fix:** `shortLabel` ≤8 chars por item.
10. **HIGH — Hero landing img sem `sizes`/`loading`** (`(public)/page.tsx:497/70`): baixa imagem no viewport cheio. **Fix:** `loading="eager" fetchpriority="high"` + `sizes`.
11. **MEDIUM — Perfil público `max-w-2xl` em telas grandes** deixa ~380px vazios de cada lado. **Fix:** 2 colunas no desktop.
12. (Sidebar 280px / footer 320px — verificados, sem overflow real.)

### Acessibilidade (WCAG 2.2 AA)

13. **CRITICAL — Animações sem `prefers-reduced-motion`** (`globals.css:31-161` + `scroll-behavior: smooth` linha 6). **Fix:** bloco `@media (prefers-reduced-motion: reduce)` zerando durações + `scroll-behavior: auto`.
14. **CRITICAL — Avatar/foto sem nome acessível no perfil público** (`[slug]/page.tsx:53-60`; `packages/ui/src/avatar.tsx:72`): `img` da pessoa com `alt=""` e wrapper `aria-hidden`. **Fix:** `alt={nome}` na foto de identidade; remover `aria-hidden` do wrapper.
15. **HIGH — FAQ sem `aria-controls`/`id`** (`_home/Faq.tsx:33-48`). **Fix:** `id`+`aria-controls` botão↔painel.
16. **HIGH — `ComoFunciona`/`MethodTabs` sem `role="tabpanel"`+`aria-labelledby`** (`_home/ComoFunciona.tsx:32-57`, `_auth/MethodTabs.tsx:22-48`).
17. **HIGH — `SearchFilters` geoError sem `role="alert"`** (`SearchFilters.tsx:81`). **Fix:** `role="alert"`.
18. **HIGH — Botão "Remover foto" target <24px** (`PortfolioManager.tsx:66-73`) — viola WCAG 2.5.8. **Fix:** `w-7 h-7` (~28px).
19. **HIGH — `Card interactive` sem `role`/`tabIndex` quando sem `<Link>`** (`packages/ui/src/card.tsx:11-31`). **Fix:** garantir `<Link className="block">`; `role="button" tabIndex={0}` quando sem `<a>`.
20. **MEDIUM — Sem skip-to-content** (`app/layout.tsx:42-49`) — WCAG 2.4.1. **Fix:** link `sr-only focus:not-sr-only` + `id="main-content"` no `<main>`.
21. **MEDIUM — Contraste `--color-muted-foreground` #6b6455 (≈4.57:1)** margem mínima, risco em `text-xs`. **Fix:** escurecer p/ `#5a5348` (~5.2:1).
22. **MEDIUM — `ProgressRing` sem `role="meter"`/`aria-value*`** (`packages/ui/src/progress-ring.tsx:42-75`).
23. **LOW — `AdminCharts` sem alternativa textual** (tabela `sr-only`).

### Consistência do Design System

24. **HIGH — `<select>` nativo em `SearchFilters` duplica classes do Input** (`SearchFilters.tsx:67-79`). **Fix:** criar `packages/ui/src/select.tsx`.
25. **HIGH — input de legenda em `PortfolioManager` não usa DS** (`PortfolioManager.tsx:92`).
26. **MEDIUM — gradientes via `style={{ background: "var(--gradient-*)" }}`** (`(public)/page.tsx:169`, `inicio/page.tsx:81`, `Sidebar.tsx:79,115`). **Fix:** mapear `bg-gradient-*` no preset Tailwind (`packages/config`).
27. **MEDIUM — emojis decorativos sem `aria-hidden`** (`StatCard` em `inicio`, `perfil:152`, `cobrancas`, `AuthPanel`). **Fix:** `aria-hidden="true"`.
28. **LOW — opacidades `/8` `/12` fora do múltiplo de 5** — verificar suporte no preset.

### Navegação por persona (reclamação original: "nav não reflete cada tipo de conta")

29. **BUG funcional — `ADMIN_NAV` duplicado e divergente:** `Sidebar.tsx:25-32` tem 6 itens (com Moderação/Financeiro); `nav-items.ts:69-74` tem só 4 — a **TabBar mobile perde Moderação e Financeiro**. **Fix:** consolidar `ADMIN_NAV` em `nav-items.ts` (6 itens; TabBar mostra 4 + "Mais").
30. **EMPRESA e CONTRATANTE têm nav idêntica** (`nav-items.ts:52-54`) apesar de necessidades distintas. **Fix:** `NAV_EMPRESA` separado.

---

## 3. Backend — API + shared (typescript-reviewer)

> Re-executado em 2026-06-10 (a execução de 09/06 foi cortada pelo limite antes do relatório).
> Verificações: `typecheck` API ✅, `lint` API ✅ (19 warnings, 0 erros), `typecheck` shared ✅.
> **CRITICAL: nenhum.** A superfície crítica (SQLi, XSS, path traversal, webhook) está coberta —
> Drizzle parametrizado, HMAC em tempo constante, Zod na borda, sem vazamento de stack trace.

### HIGH

1. **`professional_profiles.plano` nunca é atualizado pelo billing** — `infrastructure/database/schema/professional-profiles.ts:26`, `modules/billing/application/billing.service.ts:479-487`, `modules/search/infrastructure/drizzle-search.repository.ts:53`.
   A coluna alimenta a **busca** (`pp.plano = ...`) e o **perfil público**, começa em `'INICIANTE'` (default) e nunca muda. `activate`/`changePlan`/cancelamento não tocam `professional_profiles`. **Consequência:** quem assina PRO continua aparecendo como INICIANTE na busca, e `?plano=PRO` nunca o retorna. O gating (`activePlan`, calculado ao vivo) está correto — só o dado desnormalizado está furado. **`contractor_profiles.plano` tem o mesmo problema** na compra avulsa. **Fix:** após `activateOrigin`/`changePlan`, `ProfilesRepository.setPlano(userId, plano)`.
2. **`findActiveByUser` trata `INADIMPLENTE` como ativa** — `modules/billing/infrastructure/drizzle-subscription.repository.ts:61-68`. Filtra só `status != 'CANCELADA'`. Em `subscribe` isso lança `ConflictException` e **bloqueia o inadimplente de regularizar criando nova assinatura**. Latente (não há job de inadimplência ainda), vira real quando implementar. **Fix:** ajustar o check de `subscribe` para permitir nova assinatura após inadimplência.
3. **`file: any` no upload de foto** — `modules/auth/interface/auth.controller.ts:144`. Desliga o type-check do arquivo passado a `users.uploadFoto`. **Fix:** `Express.Multer.File` (ou interface local, como `ProfilesController`).
4. **`status as any` no `setStatus`** — `modules/users/infrastructure/drizzle-users.repository.ts:104`. Cast silencia o enum do Drizzle → erro só em runtime. **Fix:** tipar com `UserStatus` do shared, sem cast.
5. **Comentário/mensagem contradizem a regra de `RECEIVE_BOOKINGS`** — `modules/booking/application/booking.service.ts:70-76`. Diz que receber pedidos é "exclusivo de planos pagos", mas a reprecificação deu a feature ao INICIANTE (`entitlements.ts:34`). Runtime correto, doc/erro desatualizados. **Fix:** atualizar texto e avaliar se o gate ainda é necessário.

### MEDIUM

6. **Extensão de arquivo derivada de `originalname` sem sanitizar** — `modules/users/application/users.service.ts:127`. `photo.jpg.php` → `ext="php"`. **Fix:** derivar do `mimetype` validado (como `ProfilesService`/`BookingService`).
7. **`GET /audit/verify` sem `@Roles(ADMIN)`** — `modules/audit/interface/audit.controller.ts:7-18`. Qualquer autenticado vê integridade/volume da trilha. **Fix:** `@Roles(UserRole.ADMIN)` + `RolesGuard`.
8. **`activePlan` faz 3 queries sequenciais por request de agendamento** — `billing.service.ts:509-523`. `createForContractor` já buscou o profissional antes. **Fix:** cache por request (`AsyncLocalStorage`/request-scoped) ou colapsar buscas.
9. **`listProposals` sem paginação** — `modules/work-orders/application/work-order.service.ts:176-179`. **Fix:** `LIMIT`/paginação na porta.
10. **`recomputeBadges` com loop sequencial + N+1 latente** — `modules/reputation/application/reputation.service.ts:222-263`. **Fix:** `Promise.all` nas leituras por alvo.
11. **`PAYMENT_WEBHOOK_SECRET` com default fraco no schema** — `config/env.validation.ts:43-45`: `default("dev-webhook-secret-change-me")`. Em prod sem a var, a API **sobe aceitando webhooks com segredo conhecido**. **Fix:** remover o default do schema (`z.string().min(32)` sem default → boot falha); manter só no `.env.example`.
12. **Comentários de workaround na interface layer** — `modules/admin/interface/admin.controller.ts:92-96` (`// Wait, ...private...`). `getBookingForAdmin` é a abordagem certa; só limpar os comentários.
13. **`countForBooking` não filtra `PENDENTE` antes da revelação bilateral** — `modules/reputation/infrastructure/drizzle-review.repository.ts:62-67`. Reenvio futuro poderia disparar revelação cedo. **Fix:** filtrar `status='PENDENTE'` (índice único `(booking_id, autor_id)` já existe).
14. **`findAllPaginated` faz 2 SELECTs não atômicos** — `drizzle-users.repository.ts:67-71`, `drizzle-work-order.repository.ts:69-73`. Total inconsistente + `count(*)` full-scan. **Fix:** `COUNT(*) OVER()`.

### LOW

15. **Anti-enumeração ok mas não documentado** — `auth.service.ts:55-62` (adicionar `// intencional`).
16. **`console.log` no `seed-completo.ts`** (16×) — warnings de ESLint.
17. **Slug fallback `Date.now() % 100_000`** — `profiles.service.ts:68`: colisão possível. **Fix:** `crypto.randomUUID().slice(0,8)`.
18. **`updateProfile` não checa unicidade de e-mail** — `users.service.ts:107-111`: colisão → 500 genérico. **Fix:** checar antes, ou mapear violação de constraint p/ `ConflictException`.

### Tabela — próximas mudanças (backend) por impacto/esforço

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 1 | [H-1] `professional_profiles.plano` no billing (activate/changePlan/cancel) | Alto (busca/perfil mostram plano errado) | Médio |
| 2 | [H-1] `contractor_profiles.plano` na compra avulsa | Médio | Baixo |
| 3 | [M-11] remover default de `PAYMENT_WEBHOOK_SECRET` no schema | Alto (segurança prod) | Muito baixo |
| 4 | [H-2] `findActiveByUser`/`subscribe` não bloquear pós-inadimplência | Alto (latente) | Baixo |
| 5 | [M-7] restringir `/audit/verify` a ADMIN | Médio | Muito baixo |
| 6 | [H-3/H-4] tipar `file: any` e `status as any` | Baixo | Muito baixo |
| 7 | [M-6] extensão via `mimetype` no `uploadFoto` | Médio | Muito baixo |
| 8 | [L-18] unicidade de e-mail em `updateProfile` | Médio | Baixo |
| 9 | [H-5] comentário/mensagem do gate `RECEIVE_BOOKINGS` | Baixo | Muito baixo |
| 10 | [M-14] `findAllPaginated` atômico (window function) | Baixo | Médio |
