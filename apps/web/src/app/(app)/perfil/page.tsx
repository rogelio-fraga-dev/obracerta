import Link from "next/link";
import type { JwtClaims, Penalty, PenaltySummary, Review, Suspension } from "@obracerta/shared";
import { Badge, Card, Avatar, ProgressRing, StatCard, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint, getMyRoles } from "@/lib/session";
import { penaltyReasonLabel } from "@/lib/penalty-ui";
import { SUSPENSION_STATUS_UI } from "@/lib/moderation-ui";
import { formatDateTimeBR } from "@/lib/format";
import { RespostaForm } from "./_components/RespostaForm";
import { ReportDialog } from "./_components/ReportDialog";
import { AppealForm } from "./_components/AppealForm";
import { ShieldIcon } from "../_shell/icons";
import { AdminForms } from "./_components/AdminForms";
import type { User } from "@obracerta/shared";

/**
 * Aba Perfil. Mostra a sessão e, para profissionais, o painel de comportamento
 * com taxa de aceitação (progress ring), pontos de penalidade e histórico.
 */
export default async function PerfilPage() {
  const hint = await getProfileHint();
  const roles = await getMyRoles();
  const isAdmin = roles.includes("ADMIN");
  const isProfissional = hint?.tipo === "PROFISSIONAL";

  const claims = await serverApi<JwtClaims>("POST", "/auth/me");
  const user = await serverApi<User>("GET", "/auth/me/profile");

  return (
    <section aria-labelledby="perfil-heading" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 id="perfil-heading" className="font-display text-3xl font-black text-foreground">
          Perfil
        </h1>
        <Badge tone="success" className="animate-fade-in">Sessão ativa</Badge>
      </div>

      {/* ── Header do Perfil ── */}
      <Card className="animate-fade-in flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar nome={user.nomeCompleto ?? "Usuário"} src={user.fotoUrl ?? undefined} size="xl" />
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="font-display text-2xl font-black text-foreground">
              {user.nomeCompleto ?? "Usuário"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Administração do Sistema" : isProfissional ? "Profissional" : "Contratante"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="neutral">WhatsApp: {claims.whatsapp}</Badge>
            {isProfissional && <Badge tone="primary">Conta verificada</Badge>}
          </div>
        </div>
        {!isAdmin && (
          <Link href="/cobrancas" className="sm:self-stretch">
            <Card interactive className="flex h-full flex-col items-center justify-center bg-muted/40 p-4">
              <span className="font-semibold text-foreground">Cobranças e reembolsos</span>
              <span aria-hidden className="mt-1 text-primary">→</span>
            </Card>
          </Link>
        )}
      </Card>

      <SuspensionPanel />

      {isAdmin && <AdminForms user={user} />}

      {!isAdmin && isProfissional && <ComportamentoPanel />}

      {!isAdmin && <AvaliacoesRecebidas />}
    </section>
  );
}

async function SuspensionPanel() {
  const suspensoes = await serverApi<Suspension[]>("GET", "/suspensions/me");
  if (suspensoes.length === 0) return null;

  return (
    <div className="animate-fade-in delay-1 space-y-3">
      <h2 className="font-display text-xl font-black text-foreground">Avisos da conta</h2>
      <ul className="space-y-3">
        {suspensoes.map((s) => {
          const ui = SUSPENSION_STATUS_UI[s.status];
          return (
            <Card key={s.id} className="border-danger/30 bg-danger/5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-danger">{s.motivo}</span>
                <Badge tone={ui.tone}>{ui.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Desde {formatDateTimeBR(s.inicioEm)}
                {s.apelacaoTexto ? ` · Apelação enviada` : ""}
              </p>
              {s.status === "ATIVA" && <div className="mt-4"><AppealForm suspensionId={s.id} /></div>}
            </Card>
          );
        })}
      </ul>
    </div>
  );
}

async function AvaliacoesRecebidas() {
  const reviews = await serverApi<Review[]>("GET", "/reviews/received");

  return (
    <div className="animate-fade-in delay-3 space-y-3">
      <h2 className="font-display text-xl font-black text-foreground">Avaliações recebidas</h2>
      {reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="Nenhuma avaliação"
          description="As avaliações aparecem aqui quando o serviço é concluído e ambas as partes avaliam."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-3">
                <span aria-label={`${r.nota} de 5`} className="text-xl text-warning tracking-widest">
                  {"★".repeat(r.nota)}
                  <span className="text-border">{"★".repeat(5 - r.nota)}</span>
                </span>
                <span className="text-sm text-muted-foreground">{formatDateTimeBR(r.criadoEm)}</span>
              </div>
              {r.comentario && <p className="mt-3 text-base text-foreground leading-relaxed">{r.comentario}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <RespostaForm reviewId={r.id} />
                <ReportDialog entidade="REVIEW" entidadeId={r.id} />
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

async function ComportamentoPanel() {
  const [resumo, penalidades] = await Promise.all([
    serverApi<PenaltySummary>("GET", "/penalties/me/summary"),
    serverApi<Penalty[]>("GET", "/penalties/me"),
  ]);

  const aceitacaoTone =
    resumo.taxaAceitacao === null ? "primary" : resumo.taxaAceitacao >= 0.8 ? "success" : resumo.taxaAceitacao >= 0.5 ? "warning" : "danger";

  return (
    <div className="animate-fade-in delay-2 space-y-6">
      <div>
        <h2 className="mb-3 font-display text-xl font-black text-foreground">Comportamento</h2>
        <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center border-border sm:border-r sm:pr-8">
            <ProgressRing
              value={resumo.taxaAceitacao ? resumo.taxaAceitacao * 100 : 0}
              tone={aceitacaoTone}
              label={resumo.taxaAceitacao != null ? `${Math.round(resumo.taxaAceitacao * 100)}%` : "—"}
            />
            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Taxa de aceitação
            </span>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4">
            <StatCard label="Aprovados" value={resumo.aprovados} detail={`de ${resumo.totalPedidos} pedidos`} />
            <StatCard
              label="Penalidades"
              value={resumo.pontosPenalidade}
              tone={resumo.pontosPenalidade > 0 ? "danger" : "success"}
              detail="Pontos na conta"
            />
          </div>
        </Card>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Recusas com justificativa legítima não penalizam. Desistir sem motivo ou não responder reduz sua reputação.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-black text-foreground">Histórico de penalidades</h3>
        {penalidades.length === 0 ? (
          <EmptyState
            icon={<ShieldIcon className="h-8 w-8 text-success" />}
            title="Conta exemplar"
            description="Você não possui nenhuma penalidade. Continue prestando um ótimo serviço!"
            className="bg-success/5 border-success/20"
          />
        ) : (
          <ul className="space-y-3">
            {penalidades.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{penaltyReasonLabel(p.motivo)}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTimeBR(p.criadoEm)}</p>
                    {p.detalhe && <p className="mt-2 text-sm text-muted-foreground">{p.detalhe}</p>}
                  </div>
                  <Badge tone="danger" size="md">+{p.pontos} pts</Badge>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
