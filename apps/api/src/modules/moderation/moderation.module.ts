import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { ReputationModule } from "../reputation/reputation.module.js";
import {
  ModerationScheduler,
  MODERATION_RESTORE_QUEUE,
  SUSPENSION_LIFT_QUEUE,
} from "./application/moderation.scheduler.js";
import { ModerationService } from "./application/moderation.service.js";
import { REPORT_REPOSITORY } from "./domain/ports/report.repository.js";
import { SUSPENSION_REPOSITORY } from "./domain/ports/suspension.repository.js";
import { DrizzleReportRepository } from "./infrastructure/drizzle-report.repository.js";
import { DrizzleSuspensionRepository } from "./infrastructure/drizzle-suspension.repository.js";
import { ModerationRestoreProcessor } from "./infrastructure/moderation-restore.processor.js";
import { SuspensionLiftProcessor } from "./infrastructure/suspension-lift.processor.js";
import { ModerationController } from "./interface/moderation.controller.js";

/**
 * Moderação (roadmap §13, Etapa 3.3). Denúncia → ocultar avaliação por 48h (job
 * BullMQ) → decisão; suspensão automática por reincidência + apelação. Importa
 * ReputationModule (ocultar/restaurar avaliações + achar o ofensor) e AuditModule.
 */
@Module({
  imports: [
    AuthModule,
    AuditModule,
    ReputationModule,
    BullModule.registerQueue({ name: MODERATION_RESTORE_QUEUE }),
    BullModule.registerQueue({ name: SUSPENSION_LIFT_QUEUE }),
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ModerationScheduler,
    ModerationRestoreProcessor,
    SuspensionLiftProcessor,
    { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
    { provide: SUSPENSION_REPOSITORY, useClass: DrizzleSuspensionRepository },
  ],
  exports: [ModerationService],
})
export class ModerationModule {}
