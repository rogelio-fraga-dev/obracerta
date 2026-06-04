import type { ApiResponse } from "@obracerta/shared";
import { config } from "./config";

/**
 * Client HTTP fino para a API. Desembrulha o envelope `{ success, data, error }`
 * (mesmo contrato do back) e lança o erro com a mensagem do servidor.
 */
async function request<T>(
  method: "POST" | "PATCH" | "GET",
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error?.message ?? "Erro inesperado.");
  }
  return json.data;
}

export const api = {
  post: <T>(path: string, body?: unknown, token?: string) => request<T>("POST", path, body, token),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>("PATCH", path, body, token),
  get: <T>(path: string, token?: string) => request<T>("GET", path, undefined, token),
};
