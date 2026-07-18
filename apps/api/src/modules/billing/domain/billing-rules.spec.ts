import {
  TRIAL_DAYS,
  FIRST_PAYMENT_WINDOW_DAYS,
  BILLING_PERIOD_DAYS,
  PURCHASE_VALIDITY_DAYS,
  PURCHASE_RENEWAL_LEAD_DAYS,
  PLAN_REMINDER_DAYS_BEFORE,
  professionalPriceCentavos,
  contractorPriceCentavos,
  hasTrial,
  graceUntil,
  firstInvoiceDue,
  nextCharge,
  purchaseExpiry,
  renewedPurchaseExpiry,
  purchaseRenewalDate,
  canTransitionInvoice,
  isPaymentConfirmed,
  canRenew,
  planReminderDate,
} from "./billing-rules.js";

describe("canRenew", () => {
  it("renova assinatura em graça ou ativa; não as encerradas", () => {
    expect(canRenew("EM_GRACA")).toBe(true);
    expect(canRenew("ATIVA")).toBe(true);
    expect(canRenew("INADIMPLENTE")).toBe(false);
    expect(canRenew("CANCELADA")).toBe(false);
  });
});

describe("planReminderDate", () => {
  it("lembra alguns dias antes da próxima cobrança", () => {
    expect(PLAN_REMINDER_DAYS_BEFORE).toBe(3);
    const proxima = new Date("2026-07-08T00:00:00.000Z");
    expect(planReminderDate(proxima).toISOString()).toBe("2026-07-05T00:00:00.000Z");
  });
});

describe("preços por plano (centavos) — homologação 18/07", () => {
  it("profissional: INICIANTE 1990, PRO 4990, ESPECIALISTA 9990", () => {
    expect(professionalPriceCentavos("INICIANTE")).toBe(1990);
    expect(professionalPriceCentavos("PRO")).toBe(4990);
    expect(professionalPriceCentavos("ESPECIALISTA")).toBe(9990);
  });

  it("contratante: BASICO 1990, COMPLETO 3990, LANCE 6990", () => {
    expect(contractorPriceCentavos("BASICO")).toBe(1990);
    expect(contractorPriceCentavos("COMPLETO")).toBe(3990);
    expect(contractorPriceCentavos("LANCE")).toBe(6990);
  });

  it("empresa paga a tabela própria: 4990 / 9990 / 14990", () => {
    expect(contractorPriceCentavos("BASICO", "EMPRESA")).toBe(4990);
    expect(contractorPriceCentavos("COMPLETO", "EMPRESA")).toBe(9990);
    expect(contractorPriceCentavos("LANCE", "EMPRESA")).toBe(14990);
  });

  it("contratante pessoa física não é afetado pelo tipo", () => {
    expect(contractorPriceCentavos("BASICO", "CONTRATANTE")).toBe(1990);
  });
});

describe("teste grátis (exclusivo do Iniciante)", () => {
  it("só o INICIANTE tem trial", () => {
    expect(hasTrial("INICIANTE")).toBe(true);
    expect(hasTrial("PRO")).toBe(false);
    expect(hasTrial("ESPECIALISTA")).toBe(false);
  });

  it("1ª fatura: Iniciante vence no fim do trial; demais na janela curta", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(TRIAL_DAYS).toBe(7);
    expect(FIRST_PAYMENT_WINDOW_DAYS).toBe(3);
    expect(firstInvoiceDue("INICIANTE", now).toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(firstInvoiceDue("PRO", now).toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });
});

describe("datas de cobrança", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("trial/graça de 7 dias", () => {
    expect(graceUntil(now).toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });

  it("próxima cobrança em 30 dias", () => {
    expect(nextCharge(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(BILLING_PERIOD_DAYS).toBe(30);
  });

  it("vigência do ciclo de acesso em 30 dias", () => {
    expect(purchaseExpiry(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(PURCHASE_VALIDITY_DAYS).toBe(30);
  });

  it("renovação do acesso: fatura emitida antes do fim da vigência", () => {
    expect(PURCHASE_RENEWAL_LEAD_DAYS).toBe(3);
    const expira = new Date("2026-07-01T00:00:00.000Z");
    expect(purchaseRenewalDate(expira).toISOString()).toBe("2026-06-28T00:00:00.000Z");
  });

  it("renovar antes do fim não come dias já pagos", () => {
    const expira = new Date("2026-07-01T00:00:00.000Z");
    const pagouAntes = new Date("2026-06-29T00:00:00.000Z");
    expect(renewedPurchaseExpiry(expira, pagouAntes).toISOString()).toBe(
      "2026-07-31T00:00:00.000Z",
    );
    // vigência já vencida → conta a partir do pagamento
    const pagouDepois = new Date("2026-07-03T00:00:00.000Z");
    expect(renewedPurchaseExpiry(expira, pagouDepois).toISOString()).toBe(
      "2026-08-02T00:00:00.000Z",
    );
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
