import {
  type BookingRequest,
  declineReasonSchema,
  isoTimestampSchema,
  uuidSchema,
  z,
} from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: aplica uma transição na máquina de estados do pedido (ou uma
 * ação de reagendamento). Mapeia a ação para `POST /bookings/:id/<caminho>`; a
 * recusa carrega motivo/detalhe e a proposta de reagendamento carrega `novaData`.
 * A autorização (quem pode agir) é checada no backend.
 */
const actionSchema = z
  .object({
    id: uuidSchema,
    action: z.enum([
      "approve",
      "decline",
      "start",
      "complete",
      "cancel",
      "reschedule",
      "reschedule-accept",
      "reschedule-reject",
    ]),
    motivo: declineReasonSchema.optional(),
    detalhe: z.string().trim().max(300).optional(),
    novaData: isoTimestampSchema.optional(),
  })
  .refine((v) => v.action !== "decline" || v.motivo !== undefined, {
    message: "Informe o motivo da recusa.",
    path: ["motivo"],
  })
  .refine((v) => v.action !== "reschedule" || v.novaData !== undefined, {
    message: "Informe a nova data.",
    path: ["novaData"],
  });

/** Ações de reagendamento → subcaminho na API (as demais usam o próprio nome). */
const RESCHEDULE_PATHS: Record<string, string> = {
  reschedule: "reagendamento",
  "reschedule-accept": "reagendamento/aceitar",
  "reschedule-reject": "reagendamento/recusar",
};

export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id, action, motivo, detalhe, novaData } = await parseBody(request, actionSchema);
    const path = RESCHEDULE_PATHS[action] ?? action;
    const body =
      action === "decline"
        ? { motivo, detalhe }
        : action === "reschedule"
          ? { novaData }
          : undefined;
    const booking = await serverApi<BookingRequest>("POST", `/bookings/${id}/${path}`, { body });
    return jsonOk(booking);
  });
}
