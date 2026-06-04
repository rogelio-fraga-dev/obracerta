import { Injectable, Logger } from "@nestjs/common";
import type {
  NotificationChannel,
  NotificationProvider,
} from "../domain/notification.provider.js";

/**
 * Adapter de desenvolvimento: "envia" logando no console. Permite exercitar OTP
 * e onboarding em localhost sem WhatsApp/SMS reais. Em produção, trocado pelos
 * adapters de WhatsApp Cloud API / SMS (mesma porta).
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger("Notify");

  sendOtp(to: string, code: string, channel: NotificationChannel = "whatsapp"): Promise<void> {
    this.logger.log(`[${channel}] OTP para ${to}: ${code}`);
    return Promise.resolve();
  }

  sendMessage(to: string, text: string, channel: NotificationChannel = "whatsapp"): Promise<void> {
    this.logger.log(`[${channel}] Mensagem para ${to}: ${text}`);
    return Promise.resolve();
  }
}
