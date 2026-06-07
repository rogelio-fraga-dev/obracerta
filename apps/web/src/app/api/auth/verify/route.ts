import { type AuthResult, otpVerifySchema } from "@obracerta/shared";
import { handle, jsonOk, parseBody } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { setProfileCookie, setSessionCookies } from "@/lib/session";

/**
 * BFF: valida o OTP. Se já cadastrado, **seta os cookies httpOnly** e devolve só
 * o usuário (sem tokens ao cliente). Se não, sinaliza cadastro pendente.
 */
export function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, otpVerifySchema);
    const result = await callApi<AuthResult>("POST", "/auth/otp/verify", { body });

    if (result.registered) {
      await setSessionCookies(result.tokens);
      await setProfileCookie(result.user);
      return jsonOk({ registered: true as const, user: result.user });
    }
    return jsonOk({ registered: false as const });
  });
}
