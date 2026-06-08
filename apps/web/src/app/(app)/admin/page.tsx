import Link from "next/link";
import { ApiEnvelopeError, formatCentavos, type HealthSnapshot } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { RolesForm } from "./_components/RolesForm";

function pct(taxa: number): string {
  return `${Math.round(taxa * 100)}%`;
}

/**
 * Painel administrativo (Fase 6, Melhoria #4). **Auto-protegido**: `/admin/metrics`
 * exige ADMIN no backend; um não-admin recebe 403 e vê "acesso restrito" — a trava
 * real é a API, não a UI.
 */
export default async function AdminPage() {
  let snapshot: HealthSnapshot;
  try {
    snapshot = await serverApi<HealthSnapshot>("GET", "/admin/metrics");
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Admin</h1>
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
    <section aria-labelledby="admin-heading" className="space-y-4">
      <h1 id="admin-heading" className="font-display text-2xl font-black text-foreground">
        Saúde do produto
      </h1>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">North Star</span>
          <Badge tone="success">Obras avaliadas pelos 2 lados</Badge>
        </div>
        <div className="font-display text-4xl font-black text-foreground">
          {snapshot.reputacao.obrasAvaliadasBilateralmente}
        </div>
        <p className="text-xs text-muted-foreground">
          {snapshot.reputacao.avaliacoesReveladas} avaliações reveladas no total.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Usuários" value={snapshot.usuarios.total} />
        <Metric label="Profissionais" value={snapshot.usuarios.profissionais} />
        <Metric label="Contratantes" value={snapshot.usuarios.contratantes} />
        <Metric label="Suspensos" value={snapshot.usuarios.suspensos} alerta={snapshot.usuarios.suspensos > 0} />
        <Metric label="Ativados (≥50%)" value={snapshot.ativacao.profissionaisAtivados} />
        <Metric label="Agendamentos" value={snapshot.agendamentos.total} />
        <Metric label="Taxa conclusão" value={pct(snapshot.agendamentos.taxaConclusao)} />
        <Metric label="Obras abertas" value={snapshot.obras.abertas} />
      </div>

      <Card className="space-y-2">
        <span className="text-sm font-semibold text-foreground">Monetização</span>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="MRR" value={formatCentavos(snapshot.monetizacao.mrrCentavos)} />
          <Stat label="Assinaturas" value={snapshot.monetizacao.assinaturasAtivas} />
          <Stat label="Churn" value={pct(snapshot.monetizacao.churnPct)} />
        </div>
      </Card>

      <Card className="space-y-2">
        <span className="text-sm font-semibold text-foreground">Moderação</span>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Denúncias abertas" value={snapshot.moderacao.denunciasAbertas} />
          <Stat label="Suspensões ativas" value={snapshot.moderacao.suspensoesAtivas} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/moderacao" className="block">
          <Card className="text-center transition-colors hover:border-primary">
            <span className="font-semibold text-foreground">Moderação →</span>
          </Card>
        </Link>
        <Link href="/admin/financeiro" className="block">
          <Card className="text-center transition-colors hover:border-primary">
            <span className="font-semibold text-foreground">Financeiro →</span>
          </Card>
        </Link>
      </div>

      <RolesForm />
    </section>
  );
}

function Metric({ label, value, alerta = false }: { label: string; value: number | string; alerta?: boolean }) {
  return (
    <Card className="py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-black ${alerta ? "text-danger" : "text-foreground"}`}>{value}</div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-black text-foreground">{value}</div>
    </div>
  );
}
