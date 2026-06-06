import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { ReputationEvent } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { reputationEvents } from "../../../infrastructure/database/schema/reputation-events.js";
import type {
  CreateReputationEventData,
  ReputationEventRepository,
} from "../domain/ports/reputation-event.repository.js";

type ReputationEventRow = typeof reputationEvents.$inferSelect;

export function rowToReputationEvent(row: ReputationEventRow): ReputationEvent {
  return {
    id: row.id,
    userId: row.userId,
    tipo: row.tipo,
    referenciaId: row.referenciaId,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleReputationEventRepository implements ReputationEventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async append(data: CreateReputationEventData): Promise<ReputationEvent> {
    const [row] = await this.db
      .insert(reputationEvents)
      .values({
        userId: data.userId,
        tipo: data.tipo,
        referenciaId: data.referenciaId,
        dados: data.dados,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar o evento de reputação.");
    return rowToReputationEvent(row);
  }

  async listForUser(userId: string): Promise<ReputationEvent[]> {
    const rows = await this.db
      .select()
      .from(reputationEvents)
      .where(eq(reputationEvents.userId, userId))
      .orderBy(desc(reputationEvents.seq));
    return rows.map(rowToReputationEvent);
  }
}
