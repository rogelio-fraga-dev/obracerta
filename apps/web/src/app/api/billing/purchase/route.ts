import { createPurchaseSchema, type Purchase } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: contratante/empresa assina um plano de acesso mensal.
 * Cria o ciclo (PENDENTE) + fatura no backend; o pagamento (Pix em Cobranças)
 * ativa a vigência via webhook e agenda a renovação automática.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createPurchaseSchema);
    const purchase = await serverApi<Purchase>("POST", "/purchases", { body });
    return jsonOk(purchase);
  });
}
