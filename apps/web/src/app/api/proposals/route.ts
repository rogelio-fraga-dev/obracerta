import { createProposalSchema, type Proposal } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: profissional envia um **lance sigiloso** para uma obra. O lance
 * é visível só ao contratante e ao próprio autor (sigilo garantido no backend).
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { workOrderId, valorCentavos, prazoDias, mensagem } = await parseBody(
      request,
      createProposalSchema,
    );
    const proposal = await serverApi<Proposal>("POST", `/work-orders/${workOrderId}/proposals`, {
      body: { valorCentavos, prazoDias, mensagem },
    });
    return jsonOk(proposal);
  });
}
