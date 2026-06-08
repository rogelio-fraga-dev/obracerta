import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  appealSuspensionSchema,
  createReportSchema,
  UserRole,
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
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { ModerationService } from "../application/moderation.service.js";

/** Decisão de denúncia (ação de moderador). */
const resolveReportSchema = z.object({ procedente: z.boolean() });
/** Julgamento de apelação (ação de moderador): deferir = revogar a suspensão. */
const resolveAppealSchema = z.object({ revogar: z.boolean() });

/**
 * Moderação (roadmap §13). As ações de moderador (resolver denúncia/apelação e ver
 * a fila) exigem o papel MODERADOR ou ADMIN (RolesGuard, Fase 6); denunciar/apelar/
 * consultar a própria suspensão são abertas a qualquer usuário autenticado.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
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

  /** Fila de moderação: denúncias abertas (MODERADOR/ADMIN). */
  @Get("reports/open")
  @Roles(UserRole.ADMIN, UserRole.MODERADOR)
  openReports(): Promise<Report[]> {
    return this.moderation.listOpenReports();
  }

  /** Decisão da denúncia (MODERADOR/ADMIN). */
  @Post("reports/:id/resolve")
  @Roles(UserRole.ADMIN, UserRole.MODERADOR)
  resolveReport(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resolveReportSchema)) body: { procedente: boolean },
  ): Promise<Report> {
    return this.moderation.resolveReport(id, body.procedente);
  }

  /** Fila do moderador: suspensões apeladas aguardando julgamento (MODERADOR/ADMIN). */
  @Get("suspensions/appealed")
  @Roles(UserRole.ADMIN, UserRole.MODERADOR)
  appealedSuspensions(): Promise<Suspension[]> {
    return this.moderation.listAppealedSuspensions();
  }

  /** O usuário suspenso apela. */
  @Post("suspensions/appeal")
  appeal(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(appealSuspensionSchema)) input: AppealSuspensionInput,
  ): Promise<Suspension> {
    return this.moderation.appeal(user.sub, input);
  }

  /** Julgamento da apelação (MODERADOR/ADMIN). */
  @Post("suspensions/:id/resolve")
  @Roles(UserRole.ADMIN, UserRole.MODERADOR)
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
