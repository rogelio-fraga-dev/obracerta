import { handle, jsonOk } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { clearSessionCookies, getSession } from "@/lib/session";

/**
 * BFF: encerra a sessão. Revoga o refresh na API (best-effort) e limpa os cookies
 * httpOnly. Idempotente — chamar sem sessão também responde ok.
 */
export function POST() {
  return handle(async () => {
    const session = await getSession();
    if (session) {
      try {
        await callApi<void>("POST", "/auth/logout", { body: { refreshToken: session.refreshToken } });
      } catch {
        /* a API pode já ter expirado o refresh; limpamos os cookies de qualquer forma */
      }
    }
    await clearSessionCookies();
    return jsonOk({ ok: true });
  });
}
