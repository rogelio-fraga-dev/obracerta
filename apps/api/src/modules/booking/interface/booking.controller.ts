import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  type BookingRequest,
  createBookingSchema,
  type CreateBookingInput,
  declineBookingSchema,
  type DeclineBookingInput,
  type JwtClaims,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { BookingService } from "../application/booking.service.js";

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  /** Contratante cria um pedido. */
  @Post()
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createBookingSchema)) input: CreateBookingInput,
  ): Promise<BookingRequest> {
    return this.bookings.createForContractor(user.sub, input);
  }

  /** Pedidos em que sou o contratante. */
  @Get("me/contractor")
  listAsContractor(@CurrentUser() user: JwtClaims): Promise<BookingRequest[]> {
    return this.bookings.listForContractor(user.sub);
  }

  /** Pedidos em que sou o profissional. */
  @Get("me/professional")
  listAsProfessional(@CurrentUser() user: JwtClaims): Promise<BookingRequest[]> {
    return this.bookings.listForProfessional(user.sub);
  }

  /** Detalhe (apenas participantes). */
  @Get(":id")
  get(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.getForParticipant(user.sub, id);
  }

  /** Profissional aprova. */
  @Post(":id/approve")
  approve(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.approve(user.sub, id);
  }

  /** Profissional recusa (motivo categorizado; OUTRO exige detalhe). */
  @Post(":id/decline")
  decline(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(declineBookingSchema)) body: DeclineBookingInput,
  ): Promise<BookingRequest> {
    return this.bookings.decline(user.sub, id, body.motivo, body.detalhe ?? null);
  }

  /** Profissional inicia a obra. */
  @Post(":id/start")
  start(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.start(user.sub, id);
  }

  /** Profissional conclui a obra. */
  @Post(":id/complete")
  complete(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.complete(user.sub, id);
  }

  /** Contratante cancela. */
  @Post(":id/cancel")
  cancel(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.cancel(user.sub, id);
  }
}
