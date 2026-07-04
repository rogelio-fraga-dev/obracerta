import { ProfessionalPlan, SubscriptionStatus, UserType, type Subscription, type User } from "@obracerta/shared";
import { EntitlementsService } from "../../entitlements/application/entitlements.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import type { SubscriptionRepository } from "../domain/ports/subscription.repository.js";
import type { PurchaseRepository } from "../domain/ports/purchase.repository.js";
import type { UsersService } from "../../users/application/users.service.js";
import { BillingService } from "./billing.service.js";

/**
 * Plano vigente / gating (reprecificação Fase 8+): um profissional SEM assinatura
 * paga cai no tier gratuito INICIANTE (baseline) — então recebe pedidos e tem
 * perfil público de graça, mas não dá lances. Contratante sem compra → sem plano.
 */
describe("BillingService — plano baseline e gating", () => {
  function build(opts: {
    activeSub?: Subscription | null;
    user?: Partial<User> | null;
  }) {
    const subscriptions = {
      findLastByUser: jest.fn().mockResolvedValue(opts.activeSub ?? null),
    } as unknown as SubscriptionRepository;
    const purchases = {
      findActiveByUser: jest.fn().mockResolvedValue(null),
    } as unknown as PurchaseRepository;
    const users = {
      findById: jest.fn().mockResolvedValue(opts.user ?? null),
    } as unknown as UsersService;

    const service = new BillingService(
      subscriptions,
      purchases,
      {} as never, // invoices
      {} as never, // refunds
      {} as never, // events
      {} as never, // planSync
      {} as never, // gateway
      {} as never, // scheduler
      new EntitlementsService(),
      users,
      {} as never, // audit
      {} as never, // notifications
    );
    return service;
  }

  it("profissional sem assinatura → baseline INICIANTE (recebe pedidos, sem lance)", async () => {
    const service = build({ user: { tipo: UserType.PROFISSIONAL } });

    const ent = await service.getEntitlements("pro-sem-plano");
    expect(ent.plano).toBe(ProfessionalPlan.INICIANTE);
    expect(ent.features).toContain(Feature.PUBLIC_PROFILE);
    expect(ent.features).toContain(Feature.RECEIVE_BOOKINGS);

    expect(await service.can("pro-sem-plano", Feature.RECEIVE_BOOKINGS)).toBe(true);
    expect(await service.can("pro-sem-plano", Feature.SUBMIT_BID)).toBe(false);
  });

  it("profissional com assinatura PRO vigente → dá lances", async () => {
    const sub = { plano: ProfessionalPlan.PRO, status: SubscriptionStatus.ATIVA } as Subscription;
    const service = build({ activeSub: sub, user: { tipo: UserType.PROFISSIONAL } });

    expect(await service.can("joana", Feature.SUBMIT_BID)).toBe(true);
  });

  it("contratante sem compra vigente → sem plano (features vazias)", async () => {
    const service = build({ user: { tipo: UserType.CONTRATANTE } });

    const ent = await service.getEntitlements("ct-1");
    expect(ent.plano).toBeNull();
    expect(ent.features).toHaveLength(0);
  });
});
