import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  type AdminSupportTicket,
  respondSupportTicketSchema,
  type RespondSupportTicketInput,
  supportStatusSchema,
  type SupportTicket,
  UserRole,
  uuidSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { SupportService } from "../application/support.service.js";

/** Gestão de chamados de suporte — painel administrativo. */
@Controller("admin/support/tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  /** Todos os chamados (filtro opcional por status), mais antigos primeiro. */
  @Get()
  list(@Query("status") status?: string): Promise<AdminSupportTicket[]> {
    const parsed = supportStatusSchema.safeParse(status);
    return this.support.listForAdmin(parsed.success ? parsed.data : null);
  }

  /** Responde um chamado (status → RESPONDIDO + aviso ao autor). */
  @Post(":id/respond")
  @HttpCode(HttpStatus.OK)
  respond(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(respondSupportTicketSchema)) body: RespondSupportTicketInput,
  ): Promise<SupportTicket> {
    return this.support.respond(id, body.resposta);
  }

  /** Fecha um chamado. */
  @Post(":id/close")
  @HttpCode(HttpStatus.OK)
  close(@Param("id", new ZodValidationPipe(uuidSchema)) id: string): Promise<SupportTicket> {
    return this.support.close(id);
  }
}
