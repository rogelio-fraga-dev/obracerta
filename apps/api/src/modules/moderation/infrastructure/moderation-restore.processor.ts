import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ModerationService } from "../application/moderation.service.js";
import {
  MODERATION_RESTORE_QUEUE,
  type ModerationRestoreJobData,
} from "../application/moderation.scheduler.js";

/**
 * Worker que encerra a ocultação precaucional de 48h. Se a denúncia ainda está
 * ABERTA (não decidida), restaura o conteúdo e a move para EM_ANALISE. Idempotente:
 * se a moderação já decidiu, não faz nada.
 */
@Processor(MODERATION_RESTORE_QUEUE)
export class ModerationRestoreProcessor extends WorkerHost {
  private readonly logger = new Logger(ModerationRestoreProcessor.name);

  constructor(private readonly moderation: ModerationService) {
    super();
  }

  async process(job: Job<ModerationRestoreJobData>): Promise<void> {
    const restored = await this.moderation.liftPrecautionaryHide(job.data.reportId);
    if (restored) {
      this.logger.log(
        `Ocultação precaucional da denúncia ${job.data.reportId} expirou (sem decisão em 48h).`,
      );
    }
  }
}
