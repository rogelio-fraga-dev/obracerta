import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  createSupportTicketSchema,
  type CreateSupportTicketInput,
  type JwtClaims,
  type SupportTicket,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { SupportService } from "../application/support.service.js";

/** Chamados de suporte do usuário autenticado (central de ajuda). */
@Controller("support/tickets")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  /** Abre um chamado. */
  @Post()
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createSupportTicketSchema)) body: CreateSupportTicketInput,
  ): Promise<SupportTicket> {
    return this.support.create(user.sub, body);
  }

  /** Meus chamados (mais recentes primeiro). */
  @Get("me")
  mine(@CurrentUser() user: JwtClaims, @Query() _q: unknown): Promise<SupportTicket[]> {
    return this.support.listMine(user.sub);
  }
}
