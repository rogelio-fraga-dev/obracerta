import { notFound } from "next/navigation";
import {
  ApiEnvelopeError,
  formatCentavos,
  type JwtClaims,
  type Proposal,
  type UserType,
  type WorkOrder,
  type WorkOrderMessage,
  type WorkOrderPhoto,
} from "@obracerta/shared";
import { Badge } from "@obracerta/ui";
import { ChatCard } from "@/components/ChatCard";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { Fact } from "../../_shell/Fact";
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

  // Tudo em UM Promise.all — nenhuma destas chamadas depende das outras (só de
  // `obra`, já carregada): propostas/fotos + entitlements (gating de lance) +
  // chat (só quando adjudicada). Evita 3 rodadas sequenciais de rede.
  const [proposals, fotos, entitlements, mensagensRes, claimsRes] = await Promise.all([
    serverApi<Proposal[]>("GET", `/work-orders/${id}/proposals`).catch(() => [] as Proposal[]),
    serverApi<WorkOrderPhoto[]>("GET", `/work-orders/${id}/fotos`).catch(
      () => [] as WorkOrderPhoto[],
    ),
    tipo === "PROFISSIONAL"
      ? serverApi<{ features: string[] }>("GET", "/me/entitlements").catch(() => null)
      : Promise.resolve(null),
    obra.status === "ADJUDICADA"
      ? serverApi<WorkOrderMessage[]>("GET", `/work-orders/${id}/mensagens`).catch(
          (e: unknown) => {
            if (!(e instanceof ApiEnvelopeError)) throw e;
            return null;
          },
        )
      : Promise.resolve(null),
    obra.status === "ADJUDICADA"
      ? serverApi<JwtClaims>("POST", "/auth/me").catch(() => null)
      : Promise.resolve(null),
  ]);

  // Gating: lances são dos planos pagos (Pro+ — feature bid.submit).
  const canBid = entitlements?.features.includes("bid.submit") ?? false;
  // Chat da obra: abre com a adjudicação, só para os participantes (o GET devolve
  // 403 para quem não participa — aí o card simplesmente não aparece).
  const mensagens: WorkOrderMessage[] | null = mensagensRes;
  const meuId: string | null = claimsRes?.sub ?? null;

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
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">{obra.descricao}</p>
          </div>
        )}
        {(fotos.length > 0 || obra.fotoUrl) && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fotos da obra
            </p>
            {fotos.length > 1 ? (
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fotos.map((f, i) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={f.url}
                        alt={`Foto ${i + 1} da obra ${obra.titulo}`}
                        className="aspect-square w-full rounded-lg border border-border object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <img
                src={fotos[0]?.url ?? obra.fotoUrl ?? ""}
                alt={`Foto da obra ${obra.titulo}`}
                className="mt-2 max-h-72 w-full rounded-lg object-cover"
              />
            )}
          </div>
        )}
      </div>

      {mensagens !== null && meuId && (
        <ChatCard
          endpoint={`/api/work-orders/${obra.id}/mensagens`}
          meuId={meuId}
          initialMensagens={mensagens}
          outraParte={tipo === "PROFISSIONAL" ? "o contratante" : "o profissional"}
        />
      )}

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

