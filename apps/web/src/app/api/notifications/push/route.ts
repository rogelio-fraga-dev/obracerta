import { type PushPublicKey, pushSubscribeSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

/** BFF: chave pública VAPID (null = push desabilitado no servidor). */
export function GET() {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const key = await serverApi<PushPublicKey>("GET", "/notifications/push/public-key");
    return jsonOk(key);
  });
}

/** BFF: registra a inscrição de push deste browser. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, pushSubscribeSchema);
    const result = await serverApi<{ subscribed: true }>("POST", "/notifications/push/subscribe", {
      body,
    });
    return jsonOk(result);
  });
}

/** BFF: remove a inscrição de push deste browser. */
export function DELETE(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, unsubscribeSchema);
    const result = await serverApi<{ subscribed: false }>(
      "DELETE",
      "/notifications/push/subscribe",
      { body },
    );
    return jsonOk(result);
  });
}
