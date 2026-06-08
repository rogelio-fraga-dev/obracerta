import { type CadastroResult, registerSchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { setProfileCookie, setSessionCookies } from "@/lib/session";

/**
 * BFF: cadastro "conta normal" (e-mail + senha). Cria a conta na API, faz
 * auto-login setando os cookies httpOnly e devolve só o usuário.
 */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, registerSchema);
    const result = await callApi<CadastroResult>("POST", "/cadastro/email", { body });
    await setSessionCookies(result.tokens);
    await setProfileCookie(result.user);
    return jsonOk({ user: result.user });
  });
}
