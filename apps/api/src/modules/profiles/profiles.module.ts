import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { OnboardingModule } from "../onboarding/onboarding.module.js";
import { UsersModule } from "../users/users.module.js";
import { CadastroService } from "./application/cadastro.service.js";
import { PortfolioService } from "./application/portfolio.service.js";
import { ProfilesService } from "./application/profiles.service.js";
import { PROFILES_REPOSITORY } from "./domain/ports/profiles.repository.js";
import { PORTFOLIO_REPOSITORY } from "./domain/ports/portfolio.repository.js";
import { DrizzleProfilesRepository } from "./infrastructure/drizzle-profiles.repository.js";
import { DrizzlePortfolioRepository } from "./infrastructure/drizzle-portfolio.repository.js";
import { CadastroController } from "./interface/cadastro.controller.js";
import { ProfilesController } from "./interface/profiles.controller.js";

/**
 * Perfis + cadastro + portfólio (roadmap §4/§14/§18). Importa AuthModule (OTP
 * verificado + auto-login), UsersModule (criação de usuário) e BillingModule
 * (gating do portfólio). JwtAuthGuard vem do AuthModule.
 */
@Module({
  imports: [AuthModule, UsersModule, OnboardingModule, BillingModule],
  controllers: [CadastroController, ProfilesController],
  providers: [
    CadastroService,
    ProfilesService,
    PortfolioService,
    { provide: PROFILES_REPOSITORY, useClass: DrizzleProfilesRepository },
    { provide: PORTFOLIO_REPOSITORY, useClass: DrizzlePortfolioRepository },
  ],
  exports: [ProfilesService, PortfolioService],
})
export class ProfilesModule {}
