import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createWorkOrderMessageSchema,
  type CreateWorkOrderMessageInput,
  type JwtClaims,
  uuidSchema,
  type WorkOrderMessage,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { WorkOrderChatService } from "../application/work-order-chat.service.js";

/** Chat da obra (dono ↔ profissional vencedor, pós-adjudicação). */
@Controller("work-orders/:id/mensagens")
@UseGuards(JwtAuthGuard)
export class WorkOrderChatController {
  constructor(private readonly chat: WorkOrderChatService) {}

  /** Mensagens da obra em ordem cronológica. */
  @Get()
  list(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<WorkOrderMessage[]> {
    return this.chat.list(user.sub, id);
  }

  /** Envia uma mensagem no chat da obra. */
  @Post()
  send(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createWorkOrderMessageSchema)) body: CreateWorkOrderMessageInput,
  ): Promise<WorkOrderMessage> {
    return this.chat.send(user.sub, id, body.texto);
  }
}
