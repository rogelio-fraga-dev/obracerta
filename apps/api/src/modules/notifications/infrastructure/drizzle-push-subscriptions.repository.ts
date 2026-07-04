import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { pushSubscriptions } from "../../../infrastructure/database/schema/push-subscriptions.js";
import type {
  PushSubscriptionsRepository,
  StoredPushSubscription,
} from "../domain/ports/push-subscriptions.repository.js";

@Injectable()
export class DrizzlePushSubscriptionsRepository implements PushSubscriptionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async upsert(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void> {
    await this.db
      .insert(pushSubscriptions)
      .values({ userId, endpoint, p256dh, auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh, auth },
      });
  }

  async listForUser(userId: string): Promise<StoredPushSubscription[]> {
    const rows = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
    }));
  }

  async removeByEndpoint(endpoint: string): Promise<void> {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}
