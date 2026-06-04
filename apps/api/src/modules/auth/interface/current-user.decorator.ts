import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtClaims } from "@obracerta/shared";
import type { AuthedRequest } from "./jwt-auth.guard.js";

/**
 * Injeta os claims do usuário autenticado num handler protegido:
 * `meuMetodo(@CurrentUser() user: JwtClaims)`. Requer `JwtAuthGuard` na rota.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtClaims | undefined => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.user;
  },
);
