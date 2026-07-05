import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  type BookingContact,
  type BookingListItem,
  type BookingRequest,
  createBookingSchema,
  type CreateBookingInput,
  declineBookingSchema,
  type DeclineBookingInput,
  type JwtClaims,
  rescheduleBookingSchema,
  type RescheduleBookingInput,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { BookingService } from "../application/booking.service.js";

/** Arquivo recebido via multipart (subset do que o Multer entrega). */
interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

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

  /** Contratante anexa a foto do serviço ao pedido (multipart, campo `file`). */
  @Post(":id/foto")
  @UseInterceptors(FileInterceptor("file"))
  uploadFoto(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @UploadedFile() file: MultipartFile | undefined,
  ): Promise<BookingRequest> {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    return this.bookings.uploadFoto(user.sub, id, { buffer: file.buffer, mimetype: file.mimetype });
  }

  /** Contato da outra parte — liberado só após o aceite (double-blind §24). */
  @Get(":id/contato")
  getContact(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingContact> {
    return this.bookings.getContact(user.sub, id);
  }

  /** Pedidos em que sou o contratante. */
  @Get("me/contractor")
  listAsContractor(@CurrentUser() user: JwtClaims): Promise<BookingListItem[]> {
    return this.bookings.listForContractor(user.sub);
  }

  /** Pedidos em que sou o profissional. */
  @Get("me/professional")
  listAsProfessional(@CurrentUser() user: JwtClaims): Promise<BookingListItem[]> {
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

  /** Participante propõe uma nova data (a outra parte confirma). */
  @Post(":id/reagendamento")
  proposeReschedule(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(rescheduleBookingSchema)) body: RescheduleBookingInput,
  ): Promise<BookingRequest> {
    return this.bookings.proposeReschedule(user.sub, id, body.novaData);
  }

  /** A outra parte confirma o reagendamento (move a data + o bloqueio de agenda). */
  @Post(":id/reagendamento/aceitar")
  acceptReschedule(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.acceptReschedule(user.sub, id);
  }

  /** A outra parte recusa o reagendamento (mantém a data original). */
  @Post(":id/reagendamento/recusar")
  rejectReschedule(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<BookingRequest> {
    return this.bookings.rejectReschedule(user.sub, id);
  }
}
