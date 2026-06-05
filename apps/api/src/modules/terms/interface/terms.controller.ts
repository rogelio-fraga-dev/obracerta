import { Body, Controller, Get, Ip, Param, Post, UseGuards } from "@nestjs/common";
import {
  type AcceptTermsInput,
  acceptTermsSchema,
  type JwtClaims,
  type TermsAcceptance,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { TermsService } from "../application/terms.service.js";

@Controller("terms")
@UseGuards(JwtAuthGuard)
export class TermsController {
  constructor(private readonly terms: TermsService) {}

  /** O usuário autenticado aceita os termos de um pedido (registra IP). */
  @Post()
  accept(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(acceptTermsSchema)) input: AcceptTermsInput,
    @Ip() ip: string,
  ): Promise<TermsAcceptance> {
    return this.terms.accept(user.sub, input, ip || null);
  }

  /** Lista os aceites de um pedido (apenas participantes). */
  @Get("booking/:bookingId")
  listForBooking(
    @CurrentUser() user: JwtClaims,
    @Param("bookingId") bookingId: string,
  ): Promise<TermsAcceptance[]> {
    return this.terms.listForBooking(user.sub, bookingId);
  }
}
