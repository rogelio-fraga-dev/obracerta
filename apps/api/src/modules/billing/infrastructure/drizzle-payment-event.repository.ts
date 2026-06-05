import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { paymentEvents } from "../../../infrastructure/database/schema/payment-events.js";
import type {
  PaymentEventData,
  PaymentEventRepository,
} from "../domain/ports/payment-event.repository.js";

@Injectable()
export class DrizzlePaymentEventRepository implements PaymentEventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Insere o evento; `onConflictDoNothing` no UNIQUE(gateway, event_id) faz a
   * idempotência: se o webhook já foi registrado, nenhuma linha retorna → `false`.
   */
  async record(data: PaymentEventData): Promise<boolean> {
    const inserted = await this.db
      .insert(paymentEvents)
      .values({
        gateway: data.gateway,
        eventId: data.eventId,
        tipo: data.tipo,
        payload: data.payload,
      })
      .onConflictDoNothing({ target: [paymentEvents.gateway, paymentEvents.eventId] })
      .returning({ id: paymentEvents.id });
    return inserted.length > 0;
  }
}
