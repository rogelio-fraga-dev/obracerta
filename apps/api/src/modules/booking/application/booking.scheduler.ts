import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const BOOKING_EXPIRY_QUEUE = "booking-expiry";

/** Payload do job de expiração de um pedido. */
export interface BookingExpiryJobData {
  bookingId: string;
}

/**
 * Agenda a expiração de um pedido PENDENTE numa fila durável (BullMQ/Redis).
 * `jobId` determinístico = idempotente (recriar o pedido não duplica o job).
 * O delay é a distância até `expiraEm`; quando dispara, o worker expira o pedido
 * se (e só se) ainda estiver PENDENTE.
 */
@Injectable()
export class BookingScheduler {
  constructor(
    @InjectQueue(BOOKING_EXPIRY_QUEUE) private readonly queue: Queue<BookingExpiryJobData>,
  ) {}

  async scheduleExpiry(bookingId: string, expiraEm: string): Promise<void> {
    const delay = Math.max(0, Date.parse(expiraEm) - Date.now());
    await this.queue.add(
      "expire",
      { bookingId },
      {
        delay,
        jobId: `booking:expire:${bookingId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
