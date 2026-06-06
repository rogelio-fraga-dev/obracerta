import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ModerationService } from "../application/moderation.service.js";
import {
  SUSPENSION_LIFT_QUEUE,
  type SuspensionLiftJobData,
} from "../application/moderation.scheduler.js";

/**
 * Worker do auto-lift de suspensão: no `fim_em`, expira a suspensão e reativa a
 * conta (roadmap §13). Idempotente — se a suspensão já foi revogada/expirada, não faz nada.
 */
@Processor(SUSPENSION_LIFT_QUEUE)
export class SuspensionLiftProcessor extends WorkerHost {
  private readonly logger = new Logger(SuspensionLiftProcessor.name);

  constructor(private readonly moderation: ModerationService) {
    super();
  }

  async process(job: Job<SuspensionLiftJobData>): Promise<void> {
    if (await this.moderation.liftSuspensionIfDue(job.data.suspensionId)) {
      this.logger.log(`Suspensão ${job.data.suspensionId} expirada (fim do prazo) e conta reativada.`);
    }
  }
}
