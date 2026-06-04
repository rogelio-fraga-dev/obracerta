import { Global, Module } from "@nestjs/common";
import { NOTIFICATION_PROVIDER } from "./domain/notification.provider.js";
import { ConsoleNotificationProvider } from "./infrastructure/console-notification.provider.js";

/**
 * Notificações (roadmap §22). @Global para que auth e onboarding injetem a porta
 * `NOTIFICATION_PROVIDER` sem reimportar. Dev usa console; prod, WhatsApp/SMS.
 */
@Global()
@Module({
  providers: [{ provide: NOTIFICATION_PROVIDER, useClass: ConsoleNotificationProvider }],
  exports: [NOTIFICATION_PROVIDER],
})
export class NotificationsModule {}
