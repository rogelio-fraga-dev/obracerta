import { type CadastroResult, cadastroSchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { setSessionCookies } from "@/lib/session";

/**
 * BFF: cria a conta (WhatsApp já verificado por OTP). Faz auto-login setando os
 * cookies httpOnly e devolve só o usuário (sem tokens ao cliente).
 */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, cadastroSchema);
    const result = await callApi<CadastroResult>("POST", "/cadastro", { body });
    await setSessionCookies(result.tokens);
    return jsonOk({ user: result.user });
  });
}
