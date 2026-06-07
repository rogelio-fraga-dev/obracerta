import {
  type ProfessionalProfile,
  updateProfessionalProfileSchema,
} from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * BFF autenticado: atualiza o perfil profissional (especialidades/bairro/anos).
 * Usa o token do cookie via `serverApi` — o browser nunca o vê.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const body = await parseBody(request, updateProfessionalProfileSchema);
    const profile = await serverApi<ProfessionalProfile>("PATCH", "/profiles/professional/me", {
      body,
    });
    return jsonOk(profile);
  });
}
