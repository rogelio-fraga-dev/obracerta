import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import { PromotionsService } from "./application/promotions.service.js";
import { COUPONS_REPOSITORY } from "./domain/ports/coupons.repository.js";
import { REFERRALS_REPOSITORY } from "./domain/ports/referrals.repository.js";
import { DrizzleCouponsRepository } from "./infrastructure/drizzle-coupons.repository.js";
import { DrizzleReferralsRepository } from "./infrastructure/drizzle-referrals.repository.js";
import { PromotionsController } from "./interface/promotions.controller.js";

/**
 * Promoções: cupons/descontos e programa de indicação. Exporta o
 * `PromotionsService` para o cadastro (processa a indicação) e o billing
 * (resgata o cupom na assinatura).
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    { provide: COUPONS_REPOSITORY, useClass: DrizzleCouponsRepository },
    { provide: REFERRALS_REPOSITORY, useClass: DrizzleReferralsRepository },
  ],
  exports: [PromotionsService],
})
export class PromotionsModule {}
