import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthResult, AuthTokens, OtpRequestResult, User } from "@obracerta/shared";
import { UsersService } from "../../users/application/users.service.js";
import { canAuthenticate } from "../domain/account-status.js";
import { OtpService } from "./otp.service.js";
import { TokenService } from "./token.service.js";

/**
 * Orquestra o login por OTP (roadmap §6). Não conhece Redis/JWT diretamente —
 * delega para OtpService/TokenService e consulta usuários via UsersService.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {}

  requestOtp(whatsapp: string): Promise<OtpRequestResult> {
    return this.otp.request(whatsapp);
  }

  /** Emite tokens para um usuário (ex.: auto-login após o cadastro). */
  login(user: User): Promise<AuthTokens> {
    return this.tokens.issue(user);
  }

  /**
   * Valida o OTP. Se o usuário já existe → login (tokens + user). Se não existe →
   * `registered: false` e o WhatsApp fica marcado como verificado para o cadastro
   * (fatia 1.2) prosseguir sem novo OTP.
   */
  async verifyOtp(whatsapp: string, code: string): Promise<AuthResult> {
    await this.otp.verify(whatsapp, code);

    const user = await this.users.findByWhatsapp(whatsapp);
    if (!user) {
      return { registered: false };
    }
    this.assertActive(user);

    const tokens = await this.tokens.issue(user);
    return { registered: true, user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const userId = await this.tokens.consumeRefresh(refreshToken);
    if (!userId) {
      throw new UnauthorizedException("Sessão inválida ou expirada.");
    }
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado.");
    }
    this.assertActive(user);
    return this.tokens.issue(user);
  }

  /** Bloqueia o login de conta não-ATIVA (suspensa/removida). */
  private assertActive(user: User): void {
    if (!canAuthenticate(user.status)) {
      throw new ForbiddenException("Sua conta está suspensa.");
    }
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }
}
