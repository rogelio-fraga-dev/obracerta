import { uuidSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const removeSchema = z.object({ id: uuidSchema });

/** BFF autenticado: empresa remove um profissional do roster da equipe. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, removeSchema);
    await serverApi<void>("DELETE", `/company/me/professionals/${body.id}`);
    return jsonOk({ removed: true });
  });
}
