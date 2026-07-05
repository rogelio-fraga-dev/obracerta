import type { NotificationType } from "@obracerta/shared";

/** Porta de saída das preferências de notificação (push por categoria). */
export interface NotificationPreferencesRepository {
  /** Preferências gravadas do usuário (ausência = padrão habilitado). */
  listForUser(userId: string): Promise<{ tipo: NotificationType; pushEnabled: boolean }[]>;
  /** Push habilitado para esta categoria? Sem linha gravada → true (padrão). */
  isPushEnabled(userId: string, tipo: NotificationType): Promise<boolean>;
  /** Grava (upsert) a preferência de uma categoria. */
  upsert(userId: string, tipo: NotificationType, pushEnabled: boolean): Promise<void>;
}

export const NOTIFICATION_PREFERENCES_REPOSITORY = Symbol("NOTIFICATION_PREFERENCES_REPOSITORY");
