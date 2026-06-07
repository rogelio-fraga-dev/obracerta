import { notFound } from "next/navigation";
import {
  ApiEnvelopeError,
  formatCentavos,
  type Proposal,
  type UserType,
  type WorkOrder,
} from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { formatDateTimeBR } from "@/lib/format";
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

  const status = WORK_ORDER_STATUS_UI[obra.status];
  const urg = WORK_URGENCY_UI[obra.urgencia];

  return (
    <section aria-labelledby="obra-heading" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h1 id="obra-heading" className="font-display text-2xl font-black text-foreground">
          {obra.titulo}
        </h1>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <Card className="space-y-2 text-sm">
        <Row label="Especialidade" value={obra.especialidade} />
        <Row label="Urgência" value={urg.label} />
        {obra.bairro && <Row label="Bairro" value={obra.bairro} />}
        {obra.pisoCentavos !== null && (
          <Row label="Piso de dignidade" value={formatCentavos(obra.pisoCentavos)} />
        )}
        {obra.descricao && <Row label="Descrição" value={obra.descricao} />}
        {obra.status === "ABERTA" && <Row label="Aberta até" value={formatDateTimeBR(obra.expiraEm)} />}
      </Card>

      {tipo === "PROFISSIONAL" ? (
        <ObraBid
          workOrderId={obra.id}
          status={obra.status}
          pisoCentavos={obra.pisoCentavos}
          minhaProposta={proposals[0] ?? null}
        />
      ) : (
        <ObraProposals workOrderId={obra.id} status={obra.status} proposals={proposals} />
      )}
    </section>
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
