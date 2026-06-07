import {
  type BookingRequest,
  declineReasonSchema,
  uuidSchema,
  z,
} from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: aplica uma transição na máquina de estados do pedido. Mapeia
 * a ação para `POST /bookings/:id/<ação>`; a recusa carrega motivo/detalhe. A
 * autorização (quem pode agir) é checada no backend.
 */
const actionSchema = z
  .object({
    id: uuidSchema,
    action: z.enum(["approve", "decline", "start", "complete", "cancel"]),
    motivo: declineReasonSchema.optional(),
    detalhe: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.action !== "decline" || v.motivo !== undefined, {
    message: "Informe o motivo da recusa.",
    path: ["motivo"],
  });

export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id, action, motivo, detalhe } = await parseBody(request, actionSchema);
    const body = action === "decline" ? { motivo, detalhe } : undefined;
    const booking = await serverApi<BookingRequest>("POST", `/bookings/${id}/${action}`, { body });
    return jsonOk(booking);
  });
}
