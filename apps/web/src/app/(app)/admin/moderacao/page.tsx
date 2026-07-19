import { ApiEnvelopeError, type Report, type Suspension } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { PartyPopper } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { Resolver } from "../_components/Resolver";

interface DetailedReport extends Report {
  denunciante: { nome: string; email: string } | null;
  denunciado: { id: string; nome: string; email: string; tipo: string; totalPenalidades: number } | null;
  reviewTarget: { autorNome: string; nota: number; comentario: string | null; criadoEm: string } | null;
}

interface DetailedSuspension extends Suspension {
  usuario: { nome: string; email: string; tipo: string } | null;
}

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
  let reports: DetailedReport[];
  let appeals: DetailedSuspension[];
  try {
    [reports, appeals] = await Promise.all([
      serverApi<DetailedReport[]>("GET", "/reports/open"),
      serverApi<DetailedSuspension[]>("GET", "/suspensions/appealed"),
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
      <BackLink href="/admin" label="Painel" />
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
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <PartyPopper aria-hidden className="h-4 w-4 text-success" /> Nenhuma denúncia pendente.
            </p>
          ) : (
            <ul className="space-y-4">
              {reports.map((r) => (
                <li key={r.id} className="space-y-3 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-foreground text-sm">{r.motivo}</span>
                    <Badge tone="neutral" size="sm">{r.entidade}</Badge>
                  </div>

                  <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex flex-wrap justify-between gap-1">
                      <span className="text-muted-foreground">Quem denunciou:</span>
                      <span className="font-semibold text-foreground">
                        {r.denunciante ? `${r.denunciante.nome} (${r.denunciante.email})` : "Anônimo / Visitante"}
                      </span>
                    </div>

                    {r.denunciado && (
                      <div className="flex flex-wrap justify-between gap-1">
                        <span className="text-muted-foreground">Denunciado:</span>
                        <span className="font-semibold text-foreground">
                          {r.denunciado.nome} ({r.denunciado.tipo === "PROFISSIONAL" ? "Profissional" : "Contratante"}) · Penalidades: {r.denunciado.totalPenalidades}
                        </span>
                      </div>
                    )}

                    {r.reviewTarget && (
                      <div className="mt-2 rounded bg-muted/60 p-2 border border-border/40">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>Avaliação de {r.reviewTarget.autorNome}</span>
                          <span className="text-primary">{"★".repeat(Math.round(r.reviewTarget.nota))}</span>
                        </div>
                        {r.reviewTarget.comentario && (
                          <p className="mt-1 italic text-muted-foreground">“{r.reviewTarget.comentario}”</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground/80">Em: {formatDateTimeBR(r.reviewTarget.criadoEm)}</p>
                      </div>
                    )}
                  </div>

                  {r.detalhe && (
                    <p className="text-xs text-foreground bg-orange-500/5 border border-orange-500/10 p-2.5 rounded-lg">
                      <strong>Argumentação:</strong> {r.detalhe}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Enviado: {formatDateTimeBR(r.criadoEm)}</span>
                    <Resolver
                      action="/api/moderation/report-resolve"
                      payloadBase={{ reportId: r.id }}
                      options={[
                        { label: "Procedente", body: { procedente: true } },
                        { label: "Improcedente", body: { procedente: false }, variant: "secondary" },
                      ]}
                    />
                  </div>
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
            <ul className="space-y-4">
              {appeals.map((s) => (
                <li key={s.id} className="space-y-3 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground text-sm">{s.motivo}</span>
                    <Badge tone="danger" size="sm">Suspensão</Badge>
                  </div>

                  <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-xs">
                    <div className="flex flex-wrap justify-between gap-1">
                      <span className="text-muted-foreground">Usuário:</span>
                      <span className="font-semibold text-foreground">
                        {s.usuario ? `${s.usuario.nome} (${s.usuario.email})` : "Desconhecido"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-1">
                      <span className="text-muted-foreground">Tipo de conta:</span>
                      <span className="font-semibold text-foreground">
                        {s.usuario?.tipo === "PROFISSIONAL" ? "Profissional" : "Contratante"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-1">
                      <span className="text-muted-foreground">Fim da suspensão:</span>
                      <span className="font-semibold text-foreground">
                        {s.fimEm ? formatDateTimeBR(s.fimEm) : "Permanente"}
                      </span>
                    </div>
                  </div>

                  {s.apelacaoTexto && (
                    <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                      <strong>Mensagem do usuário:</strong> “{s.apelacaoTexto}”
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Suspenso em: {formatDateTimeBR(s.inicioEm)}</span>
                    <Resolver
                      action="/api/moderation/appeal-resolve"
                      payloadBase={{ suspensionId: s.id }}
                      options={[
                        { label: "Revogar suspensão", body: { revogar: true } },
                        { label: "Manter", body: { revogar: false }, variant: "secondary" },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
