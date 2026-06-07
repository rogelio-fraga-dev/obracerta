import { acceptTermsSchema, type TermsAcceptance } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: registra o aceite (append-only) dos termos de um pedido. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, acceptTermsSchema);
    const acceptance = await serverApi<TermsAcceptance>("POST", "/terms", { body });
    return jsonOk(acceptance);
  });
}
