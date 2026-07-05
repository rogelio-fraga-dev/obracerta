import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type {
  AvailabilitySlot,
  BookingRequest,
  PenaltySummary,
  PortfolioPhoto,
  ProfessionalProfile,
  Review,
  User,
} from "@obracerta/shared";
import { CheckCircle2, ClipboardList, Hammer, Star } from "lucide-react";
import { Badge, Card, StatCard, Avatar } from "@obracerta/ui";
import { getMyRoles, getProfileHint } from "@/lib/session";
import { serverApi } from "@/lib/server-api";
import { formatRelativeBR, firstName } from "@/lib/format";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import {
  AgendaIcon,
  ObrasIcon,
  PedidosIcon,
  PlanoIcon,
  PlusIcon,
  SearchIcon,
} from "../_shell/icons";

interface Acao {
  href: string;
  titulo: string;
  desc: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface ChecklistItem {
  href: string;
  titulo: string;
  done: boolean;
}

/**
 * Passos de ativação do profissional (onboarding guiado): perfil completo,
 * agenda definida e portfólio com fotos — o caminho até aparecer bem na busca.
 * `portfolio: null` = plano sem a feature (não vira pendência).
 */
function buildChecklist(
  perfil: ProfessionalProfile | null,
  agenda: AvailabilitySlot[],
  portfolio: PortfolioPhoto[] | null,
): ChecklistItem[] {
  const itens: ChecklistItem[] = [
    {
      href: "/perfil",
      titulo: "Complete seu perfil",
      done: (perfil?.completudePct ?? 0) >= 100,
    },
    {
      href: "/agenda",
      titulo: "Defina sua agenda semanal",
      done: agenda.length > 0,
    },
  ];
  if (portfolio !== null) {
    itens.push({
      href: "/perfil",
      titulo: "Publique fotos no portfólio",
      done: portfolio.length > 0,
    });
  }
  // Tudo feito → o card nem aparece.
  return itens.every((i) => i.done) ? [] : itens;
}

const ACOES_PROFISSIONAL: Acao[] = [
  { href: "/agenda", titulo: "Minha agenda", desc: "Defina seus horários disponíveis", Icon: AgendaIcon },
  { href: "/pedidos", titulo: "Pedidos", desc: "Aprove, inicie e conclua serviços", Icon: PedidosIcon },
  { href: "/obras", titulo: "Obras abertas", desc: "Dê lances em obras de contratantes", Icon: ObrasIcon },
  { href: "/cobrancas", titulo: "Meu plano", desc: "Plano, faturas e benefícios", Icon: PlanoIcon },
];

const ACOES_CONTRATANTE: Acao[] = [
  { href: "/buscar", titulo: "Encontrar profissional", desc: "Por especialidade ou perto de você", Icon: SearchIcon },
  { href: "/obras/nova", titulo: "Publicar obra", desc: "Receba lances de vários profissionais", Icon: PlusIcon },
  { href: "/pedidos", titulo: "Meus pedidos", desc: "Acompanhe seus agendamentos", Icon: PedidosIcon },
  { href: "/cobrancas", titulo: "Cobranças", desc: "Faturas e reembolsos", Icon: PlanoIcon },
];

/** Início — painel inicial com stats reais, próximos compromissos e ações rápidas. */
export default async function InicioPage() {
  const [hint, roles] = await Promise.all([getProfileHint(), getMyRoles()]);
  if (roles.includes("ADMIN")) redirect("/admin");

  const primeiroNome = firstName(hint?.nome);
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const acoes = isProfissional ? ACOES_PROFISSIONAL : ACOES_CONTRATANTE;

  // Buscar dados reais para o dashboard
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const [pedidos, reviews, me] = await Promise.all([
    serverApi<BookingRequest[]>("GET", endpoint).catch(() => [] as BookingRequest[]),
    serverApi<Review[]>("GET", "/reviews/received").catch(() => [] as Review[]),
    serverApi<User>("GET", "/auth/me/profile").catch(() => null),
  ]);

  // Calcular stats
  const pendentes = pedidos.filter((p) => p.status === "PENDENTE").length;
  const emAndamento = pedidos.filter((p) => ["APROVADO", "INICIADO"].includes(p.status)).length;
  const concluidos = pedidos.filter((p) => p.status === "CONCLUIDO").length;
  const mediaNotas = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length).toFixed(1)
    : "—";

  // Próximos compromissos
  const totalProximos = pedidos.filter((p) => !["CONCLUIDO", "CANCELADO", "EXPIRADO"].includes(p.status));
  const maxCompromissos = isProfissional ? 3 : 2;
  const proximos = [...totalProximos]
    .sort((a, b) => new Date(a.dataServico).getTime() - new Date(b.dataServico).getTime())
    .slice(0, maxCompromissos);

  // Para profissionais: penalidades + passos de ativação (checklist do 1º acesso)
  let penaltyStats: PenaltySummary | null = null;
  let checklist: ChecklistItem[] = [];
  if (isProfissional) {
    const [penalties, perfil, agenda, portfolio] = await Promise.all([
      serverApi<PenaltySummary>("GET", "/penalties/me/summary").catch(() => null),
      serverApi<ProfessionalProfile>("GET", "/profiles/professional/me").catch(() => null),
      serverApi<AvailabilitySlot[]>("GET", "/availability/me").catch(() => [] as AvailabilitySlot[]),
      // 403 no plano sem portfólio → não vira passo pendente
      serverApi<PortfolioPhoto[]>("GET", "/profiles/professional/me/portfolio").catch(() => null),
    ]);
    penaltyStats = penalties;
    checklist = buildChecklist(perfil, agenda, portfolio);
  }

  return (
    <section aria-labelledby="inicio-heading" className="space-y-6 sm:space-y-8">
      {/* ── Hero com gradiente (compacto no celular) ── */}
      <div className="animate-fade-in rounded-2xl bg-gradient-hero px-4 py-4 text-background sm:px-7 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar nome={hint?.nome ?? "U"} src={me?.fotoUrl ?? undefined} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-orange-300/80 sm:text-xs">
              {isProfissional ? "Profissional" : "Contratante"}
            </p>
            <h1 id="inicio-heading" className="mt-0.5 truncate font-display text-xl font-black text-background sm:text-4xl">
              {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo"}
            </h1>
            <p className="mt-1 hidden text-sm text-background/60 sm:block">
              {isProfissional
                ? "Gerencie sua agenda, pedidos e obras por aqui."
                : "Encontre profissionais e acompanhe seus pedidos."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Primeiros passos do contratante (1º acesso, sem pedidos ainda) ── */}
      {!isProfissional && pedidos.length === 0 && (
        <Card className="animate-fade-in border-primary/25 bg-primary/[0.04] p-4 sm:p-6">
          <h2 className="font-display text-lg font-black text-foreground">
            Bem-vindo(a)! Comece por aqui
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dois caminhos para o seu primeiro serviço:
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href="/buscar">
              <Card interactive className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <SearchIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-foreground">Buscar profissional</span>
                  <span className="block text-sm text-muted-foreground">Escolha e agende direto</span>
                </span>
              </Card>
            </Link>
            <Link href="/obras/nova">
              <Card interactive className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <PlusIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-foreground">Publicar uma obra</span>
                  <span className="block text-sm text-muted-foreground">Receba lances de vários</span>
                </span>
              </Card>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Checklist de ativação (profissional com passos pendentes) ── */}
      {checklist.length > 0 && (
        <Card className="animate-fade-in border-primary/25 bg-primary/[0.04] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-black text-foreground">
              Comece bem: ative seu perfil
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              {checklist.filter((c) => c.done).length}/{checklist.length} concluídos
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Perfis completos aparecem melhor na busca e recebem mais pedidos.
          </p>
          <ul className="mt-3 space-y-2">
            {checklist.map((item) => (
              <li key={item.titulo}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40"
                >
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      item.done ? "bg-success text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.done ? "✓" : "•"}
                  </span>
                  <span
                    className={`flex-1 text-sm font-semibold ${
                      item.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {item.titulo}
                  </span>
                  {!item.done && <span aria-hidden className="text-muted-foreground">→</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Stats KPIs — 2 colunas compactas no celular ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          className="h-full animate-fade-in delay-1 p-3 sm:p-5"
          icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Pendentes"
          value={pendentes}
          tone={pendentes > 0 ? "warning" : "default"}
          detail={pendentes > 0 ? "Aguardando ação" : "Tudo em dia"}
        />
        <StatCard
          className="h-full animate-fade-in delay-2 p-3 sm:p-5"
          icon={<Hammer className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Em andamento"
          value={emAndamento}
          tone={emAndamento > 0 ? "primary" : "default"}
        />
        <StatCard
          className="h-full animate-fade-in delay-3 p-3 sm:p-5"
          icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Concluídos"
          value={concluidos}
          tone="success"
        />
        <StatCard
          className="h-full animate-fade-in delay-4 p-3 sm:p-5"
          icon={<Star className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Avaliação média"
          value={mediaNotas}
          detail={`${reviews.length} avaliação(ões)`}
        />
      </div>

      {/* ── Próximos compromissos ── */}
      {proximos.length > 0 && (
        <div className="animate-fade-in delay-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-black text-foreground">
              Próximos compromissos
            </h2>
            {totalProximos.length > maxCompromissos && (
              <Link href="/pedidos?filtro=andamento" className="text-sm font-bold text-primary hover:underline">
                Ver todos ({totalProximos.length})
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {proximos.map((p) => {
              const ui = BOOKING_STATUS_UI[p.status];
              return (
                <Link key={p.id} href={`/pedidos/${p.id}`} className="block">
                  <Card interactive className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary sm:h-12 sm:w-12">
                      <PedidosIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{p.especialidade}</p>
                      <p className="truncate text-sm text-muted-foreground">{formatRelativeBR(p.dataServico)}</p>
                    </div>
                    <Badge tone={ui.tone} className="shrink-0">{ui.label}</Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Painel de comportamento (profissional) ── */}
      {isProfissional && penaltyStats && (
        <div className="animate-fade-in delay-4">
          <Card className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="text-center shrink-0">
              <div className="font-display text-4xl font-black text-primary">
                {penaltyStats.taxaAceitacao != null
                  ? `${Math.round(penaltyStats.taxaAceitacao * 100)}%`
                  : "—"}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Taxa de aceitação</p>
            </div>
            <div className="h-px w-full sm:h-12 sm:w-px bg-border" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{penaltyStats.aprovados}</strong> aprovados
                </span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{penaltyStats.recusados}</strong> recusados
                </span>
                {penaltyStats.pontosPenalidade > 0 && (
                  <Badge tone="danger">
                    {penaltyStats.pontosPenalidade} pts de penalidade
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Recusas com justificativa não penalizam.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Ações rápidas ── */}
      <div>
        <h2 className="mb-3 font-display text-xl font-black text-foreground">
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {acoes.map(({ href, titulo, desc, Icon }, i) => (
            <Link key={href} href={href}>
              <Card
                interactive
                className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-6 animate-fade-in delay-${i + 1}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-foreground">{titulo}</span>
                  <span className="block truncate text-sm text-muted-foreground">{desc}</span>
                </span>
                <span aria-hidden className="text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                  →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
