import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { AppConfig } from "../../config/configuration.js";
import { UsersModule } from "../users/users.module.js";
import { AuthService } from "./application/auth.service.js";
import { OtpService } from "./application/otp.service.js";
import { TokenService } from "./application/token.service.js";
import { AuthController } from "./interface/auth.controller.js";
import { JwtAuthGuard } from "./interface/jwt-auth.guard.js";
import { RolesGuard } from "./interface/roles.guard.js";

/**
 * Módulo de autenticação (roadmap §6). OTP → JWT (access) + refresh em Redis.
 * O provedor de notificação é plugável (porta): dev usa console; prod, WhatsApp/SMS.
 */
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get("jwtSecret", { infer: true }),
        signOptions: { expiresIn: config.get("jwtAccessTtl", { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService, JwtAuthGuard, RolesGuard],
  // Re-exporta UsersModule: módulos que usam o RolesGuard (via @UseGuards) precisam
  // do UsersService em escopo, pois o Nest re-resolve o guard no módulo consumidor.
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AuthService, OtpService, UsersModule],
})
export class AuthModule {}
