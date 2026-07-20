import Link from "next/link";
import { Suspense } from "react";
import { Lock } from "lucide-react";
import type {
  CompanyInvite,
  CompanyProfile,
  JwtClaims,
  MyVerification,
  Penalty,
  PenaltySummary,
  PortfolioPhoto,
  ReferralSummary,
  Suspension,
} from "@obracerta/shared";
import { Badge, Card, Avatar, ProgressRing, StatCard, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint, getMyRoles } from "@/lib/session";
import { penaltyReasonLabel } from "@/lib/penalty-ui";
import { SUSPENSION_STATUS_UI } from "@/lib/moderation-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../_shell/BackLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppealForm } from "./_components/AppealForm";
import { PortfolioManager } from "./_components/PortfolioManager";
import { ProfileQrCard } from "./_components/ProfileQrCard";
import { CompanyInvites } from "./_components/CompanyInvites";
import { ShieldIcon } from "../_shell/icons";
import { AdminForms } from "./_components/AdminForms";
import { ProfileEditCard } from "./_components/ProfileEditCard";
import { VerificationCard } from "./_components/VerificationCard";
import { ReferralCard } from "./_components/ReferralCard";
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
  const isEmpresa = hint?.tipo === "EMPRESA";
  const tipoLabel = isAdmin
    ? "Administração do Sistema"
    : isProfissional
      ? "Profissional"
      : isEmpresa
        ? "Empresa"
        : "Contratante";

  // Paralelo — nada aqui depende um do outro (evita waterfall de 2 round-trips).
  const [claims, user] = await Promise.all([
    serverApi<JwtClaims>("POST", "/auth/me"),
    serverApi<User>("GET", "/auth/me/profile"),
  ]);

  const personaTagline = isAdmin
    ? "Administração do sistema — moderação, financeiro e gestão de contas."
    : isProfissional
      ? "Sua reputação e seu comportamento definem sua visibilidade na busca."
      : isEmpresa
        ? "Conta empresarial — publique obras e contrate profissionais."
        : "Acompanhe seus pedidos e encontre profissionais de confiança.";

  return (
    <section aria-labelledby="perfil-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <h1 id="perfil-heading" className="font-display text-2xl font-black text-foreground sm:text-3xl">
        Perfil
      </h1>

      {/* Banner contextual por persona — comunica de imediato para qual conta o perfil é. */}
      <div className="rounded-2xl bg-gradient-hero px-4 py-4 text-white sm:px-6 sm:py-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[3px] text-white/70 sm:text-xs">{tipoLabel}</p>
        <p className="mt-1 font-display text-base font-black sm:text-xl">{personaTagline}</p>
      </div>

      {/* ── Header do Perfil ── */}
      <Card className="animate-fade-in flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex min-w-0 items-center gap-3 sm:contents">
          <Avatar nome={user.nomeCompleto ?? "Usuário"} src={user.fotoUrl ?? undefined} size="lg" className="sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-black text-foreground sm:text-2xl">
                {user.nomeCompleto ?? "Usuário"}
              </h2>
              <p className="text-sm text-muted-foreground">{tipoLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge tone="neutral">WhatsApp: {claims.whatsapp}</Badge>
              {isProfissional && <Badge tone="primary">Conta verificada</Badge>}
            </div>
          </div>
        </div>
        {!isAdmin && (
          <Link href="/cobrancas" className="w-full shrink-0 sm:w-auto sm:self-stretch">
            <Card interactive className="flex h-full w-full flex-col items-center justify-center bg-muted/40 p-3 sm:p-4">
              <span className="text-center text-sm font-semibold text-foreground sm:text-base">
                Cobranças e reembolsos
              </span>
              <span aria-hidden className="mt-1 text-primary">→</span>
            </Card>
          </Link>
        )}
      </Card>

      {/* Painéis async em Suspense próprio (streaming) — a página pinta na hora
          e cada bloco chega quando os SEUS dados chegam (mesmo padrão do /inicio). */}
      <Suspense fallback={null}>
        <SuspensionPanel />
      </Suspense>

      <ThemeToggle />

      {!isAdmin && <ProfileEditCard user={user} />}

      {isAdmin && <AdminForms user={user} />}

      {!isAdmin && isEmpresa && (
        <Suspense fallback={<PanelSkeleton />}>
          <EmpresaPanel />
        </Suspense>
      )}

      {!isAdmin && isProfissional && (
        <Suspense fallback={<PanelSkeleton />}>
          <VerificationPanel />
        </Suspense>
      )}

      {!isAdmin && (
        <Suspense fallback={<PanelSkeleton />}>
          <ReferralPanel />
        </Suspense>
      )}

      {!isAdmin && isProfissional && (
        <Suspense fallback={null}>
          <CompanyInvitesPanel />
        </Suspense>
      )}

      {!isAdmin && isProfissional && (
        <Suspense fallback={null}>
          <QrPanel />
        </Suspense>
      )}

      {!isAdmin && isProfissional && (
        <Suspense fallback={<PanelSkeleton />}>
          <PortfolioPanel />
        </Suspense>
      )}

      {!isAdmin && isProfissional && (
        <Suspense fallback={<PanelSkeleton />}>
          <ComportamentoPanel />
        </Suspense>
      )}
    </section>
  );
}

/** Placeholder de painel enquanto a seção carrega em streaming. */
function PanelSkeleton() {
  return <div className="animate-skeleton h-32 rounded-2xl bg-muted" />;
}

/** Verificação de identidade por foto (selfie) — só profissional. */
async function VerificationPanel() {
  const verificacao = await serverApi<MyVerification>(
    "GET",
    "/profiles/professional/me/verificacao",
  ).catch(() => null);
  if (!verificacao) return null;
  return <VerificationCard verificacao={verificacao} />;
}

/** Programa de indicação — disponível para qualquer conta (não-admin). */
async function ReferralPanel() {
  const resumo = await serverApi<ReferralSummary>("GET", "/promotions/me/indicacao").catch(
    () => null,
  );
  if (!resumo) return null;
  return <ReferralCard resumo={resumo} />;
}

/** Convites de empresa pendentes (opt-in do diretório público) — só profissional. */
async function CompanyInvitesPanel() {
  const invites = await serverApi<CompanyInvite[]>(
    "GET",
    "/professionals/me/company-invites",
  ).catch(() => [] as CompanyInvite[]);
  return <CompanyInvites invites={invites} />;
}

async function EmpresaPanel() {
  let company: CompanyProfile | null = null;
  try {
    company = await serverApi<CompanyProfile>("GET", "/profiles/company/me");
  } catch {
    company = null;
  }

  return (
    <div className="animate-fade-in delay-1 space-y-3">
      <h2 className="font-display text-xl font-black text-foreground">Dados da empresa</h2>
      <Card className="grid gap-4 sm:grid-cols-3">
        <CompanyField label="Razão social" value={company?.razaoSocial} />
        <CompanyField label="Nome fantasia" value={company?.nomeFantasia} />
        <CompanyField label="CNPJ" value={formatCnpj(company?.cnpj)} />
      </Card>
      {company?.slug && (
        <Link
          href={`/empresa/${company.slug}`}
          className="inline-flex items-center gap-1.5 px-1 text-sm font-semibold text-primary hover:underline"
        >
          Ver perfil público da empresa →
        </Link>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        A empresa contrata e publica obras como contratante. Os profissionais que confirmam o
        vínculo aparecem no seu perfil público (gerencie em Equipe).
      </p>
    </div>
  );
}

function CompanyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value ?? "—"}</p>
    </div>
  );
}

/** Formata CNPJ de 14 dígitos: 11444777000161 → 11.444.777/0001-61. */
function formatCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? null;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

/** Cartão de visita digital (QR do perfil público) — só profissionais com slug. */
async function QrPanel() {
  const perfil = await serverApi<{ slugPublico: string | null }>(
    "GET",
    "/profiles/professional/me",
  ).catch(() => null);
  if (!perfil?.slugPublico) return null;
  return (
    <div className="animate-fade-in delay-1">
      <ProfileQrCard slug={perfil.slugPublico} />
    </div>
  );
}

async function PortfolioPanel() {
  const [ent, fotos] = await Promise.all([
    serverApi<{ features: string[] }>("GET", "/me/entitlements"),
    serverApi<PortfolioPhoto[]>("GET", "/profiles/professional/me/portfolio"),
  ]);
  const canPortfolio = ent.features.includes("profile.portfolio");

  return (
    <div className="animate-fade-in delay-1 space-y-3">
      <div>
        <h2 className="font-display text-xl font-black text-foreground">Portfólio de obras</h2>
        <p className="text-sm text-muted-foreground">
          Mostre seus melhores trabalhos — aparecem no seu perfil público.
        </p>
      </div>
      {canPortfolio ? (
        <PortfolioManager fotos={fotos} />
      ) : (
        <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
          <span aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Lock className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            O portfólio de obras é um benefício dos planos pagos. Faça upgrade para montar sua galeria.
          </p>
          <Link href="/cobrancas" className="inline-block">
            <Badge tone="primary" size="md">Ver planos →</Badge>
          </Link>
        </Card>
      )}
    </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0 font-bold text-danger">{s.motivo}</span>
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
        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
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
          <div className="grid w-full flex-1 grid-cols-2 gap-2 sm:gap-4">
            <StatCard className="p-3 sm:p-5" label="Aprovados" value={resumo.aprovados} detail={`de ${resumo.totalPedidos} pedidos`} />
            <StatCard
              className="p-3 sm:p-5"
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
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{penaltyReasonLabel(p.motivo)}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">{formatDateTimeBR(p.criadoEm)}</p>
                    {p.detalhe && <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{p.detalhe}</p>}
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
