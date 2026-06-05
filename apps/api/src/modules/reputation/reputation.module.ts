import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BookingModule } from "../booking/booking.module.js";
import { ReputationScheduler, REVIEW_REVEAL_QUEUE } from "./application/reputation.scheduler.js";
import { ReputationService } from "./application/reputation.service.js";
import { REVIEW_REPOSITORY } from "./domain/ports/review.repository.js";
import { BADGE_REPOSITORY } from "./domain/ports/badge.repository.js";
import { REVIEW_RESPONSE_REPOSITORY } from "./domain/ports/review-response.repository.js";
import { DrizzleReviewRepository } from "./infrastructure/drizzle-review.repository.js";
import { DrizzleBadgeRepository } from "./infrastructure/drizzle-badge.repository.js";
import { DrizzleReviewResponseRepository } from "./infrastructure/drizzle-review-response.repository.js";
import { ReputationRevealProcessor } from "./infrastructure/reputation-reveal.processor.js";
import { ReputationController } from "./interface/reputation.controller.js";

/**
 * Reputação (roadmap §4.3/§12, Etapa 3.1). Avaliação dupla-cega com revelação
 * simultânea (par) ou por janela de 7d (fila BullMQ). Importa BookingModule
 * (autorização por participante + estado CONCLUIDO) e AuditModule (trilha).
 */
@Module({
  imports: [
    AuthModule,
    BookingModule,
    AuditModule,
    BullModule.registerQueue({ name: REVIEW_REVEAL_QUEUE }),
  ],
  controllers: [ReputationController],
  providers: [
    ReputationService,
    ReputationScheduler,
    ReputationRevealProcessor,
    { provide: REVIEW_REPOSITORY, useClass: DrizzleReviewRepository },
    { provide: BADGE_REPOSITORY, useClass: DrizzleBadgeRepository },
    { provide: REVIEW_RESPONSE_REPOSITORY, useClass: DrizzleReviewResponseRepository },
  ],
  exports: [ReputationService],
})
export class ReputationModule {}
