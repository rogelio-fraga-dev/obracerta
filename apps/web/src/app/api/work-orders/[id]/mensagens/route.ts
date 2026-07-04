import {
  createWorkOrderMessageSchema,
  uuidSchema,
  type WorkOrderMessage,
} from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

/** BFF autenticado: mensagens do chat da obra (participantes, pós-adjudicação). */
export function GET(_request: Request, { params }: { params: Params }) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) return jsonError("VALIDATION", "Obra inválida.", 400);
    const mensagens = await serverApi<WorkOrderMessage[]>(
      "GET",
      `/work-orders/${parsed.data}/mensagens`,
    );
    return jsonOk(mensagens);
  });
}

/** BFF autenticado: envia uma mensagem no chat da obra. */
export function POST(request: Request, { params }: { params: Params }) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id } = await params;
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) return jsonError("VALIDATION", "Obra inválida.", 400);
    const body = await parseBody(request, createWorkOrderMessageSchema);
    const mensagem = await serverApi<WorkOrderMessage>(
      "POST",
      `/work-orders/${parsed.data}/mensagens`,
      { body },
    );
    return jsonOk(mensagem);
  });
}
