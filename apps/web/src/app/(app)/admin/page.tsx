import Link from "next/link";
import { ApiEnvelopeError, formatCentavos, type HealthSnapshot } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { MoneyIcon, ShieldIcon } from "../_shell/icons";
import { AdminCharts } from "./_components/AdminCharts";

function pct(taxa: number): string {
  return `${Math.round(taxa * 100)}%`;
}

/**
 * Painel administrativo (Fase 6, Melhoria #4) — home do ADMIN, com visão de saúde
 * do produto. **Auto-protegido**: `/admin/metrics` exige ADMIN no backend; um
 * não-admin recebe 403 e vê "acesso restrito". Layout PC-first (grades amplas).
 */
export default async function AdminPage() {
  const hint = await getProfileHint();
  let snapshot: HealthSnapshot;
  try {
    snapshot = await serverApi<HealthSnapshot>("GET", "/admin/metrics");
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Administração</h1>
          <Card>
            <p className="text-muted-foreground">
              Acesso restrito. Esta área é exclusiva de administradores.
            </p>
          </Card>
        </section>
      );
    }
    throw e;
  }

  return (
    <section aria-labelledby="admin-heading" className="space-y-6">
      {/* Cabeçalho — identidade clara de "painel admin", não de contratante. */}
      <header className="flex flex-col gap-4 rounded-2xl bg-foreground px-6 py-7 text-background sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-background/80">
            <ShieldIcon className="h-4 w-4" /> Administração
          </span>
          <h1 id="admin-heading" className="mt-2 font-display text-4xl lg:text-5xl font-black text-background">
            Saúde do produto
          </h1>
          <p className="mt-1 text-sm text-background/70">
            {hint?.nome ? `${hint.nome} · ` : ""}controle total do sistema.
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-background/10 px-6 py-5 text-center">
          <div className="font-display text-5xl lg:text-6xl font-black text-background">
            {snapshot.reputacao.obrasAvaliadasBilateralmente}
          </div>
          <div className="mt-2 text-sm text-background/70">Métrica Principal · obras avaliadas 2 lados</div>
        </div>
      </header>

      {/* KPIs — grade responsiva que preenche o desktop sem ficar fora do eixo. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Metric label="Usuários" value={snapshot.usuarios.total} />
        <Metric label="Profissionais" value={snapshot.usuarios.profissionais} />
        <Metric label="Contratantes" value={snapshot.usuarios.contratantes} />
        <Metric
          label="Suspensos"
          value={snapshot.usuarios.suspensos}
          alerta={snapshot.usuarios.suspensos > 0}
        />
        <Metric label="Ativados (≥50%)" value={snapshot.ativacao.profissionaisAtivados} />
        <Metric label="Agendamentos" value={snapshot.agendamentos.total} />
        <Metric label="Taxa conclusão" value={pct(snapshot.agendamentos.taxaConclusao)} />
        <Metric label="Obras abertas" value={snapshot.obras.abertas} />
      </div>

      {/* Blocos lado a lado no desktop. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl lg:text-2xl font-black text-foreground">Monetização</span>
            <Badge tone="success">Assinaturas</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Receita Recorrente" value={formatCentavos(snapshot.monetizacao.mrrCentavos)} />
            <Stat label="Assinaturas" value={snapshot.monetizacao.assinaturasAtivas} />
            <Stat label="Cancelamentos" value={pct(snapshot.monetizacao.churnPct)} />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl lg:text-2xl font-black text-foreground">Moderação</span>
            {snapshot.moderacao.denunciasAbertas > 0 && <Badge tone="warning">Pendências</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Denúncias abertas" value={snapshot.moderacao.denunciasAbertas} />
            <Stat label="Suspensões ativas" value={snapshot.moderacao.suspensoesAtivas} />
          </div>
        </Card>
      </div>

      {/* Atalhos para as filas operacionais. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ShortcutCard
          href="/admin/moderacao"
          title="Fila de moderação"
          desc="Denúncias e apelações de suspensão"
          Icon={ShieldIcon}
        />
        <ShortcutCard
          href="/admin/financeiro"
          title="Fila do financeiro"
          desc="Reembolsos pendentes para aprovar"
          Icon={MoneyIcon}
        />
      </div>

      {/* Gráficos / Análise */}
      <AdminCharts snapshot={snapshot} />
    </section>
  );
}

function Metric({
  label,
  value,
  alerta = false,
}: {
  label: string;
  value: number | string;
  alerta?: boolean;
}) {
  return (
    <Card className="py-5 px-4 lg:py-6 lg:px-5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-4xl lg:text-5xl font-black ${alerta ? "text-danger" : "text-foreground"}`}>
        {value}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3.5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl lg:text-2xl font-black text-foreground">{value}</div>
    </div>
  );
}

function ShortcutCard({
  href,
  title,
  desc,
  Icon,
}: {
  href: string;
  title: string;
  desc: string;
  Icon: typeof ShieldIcon;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="flex items-center gap-5 p-6 transition-colors group-hover:border-primary">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg lg:text-xl font-black text-foreground">{title}</span>
          <span className="block text-base text-muted-foreground mt-0.5">{desc}</span>
        </span>
        <span
          aria-hidden
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        >
          →
        </span>
      </Card>
    </Link>
  );
}
