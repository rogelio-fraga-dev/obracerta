import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  applyCouponSchema,
  createCouponSchema,
  UserRole,
  uuidSchema,
  z,
  type ApplyCouponInput,
  type Coupon,
  type CouponPreview,
  type CreateCouponInput,
  type JwtClaims,
  type ReferralSummary,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { PromotionsService } from "../application/promotions.service.js";

const toggleCouponSchema = z.object({ ativo: z.boolean() });

/**
 * Promoções: painel de indicação e prévia de cupom (usuário autenticado) +
 * catálogo de cupons (admin). O resgate do cupom acontece dentro do fluxo de
 * assinatura (billing), não aqui.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  /** Painel de indicação do usuário: código próprio + indicados + cupons. */
  @Get("promotions/me/indicacao")
  minhaIndicacao(@CurrentUser() user: JwtClaims): Promise<ReferralSummary> {
    return this.promotions.getReferralSummary(user.sub);
  }

  /** Prévia de um cupom (valida disponibilidade para o usuário). */
  @Post("promotions/cupons/preview")
  previewCupom(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(applyCouponSchema)) input: ApplyCouponInput,
  ): Promise<CouponPreview> {
    return this.promotions.previewCoupon(user.sub, input.codigo);
  }

  /** Catálogo de cupons (admin). */
  @Get("admin/cupons")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listCupons(): Promise<Coupon[]> {
    return this.promotions.listCoupons();
  }

  /** Cria um cupom (admin). */
  @Post("admin/cupons")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  criarCupom(
    @Body(new ZodValidationPipe(createCouponSchema)) input: CreateCouponInput,
  ): Promise<Coupon> {
    return this.promotions.createCoupon(input);
  }

  /** Ativa/desativa um cupom (admin). */
  @Post("admin/cupons/:id/toggle")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleCupom(
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(toggleCouponSchema)) input: { ativo: boolean },
  ): Promise<{ ok: true }> {
    await this.promotions.toggleCoupon(id, input.ativo);
    return { ok: true };
  }
}
