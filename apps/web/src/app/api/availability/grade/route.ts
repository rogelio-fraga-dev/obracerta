import { type AvailabilitySlot, setAvailabilitySchema } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: substitui a grade semanal de disponibilidade inteira
 * (idempotente). O backend reprojeta o calendário a partir dela.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, setAvailabilitySchema);
    const slots = await serverApi<AvailabilitySlot[]>("PUT", "/availability/me", { body });
    return jsonOk(slots);
  });
}
