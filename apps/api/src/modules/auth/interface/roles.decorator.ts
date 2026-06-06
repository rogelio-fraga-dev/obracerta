import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@obracerta/shared";

/** Chave de metadata onde o `@Roles(...)` guarda os papéis exigidos pela rota. */
export const ROLES_KEY = "required_roles";

/**
 * Marca uma rota como restrita a papéis administrativos. Use junto com
 * `@UseGuards(JwtAuthGuard, RolesGuard)`. Ex.: `@Roles(UserRole.ADMIN, UserRole.MODERADOR)`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
