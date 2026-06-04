import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { OtpRequestResult } from "@obracerta/shared";
import type { AppConfig } from "../../../config/configuration.js";
import { RedisService } from "../../../infrastructure/cache/redis.service.js";
import { generateOtpCode, otpKeys } from "../domain/otp.js";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../domain/ports/notification.provider.js";

/**
 * Fluxo de OTP sobre Redis (TTL curto) + provedor de notificação.
 * Defesas: TTL no código, limite de tentativas (anti-brute force, roadmap §9).
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService<AppConfig, true>,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifications: NotificationProvider,
  ) {}

  /** Gera, armazena e envia um código; zera tentativas anteriores. */
  async request(whatsapp: string): Promise<OtpRequestResult> {
    const ttl = this.config.get("otpTtlSeconds", { infer: true });
    const code = generateOtpCode();

    await this.redis.client.set(otpKeys.code(whatsapp), code, "EX", ttl);
    await this.redis.client.del(otpKeys.attempts(whatsapp));
    await this.notifications.sendOtp(whatsapp, code);

    return { expiresInSeconds: ttl };
  }

  /** Valida o código; em sucesso marca o WhatsApp como verificado (p/ cadastro). */
  async verify(whatsapp: string, code: string): Promise<void> {
    const stored = await this.redis.client.get(otpKeys.code(whatsapp));
    if (!stored) {
      throw new UnauthorizedException("Código expirado ou inexistente. Solicite outro.");
    }

    const maxAttempts = this.config.get("otpMaxAttempts", { infer: true });
    const attempts = await this.redis.client.incr(otpKeys.attempts(whatsapp));
    if (attempts > maxAttempts) {
      await this.redis.client.del(otpKeys.code(whatsapp));
      throw new UnauthorizedException("Muitas tentativas. Solicite um novo código.");
    }

    if (stored !== code) {
      throw new UnauthorizedException("Código inválido.");
    }

    const ttl = this.config.get("otpTtlSeconds", { infer: true });
    await this.redis.client.del(otpKeys.code(whatsapp), otpKeys.attempts(whatsapp));
    await this.redis.client.set(otpKeys.verified(whatsapp), "1", "EX", ttl * 2);
  }

  /** Consome (one-shot) a marca de verificação — usada pelo cadastro (fatia 1.2). */
  async consumeVerified(whatsapp: string): Promise<boolean> {
    const removed = await this.redis.client.del(otpKeys.verified(whatsapp));
    return removed > 0;
  }
}
