import { webhookSignature, verifyWebhookSignature } from "./webhook-signature.js";

const secret = "test-secret-0123456789";
const payload = { eventId: "evt-1", tipo: "PAYMENT_CONFIRMED", chargeId: "chg-1" };

describe("webhookSignature", () => {
  it("é determinística (mesmo segredo + payload → mesma assinatura)", () => {
    expect(webhookSignature(secret, payload)).toBe(webhookSignature(secret, payload));
  });

  it("é um HMAC-SHA256 em hex (64 chars)", () => {
    expect(webhookSignature(secret, payload)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("muda com o segredo ou com qualquer campo do payload", () => {
    const base = webhookSignature(secret, payload);
    expect(webhookSignature("outro-segredo-0123456", payload)).not.toBe(base);
    expect(webhookSignature(secret, { ...payload, chargeId: "chg-2" })).not.toBe(base);
    expect(webhookSignature(secret, { ...payload, tipo: "PAYMENT_OVERDUE" })).not.toBe(base);
  });
});

describe("verifyWebhookSignature", () => {
  it("aceita a assinatura correta", () => {
    const sig = webhookSignature(secret, payload);
    expect(verifyWebhookSignature(secret, payload, sig)).toBe(true);
  });

  it("rejeita assinatura errada, payload adulterado, segredo errado e ausente", () => {
    const sig = webhookSignature(secret, payload);
    expect(verifyWebhookSignature(secret, payload, "deadbeef")).toBe(false);
    expect(verifyWebhookSignature(secret, { ...payload, chargeId: "chg-2" }, sig)).toBe(false);
    expect(verifyWebhookSignature("segredo-errado-01234", payload, sig)).toBe(false);
    expect(verifyWebhookSignature(secret, payload, undefined)).toBe(false);
    expect(verifyWebhookSignature(secret, payload, "")).toBe(false);
  });
});
