import { z } from "zod";
import { userRoleSchema } from "./enums.js";

/**
 * Contratos administrativos (roadmap Fase 6). Definição dos papéis de um usuário
 * (substitui o conjunto inteiro — idempotente). Ação restrita a ADMIN (RolesGuard).
 */
export const setUserRolesSchema = z.object({
  roles: z.array(userRoleSchema).max(3),
});
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;
