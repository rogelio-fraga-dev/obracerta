import { type CadastroResult, loginSchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { setProfileCookie, setSessionCookies } from "@/lib/session";

/**
 * BFF: login "conta normal" (e-mail + senha). Em sucesso, **seta os cookies
 * httpOnly** e devolve só o usuário (sem tokens ao cliente).
 */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, loginSchema);
    const result = await callApi<CadastroResult>("POST", "/auth/login", { body });
    await setSessionCookies(result.tokens);
    await setProfileCookie(result.user);
    return jsonOk({ user: result.user });
  });
}
