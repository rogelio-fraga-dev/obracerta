import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type { BookingRequest, PenaltySummary, Review } from "@obracerta/shared";
import { Badge, Card, StatCard, Avatar } from "@obracerta/ui";
import { getMyRoles, getProfileHint } from "@/lib/session";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR, firstName } from "@/lib/format";
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
  const [pedidos, reviews] = await Promise.all([
    serverApi<BookingRequest[]>("GET", endpoint).catch(() => [] as BookingRequest[]),
    serverApi<Review[]>("GET", "/reviews/received").catch(() => [] as Review[]),
  ]);

  // Calcular stats
  const pendentes = pedidos.filter((p) => p.status === "PENDENTE").length;
  const emAndamento = pedidos.filter((p) => ["ACEITO", "EM_ANDAMENTO"].includes(p.status)).length;
  const concluidos = pedidos.filter((p) => p.status === "CONCLUIDO").length;
  const mediaNotas = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length).toFixed(1)
    : "—";

  // Próximos compromissos (os 3 mais próximos não concluídos)
  const proximos = pedidos
    .filter((p) => !["CONCLUIDO", "CANCELADO", "EXPIRADO"].includes(p.status))
    .sort((a, b) => new Date(a.dataServico).getTime() - new Date(b.dataServico).getTime())
    .slice(0, 3);

  // Para profissionais: buscar penalidades
  let penaltyStats: PenaltySummary | null = null;
  if (isProfissional) {
    penaltyStats = await serverApi<PenaltySummary>("GET", "/penalties/me/summary").catch(() => null);
  }

  return (
    <section aria-labelledby="inicio-heading" className="space-y-8">
      {/* ── Hero com gradiente ── */}
      <div className="animate-fade-in rounded-2xl bg-gradient-hero px-5 py-6 text-background sm:px-7 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar nome={hint?.nome ?? "U"} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[2px] text-orange-300/80">
              {isProfissional ? "Profissional" : "Contratante"}
            </p>
            <h1 id="inicio-heading" className="mt-0.5 truncate font-display text-2xl font-black text-background sm:text-4xl">
              {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo"}
            </h1>
            <p className="mt-1 text-sm text-background/60">
              {isProfissional
                ? "Gerencie sua agenda, pedidos e obras por aqui."
                : "Encontre profissionais e acompanhe seus pedidos."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-fade-in delay-1">
          <StatCard
            icon="📋"
            label="Pendentes"
            value={pendentes}
            tone={pendentes > 0 ? "warning" : "default"}
            detail={pendentes > 0 ? "Aguardando ação" : "Tudo em dia"}
          />
        </div>
        <div className="animate-fade-in delay-2">
          <StatCard
            icon="🔨"
            label="Em andamento"
            value={emAndamento}
            tone={emAndamento > 0 ? "primary" : "default"}
          />
        </div>
        <div className="animate-fade-in delay-3">
          <StatCard
            icon="✅"
            label="Concluídos"
            value={concluidos}
            tone="success"
          />
        </div>
        <div className="animate-fade-in delay-4">
          <StatCard
            icon="⭐"
            label="Avaliação média"
            value={mediaNotas}
            detail={`${reviews.length} avaliação(ões)`}
          />
        </div>
      </div>

      {/* ── Próximos compromissos ── */}
      {proximos.length > 0 && (
        <div className="animate-fade-in delay-3">
          <h2 className="mb-3 font-display text-xl font-black text-foreground">
            Próximos compromissos
          </h2>
          <div className="space-y-3">
            {proximos.map((p) => {
              const ui = BOOKING_STATUS_UI[p.status];
              return (
                <Link key={p.id} href={`/pedidos/${p.id}`} className="block">
                  <Card interactive className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <PedidosIcon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{p.especialidade}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTimeBR(p.dataServico)}</p>
                    </div>
                    <Badge tone={ui.tone}>{ui.label}</Badge>
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
                className={`flex items-center gap-4 animate-fade-in delay-${i + 1}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="h-6 w-6" />
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
