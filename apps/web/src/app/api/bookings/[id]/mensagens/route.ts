import {
  type BookingMessage,
  createBookingMessageSchema,
  uuidSchema,
} from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

/** BFF autenticado: mensagens do chat do pedido (participantes, pós-aceite). */
export function GET(_request: Request, { params }: { params: Params }) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) return jsonError("VALIDATION", "Pedido inválido.", 400);
    const mensagens = await serverApi<BookingMessage[]>("GET", `/bookings/${parsed.data}/mensagens`);
    return jsonOk(mensagens);
  });
}

/** BFF autenticado: envia uma mensagem no chat do pedido. */
export function POST(request: Request, { params }: { params: Params }) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) return jsonError("VALIDATION", "Pedido inválido.", 400);
    const body = await parseBody(request, createBookingMessageSchema);
    const mensagem = await serverApi<BookingMessage>("POST", `/bookings/${parsed.data}/mensagens`, {
      body,
    });
    return jsonOk(mensagem);
  });
}
