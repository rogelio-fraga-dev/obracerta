import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy (hardening Fase 7/segurança).
 *
 * 2ª camada contra XSS além do escape do React. Em **produção** usa nonce +
 * `strict-dynamic` (só scripts que o Next assina rodam). Em **dev** afrouxa
 * (`unsafe-eval`/`unsafe-inline` + websocket) para o HMR do `next dev` funcionar.
 *
 * O nonce é gerado por requisição e exposto no header `x-nonce` da request — o
 * Next o lê e aplica aos próprios scripts automaticamente.
 */
const isDev = process.env.NODE_ENV !== "production";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  // O browser fala same-origin (BFF); liberamos a API por garantia + websocket no dev (HMR).
  const connectSrc = isDev ? `'self' ${apiUrl} ws: wss:` : `'self' ${apiUrl}`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // 'unsafe-inline' em style é inevitável (Tailwind/next-font injetam <style> e style="")
    `style-src 'self' 'unsafe-inline'`,
    // fotos de perfil/portfólio vêm do storage (MinIO local em dev; CDN https em prod)
    `img-src 'self' data: blob: https: http://localhost:9000`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `media-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // Desliga APIs sensíveis que não usamos; geolocation só na própria origem ("perto de mim").
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  );
  // HSTS só em produção (em dev quebraria http://localhost). O Caddy também aplica,
  // mas garantimos aqui caso o app rode atrás de outro proxy.
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return response;
}

export const config = {
  matcher: [
    // Aplica a documentos; pula API (BFF JSON), assets estáticos e prefetch.
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
