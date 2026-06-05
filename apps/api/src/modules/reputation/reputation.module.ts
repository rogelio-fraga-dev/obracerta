import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BookingModule } from "../booking/booking.module.js";
import { ReputationScheduler, REVIEW_REVEAL_QUEUE } from "./application/reputation.scheduler.js";
import { ReputationService } from "./application/reputation.service.js";
import { REVIEW_REPOSITORY } from "./domain/ports/review.repository.js";
import { DrizzleReviewRepository } from "./infrastructure/drizzle-review.repository.js";
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
  ],
  exports: [ReputationService],
})
export class ReputationModule {}
