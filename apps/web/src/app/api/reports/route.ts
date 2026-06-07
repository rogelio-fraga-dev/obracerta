import { createReportSchema, type Report } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: qualquer usuário denuncia um conteúdo/perfil. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, createReportSchema);
    const report = await serverApi<Report>("POST", "/reports", { body });
    return jsonOk(report);
  });
}
