import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { EngagementScheduler, ENGAGEMENT_QUEUE } from "./application/engagement.scheduler.js";
import { EngagementService } from "./application/engagement.service.js";
import { ENGAGEMENT_REPOSITORY } from "./domain/ports/engagement.repository.js";
import { DrizzleEngagementRepository } from "./infrastructure/drizzle-engagement.repository.js";
import { EngagementProcessor } from "./infrastructure/engagement.processor.js";

/**
 * Lembretes diários de engajamento (job BullMQ): pedido expirando, perfil
 * incompleto e agenda vazia — com dedupe anti-spam. Leituras read-only dos
 * domínios; a escrita é só no inbox de notificações.
 */
@Module({
  imports: [BullModule.registerQueue({ name: ENGAGEMENT_QUEUE })],
  providers: [
    EngagementService,
    EngagementScheduler,
    EngagementProcessor,
    { provide: ENGAGEMENT_REPOSITORY, useClass: DrizzleEngagementRepository },
  ],
})
export class EngagementModule {}
