import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import {
  WorkOrderScheduler,
  WORK_ORDER_EXPIRY_QUEUE,
} from "./application/work-order.scheduler.js";
import { WorkOrderService } from "./application/work-order.service.js";
import { WORK_ORDER_REPOSITORY } from "./domain/ports/work-order.repository.js";
import { PROPOSAL_REPOSITORY } from "./domain/ports/proposal.repository.js";
import { DrizzleWorkOrderRepository } from "./infrastructure/drizzle-work-order.repository.js";
import { DrizzleProposalRepository } from "./infrastructure/drizzle-proposal.repository.js";
import { WorkOrderExpiryProcessor } from "./infrastructure/work-order-expiry.processor.js";
import { WorkOrderController } from "./interface/work-order.controller.js";

/**
 * Obras e lances sigilosos (roadmap §16, Etapa 5.3). Abrir obra (expiração por
 * urgência via BullMQ), lance ≥ piso de dignidade, sigilo dos lances e adjudicação.
 * Importa UsersModule (valida tipo) e AuditModule (trilha).
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    AuditModule,
    BullModule.registerQueue({ name: WORK_ORDER_EXPIRY_QUEUE }),
  ],
  controllers: [WorkOrderController],
  providers: [
    WorkOrderService,
    WorkOrderScheduler,
    WorkOrderExpiryProcessor,
    { provide: WORK_ORDER_REPOSITORY, useClass: DrizzleWorkOrderRepository },
    { provide: PROPOSAL_REPOSITORY, useClass: DrizzleProposalRepository },
  ],
  exports: [WorkOrderService],
})
export class WorkOrdersModule {}
