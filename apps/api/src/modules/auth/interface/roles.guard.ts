import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@obracerta/shared";
import { UsersService } from "../../users/application/users.service.js";
import { hasAnyRole } from "../domain/roles.js";
import { ROLES_KEY } from "./roles.decorator.js";
import type { AuthedRequest } from "./jwt-auth.guard.js";

/**
 * Guard de autorização por papel. Roda DEPOIS do `JwtAuthGuard` (que anexa
 * `request.user`): lê os papéis exigidos pelo `@Roles(...)` e consulta os papéis
 * atuais do usuário no banco (sempre fresco — revogar admin vale na hora). Sem
 * `@Roles`, libera. A decisão fica no domínio (`hasAnyRole`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const userId = request.user?.sub;
    if (!userId) throw new ForbiddenException("Autenticação necessária.");

    const roles = await this.users.getRoles(userId);
    if (!hasAnyRole(roles, required)) {
      throw new ForbiddenException("Você não tem permissão para esta ação.");
    }
    return true;
  }
}
