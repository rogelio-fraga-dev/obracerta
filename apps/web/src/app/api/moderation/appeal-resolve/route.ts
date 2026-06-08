import { uuidSchema, z, type Suspension } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const schema = z.object({ suspensionId: uuidSchema, revogar: z.boolean() });

/** BFF (moderador): julga uma apelação (revogar = derruba a suspensão). */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { suspensionId, revogar } = await parseBody(request, schema);
    const suspension = await serverApi<Suspension>("POST", `/suspensions/${suspensionId}/resolve`, {
      body: { revogar },
    });
    return jsonOk(suspension);
  });
}
