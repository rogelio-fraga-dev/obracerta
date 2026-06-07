import type { BadgeTone } from "@obracerta/ui";
import type { BookingStatus, DeclineReason, UserType } from "@obracerta/shared";

/** Rótulo + tom (Badge) de cada estado do pedido. */
export const BOOKING_STATUS_UI: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "info" },
  INICIADO: { label: "Em andamento", tone: "info" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
  RECUSADO: { label: "Recusado", tone: "danger" },
  EXPIRADO: { label: "Expirado", tone: "neutral" },
  CANCELADO: { label: "Cancelado", tone: "neutral" },
};

/** Motivos de recusa (rótulos legíveis). DESISTENCIA é penalizável (§8). */
export const DECLINE_REASON_UI: Record<DeclineReason, string> = {
  AGENDA_INDISPONIVEL: "Agenda indisponível",
  FORA_DA_AREA: "Fora da minha área",
  ESCOPO_INCOMPATIVEL: "Escopo incompatível",
  VALOR_INCOMPATIVEL: "Valor incompatível",
  DESISTENCIA: "Desistência",
  OUTRO: "Outro",
};

export type BookingAction = "approve" | "decline" | "start" | "complete" | "cancel";

export interface BookingActionUI {
  action: BookingAction;
  label: string;
  variant: "primary" | "secondary" | "ghost";
}

/**
 * Ações disponíveis para um pedido conforme **estado** e **papel** — espelha a
 * máquina de estados do backend (`booking-state`): profissional aprova/recusa/
 * inicia/conclui; contratante cancela enquanto não terminal.
 */
export function bookingActionsFor(status: BookingStatus, tipo: UserType): BookingActionUI[] {
  if (tipo === "PROFISSIONAL") {
    if (status === "PENDENTE") {
      return [
        { action: "approve", label: "Aprovar", variant: "primary" },
        { action: "decline", label: "Recusar", variant: "secondary" },
      ];
    }
    if (status === "APROVADO") return [{ action: "start", label: "Iniciar serviço", variant: "primary" }];
    if (status === "INICIADO") return [{ action: "complete", label: "Concluir", variant: "primary" }];
    return [];
  }
  // Contratante: pode cancelar enquanto o pedido não chegou a um estado terminal.
  if (status === "PENDENTE" || status === "APROVADO" || status === "INICIADO") {
    return [{ action: "cancel", label: "Cancelar pedido", variant: "secondary" }];
  }
  return [];
}
