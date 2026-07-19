import { uuidSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const actionSchema = z.object({
  id: uuidSchema,
  acao: z.enum(["confirm", "reject"]),
});

/**
 * BFF autenticado: profissional confirma ou recusa um convite de equipe de
 * empresa (opt-in para aparecer no diretório público).
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, actionSchema);
    await serverApi<void>("POST", `/professionals/me/company-invites/${body.id}/${body.acao}`);
    return jsonOk({ ok: true });
  });
}
