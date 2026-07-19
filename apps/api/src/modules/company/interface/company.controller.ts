import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  addCompanyMemberSchema,
  addCompanyProfessionalSchema,
  type AddCompanyMemberInput,
  type AddCompanyProfessionalInput,
  type CompanyMember,
  type CompanyProfessional,
  type CompanyTeam,
  type JwtClaims,
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
