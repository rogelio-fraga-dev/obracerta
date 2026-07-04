import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { NOTIFICATION_PROVIDER } from "./domain/notification.provider.js";
import { ConsoleNotificationProvider } from "./infrastructure/console-notification.provider.js";
import { NOTIFICATIONS_REPOSITORY } from "./domain/ports/notifications.repository.js";
import { DrizzleNotificationsRepository } from "./infrastructure/drizzle-notifications.repository.js";
import { InboxService } from "./application/inbox.service.js";
import { NotificationsController } from "./interface/notifications.controller.js";

/**
 * Notificações (roadmap §22). Duas camadas: o provedor **externo** (WhatsApp/SMS;
 * console em dev) e o **in-app** (sino + /notificacoes, persistido). @Global para
 * que os domínios injetem `NOTIFICATION_PROVIDER`/`InboxService` sem reimportar.
 * Importa AuthModule pelo JwtAuthGuard do controller (o auth NÃO importa este
 * módulo — injeta o provider via @Global — então não há ciclo).
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATION_PROVIDER, useClass: ConsoleNotificationProvider },
    { provide: NOTIFICATIONS_REPOSITORY, useClass: DrizzleNotificationsRepository },
    InboxService,
  ],
  exports: [NOTIFICATION_PROVIDER, InboxService],
})
export class NotificationsModule {}
