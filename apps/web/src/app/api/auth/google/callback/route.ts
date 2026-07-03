import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { GoogleAuthResult } from "@obracerta/shared";
import { publicOrigin } from "@/lib/bff";
import { callApi } from "@/lib/server-api";
import { GOOGLE_STATE_COOKIE, setProfileCookie, setSessionCookies } from "@/lib/session";

/**
 * BFF: callback do consentimento Google. Valida o `state` (anti-CSRF), troca o
 * `code` na API e:
 * - conta existente → seta os cookies httpOnly e entra (`/inicio`);
 * - e-mail sem conta → manda para o cadastro com nome/e-mail pré-preenchíveis;
 * - qualquer falha → volta ao login com um erro genérico.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const origin = publicOrigin(request);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value ?? null;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectClearingState(`${origin}/entrar?erro=google`);
  }

  try {
    const result = await callApi<GoogleAuthResult>("POST", "/auth/google", {
      body: { code, redirectUri: `${origin}/api/auth/google/callback` },
    });

    if (!result.registered) {
      const q = new URLSearchParams({ google: "1", email: result.email, nome: result.nome });
      return redirectClearingState(`${origin}/cadastro?${q.toString()}`);
    }

    await setSessionCookies(result.tokens);
    await setProfileCookie(result.user);
    return redirectClearingState(`${origin}/inicio`);
  } catch {
    return redirectClearingState(`${origin}/entrar?erro=google`);
  }
}

/** Redireciona apagando o cookie de `state` (uso único). */
function redirectClearingState(to: string): NextResponse {
  const res = NextResponse.redirect(to);
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
  return res;
}
