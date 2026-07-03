import { z, type PixCharge } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: Pix de uma fatura aberta do usuário.
 * - GET `?invoiceId=` → payload do QR (copia-e-cola) + flag `simulavel`.
 * - POST `{invoiceId}` → **sandbox**: simula a confirmação do pagamento
 *   (mesmo pipeline do webhook real; a API bloqueia fora do sandbox).
 */
export function GET(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const invoiceId = new URL(request.url).searchParams.get("invoiceId");
    if (!invoiceId) return jsonError("VALIDATION", "invoiceId é obrigatório.", 400);
    const pix = await serverApi<PixCharge>("GET", `/invoices/${invoiceId}/pix`);
    return jsonOk(pix);
  });
}

const simulateSchema = z.object({ invoiceId: z.string().uuid() });

export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, simulateSchema);
    const result = await serverApi<{ status: string }>(
      "POST",
      `/invoices/${body.invoiceId}/pix/simular`,
    );
    return jsonOk(result);
  });
}
