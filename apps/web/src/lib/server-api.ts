import "server-only";
import { redirect } from "next/navigation";
import { type AuthTokens, unwrapEnvelope } from "@obracerta/shared";
import { config } from "./config";
import {
  clearSessionCookies,
  getSession,
  LOGIN_PATH,
  setSessionCookies,
} from "./session";

/**
 * Camada HTTP server-side do BFF. Toda chamada à API acontece aqui — o token
 * nunca vai ao cliente. `serverApi` injeta o Bearer do cookie e, num 401, tenta
 * **renovar** a sessão (refresh rotacionado) e repete a chamada uma vez.
 */

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface ApiCallOptions {
  body?: unknown;
  token?: string;
  /** Repassa o `x-request-id` recebido para correlacionar logs front↔back. */
  requestId?: string;
}

/** Fetch cru contra a API (sem desembrulhar) — usado internamente para inspecionar status. */
async function rawFetch(method: HttpMethod, path: string, options: ApiCallOptions): Promise<Response> {
  const { body, token, requestId } = options;
  return fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // Dados sempre frescos: a API é a fonte de verdade, sem cache do fetch.
    cache: "no-store",
  });
}

/**
 * Chamada **não autenticada** (ou com token explícito): fetch + desembrulho do
 * envelope. Usada pelos route handlers do BFF (OTP/cadastro) e por páginas
 * públicas SSR.
 */
export async function callApi<T>(
  method: HttpMethod,
  path: string,
  options: ApiCallOptions = {},
): Promise<T> {
  const res = await rawFetch(method, path, options);
  const json: unknown = await res.json().catch(() => null);
  return unwrapEnvelope<T>(json, res.status);
}

/** Tenta renovar a sessão a partir do refresh token; `null` se falhar. */
async function tryRefresh(refreshToken: string): Promise<AuthTokens | null> {
  try {
    return await callApi<AuthTokens>("POST", "/auth/refresh", { body: { refreshToken } });
  } catch {
    return null;
  }
}

/**
 * Persiste os tokens renovados. Em Route Handlers/Server Actions os cookies são
 * graváveis; durante o render de um Server Component a gravação lança — nesse
 * caso seguimos com o token novo só nesta requisição (best-effort). O refresh
 * definitivo via middleware é hardening posterior.
 */
async function persistBestEffort(tokens: AuthTokens): Promise<void> {
  try {
    await setSessionCookies(tokens);
  } catch {
    /* render context: cookies read-only — ignorado de propósito */
  }
}

/**
 * Chamada **autenticada**: usa o access token do cookie. Sem sessão → redireciona
 * ao login. Num 401, renova e repete uma vez; se a renovação falhar, encerra a
 * sessão e manda ao login.
 */
export async function serverApi<T>(
  method: HttpMethod,
  path: string,
  options: Omit<ApiCallOptions, "token"> = {},
): Promise<T> {
  const session = await getSession();
  if (!session) {
    redirect(LOGIN_PATH);
  }

  let res = await rawFetch(method, path, { ...options, token: session.accessToken });

  if (res.status === 401) {
    const refreshed = await tryRefresh(session.refreshToken);
    if (!refreshed) {
      await clearSessionCookies();
      redirect(LOGIN_PATH);
    }
    await persistBestEffort(refreshed);
    res = await rawFetch(method, path, { ...options, token: refreshed.accessToken });
  }

  const json: unknown = await res.json().catch(() => null);
  return unwrapEnvelope<T>(json, res.status);
}
