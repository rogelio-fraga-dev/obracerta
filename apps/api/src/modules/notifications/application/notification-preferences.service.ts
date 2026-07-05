import { Inject, Injectable } from "@nestjs/common";
import {
  type NotificationPreference,
  type NotificationType,
  notificationTypeSchema,
} from "@obracerta/shared";
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from "../domain/ports/notification-preferences.repository.js";

/** Todas as categorias conhecidas (fonte: o enum do shared). */
const ALL_TYPES = notificationTypeSchema.options;

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly repo: NotificationPreferencesRepository,
  ) {}

  /** Preferências completas (toda categoria; ausência = habilitado). */
  async list(userId: string): Promise<NotificationPreference[]> {
    const stored = await this.repo.listForUser(userId);
    const byTipo = new Map(stored.map((s) => [s.tipo, s.pushEnabled]));
    return ALL_TYPES.map((tipo) => ({ tipo, pushEnabled: byTipo.get(tipo) ?? true }));
  }

  set(userId: string, tipo: NotificationType, pushEnabled: boolean): Promise<void> {
    return this.repo.upsert(userId, tipo, pushEnabled);
  }

  isPushEnabled(userId: string, tipo: NotificationType): Promise<boolean> {
    return this.repo.isPushEnabled(userId, tipo);
  }
}
