import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { UsersModule } from "../users/users.module.js";
import { CompanyTeamService } from "./application/company-team.service.js";
import { COMPANY_TEAM_REPOSITORY } from "./domain/ports/company-team.repository.js";
import { DrizzleCompanyTeamRepository } from "./infrastructure/drizzle-company-team.repository.js";
import {
  CompanyController,
  CompanyInvitesController,
  PublicCompanyController,
} from "./interface/company.controller.js";

/**
 * Equipe da empresa (homologação 18/07 — evolução do modelo 1-admin): membros
 * com acesso delegado + roster de profissionais. Exporta o CompanyTeamService
 * para o work-orders resolver "quem age por qual empresa".
 */
@Module({
  imports: [AuthModule, UsersModule, BillingModule, AuditModule, NotificationsModule],
  controllers: [CompanyController, CompanyInvitesController, PublicCompanyController],
  providers: [
    CompanyTeamService,
    { provide: COMPANY_TEAM_REPOSITORY, useClass: DrizzleCompanyTeamRepository },
  ],
  exports: [CompanyTeamService],
})
export class CompanyModule {}
