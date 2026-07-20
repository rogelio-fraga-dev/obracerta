import { uuidSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const schema = z.object({ userId: uuidSchema, aprovar: z.boolean() });

/** BFF (moderador): aprova/recusa uma verificação de identidade. Autorização no backend. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { userId, aprovar } = await parseBody(request, schema);
    await serverApi("POST", `/profiles/verificacoes/${userId}/resolver`, { body: { aprovar } });
    return jsonOk({ ok: true });
  });
}
