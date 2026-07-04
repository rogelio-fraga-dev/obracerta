import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import type { Notification, NotificationType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { notifications } from "../../../infrastructure/database/schema/notifications.js";
import type {
  CreateNotificationData,
  NotificationsRepository,
} from "../domain/ports/notifications.repository.js";

type NotificationRow = typeof notifications.$inferSelect;

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    tipo: row.tipo as NotificationType,
    titulo: row.titulo,
    corpo: row.corpo,
    link: row.link,
    lida: row.lida,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleNotificationsRepository implements NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const [row] = await this.db
      .insert(notifications)
      .values({
        userId: data.userId,
        tipo: data.tipo,
        titulo: data.titulo,
        corpo: data.corpo ?? null,
        link: data.link ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a notificação.");
    return rowToNotification(row);
  }

  async listForUser(userId: string, limit: number): Promise<Notification[]> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.criadoEm))
      .limit(limit);
    return rows.map(rowToNotification);
  }

  async countUnread(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.lida, false)));
    return row?.total ?? 0;
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(notifications)
      .set({ lida: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return rows.length > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ lida: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.lida, false)));
  }
}
