import { uuidSchema, userRoleSchema, z } from "@obracerta/shared";
import { handle, jsonError, jsonOk, parseBody } from "@/lib/bff";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const setRolesSchema = z.object({
  userId: uuidSchema,
  roles: z.array(userRoleSchema).max(3),
});

/**
 * BFF (admin): define os papéis de um usuário. A autorização ADMIN é checada no
 * backend (RolesGuard) — aqui só repassamos.
 */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await getSession())) {
      return jsonError("UNAUTHENTICATED", "Sessão expirada. Entre novamente.", 401);
    }
    const { userId, roles } = await parseBody(request, setRolesSchema);
    const result = await serverApi<{ roles: string[] }>("PUT", `/admin/users/${userId}/roles`, {
      body: { roles },
    });
    return jsonOk(result);
  });
}
