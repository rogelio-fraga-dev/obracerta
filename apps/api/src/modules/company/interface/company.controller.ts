import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  addCompanyMemberSchema,
  addCompanyProfessionalSchema,
  type AddCompanyMemberInput,
  type AddCompanyProfessionalInput,
  type CompanyDirectoryItem,
  type CompanyInvite,
  type CompanyMember,
  type CompanyProfessional,
  type CompanyTeam,
  type JwtClaims,
  type PublicCompanyProfile,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { CompanyTeamService } from "../application/company-team.service.js";

/**
 * Equipe da empresa (homologação 18/07). Todas as rotas exigem JWT e são
 * escopadas à conta autenticada (`user.sub` = a empresa); a autorização real
 * (tipo EMPRESA + plano com `company.team`) fica no service.
 */
@Controller("company/me")
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly team: CompanyTeamService) {}

  /** Membros + profissionais da equipe da empresa autenticada. */
  @Get("team")
  myTeam(@CurrentUser() user: JwtClaims): Promise<CompanyTeam> {
    return this.team.team(user.sub);
  }

  /** Por qual empresa eu ajo (membro da equipe) + features do plano dela. */
  @Get("acting")
  acting(@CurrentUser() user: JwtClaims): Promise<{ companyId: string | null; features: string[] }> {
    return this.team.actingContext(user.sub);
  }

  /** Convida/registra um membro por e-mail (vínculo imediato se a conta existir). */
  @Post("members")
  addMember(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(addCompanyMemberSchema)) input: AddCompanyMemberInput,
  ): Promise<CompanyMember> {
    return this.team.addMember(user.sub, input);
  }

  /** Remove um membro da equipe. */
  @Delete("members/:id")
  removeMember(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<void> {
    return this.team.removeMember(user.sub, id);
  }

  /** Vincula um profissional da plataforma ao roster da equipe. */
  @Post("professionals")
  addProfessional(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(addCompanyProfessionalSchema)) input: AddCompanyProfessionalInput,
  ): Promise<CompanyProfessional> {
    return this.team.addProfessional(user.sub, input);
  }

  /** Remove um profissional do roster. */
  @Delete("professionals/:id")
  removeProfessional(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<void> {
    return this.team.removeProfessional(user.sub, id);
  }
}

/**
 * Convites de empresa do **profissional** (opt-in para aparecer no diretório).
 * Rotas separadas porque o ator aqui é o profissional, não a empresa.
 */
@Controller("professionals/me/company-invites")
@UseGuards(JwtAuthGuard)
export class CompanyInvitesController {
  constructor(private readonly team: CompanyTeamService) {}

  /** Convites pendentes recebidos. */
  @Get()
  pending(@CurrentUser() user: JwtClaims): Promise<CompanyInvite[]> {
    return this.team.pendingInvites(user.sub);
  }

  /** Confirma um convite (passa a aparecer no perfil público da empresa). */
  @Post(":id/confirm")
  confirm(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<void> {
    return this.team.confirmInvite(user.sub, id);
  }

  /** Recusa (remove) um convite pendente. */
  @Post(":id/reject")
  reject(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<void> {
    return this.team.rejectInvite(user.sub, id);
  }
}

/**
 * Diretório público de empresas (sem login) — os profissionais querem ser
 * encontrados via a empresa. Só empresas com slug e ao menos 1 profissional
 * confirmado aparecem; o perfil lista apenas a equipe que consentiu.
 */
@Controller("public/companies")
export class PublicCompanyController {
  constructor(private readonly team: CompanyTeamService) {}

  /** Lista/busca empresas por nome e cidade. */
  @Get()
  directory(
    @Query("q") q?: string,
    @Query("cidadeId") cidadeId?: string,
  ): Promise<CompanyDirectoryItem[]> {
    return this.team.directory(q?.trim() || null, cidadeId?.trim() || null);
  }

  /** Perfil público de uma empresa por slug. */
  @Get(":slug")
  profile(@Param("slug") slug: string): Promise<PublicCompanyProfile> {
    return this.team.publicProfile(slug);
  }
}
