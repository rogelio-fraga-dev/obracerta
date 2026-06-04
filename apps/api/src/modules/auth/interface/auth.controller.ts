import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  type AuthResult,
  type AuthTokens,
  type JwtClaims,
  type OtpRequestInput,
  type OtpRequestResult,
  otpRequestSchema,
  type OtpVerifyInput,
  otpVerifySchema,
  type RefreshInput,
  refreshSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { AuthService } from "../application/auth.service.js";
import { CurrentUser } from "./current-user.decorator.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

/**
 * Endpoints de autenticação por OTP (roadmap §6). O envelope de resposta é
 * aplicado globalmente; a validação de input usa os schemas Zod do shared.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Solicita OTP. Rate-limited (anti-abuso, roadmap §9): 3 req / 60s por IP. */
  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestInput,
  ): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body.whatsapp);
  }

  /** Valida o OTP → login (se já cadastrado) ou sinaliza cadastro pendente. */
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyInput,
  ): Promise<AuthResult> {
    return this.auth.verifyOtp(body.whatsapp, body.code);
  }

  /** Renova o par de tokens (rotaciona o refresh). */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken);
  }

  /** Encerra a sessão (revoga o refresh). */
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }

  /** Retorna os claims do usuário autenticado (sanity check do access token). */
  @Post("me")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtClaims): JwtClaims {
    return user;
  }
}
