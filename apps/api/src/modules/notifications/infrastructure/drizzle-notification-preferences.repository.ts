import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { NotificationType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { notificationPreferences } from "../../../infrastructure/database/schema/notification-preferences.js";
import type { NotificationPreferencesRepository } from "../domain/ports/notification-preferences.repository.js";

@Injectable()
export class DrizzleNotificationPreferencesRepository
  implements NotificationPreferencesRepository
{
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listForUser(
    userId: string,
  ): Promise<{ tipo: NotificationType; pushEnabled: boolean }[]> {
    const rows = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return rows.map((r) => ({ tipo: r.tipo as NotificationType, pushEnabled: r.pushEnabled }));
  }

  async isPushEnabled(userId: string, tipo: NotificationType): Promise<boolean> {
    const [row] = await this.db
      .select({ pushEnabled: notificationPreferences.pushEnabled })
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.tipo, tipo),
        ),
      )
      .limit(1);
    // Ausência de linha = padrão habilitado.
    return row ? row.pushEnabled : true;
  }

  async upsert(userId: string, tipo: NotificationType, pushEnabled: boolean): Promise<void> {
    await this.db
      .insert(notificationPreferences)
      .values({ userId, tipo, pushEnabled })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.tipo],
        set: { pushEnabled, atualizadoEm: new Date() },
      });
  }
}
