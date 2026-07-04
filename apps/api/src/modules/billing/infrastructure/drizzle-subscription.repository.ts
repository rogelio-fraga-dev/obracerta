import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, ne } from "drizzle-orm";
import type { ProfessionalPlan, Subscription, SubscriptionStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { subscriptions } from "../../../infrastructure/database/schema/subscriptions.js";
import type {
  CreateSubscriptionData,
  SubscriptionRepository,
} from "../domain/ports/subscription.repository.js";

type SubscriptionRow = typeof subscriptions.$inferSelect;

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    plano: row.plano as ProfessionalPlan,
    status: row.status as SubscriptionStatus,
    gateway: row.gateway,
    gatewayId: row.gatewayId,
    valorCentavos: row.valorCentavos,
    graceUntil: row.graceUntil ? row.graceUntil.toISOString() : null,
    proximaCobranca: row.proximaCobranca ? row.proximaCobranca.toISOString() : null,
    canceladoEm: row.canceladoEm ? row.canceladoEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const [row] = await this.db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        plano: data.plano,
        gateway: data.gateway,
        gatewayId: data.gatewayId,
        valorCentavos: data.valorCentavos,
        graceUntil: new Date(data.graceUntil),
        proximaCobranca: new Date(data.proximaCobranca),
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a assinatura.");
    return rowToSubscription(row);
  }

  async findById(id: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return row ? rowToSubscription(row) : null;
  }

  async findActiveByUser(userId: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), ne(subscriptions.status, "CANCELADA")))
      .limit(1);
    return row ? rowToSubscription(row) : null;
  }

  async activate(id: string): Promise<Subscription | null> {
    const [row] = await this.db
      .update(subscriptions)
      .set({ status: "ATIVA", atualizadoEm: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return row ? rowToSubscription(row) : null;
  }

  async cancel(id: string): Promise<Subscription | null> {
    const now = new Date();
    const [row] = await this.db
      .update(subscriptions)
      .set({ status: "CANCELADA", canceladoEm: now, atualizadoEm: now })
      .where(eq(subscriptions.id, id))
      .returning();
    return row ? rowToSubscription(row) : null;
  }

  async changePlan(id: string, plano: string, valorCentavos: number): Promise<Subscription | null> {
    const [row] = await this.db
      .update(subscriptions)
      .set({ plano, valorCentavos, atualizadoEm: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return row ? rowToSubscription(row) : null;
  }

  async setProximaCobranca(id: string, proximaCobranca: string): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({ proximaCobranca: new Date(proximaCobranca), atualizadoEm: new Date() })
      .where(eq(subscriptions.id, id));
  }

  async findLastByUser(userId: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.criadoEm))
      .limit(1);
    return row ? rowToSubscription(row) : null;
  }
}
