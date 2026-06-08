import { uuidSchema, z, type Refund } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const schema = z.object({ refundId: uuidSchema, aprovar: z.boolean() });

/** BFF (financeiro): aprova ou recusa um reembolso. Autorização FINANCEIRO/ADMIN no backend. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { refundId, aprovar } = await parseBody(request, schema);
    const refund = await serverApi<Refund>("POST", `/refunds/${refundId}/resolve`, {
      body: { aprovar },
    });
    return jsonOk(refund);
  });
}
