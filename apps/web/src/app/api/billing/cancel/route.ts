import type { Subscription } from "@obracerta/shared";
import { handle, jsonError, jsonOk } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: profissional cancela sua assinatura recorrente.
 * O plano permanece ativo (grace period) até o fim da vigência da cobrança.
 */
export function POST() {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const subscription = await serverApi<Subscription>("POST", "/subscriptions/cancel");
    return jsonOk(subscription);
  });
}
