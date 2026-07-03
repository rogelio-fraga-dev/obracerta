import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthTokens, User, UserType } from "@obracerta/shared";

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
/** Dica de perfil (tipo + nome) — NÃO httpOnly: não é segredo e habilita UI ciente de papel. */
const PROFILE_COOKIE = "oc_pf";

/** Janela do refresh token (30 dias) — o access é renovado a partir dele. */
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Rota de entrada para onde redirecionamos quando não há sessão. */
export const LOGIN_PATH = "/entrar";

/** Cookie httpOnly com o `state` anti-CSRF do fluxo Google (uso único, 10 min). */
export const GOOGLE_STATE_COOKIE = "oc_gstate";

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
  store.delete(PROFILE_COOKIE);
}

export interface ProfileHint {
  tipo: UserType;
  nome: string;
}

/** Grava a dica de perfil (tipo + nome) para UI ciente de papel. Não é segredo. */
export async function setProfileCookie(user: Pick<User, "tipo" | "nomeCompleto">): Promise<void> {
  const store = await cookies();
  const hint: ProfileHint = { tipo: user.tipo, nome: user.nomeCompleto };
  store.set(PROFILE_COOKIE, JSON.stringify(hint), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

/** Lê a dica de perfil dos cookies, ou `null` se ausente/ilegível. */
export async function getProfileHint(): Promise<ProfileHint | null> {
  const raw = (await cookies()).get(PROFILE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProfileHint;
    return parsed.tipo && parsed.nome ? parsed : null;
  } catch {
    return null;
  }
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

/**
 * Papéis administrativos do usuário atual — **best-effort para gating de UI**
 * (mostrar/esconder o painel admin). Nunca lança nem redireciona: qualquer falha
 * (sem sessão, token expirado, API fora) devolve `[]`. A segurança real é a API
 * (RolesGuard relê os papéis frescos do banco a cada request).
 *
 * Memoizado por request com `React.cache`: layout + páginas (`/inicio`, `/perfil`)
 * chamam na mesma request sem refazer o HTTP a `/auth/me/roles` (evita o waterfall).
 */
export const getMyRoles = cache(async (): Promise<string[]> => {
  const session = await getSession();
  if (!session) return [];
  try {
    const { callApi } = await import("./server-api");
    const result = await callApi<{ roles: string[] }>("GET", "/auth/me/roles", {
      token: session.accessToken,
    });
    return result.roles;
  } catch {
    return [];
  }
});
