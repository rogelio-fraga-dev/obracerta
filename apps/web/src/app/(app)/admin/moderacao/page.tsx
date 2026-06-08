import { ApiEnvelopeError, type Report, type Suspension } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { Resolver } from "../_components/Resolver";

/** Acesso negado (não é moderador/admin). */
function Restrito() {
  return (
    <Card>
      <p className="text-muted-foreground">Área de moderação — acesso restrito a moderadores.</p>
    </Card>
  );
}

/**
 * Fila de moderação (MODERADOR/ADMIN): denúncias abertas e apelações de suspensão.
 * Auto-protegida pela API (403 → restrito).
 */
export default async function ModeracaoPage() {
  let reports: Report[];
  let appeals: Suspension[];
  try {
    [reports, appeals] = await Promise.all([
      serverApi<Report[]>("GET", "/reports/open"),
      serverApi<Suspension[]>("GET", "/suspensions/appealed"),
    ]);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Moderação</h1>
          <Restrito />
        </section>
      );
    }
    throw e;
  }

  return (
    <section aria-labelledby="mod-heading" className="space-y-6">
      <header>
        <h1 id="mod-heading" className="font-display text-3xl font-black text-foreground">
          Moderação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Denúncias e apelações de suspensão aguardando decisão.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">
          Denúncias abertas ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma denúncia pendente. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{r.motivo}</span>
                  <Badge tone="neutral">{r.entidade}</Badge>
                </div>
                {r.detalhe && <p className="text-sm text-muted-foreground">{r.detalhe}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(r.criadoEm)}</p>
                <Resolver
                  action="/api/moderation/report-resolve"
                  payloadBase={{ reportId: r.id }}
                  options={[
                    { label: "Procedente", body: { procedente: true } },
                    { label: "Improcedente", body: { procedente: false }, variant: "secondary" },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">
          Apelações ({appeals.length})
        </h2>
        {appeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma apelação pendente.</p>
        ) : (
          <ul className="space-y-3">
            {appeals.map((s) => (
              <li key={s.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="font-semibold text-foreground">{s.motivo}</span>
                {s.apelacaoTexto && (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">“{s.apelacaoTexto}”</p>
                )}
                <Resolver
                  action="/api/moderation/appeal-resolve"
                  payloadBase={{ suspensionId: s.id }}
                  options={[
                    { label: "Revogar suspensão", body: { revogar: true } },
                    { label: "Manter", body: { revogar: false }, variant: "secondary" },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
        </Card>
      </div>
    </section>
  );
}
