import { appealSuspensionSchema, type Suspension } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: o usuário suspenso apela da suspensão. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, appealSuspensionSchema);
    const suspension = await serverApi<Suspension>("POST", "/suspensions/appeal", { body });
    return jsonOk(suspension);
  });
}
