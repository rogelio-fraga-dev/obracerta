"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCentavos, type Proposal, type WorkOrderStatus } from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { PROPOSAL_STATUS_UI } from "@/lib/work-order-ui";

/**
 * Propostas recebidas (visão do contratante dono — sigilosas, só ele as vê). Pode
 * **adjudicar** uma enquanto a obra está aberta: o backend marca a obra ADJUDICADA,
 * o lance ACEITA e os demais RECUSADOS.
 */
export function ObraProposals({
  status,
  proposals,
}: {
  workOrderId: string;
  status: WorkOrderStatus;
  proposals: Proposal[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function aceitar(proposalId: string) {
    setError(null);
    setLoadingId(proposalId);
    try {
      await bff.post("/api/proposals/accept", { proposalId });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível adjudicar.");
      setLoadingId(null);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-black text-foreground">
        Propostas ({proposals.length})
      </h2>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma proposta ainda. Os lances são sigilosos — só você os vê.
        </p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => {
            const ui = PROPOSAL_STATUS_UI[p.status];
            return (
              <li key={p.id} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black text-foreground">
                    {formatCentavos(p.valorCentavos)}
                  </span>
                  <Badge tone={ui.tone}>{ui.label}</Badge>
                </div>
                {p.prazoDias !== null && (
                  <p className="text-xs text-muted-foreground">Prazo: {p.prazoDias} dias</p>
                )}
                {p.mensagem && <p className="text-sm text-foreground">{p.mensagem}</p>}
                {status === "ABERTA" && p.status === "ENVIADA" && (
                  <Button size="sm" onClick={() => aceitar(p.id)} disabled={loadingId !== null}>
                    {loadingId === p.id ? "Adjudicando…" : "Aceitar esta proposta"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
