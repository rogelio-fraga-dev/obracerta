import type { ReceivedReview } from "@obracerta/shared";
import { Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { RespostaForm } from "../perfil/_components/RespostaForm";
import { ReportDialog } from "../perfil/_components/ReportDialog";

export default async function AvaliacoesPage() {
  const reviews = await serverApi<ReceivedReview[]>("GET", "/reviews/received");

  // Estatísticas gerais
  const totalReviews = reviews.length;
  const mediaNotas = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.nota, 0) / totalReviews).toFixed(1)
    : "—";

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const nota = Math.min(Math.max(Math.round(r.nota), 1), 5) as 1 | 2 | 3 | 4 | 5;
    distribution[nota]++;
  });

  return (
    <section aria-labelledby="eval-heading" className="space-y-6">
      <div>
        <h1 id="eval-heading" className="font-display text-3xl font-black text-foreground">
          Avaliações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu histórico de feedbacks e responda aos seus clientes.
        </p>
      </div>

      {/* ── Painel de Estatísticas / Rating Breakdown ── */}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Média Geral
          </span>
          <span className="mt-2 font-display text-6xl font-black text-foreground">
            {mediaNotas}
          </span>
          {totalReviews > 0 && (
            <div className="mt-3 flex flex-col items-center">
              <span aria-label={`${mediaNotas} de 5`} className="text-xl text-warning tracking-widest">
                {"★".repeat(Math.round(Number(mediaNotas)))}
                <span className="text-border">{"★".repeat(5 - Math.round(Number(mediaNotas)))}</span>
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Baseado em {totalReviews} avaliação(ões)
              </span>
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-center p-6 space-y-2">
          <span className="text-sm font-bold text-foreground">Distribuição de notas</span>
          <div className="space-y-2 mt-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = distribution[star];
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-muted-foreground text-right">{star} estrela(s)</span>
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-warning transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 font-semibold text-foreground text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Lista de Avaliações ── */}
      <div className="space-y-3">
        <h2 className="font-display text-xl font-black text-foreground">
          Feedbacks recebidos
        </h2>

        {reviews.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="Ainda sem avaliações"
            description="As avaliações recebidas de seus serviços concluídos aparecerão aqui."
          />
        ) : (
          <ul className="space-y-4">
            {reviews.map((r, i) => (
              <li key={r.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)}`}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span aria-label={`${r.nota} de 5`} className="text-xl text-warning tracking-widest">
                        {"★".repeat(r.nota)}
                        <span className="text-border">{"★".repeat(5 - r.nota)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                      <span className="text-xs font-bold text-muted-foreground">
                        Avaliação Recebida
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTimeBR(r.criadoEm)}
                    </span>
                  </div>

                  {r.comentario && (
                    <p className="text-base text-foreground leading-relaxed">
                      “{r.comentario}”
                    </p>
                  )}

                  {r.resposta && (
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Sua resposta
                      </p>
                      <p className="mt-1.5 text-sm text-foreground leading-relaxed">
                        {r.resposta}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-border pt-4 mt-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {r.resposta ? (
                        <span className="text-xs text-muted-foreground">Você respondeu a este feedback.</span>
                      ) : (
                        <RespostaForm reviewId={r.id} />
                      )}
                    </div>
                    <div className="shrink-0 self-end sm:self-start">
                      <ReportDialog entidade="REVIEW" entidadeId={r.id} />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
