import { unwrapEnvelope } from "@obracerta/shared";

/**
 * Client de browser do BFF. Chama os route handlers do **próprio** Next
 * (mesma origem, `/api/...`) — nunca a API direto. Os cookies httpOnly viajam
 * sozinhos; o JS nunca toca em token. Desembrulha o mesmo envelope da API.
 */
async function send<T>(method: "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json: unknown = await res.json().catch(() => null);
  return unwrapEnvelope<T>(json, res.status);
}

export const bff = {
  post: <T>(path: string, body?: unknown) => send<T>("POST", path, body),
};
