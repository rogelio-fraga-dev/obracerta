import { uuidSchema, z, type Report } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const schema = z.object({ reportId: uuidSchema, procedente: z.boolean() });

/** BFF (moderador): decide uma denúncia. Autorização MODERADOR/ADMIN no backend. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { reportId, procedente } = await parseBody(request, schema);
    const report = await serverApi<Report>("POST", `/reports/${reportId}/resolve`, {
      body: { procedente },
    });
    return jsonOk(report);
  });
}
