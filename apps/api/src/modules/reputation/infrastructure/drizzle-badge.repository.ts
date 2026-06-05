import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { badges } from "../../../infrastructure/database/schema/badges.js";
import type { BadgeRepository } from "../domain/ports/badge.repository.js";

@Injectable()
export class DrizzleBadgeRepository implements BadgeRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listActiveCodes(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ codigo: badges.codigo })
      .from(badges)
      .where(and(eq(badges.userId, userId), isNull(badges.revogadoEm)));
    return rows.map((r) => r.codigo);
  }

  async grant(userId: string, codigo: string): Promise<void> {
    await this.db.insert(badges).values({ userId, codigo });
  }

  async revoke(userId: string, codigo: string): Promise<void> {
    await this.db
      .update(badges)
      .set({ revogadoEm: new Date() })
      .where(
        and(eq(badges.userId, userId), eq(badges.codigo, codigo), isNull(badges.revogadoEm)),
      );
  }
}
