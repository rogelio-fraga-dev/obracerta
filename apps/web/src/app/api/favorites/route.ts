import { z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const toggleSchema = z.object({
  professionalId: z.string().uuid(),
  favoritar: z.boolean(),
});

/** BFF autenticado: favoritar/desfavoritar um profissional (toggle idempotente). */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, toggleSchema);
    const result = body.favoritar
      ? await serverApi<{ favorited: boolean }>("POST", "/favorites", {
          body: { professionalId: body.professionalId },
        })
      : await serverApi<{ favorited: boolean }>("DELETE", `/favorites/${body.professionalId}`);
    return jsonOk(result);
  });
}
