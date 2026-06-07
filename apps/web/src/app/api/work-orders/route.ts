import { createWorkOrderSchema, type WorkOrder } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: contratante abre uma obra (urgência define a expiração). */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createWorkOrderSchema);
    const obra = await serverApi<WorkOrder>("POST", "/work-orders", { body });
    return jsonOk(obra);
  });
}
