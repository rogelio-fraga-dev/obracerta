import { UserRole } from "@obracerta/shared";

/**
 * Domínio puro de autorização por papel (roadmap Fase 6). Sem framework: decide se
 * um conjunto de papéis satisfaz o exigido. O `RolesGuard` aplica isto no HTTP.
 */

/**
 * True se o usuário pode acessar a rota. Regras:
 * - lista de exigidos vazia → liberado;
 * - **ADMIN é superusuário** → controle total, satisfaz qualquer exigência;
 * - caso contrário, basta ter ao menos um dos papéis exigidos.
 */
export function hasAnyRole(userRoles: string[], required: UserRole[]): boolean {
  if (required.length === 0) return true;
  if (userRoles.includes(UserRole.ADMIN)) return true;
  return required.some((r) => userRoles.includes(r));
}

/** Atalho: o usuário é ADMIN? */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes(UserRole.ADMIN);
}
