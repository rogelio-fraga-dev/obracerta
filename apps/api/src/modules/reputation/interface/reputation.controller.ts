import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createReviewSchema,
  createReviewResponseSchema,
  type CreateReviewInput,
  type CreateReviewResponseInput,
  type JwtClaims,
  type ReputationEvent,
  type ReputationSummary,
  type Review,
  type ReviewResponse,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { ReputationService } from "../application/reputation.service.js";

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

  /** Avaliações reveladas recebidas pelo usuário autenticado (alvo). */
  @Get("reviews/received")
  received(@CurrentUser() user: JwtClaims): Promise<Review[]> {
    return this.reputation.listReceived(user.sub);
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
