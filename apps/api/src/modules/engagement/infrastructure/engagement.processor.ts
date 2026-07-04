import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { EngagementService } from "../application/engagement.service.js";
import { ENGAGEMENT_QUEUE } from "../application/engagement.scheduler.js";

/** Worker do job diário de lembretes de engajamento. */
@Processor(ENGAGEMENT_QUEUE)
export class EngagementProcessor extends WorkerHost {
  private readonly logger = new Logger(EngagementProcessor.name);

  constructor(private readonly engagement: EngagementService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    this.logger.log("Rodando lembretes diários de engajamento…");
    await this.engagement.runDaily();
  }
}
