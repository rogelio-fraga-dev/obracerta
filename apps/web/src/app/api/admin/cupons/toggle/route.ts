import { uuidSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const schema = z.object({ id: uuidSchema, ativo: z.boolean() });

/** BFF (admin): ativa/desativa um cupom. Autorização ADMIN no backend. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { id, ativo } = await parseBody(request, schema);
    await serverApi("POST", `/admin/cupons/${id}/toggle`, { body: { ativo } });
    return jsonOk({ ok: true });
  });
}
