import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const REVIEW_REVEAL_QUEUE = "review-reveal";

/** Payload do job de revelação por janela de um pedido. */
export interface ReviewRevealJobData {
  bookingId: string;
}

/**
 * Agenda a revelação por janela (7d) das avaliações de um pedido numa fila durável
 * (BullMQ/Redis). `jobId` determinístico POR PEDIDO = idempotente: o segundo lado a
 * avaliar reagenda o mesmo job (não duplica). Quando dispara, o worker revela o que
 * estiver PENDENTE — seguro mesmo que o par já tenha sido revelado antes.
 */
@Injectable()
export class ReputationScheduler {
  constructor(
    @InjectQueue(REVIEW_REVEAL_QUEUE) private readonly queue: Queue<ReviewRevealJobData>,
  ) {}

  async scheduleReveal(bookingId: string, prazoEm: string): Promise<void> {
    const delay = Math.max(0, Date.parse(prazoEm) - Date.now());
    await this.queue.add(
      "reveal",
      { bookingId },
      {
        delay,
        jobId: `review:reveal:${bookingId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
