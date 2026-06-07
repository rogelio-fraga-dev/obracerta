import { uuidSchema, z, type Refund } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** Motivos CDC aceitos pelo backend (domínio do billing). */
const refundReasonSchema = z.enum([
  "ARREPENDIMENTO",
  "COBRANCA_INDEVIDA",
  "FALHA_SERVICO",
  "CANCELAMENTO_PROPORCIONAL",
]);

const requestRefundSchema = z.object({ invoiceId: uuidSchema, motivo: refundReasonSchema });

/** BFF autenticado: solicita reembolso de uma fatura paga (motivo CDC §21). */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, requestRefundSchema);
    const refund = await serverApi<Refund>("POST", "/refunds", { body });
    return jsonOk(refund);
  });
}
