import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { WorkOrdersModule } from "../work-orders/work-orders.module.js";
import { WorkOrderChatService } from "./application/work-order-chat.service.js";
import { WORK_ORDER_CHAT_REPOSITORY } from "./domain/ports/work-order-chat.repository.js";
import { DrizzleWorkOrderChatRepository } from "./infrastructure/drizzle-work-order-chat.repository.js";
import { WorkOrderChatController } from "./interface/work-order-chat.controller.js";

/** Chat da obra: conversa centralizada, aberta com a adjudicação. */
@Module({
  imports: [AuthModule, WorkOrdersModule],
  controllers: [WorkOrderChatController],
  providers: [
    WorkOrderChatService,
    { provide: WORK_ORDER_CHAT_REPOSITORY, useClass: DrizzleWorkOrderChatRepository },
  ],
})
export class WorkOrderChatModule {}
