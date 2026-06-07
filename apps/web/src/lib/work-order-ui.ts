import type { BadgeTone } from "@obracerta/ui";
import type { ProposalStatus, WorkOrderStatus, WorkUrgency } from "@obracerta/shared";

/** Rótulo + tom de cada estado da obra. */
export const WORK_ORDER_STATUS_UI: Record<WorkOrderStatus, { label: string; tone: BadgeTone }> = {
  ABERTA: { label: "Aberta", tone: "success" },
  ADJUDICADA: { label: "Adjudicada", tone: "info" },
  CONCLUIDA: { label: "Concluída", tone: "success" },
  CANCELADA: { label: "Cancelada", tone: "neutral" },
  EXPIRADA: { label: "Expirada", tone: "neutral" },
};

/** Urgência da obra (define a janela de expiração no backend). */
export const WORK_URGENCY_UI: Record<WorkUrgency, { label: string; tone: BadgeTone }> = {
  URGENTE: { label: "Urgente", tone: "danger" },
  NORMAL: { label: "Normal", tone: "info" },
  FLEXIVEL: { label: "Flexível", tone: "neutral" },
};

/** Estado de uma proposta/lance. */
export const PROPOSAL_STATUS_UI: Record<ProposalStatus, { label: string; tone: BadgeTone }> = {
  ENVIADA: { label: "Enviada", tone: "info" },
  ACEITA: { label: "Aceita", tone: "success" },
  RECUSADA: { label: "Recusada", tone: "neutral" },
  RETIRADA: { label: "Retirada", tone: "neutral" },
};
