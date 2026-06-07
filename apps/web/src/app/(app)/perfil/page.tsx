import Link from "next/link";
import type { JwtClaims, Penalty, PenaltySummary, Review, Suspension } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { acceptanceTone, formatPercent, penaltyReasonLabel } from "@/lib/penalty-ui";
import { SUSPENSION_STATUS_UI } from "@/lib/moderation-ui";
import { formatDateTimeBR } from "@/lib/format";
import { RespostaForm } from "./_components/RespostaForm";
import { ReportDialog } from "./_components/ReportDialog";
import { AppealForm } from "./_components/AppealForm";

/**
 * Aba Perfil. Mostra a sessão (prova o loop BFF) e, para profissionais, o
 * **painel de comportamento** (Fase 2 §8): taxa de aceitação, pontos de
 * penalidade e histórico. Tudo read-only via `serverApi`.
 */
export default async function PerfilPage() {
  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";

  const claims = await serverApi<JwtClaims>("POST", "/auth/me");

  return (
    <section aria-labelledby="perfil-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 id="perfil-heading" className="font-display text-2xl font-black text-foreground">
          {hint?.nome ?? "Perfil"}
        </h1>
        <Badge tone="success">Sessão ativa</Badge>
      </div>

      <Card className="space-y-2 text-sm">
        <Row label="WhatsApp" value={claims.whatsapp} />
        <Row label="Tipo" value={hint?.tipo === "PROFISSIONAL" ? "Profissional" : "Contratante"} />
      </Card>

      <Link href="/cobrancas" className="block">
        <Card className="transition-colors hover:border-primary">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Cobranças e reembolsos</span>
            <span aria-hidden className="text-xl text-primary">
              →
            </span>
          </div>
        </Card>
      </Link>

      <SuspensionPanel />

      {isProfissional && <ComportamentoPanel />}

      <AvaliacoesRecebidas />
    </section>
  );
}

async function SuspensionPanel() {
  const suspensoes = await serverApi<Suspension[]>("GET", "/suspensions/me");
  if (suspensoes.length === 0) return null;

  return (
    <Card className="space-y-3 border-danger/40">
      <h2 className="font-display text-lg font-black text-foreground">Sua conta</h2>
      <ul className="space-y-3">
        {suspensoes.map((s) => {
          const ui = SUSPENSION_STATUS_UI[s.status];
          return (
            <li key={s.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">{s.motivo}</span>
                <Badge tone={ui.tone}>{ui.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Desde {formatDateTimeBR(s.inicioEm)}
                {s.apelacaoTexto ? ` · Apelação enviada` : ""}
              </p>
              {s.status === "ATIVA" && <AppealForm suspensionId={s.id} />}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

async function AvaliacoesRecebidas() {
  const reviews = await serverApi<Review[]>("GET", "/reviews/received");

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-black text-foreground">Avaliações recebidas</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliação revelada ainda. Elas aparecem quando ambas as partes avaliam.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span aria-label={`${r.nota} de 5`} className="text-primary">
                  {"★".repeat(r.nota)}
                  <span className="text-border">{"★".repeat(5 - r.nota)}</span>
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTimeBR(r.criadoEm)}</span>
              </div>
              {r.comentario && <p className="text-sm text-foreground">{r.comentario}</p>}
              <div className="flex items-center justify-between gap-3">
                <RespostaForm reviewId={r.id} />
                <ReportDialog entidade="REVIEW" entidadeId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

async function ComportamentoPanel() {
  const [resumo, penalidades] = await Promise.all([
    serverApi<PenaltySummary>("GET", "/penalties/me/summary"),
    serverApi<Penalty[]>("GET", "/penalties/me"),
  ]);

  return (
    <>
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-black text-foreground">Comportamento</h2>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Taxa de aceitação</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-4xl font-black text-foreground">
                {formatPercent(resumo.taxaAceitacao)}
              </span>
              <Badge tone={acceptanceTone(resumo.taxaAceitacao)}>
                {resumo.aprovados}/{resumo.totalPedidos} aprovados
              </Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Pedidos" value={resumo.totalPedidos} />
          <Stat label="Recusados" value={resumo.recusados} />
          <Stat label="Expirados" value={resumo.expirados} />
          <Stat label="Pontos" value={resumo.pontosPenalidade} alerta={resumo.pontosPenalidade > 0} />
        </div>
        <p className="text-xs text-muted-foreground">
          Recusas com justificativa legítima não penalizam. Desistir sem motivo ou não responder reduz
          sua reputação.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">Penalidades</h2>
        {penalidades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma penalidade. Continue assim! 👏</p>
        ) : (
          <ul className="space-y-2">
            {penalidades.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-foreground">{penaltyReasonLabel(p.motivo)}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTimeBR(p.criadoEm)}</div>
                  {p.detalhe && <div className="text-xs text-muted-foreground">{p.detalhe}</div>}
                </div>
                <Badge tone="danger">+{p.pontos} pts</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function Stat({ label, value, alerta = false }: { label: string; value: number; alerta?: boolean }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-black ${alerta ? "text-danger" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
