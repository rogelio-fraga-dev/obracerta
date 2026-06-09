import { type ProfessionalDocument, createDocumentSchema } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: profissional emite um orçamento ou recibo (gated na API). */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createDocumentSchema);
    const doc = await serverApi<ProfessionalDocument>("POST", "/tools/documents", { body });
    return jsonOk(doc);
  });
}
