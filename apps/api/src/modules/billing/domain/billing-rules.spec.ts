import {
  SUBSCRIPTION_GRACE_DAYS,
  BILLING_PERIOD_DAYS,
  PURCHASE_VALIDITY_DAYS,
  professionalPriceCentavos,
  contractorPriceCentavos,
  graceUntil,
  nextCharge,
  purchaseExpiry,
  canTransitionInvoice,
  isPaymentConfirmed,
} from "./billing-rules.js";

describe("preços por plano (centavos)", () => {
  it("profissional: PRO 4900, ESPECIALISTA 9900, INICIANTE 0", () => {
    expect(professionalPriceCentavos("PRO")).toBe(4900);
    expect(professionalPriceCentavos("ESPECIALISTA")).toBe(9900);
    expect(professionalPriceCentavos("INICIANTE")).toBe(0);
  });

  it("contratante: BASICO 1900, COMPLETO 3900, LANCE 6900", () => {
    expect(contractorPriceCentavos("BASICO")).toBe(1900);
    expect(contractorPriceCentavos("COMPLETO")).toBe(3900);
    expect(contractorPriceCentavos("LANCE")).toBe(6900);
  });
});

describe("datas de cobrança", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("graça de 7 dias", () => {
    expect(graceUntil(now).toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(SUBSCRIPTION_GRACE_DAYS).toBe(7);
  });

  it("próxima cobrança em 30 dias", () => {
    expect(nextCharge(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(BILLING_PERIOD_DAYS).toBe(30);
  });

  it("validade do avulso em 30 dias", () => {
    expect(purchaseExpiry(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(PURCHASE_VALIDITY_DAYS).toBe(30);
  });
});

describe("canTransitionInvoice", () => {
  it("PENDENTE pode ir para PAGA/VENCIDA/CANCELADA", () => {
    expect(canTransitionInvoice("PENDENTE", "PAGA")).toBe(true);
    expect(canTransitionInvoice("PENDENTE", "VENCIDA")).toBe(true);
    expect(canTransitionInvoice("PENDENTE", "CANCELADA")).toBe(true);
    expect(canTransitionInvoice("PENDENTE", "ESTORNADA")).toBe(false);
  });

  it("VENCIDA ainda pode ser paga", () => {
    expect(canTransitionInvoice("VENCIDA", "PAGA")).toBe(true);
  });

  it("PAGA só pode ser estornada (não paga de novo)", () => {
    expect(canTransitionInvoice("PAGA", "ESTORNADA")).toBe(true);
    expect(canTransitionInvoice("PAGA", "PAGA")).toBe(false);
  });

  it("estados terminais não transitam", () => {
    expect(canTransitionInvoice("CANCELADA", "PAGA")).toBe(false);
    expect(canTransitionInvoice("ESTORNADA", "PAGA")).toBe(false);
  });
});

describe("isPaymentConfirmed", () => {
  it("reconhece eventos de pagamento confirmado", () => {
    expect(isPaymentConfirmed("PAYMENT_CONFIRMED")).toBe(true);
    expect(isPaymentConfirmed("PAYMENT_RECEIVED")).toBe(true);
  });

  it("ignora outros eventos", () => {
    expect(isPaymentConfirmed("PAYMENT_OVERDUE")).toBe(false);
    expect(isPaymentConfirmed("PAYMENT_CREATED")).toBe(false);
  });
});
