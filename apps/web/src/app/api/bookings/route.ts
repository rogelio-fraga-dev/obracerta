import { type BookingRequest, createBookingSchema } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: contratante cria um pedido de agendamento. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createBookingSchema);
    const booking = await serverApi<BookingRequest>("POST", "/bookings", { body });
    return jsonOk(booking);
  });
}
