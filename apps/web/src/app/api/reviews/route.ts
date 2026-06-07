import { createReviewSchema, type Review } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: avalia a contraparte de um pedido CONCLUIDO. A nota nasce
 * **oculta** (dupla-cega) e só é revelada quando ambos avaliam ou a janela fecha.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createReviewSchema);
    const review = await serverApi<Review>("POST", "/reviews", { body });
    return jsonOk(review);
  });
}
