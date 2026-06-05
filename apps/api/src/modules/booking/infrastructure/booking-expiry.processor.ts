import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { BookingService } from "../application/booking.service.js";
import { BOOKING_EXPIRY_QUEUE, type BookingExpiryJobData } from "../application/booking.scheduler.js";

/**
 * Worker que expira pedidos PENDENTE quando o job de 24h dispara. A transição é
 * guardada (só expira se ainda PENDENTE), então é seguro o job rodar mesmo que o
 * pedido já tenha sido aprovado/recusado/cancelado nesse meio-tempo.
 */
@Processor(BOOKING_EXPIRY_QUEUE)
export class BookingExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingExpiryProcessor.name);

  constructor(private readonly bookings: BookingService) {
    super();
  }

  async process(job: Job<BookingExpiryJobData>): Promise<void> {
    const expired = await this.bookings.expireIfPending(job.data.bookingId);
    if (expired) {
      this.logger.log(`Pedido ${job.data.bookingId} expirado (24h sem resposta).`);
    }
  }
}
