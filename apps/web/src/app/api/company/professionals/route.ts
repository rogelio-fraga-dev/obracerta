import { addCompanyProfessionalSchema, type CompanyProfessional } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: empresa vincula um profissional da plataforma ao roster da equipe. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, addCompanyProfessionalSchema);
    const link = await serverApi<CompanyProfessional>("POST", "/company/me/professionals", { body });
    return jsonOk(link);
  });
}
