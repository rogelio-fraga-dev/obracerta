import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  appealSuspensionSchema,
  createReportSchema,
  z,
  type AppealSuspensionInput,
  type CreateReportInput,
  type JwtClaims,
  type Report,
  type Suspension,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { ModerationService } from "../application/moderation.service.js";

/** Decisão de denúncia (ação de moderador). */
const resolveReportSchema = z.object({ procedente: z.boolean() });
/** Julgamento de apelação (ação de moderador): deferir = revogar a suspensão. */
const resolveAppealSchema = z.object({ revogar: z.boolean() });

/**
 * Moderação (roadmap §13). NOTA: as ações de moderador (resolver denúncia/apelação)
 * estão sob JwtAuthGuard apenas — o gating por papel admin/moderador entra com o
 * módulo `admin` (Fase 6). Hoje qualquer usuário autenticado pode chamá-las.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  /** Qualquer usuário denuncia um conteúdo/usuário. */
  @Post("reports")
  report(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createReportSchema)) input: CreateReportInput,
  ): Promise<Report> {
    return this.moderation.denunciar(user.sub, input);
  }

  /** Fila de moderação: denúncias abertas. (moderador — ver NOTA do controller) */
  @Get("reports/open")
  openReports(): Promise<Report[]> {
    return this.moderation.listOpenReports();
  }

  /** Decisão da denúncia. (moderador — ver NOTA do controller) */
  @Post("reports/:id/resolve")
  resolveReport(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resolveReportSchema)) body: { procedente: boolean },
  ): Promise<Report> {
    return this.moderation.resolveReport(id, body.procedente);
  }

  /** O usuário suspenso apela. */
  @Post("suspensions/appeal")
  appeal(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(appealSuspensionSchema)) input: AppealSuspensionInput,
  ): Promise<Suspension> {
    return this.moderation.appeal(user.sub, input);
  }

  /** Julgamento da apelação. (moderador — ver NOTA do controller) */
  @Post("suspensions/:id/resolve")
  resolveAppeal(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resolveAppealSchema)) body: { revogar: boolean },
  ): Promise<Suspension> {
    return this.moderation.resolveAppeal(id, body.revogar);
  }

  /** Suspensões do usuário autenticado. */
  @Get("suspensions/me")
  mySuspensions(@CurrentUser() user: JwtClaims): Promise<Suspension[]> {
    return this.moderation.listSuspensions(user.sub);
  }

  /** A conta do usuário autenticado está suspensa em vigor? */
  @Get("suspensions/me/active")
  async amISuspended(@CurrentUser() user: JwtClaims): Promise<{ suspended: boolean }> {
    return { suspended: await this.moderation.isSuspended(user.sub) };
  }
}
