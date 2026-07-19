import { addCompanyMemberSchema, type CompanyMember } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/** BFF autenticado: administrador da empresa convida/registra um membro da equipe. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, addCompanyMemberSchema);
    const member = await serverApi<CompanyMember>("POST", "/company/me/members", { body });
    return jsonOk(member);
  });
}
