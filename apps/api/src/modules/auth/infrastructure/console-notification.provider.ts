import { Injectable, Logger } from "@nestjs/common";
import type {
  NotificationChannel,
  NotificationProvider,
} from "../domain/ports/notification.provider.js";

/**
 * Adapter de desenvolvimento: "envia" o OTP logando no console. Permite testar
 * o fluxo de login em localhost sem WhatsApp/SMS reais. Em produção, este
 * provider é trocado pelos adapters de WhatsApp Cloud API / SMS (mesma porta).
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger("OTP");

  sendOtp(to: string, code: string, channel: NotificationChannel = "whatsapp"): Promise<void> {
    this.logger.log(`[${channel}] OTP para ${to}: ${code}`);
    return Promise.resolve();
  }
}
