import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  type BookingMessage,
  createBookingMessageSchema,
  type CreateBookingMessageInput,
  type JwtClaims,
  uuidSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { BookingChatService } from "../application/booking-chat.service.js";

/** Chat do pedido (participantes, pós-aceite). */
@Controller("bookings/:id/mensagens")
@UseGuards(JwtAuthGuard)
export class BookingChatController {
  constructor(private readonly chat: BookingChatService) {}

  /** Mensagens do pedido em ordem cronológica. */
  @Get()
  list(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<BookingMessage[]> {
    return this.chat.list(user.sub, id);
  }

  /** Envia uma mensagem no chat do pedido. */
  @Post()
  send(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(createBookingMessageSchema)) body: CreateBookingMessageInput,
  ): Promise<BookingMessage> {
    return this.chat.send(user.sub, id, body.texto);
  }
}
