import type { SearchProfessionalsResult } from "@obracerta/shared";
import { handle, jsonError, jsonOk } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: busca de profissionais para o autocomplete do novo pedido.
 * Repassa só os parâmetros seguros (q/especialidade/limit) à API.
 */
export function GET(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const url = new URL(request.url);
    const qs = new URLSearchParams();
    for (const key of ["q", "especialidade", "limit"]) {
      const value = url.searchParams.get(key);
      if (value) qs.set(key, value);
    }
    const result = await serverApi<SearchProfessionalsResult>(
      "GET",
      `/search/professionals?${qs.toString()}`,
    );
    return jsonOk(result);
  });
}
