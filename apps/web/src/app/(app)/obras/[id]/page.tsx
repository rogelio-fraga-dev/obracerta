import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ApiEnvelopeError,
  formatCentavos,
  type Proposal,
  type UserType,
  type WorkOrder,
} from "@obracerta/shared";
import { Badge } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { ClockIcon, MapPinIcon, MoneyIcon, TagIcon } from "../../_shell/icons";
import { ObraBid } from "./_components/ObraBid";
import { ObraProposals } from "./_components/ObraProposals";

/** Detalhe de uma obra: dados, lance (profissional) e propostas sigilosas (contratante). */
export default async function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hint = await getProfileHint();
  const tipo: UserType = hint?.tipo ?? "CONTRATANTE";

  let obra: WorkOrder;
  try {
    obra = await serverApi<WorkOrder>("GET", `/work-orders/${id}`);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) notFound();
    throw e;
  }

  // Sigilo: o backend escopa as propostas (dono vê todas; profissional só a sua).
  let proposals: Proposal[] = [];
  try {
    proposals = await serverApi<Proposal[]>("GET", `/work-orders/${id}/proposals`);
  } catch {
    proposals = [];
  }

  // Gating: lances são dos planos pagos (Pro+ — feature bid.submit).
  let canBid = false;
  if (tipo === "PROFISSIONAL") {
    try {
      const ent = await serverApi<{ features: string[] }>("GET", "/me/entitlements");
      canBid = ent.features.includes("bid.submit");
    } catch {
      canBid = false;
    }
  }

  const status = WORK_ORDER_STATUS_UI[obra.status];
  const urg = WORK_URGENCY_UI[obra.urgencia];

  return (
    <section aria-labelledby="obra-heading" className="space-y-4">
      <BackLink href="/obras" label="Obras" />

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground">Obra</p>
            <h1 id="obra-heading" className="font-display text-2xl font-black text-foreground">
              {obra.titulo}
            </h1>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={urg.tone}>{urg.label}</Badge>
          {obra.pisoCentavos !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              <MoneyIcon className="h-4 w-4" />
              Piso {formatCentavos(obra.pisoCentavos)}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <Fact icon={<TagIcon className="h-5 w-5" />} label="Especialidade">
          {obra.especialidade}
        </Fact>
        {obra.bairro && (
          <Fact icon={<MapPinIcon className="h-5 w-5" />} label="Bairro">
            {obra.bairro}
          </Fact>
        )}
        {obra.status === "ABERTA" && (
          <Fact icon={<ClockIcon className="h-5 w-5" />} label="Aberta até">
            {formatDateTimeBR(obra.expiraEm)}
          </Fact>
        )}
        {obra.descricao && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
            <p className="mt-1 text-sm text-foreground">{obra.descricao}</p>
          </div>
        )}
      </div>

      {tipo === "PROFISSIONAL" ? (
        <ObraBid
          workOrderId={obra.id}
          status={obra.status}
          pisoCentavos={obra.pisoCentavos}
          minhaProposta={proposals[0] ?? null}
          canBid={canBid}
        />
      ) : (
        <ObraProposals status={obra.status} proposals={proposals} />
      )}
    </section>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 first:pt-0 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{children}</p>
      </div>
    </div>
  );
}
