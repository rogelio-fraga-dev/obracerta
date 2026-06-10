import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards, UseInterceptors, UploadedFile, ParseFilePipeBuilder } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  type AuthResult,
  type AuthTokens,
  type CadastroResult,
  type JwtClaims,
  type LoginInput,
  loginSchema,
  type OtpRequestInput,
  type OtpRequestResult,
  otpRequestSchema,
  type OtpVerifyInput,
  otpVerifySchema,
  type RefreshInput,
  refreshSchema,
  type UpdateProfileInput,
  updateProfileSchema,
  type UpdatePasswordInput,
  updatePasswordSchema,
} from "@obracerta/shared";
import { FileInterceptor } from "@nestjs/platform-express";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { UsersService } from "../../users/application/users.service.js";
import { AuthService } from "../application/auth.service.js";
import { CurrentUser } from "./current-user.decorator.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

/**
 * Endpoints de autenticação por OTP (roadmap §6). O envelope de resposta é
 * aplicado globalmente; a validação de input usa os schemas Zod do shared.
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

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

  /** Login "conta normal" (e-mail + senha). Rate-limited contra brute force. */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  loginWithPassword(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
  ): Promise<CadastroResult> {
    return this.auth.loginWithPassword(body.email, body.password);
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

  /** Papéis administrativos do próprio usuário autenticado (gating de UI, não-segredo). */
  @Get("me/roles")
  @UseGuards(JwtAuthGuard)
  async myRoles(@CurrentUser() user: JwtClaims): Promise<{ roles: string[] }> {
    return { roles: await this.users.getRoles(user.sub) };
  }

  /** Retorna os dados completos do usuário logado */
  @Get("me/profile")
  @UseGuards(JwtAuthGuard)
  getProfileData(@CurrentUser() user: JwtClaims) {
    return this.users.findById(user.sub);
  }

  /** Atualiza perfil básico (nome, email) */
  @Put("me/profile")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.users.updateProfile(user.sub, body);
  }

  /** Atualiza senha */
  @Put("me/password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(updatePasswordSchema)) body: UpdatePasswordInput,
  ) {
    await this.auth.updatePassword(user.sub, body.oldPassword, body.newPassword);
  }

  /** Upload de foto de perfil (qualquer usuário logado) */
  @Post("me/foto")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadFoto(
    @CurrentUser() user: JwtClaims,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: ".(png|jpeg|jpg|webp)" })
        .addMaxSizeValidator({ maxSize: 1024 * 1024 * 5 }) // 5MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    return this.users.uploadFoto(user.sub, file);
  }
}
