import Link from "next/link";
import { ApiEnvelopeError, formatCentavos, type CompanyReport } from "@obracerta/shared";
import { Button, Card, StatCard } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";

/**
 * Relatórios da operação da empresa (homologação 18/07 — Empresa PRO): obras,
 * propostas, contratações e indicadores. A trava real é a API
 * (`company.reports`, 403 → cadeado de upgrade aqui).
 */
export default async function RelatoriosPage() {
  // A API decide quem vê (empresa OU membro da equipe agindo por ela) — a
  // página tenta primeiro e só então diferencia a mensagem do 403.
  const hint = await getProfileHint();
  let report: CompanyReport | null = null;
  let bloqueado = false;
  try {
    report = await serverApi<CompanyReport>("GET", "/work-orders/me/relatorio");
  } catch (e) {
    if (e instanceof ApiEnvelopeError && e.status === 403) bloqueado = true;
    else throw e;
  }

  if (bloqueado && hint?.tipo !== "EMPRESA") {
    return (
      <section className="space-y-4">
        <BackLink href="/inicio" label="Início" />
        <Card>
          <p className="text-sm text-muted-foreground">
            Os relatórios da operação são exclusivos de contas de empresa (e de membros da equipe
            de uma empresa com plano Empresa PRO).
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="relatorios-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="relatorios-heading" className="font-display text-3xl font-black text-foreground">
          Relatórios da operação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Obras, propostas e indicadores das contratações da sua empresa.
        </p>
      </div>

      {bloqueado || !report ? (
        <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
          <span aria-hidden className="text-3xl">🔒</span>
          <h2 className="font-display text-lg font-black text-foreground">
            Relatórios são exclusivos do Empresa PRO
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórico completo de contratações, indicadores de desempenho e visão da operação.
            Assine o Empresa PRO para desbloquear.
          </p>
          <Button asChild className="mx-auto w-fit">
            <Link href="/cobrancas">Assinar Empresa PRO</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Obras publicadas
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon="🏗️" label="Total de obras" value={report.obras.total} />
              <StatCard icon="📢" label="Abertas" value={report.obras.abertas} tone="primary" />
              <StatCard icon="🚧" label="Em andamento" value={report.obras.emAndamento} />
              <StatCard icon="✅" label="Concluídas" value={report.obras.concluidas} tone="success" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Contratações
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon="🤝" label="Contratações" value={report.contratacoes.total} />
              <StatCard
                icon="💰"
                label="Valor contratado"
                value={formatCentavos(report.contratacoes.valorTotalCentavos)}
                tone="primary"
              />
              <StatCard
                icon="📊"
                label="Ticket médio"
                value={formatCentavos(report.contratacoes.valorMedioCentavos)}
              />
              <StatCard
                icon="⏱️"
                label="Tempo até contratar"
                value={
                  report.contratacoes.tempoMedioAteContratarHoras === null
                    ? "—"
                    : `${report.contratacoes.tempoMedioAteContratarHoras}h`
                }
                detail="Média da abertura à adjudicação"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2">
              <h2 className="font-display text-lg font-black text-foreground">Propostas</h2>
              <p className="text-sm text-muted-foreground">
                Sua empresa recebeu{" "}
                <strong className="text-foreground">{report.propostas.recebidas}</strong> propostas
                — média de{" "}
                <strong className="text-foreground">{report.propostas.mediaPorObra}</strong> por
                obra publicada.
                {report.obras.encerradasSemContratacao > 0 && (
                  <> {report.obras.encerradasSemContratacao} obra(s) encerraram sem contratação.</>
                )}
              </p>
            </Card>
            <Card className="space-y-2">
              <h2 className="font-display text-lg font-black text-foreground">
                Top especialidades
              </h2>
              {report.topEspecialidades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Publique obras para ver as especialidades mais demandadas.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {report.topEspecialidades.map((t, i) => (
                    <li key={t.especialidade} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        <span className="mr-2 font-black text-primary">{i + 1}.</span>
                        {t.especialidade}
                      </span>
                      <span className="font-bold text-foreground">{t.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
