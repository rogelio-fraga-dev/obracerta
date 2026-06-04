import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { jwtClaimsSchema, type JwtClaims } from "@obracerta/shared";

/** Request com os claims do usuário autenticado anexados. */
export interface AuthedRequest extends Request {
  user?: JwtClaims;
}

/**
 * Guard de rota: exige um access token (Bearer) válido e anexa os claims em
 * `request.user`. Rotas protegidas usam `@UseGuards(JwtAuthGuard)`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractBearer(request);
    if (!token) {
      throw new UnauthorizedException("Token de acesso ausente.");
    }

    try {
      const payload: unknown = await this.jwt.verifyAsync(token);
      request.user = jwtClaimsSchema.parse(payload);
      return true;
    } catch {
      throw new UnauthorizedException("Token de acesso inválido ou expirado.");
    }
  }

  private extractBearer(request: AuthedRequest): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice("Bearer ".length).trim() || null;
  }
}
