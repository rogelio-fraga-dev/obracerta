import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { NOTIFICATION_PROVIDER } from "./domain/notification.provider.js";
import { ConsoleNotificationProvider } from "./infrastructure/console-notification.provider.js";
import { NOTIFICATIONS_REPOSITORY } from "./domain/ports/notifications.repository.js";
import { PUSH_SUBSCRIPTIONS_REPOSITORY } from "./domain/ports/push-subscriptions.repository.js";
import { NOTIFICATION_PREFERENCES_REPOSITORY } from "./domain/ports/notification-preferences.repository.js";
import { DrizzleNotificationsRepository } from "./infrastructure/drizzle-notifications.repository.js";
import { DrizzlePushSubscriptionsRepository } from "./infrastructure/drizzle-push-subscriptions.repository.js";
import { DrizzleNotificationPreferencesRepository } from "./infrastructure/drizzle-notification-preferences.repository.js";
import { InboxService } from "./application/inbox.service.js";
import { PushService } from "./application/push.service.js";
import { NotificationPreferencesService } from "./application/notification-preferences.service.js";
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
    { provide: PUSH_SUBSCRIPTIONS_REPOSITORY, useClass: DrizzlePushSubscriptionsRepository },
    {
      provide: NOTIFICATION_PREFERENCES_REPOSITORY,
      useClass: DrizzleNotificationPreferencesRepository,
    },
    InboxService,
    PushService,
    NotificationPreferencesService,
  ],
  exports: [NOTIFICATION_PROVIDER, InboxService, PushService],
})
export class NotificationsModule {}
