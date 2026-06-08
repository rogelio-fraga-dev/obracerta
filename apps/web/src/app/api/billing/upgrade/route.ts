import { createSubscriptionSchema, type Subscription } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: **upgrade de plano** do profissional. Troca o plano da
 * assinatura vigente (ou cria, se não houver). O gating (`/me/entitlements`)
 * passa a refletir as novas funções liberadas.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createSubscriptionSchema);
    const subscription = await serverApi<Subscription>("POST", "/subscriptions/upgrade", { body });
    return jsonOk(subscription);
  });
}
