import { createReviewResponseSchema, type ReviewResponse } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: direito de resposta — o avaliado responde (1x, até 30 dias) a
 * uma avaliação já revelada.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createReviewResponseSchema);
    const response = await serverApi<ReviewResponse>("POST", "/reviews/responses", { body });
    return jsonOk(response);
  });
}
