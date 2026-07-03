import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { callApi } from "@/lib/server-api";
import { GOOGLE_STATE_COOKIE } from "@/lib/session";

/**
 * BFF: inicia o login com Google. Gera um `state` anti-CSRF (cookie httpOnly,
 * 10 min), pede à API a URL de consentimento (real ou simulada, conforme o
 * adapter do backend) e redireciona o navegador para lá.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = randomBytes(16).toString("hex");

  try {
    const { url } = await callApi<{ url: string }>(
      "GET",
      `/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}&state=${state}`,
    );
    const res = NextResponse.redirect(url);
    res.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/google",
      maxAge: 600,
    });
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/entrar?erro=google`);
  }
}
