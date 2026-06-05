import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ReputationService } from "../application/reputation.service.js";
import {
  REVIEW_REVEAL_QUEUE,
  type ReviewRevealJobData,
} from "../application/reputation.scheduler.js";

/**
 * Worker que revela as avaliações PENDENTE de um pedido quando a janela de 7d
 * fecha. Idempotente: se o par já foi revelado na hora (ambos avaliaram), revela
 * zero — então é seguro rodar mesmo após a revelação simultânea.
 */
@Processor(REVIEW_REVEAL_QUEUE)
export class ReputationRevealProcessor extends WorkerHost {
  private readonly logger = new Logger(ReputationRevealProcessor.name);

  constructor(private readonly reputation: ReputationService) {
    super();
  }

  async process(job: Job<ReviewRevealJobData>): Promise<void> {
    const revealed = await this.reputation.revealForBooking(job.data.bookingId);
    if (revealed > 0) {
      this.logger.log(
        `Avaliações do pedido ${job.data.bookingId} reveladas por janela (${revealed}).`,
      );
    }
  }
}
