import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { OnboardingModule } from "../onboarding/onboarding.module.js";
import { PromotionsModule } from "../promotions/promotions.module.js";
import { UsersModule } from "../users/users.module.js";
import { CadastroService } from "./application/cadastro.service.js";
import { PortfolioService } from "./application/portfolio.service.js";
import { ProfileAnalyticsService } from "./application/profile-analytics.service.js";
import { ProfilesService } from "./application/profiles.service.js";
import { ANALYTICS_REPOSITORY } from "./domain/ports/analytics.repository.js";
import { PROFILES_REPOSITORY } from "./domain/ports/profiles.repository.js";
import { PORTFOLIO_REPOSITORY } from "./domain/ports/portfolio.repository.js";
import { DrizzleAnalyticsRepository } from "./infrastructure/drizzle-analytics.repository.js";
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
  imports: [AuthModule, UsersModule, OnboardingModule, BillingModule, NotificationsModule, PromotionsModule],
  controllers: [CadastroController, ProfilesController],
  providers: [
    CadastroService,
    ProfilesService,
    PortfolioService,
    ProfileAnalyticsService,
    { provide: PROFILES_REPOSITORY, useClass: DrizzleProfilesRepository },
    { provide: PORTFOLIO_REPOSITORY, useClass: DrizzlePortfolioRepository },
    { provide: ANALYTICS_REPOSITORY, useClass: DrizzleAnalyticsRepository },
  ],
  exports: [ProfilesService, PortfolioService],
})
export class ProfilesModule {}
