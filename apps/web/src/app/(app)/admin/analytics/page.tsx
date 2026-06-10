import Link from "next/link";
import { ApiEnvelopeError, formatCentavos, type AnalyticsSnapshot } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { AnalyticsIcon, ChevronLeftIcon } from "../../_shell/icons";
import { AnalyticsCharts } from "./_components/AnalyticsCharts";

function pct(taxa: number): string {
  return `${Math.round(taxa * 100)}%`;
}

/**
 * Analytics estratégico do ADMIN (roadmap §10) — funil de conversão, liquidez do
 * marketplace, receita (ARPA/LTV estimado) e coorte. **Auto-protegido**:
 * `/admin/analytics` exige ADMIN no backend; um não-admin recebe 403.
 */
export default async function AdminAnalyticsPage() {
  let snapshot: AnalyticsSnapshot;
  try {
    snapshot = await serverApi<AnalyticsSnapshot>("GET", "/admin/analytics");
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Analytics</h1>
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

  const { funil, liquidez, receita } = snapshot;

  return (
    <section aria-labelledby="analytics-heading" className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-foreground px-6 py-7 text-background sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm font-semibold text-background/70 hover:text-background"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Voltar ao painel
          </Link>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-background/80">
            <AnalyticsIcon className="h-4 w-4" /> Analytics estratégico
          </span>
          <h1
            id="analytics-heading"
            className="mt-2 font-display text-4xl lg:text-5xl font-black text-background"
          >
            Crescimento &amp; liquidez
          </h1>
        </div>
        <div className="shrink-0 rounded-xl bg-background/10 px-6 py-5 text-center">
          <div className="font-display text-5xl lg:text-6xl font-black text-background">
            {pct(liquidez.taxaLiquidez)}
          </div>
          <div className="mt-2 text-sm text-background/70">Liquidez · obras com ≥1 lance</div>
        </div>
      </header>

      {/* Funil — etapas com taxa de passagem entre elas. */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl lg:text-2xl font-black text-foreground">
            Funil do profissional
          </span>
          <Badge tone="neutral">Conversão</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <FunnelStep label="Cadastros" value={funil.cadastros} />
          <FunnelStep label="Com perfil" value={funil.profissionaisComPerfil} taxa={pct(funil.taxaPerfil)} />
          <FunnelStep label="Ativados (≥50%)" value={funil.profissionaisAtivados} taxa={pct(funil.taxaAtivacao)} />
          <FunnelStep label="Com lance" value={funil.profissionaisComLance} taxa={pct(funil.taxaEngajamento)} />
          <FunnelStep label="Obras fechadas" value={funil.obrasAdjudicadas} destaque />
        </div>
      </Card>

      {/* Liquidez + Receita lado a lado no desktop. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <span className="font-display text-xl lg:text-2xl font-black text-foreground">
            Liquidez do marketplace
          </span>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Obras publicadas" value={liquidez.obrasTotal} />
            <Stat label="Obras com lance" value={liquidez.obrasComLance} />
            <Stat label="Taxa de liquidez" value={pct(liquidez.taxaLiquidez)} />
            <Stat label="Lances por obra" value={liquidez.lancesPorObra} />
            <Stat label="Taxa de adjudicação" value={pct(liquidez.taxaAdjudicacao)} />
            <Stat label="Contratantes c/ obra" value={funil.contratantesComObra} />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl lg:text-2xl font-black text-foreground">Receita</span>
            <Badge tone="success">Assinaturas</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Assinantes ativos" value={receita.assinantesAtivos} />
            <Stat label="ARPA (receita/assinante)" value={formatCentavos(receita.arpaCentavos)} />
            <Stat label="LTV estimado" value={formatCentavos(receita.ltvEstimadoCentavos)} />
            <Stat label="Churn" value={pct(receita.churnPct)} />
          </div>
          <p className="text-xs text-muted-foreground">
            LTV é uma <strong>estimativa</strong> (ARPA projetado pela vida útil ≈ 1/churn,
            limitada a 24 meses), não receita realizada.
          </p>
        </Card>
      </div>

      <AnalyticsCharts snapshot={snapshot} />
    </section>
  );
}

function FunnelStep({
  label,
  value,
  taxa,
  destaque = false,
}: {
  label: string;
  value: number;
  taxa?: string;
  destaque?: boolean;
}) {
  return (
    <Card className={`py-5 px-4 ${destaque ? "border-primary" : ""}`}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-3xl lg:text-4xl font-black ${destaque ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      {taxa && <div className="mt-1 text-xs font-semibold text-muted-foreground">↳ {taxa} da etapa anterior</div>}
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
