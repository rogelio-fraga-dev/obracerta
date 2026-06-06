import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthTokens } from "@obracerta/shared";

/**
 * Sessão do web no padrão **BFF**: os tokens vivem **só em cookies httpOnly**
 * setados pelo servidor — o browser nunca os enxerga (sem XSS/token leak). As
 * chamadas autenticadas à API acontecem server-side ({@link ./server-api}),
 * lendo o access token destes cookies.
 *
 * `import "server-only"` garante erro de build se um Client Component importar.
 */

const ACCESS_COOKIE = "oc_at";
const REFRESH_COOKIE = "oc_rt";

/** Janela do refresh token (30 dias) — o access é renovado a partir dele. */
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Rota de entrada para onde redirecionamos quando não há sessão. */
export const LOGIN_PATH = "/entrar";

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export interface Session {
  accessToken: string;
  refreshToken: string;
}

/** Grava o par de tokens nos cookies httpOnly (chamado pelos route handlers do BFF). */
export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  // O access não recebe maxAge (cookie de sessão); o refresh persiste a janela.
  store.set(ACCESS_COOKIE, tokens.accessToken, baseCookieOptions());
  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

/** Remove os cookies de sessão (logout). */
export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Lê a sessão atual dos cookies, ou `null` se não houver. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

/** Sessão obrigatória — redireciona para o login se ausente. Uso em Server Components. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(LOGIN_PATH);
  }
  return session;
}
