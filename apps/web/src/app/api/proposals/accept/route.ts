import { type Proposal, uuidSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const acceptSchema = z.object({ proposalId: uuidSchema });

/**
 * BFF autenticado: contratante **adjudica** uma proposta (obra ADJUDICADA, lance
 * ACEITA, demais RECUSADAS). A autorização (ser o dono da obra) é checada no backend.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { proposalId } = await parseBody(request, acceptSchema);
    const proposal = await serverApi<Proposal>("POST", `/proposals/${proposalId}/accept`);
    return jsonOk(proposal);
  });
}
