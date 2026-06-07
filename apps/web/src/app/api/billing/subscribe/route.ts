import { createSubscriptionSchema, type Subscription } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: profissional assina um plano recorrente. Cria a assinatura
 * (EM_GRACA) + fatura no backend; o pagamento se confirma por webhook (Fase 4).
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createSubscriptionSchema);
    const subscription = await serverApi<Subscription>("POST", "/subscriptions", { body });
    return jsonOk(subscription);
  });
}
