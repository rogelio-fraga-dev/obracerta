import Link from "next/link";
import {
  ApiEnvelopeError,
  formatCentavos,
  type ProfessionalAnalytics,
} from "@obracerta/shared";
import { Badge, Button, Card, StatCard } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";

/**
 * Desempenho do profissional (homologação 18/07): KPIs do plano Profissional+
 * (`profile.analytics`) e bloco avançado exclusivo do Especialista
 * (`profile.analytics.advanced`). A trava real é a API (403 → cadeado aqui).
 */
export default async function DesempenhoPage() {
  const hint = await getProfileHint();
  if (hint?.tipo !== "PROFISSIONAL") {
    return (
      <section className="space-y-4">
        <BackLink href="/inicio" label="Início" />
        <Card>
          <p className="text-sm text-muted-foreground">
            O painel de desempenho é exclusivo de contas profissionais.
          </p>
        </Card>
      </section>
    );
  }

  let analytics: ProfessionalAnalytics | null = null;
  let bloqueado = false;
  try {
    analytics = await serverApi<ProfessionalAnalytics>(
      "GET",
      "/profiles/professional/me/analytics",
    );
  } catch (e) {
    if (e instanceof ApiEnvelopeError && e.status === 403) bloqueado = true;
    else throw e;
  }

  return (
    <section aria-labelledby="desempenho-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="desempenho-heading" className="font-display text-3xl font-black text-foreground">
          Desempenho
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Como seu perfil está performando na plataforma.
        </p>
      </div>

      {bloqueado || !analytics ? (
        <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
          <span aria-hidden className="text-3xl">🔒</span>
          <h2 className="font-display text-lg font-black text-foreground">
            Analytics é dos planos Profissional e Especialista
          </h2>
          <p className="text-sm text-muted-foreground">
            Veja pedidos, taxa de aceitação, avaliações e (no Especialista) a conversão dos seus
            lances. Faça upgrade para desbloquear.
          </p>
          <Button asChild className="mx-auto w-fit">
            <Link href="/cobrancas">Fazer upgrade</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* KPIs base (Profissional+) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon="📬" label="Pedidos recebidos" value={analytics.pedidos.total} detail={`${analytics.pedidos.ultimos30d} nos últimos 30 dias`} />
            <StatCard
              icon="🤝"
              label="Taxa de aceitação"
              value={analytics.taxaAceitacao === null ? "—" : `${analytics.taxaAceitacao}%`}
              tone={analytics.taxaAceitacao !== null && analytics.taxaAceitacao >= 70 ? "success" : "default"}
              detail={`${analytics.pedidos.aprovados} aceitos · ${analytics.pedidos.recusados} recusados · ${analytics.pedidos.expirados} expirados`}
            />
            <StatCard icon="🏁" label="Serviços concluídos" value={analytics.pedidos.concluidos} />
            <StatCard
              icon="⭐"
              label="Avaliação média"
              value={analytics.avaliacoes.media === null ? "—" : analytics.avaliacoes.media.toFixed(1)}
              detail={`${analytics.avaliacoes.total} avaliações reveladas`}
              tone="primary"
            />
          </div>

          {/* Bloco avançado (Especialista) */}
          {analytics.avancado ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-black text-foreground">
                  Analytics avançados
                </h2>
                <Badge tone="warning">Especialista</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard
                  icon="📤"
                  label="Lances enviados"
                  value={analytics.avancado.lances.enviados}
                />
                <StatCard
                  icon="🏆"
                  label="Lances aceitos"
                  value={analytics.avancado.lances.aceitos}
                  detail={
                    analytics.avancado.lances.taxaConversao === null
                      ? undefined
                      : `${analytics.avancado.lances.taxaConversao}% de conversão`
                  }
                  tone="success"
                />
                <StatCard
                  icon="💰"
                  label="Ganho via plataforma"
                  value={formatCentavos(analytics.avancado.ganhoEstimadoCentavos)}
                  detail="Soma dos lances aceitos"
                  tone="primary"
                />
              </div>
              {analytics.avancado.pedidosPorMes.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pedidos por mês (últimos 6)
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {analytics.avancado.pedidosPorMes.map((m) => {
                      const max = Math.max(
                        ...analytics.avancado!.pedidosPorMes.map((x) => x.total),
                        1,
                      );
                      return (
                        <li key={m.mes} className="flex items-center gap-3 text-sm">
                          <span className="w-16 shrink-0 font-semibold text-muted-foreground">
                            {m.mes}
                          </span>
                          <span
                            className="h-2.5 rounded-full bg-primary"
                            style={{ width: `${Math.max((m.total / max) * 100, 4)}%` }}
                            aria-hidden
                          />
                          <span className="font-bold text-foreground">{m.total}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          ) : (
            <Card className="space-y-2 border-primary/30 bg-primary/[0.04]">
              <p className="text-sm text-foreground">
                <span aria-hidden>🔒</span> <strong>Analytics avançados</strong> (conversão de
                lances, ganho via plataforma e tendência mensal) são exclusivos do plano{" "}
                <strong>Especialista</strong>.{" "}
                <Link href="/cobrancas" className="font-semibold text-primary hover:underline">
                  Fazer upgrade →
                </Link>
              </p>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
