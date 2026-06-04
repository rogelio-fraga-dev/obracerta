import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import type { AppConfig } from "../../config/configuration.js";
import { UsersModule } from "../users/users.module.js";
import { AuthService } from "./application/auth.service.js";
import { OtpService } from "./application/otp.service.js";
import { TokenService } from "./application/token.service.js";
import { AuthController } from "./interface/auth.controller.js";
import { JwtAuthGuard } from "./interface/jwt-auth.guard.js";

/**
 * Módulo de autenticação (roadmap §6). OTP → JWT (access) + refresh em Redis.
 * O provedor de notificação é plugável (porta): dev usa console; prod, WhatsApp/SMS.
 */
@Module({
  imports: [
    UsersModule,
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 10 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get("jwtSecret", { infer: true }),
        signOptions: { expiresIn: config.get("jwtAccessTtl", { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard, AuthService, OtpService],
})
export class AuthModule {}
