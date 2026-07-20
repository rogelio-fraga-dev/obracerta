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
  createReviewSchema,
  createReviewResponseSchema,
  type BookingReviewStatus,
  type CreateReviewInput,
  type CreateReviewResponseInput,
  type JwtClaims,
  type ReceivedReview,
  type ReputationEvent,
  type ReputationSummary,
  type Review,
  type ReviewResponse,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { IMAGE_UPLOAD_OPTIONS } from "../../../common/uploads/image-upload.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { ReputationService } from "../application/reputation.service.js";

/** Subconjunto do arquivo multipart usado (evita @types/multer global). */
interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReputationController {
  constructor(private readonly reputation: ReputationService) {}

  /** Autor avalia a contraparte de um pedido concluído (nasce oculta). */
  @Post("reviews")
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewInput,
  ): Promise<Review> {
    return this.reputation.createReview(user.sub, input);
  }

  /** Anexa a foto do serviço concluído à própria avaliação (multipart, campo `file`). */
  @Post("reviews/:id/foto")
  @UseInterceptors(FileInterceptor("file", IMAGE_UPLOAD_OPTIONS))
  attachFoto(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @UploadedFile() file: MultipartFile | undefined,
  ): Promise<Review> {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    return this.reputation.attachReviewPhoto(user.sub, id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  }

  /** Avaliações reveladas recebidas pelo usuário autenticado (alvo), com a resposta (se houver). */
  @Get("reviews/received")
  received(@CurrentUser() user: JwtClaims): Promise<ReceivedReview[]> {
    return this.reputation.listReceived(user.sub);
  }

  /** O usuário autenticado já avaliou este pedido? (a UI usa para não mostrar o form de novo). */
  @Get("reviews/booking/:bookingId/mine")
  reviewedBooking(
    @CurrentUser() user: JwtClaims,
    @Param("bookingId") bookingId: string,
  ): Promise<BookingReviewStatus> {
    return this.reputation.hasReviewedBooking(user.sub, bookingId);
  }

  /** Avaliado responde (1x, em até 30 dias da revelação). */
  @Post("reviews/responses")
  respond(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createReviewResponseSchema)) input: CreateReviewResponseInput,
  ): Promise<ReviewResponse> {
    return this.reputation.respondToReview(user.sub, input);
  }

  /** Reputação pública de um usuário (avaliações reveladas + média). */
  @Get("reputation/:userId")
  reputationOf(@Param("userId") userId: string): Promise<ReputationSummary> {
    return this.reputation.getReputation(userId);
  }

  /** Trilha de reputação de um usuário (eventos: avaliações reveladas, badges). */
  @Get("reputation/:userId/eventos")
  events(@Param("userId") userId: string): Promise<ReputationEvent[]> {
    return this.reputation.listEvents(userId);
  }
}
