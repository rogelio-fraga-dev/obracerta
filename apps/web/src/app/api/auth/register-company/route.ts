import { type CadastroResult, registerCompanySchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { setProfileCookie, setSessionCookies } from "@/lib/session";

/**
 * BFF: cadastro de empresa (PJ). Cria a conta EMPRESA na API (CNPJ + razão
 * social), faz auto-login setando os cookies httpOnly e devolve só o usuário.
 */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, registerCompanySchema);
    const result = await callApi<CadastroResult>("POST", "/cadastro/empresa", { body });
    await setSessionCookies(result.tokens);
    await setProfileCookie(result.user);
    return jsonOk({ user: result.user });
  });
}
