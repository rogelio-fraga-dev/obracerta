import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray, or } from "drizzle-orm";
import { Pool } from "pg";
import type { User } from "@obracerta/shared";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { subscriptions } from "../../../infrastructure/database/schema/subscriptions.js";
import { purchases } from "../../../infrastructure/database/schema/purchases.js";
import { invoices } from "../../../infrastructure/database/schema/invoices.js";
import { paymentEvents } from "../../../infrastructure/database/schema/payment-events.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import type { UsersService } from "../../users/application/users.service.js";
import type { AuditService } from "../../audit/application/audit.service.js";
import { BillingService } from "../application/billing.service.js";
import { FakePaymentGateway } from "./fake-payment-gateway.js";
import { DrizzleSubscriptionRepository } from "./drizzle-subscription.repository.js";
import { DrizzlePurchaseRepository } from "./drizzle-purchase.repository.js";
import { DrizzleInvoiceRepository } from "./drizzle-invoice.repository.js";
import { DrizzlePaymentEventRepository } from "./drizzle-payment-event.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 4.1): fluxo de billing ponta a ponta com gateway fake —
 * assinar → emitir fatura → webhook confirma → fatura PAGA + origem ativada; e a
 * idempotência do webhook. Requer docker:up. Fora do CI.
 */
describe("BillingService (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const subRepo = new DrizzleSubscriptionRepository(db);
  const purchaseRepo = new DrizzlePurchaseRepository(db);
  const invoiceRepo = new DrizzleInvoiceRepository(db);
  const eventRepo = new DrizzlePaymentEventRepository(db);
  const gateway = new FakePaymentGateway();

  const usersById = new Map<string, User>();
  const usersStub = { findById: (id: string) => Promise.resolve(usersById.get(id) ?? null) } as unknown as UsersService;
  const auditStub = { record: () => Promise.resolve(undefined) } as unknown as AuditService;
  const billing = new BillingService(
    subRepo,
    purchaseRepo,
    invoiceRepo,
    eventRepo,
    gateway,
    usersStub,
    auditStub,
  );

  const sufixo = Date.now().toString().slice(-9);
  let profId = "";
  let contratanteId = "";

  beforeAll(async () => {
    const prof = await usersRepo.create({
      nomeCompleto: "Prof Bill",
      whatsapp: `+5555${sufixo}`,
      email: `prof.bill.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    const contratante = await usersRepo.create({
      nomeCompleto: "Cont Bill",
      whatsapp: `+5565${sufixo}`,
      email: `cont.bill.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    profId = prof.id;
    contratanteId = contratante.id;
    usersById.set(profId, prof);
    usersById.set(contratanteId, contratante);
  });

  afterAll(async () => {
    await db.delete(paymentEvents).where(inArray(paymentEvents.eventId, [`evt-${sufixo}-1`, `evt-${sufixo}-2`, `evt-${sufixo}-3`]));
    await db.delete(invoices).where(or(eq(invoices.userId, profId), eq(invoices.userId, contratanteId)));
    await db.delete(subscriptions).where(eq(subscriptions.userId, profId));
    await db.delete(purchases).where(eq(purchases.userId, contratanteId));
    await db.delete(users).where(or(eq(users.id, profId), eq(users.id, contratanteId)));
    await pool.end();
  });

  it("assina (EM_GRACA + fatura PENDENTE), webhook confirma → PAGA + ATIVA, e é idempotente", async () => {
    const subscription = await billing.subscribe(profId, { plano: "PRO" });
    expect(subscription.status).toBe("EM_GRACA");
    expect(subscription.valorCentavos).toBe(4900);

    const [invoice] = await invoiceRepo.listForUser(profId);
    expect(invoice?.status).toBe("PENDENTE");
    const chargeId = invoice!.gatewayId!;

    // webhook confirma o pagamento
    expect(
      await billing.handleWebhook({ eventId: `evt-${sufixo}-1`, tipo: "PAYMENT_CONFIRMED", chargeId, metodo: "PIX" }),
    ).toBe("pago");

    const paga = await invoiceRepo.findByGatewayCharge(gateway.name, chargeId);
    expect(paga?.status).toBe("PAGA");
    expect(paga?.metodo).toBe("PIX");
    expect((await subRepo.findById(subscription.id))?.status).toBe("ATIVA");

    // mesmo evento de novo → idempotente (não reprocessa)
    expect(
      await billing.handleWebhook({ eventId: `evt-${sufixo}-1`, tipo: "PAYMENT_CONFIRMED", chargeId }),
    ).toBe("duplicado");
    // novo evento, mas a fatura já está PAGA → não há transição válida
    expect(
      await billing.handleWebhook({ eventId: `evt-${sufixo}-2`, tipo: "PAYMENT_CONFIRMED", chargeId }),
    ).toBe("ja_processada");
  });

  it("não permite assinar duas vezes (assinatura vigente)", async () => {
    await expect(billing.subscribe(profId, { plano: "ESPECIALISTA" })).rejects.toThrow();
  });

  it("compra avulsa: webhook ativa a compra com expiração", async () => {
    const purchase = await billing.purchase(contratanteId, { plano: "COMPLETO" });
    expect(purchase.status).toBe("PENDENTE");
    expect(purchase.valorCentavos).toBe(3900);

    const invoice = (await invoiceRepo.listForUser(contratanteId))[0];
    const chargeId = invoice!.gatewayId!;
    expect(
      await billing.handleWebhook({ eventId: `evt-${sufixo}-3`, tipo: "PAYMENT_CONFIRMED", chargeId, metodo: "PIX" }),
    ).toBe("pago");

    const ativo = await purchaseRepo.findById(purchase.id);
    expect(ativo?.status).toBe("ATIVO");
    expect(ativo?.expiraEm).not.toBeNull();
  });
});
