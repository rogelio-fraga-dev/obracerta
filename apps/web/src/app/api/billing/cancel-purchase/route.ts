import type { Purchase } from "@obracerta/shared";
import { handle, jsonError, jsonOk } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: contratante/empresa cancela a renovação do plano de acesso
 * mensal. O acesso continua até o fim do período já pago.
 */
export function POST() {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const purchase = await serverApi<Purchase>("POST", "/purchases/cancel");
    return jsonOk(purchase);
  });
}
