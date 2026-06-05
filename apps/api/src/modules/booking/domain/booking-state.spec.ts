import {
  canTransition,
  isTerminal,
  exceedsPendingLimit,
  computeExpiry,
  serviceBlockWindow,
  MAX_PENDING_PER_ESPECIALIDADE,
} from "./booking-state.js";

describe("canTransition", () => {
  it("permite as transições do fluxo feliz", () => {
    expect(canTransition("PENDENTE", "APROVADO")).toBe(true);
    expect(canTransition("APROVADO", "INICIADO")).toBe(true);
    expect(canTransition("INICIADO", "CONCLUIDO")).toBe(true);
  });

  it("permite recusa/expiração/cancelamento a partir de PENDENTE", () => {
    expect(canTransition("PENDENTE", "RECUSADO")).toBe(true);
    expect(canTransition("PENDENTE", "EXPIRADO")).toBe(true);
    expect(canTransition("PENDENTE", "CANCELADO")).toBe(true);
  });

  it("bloqueia transições inválidas", () => {
    expect(canTransition("PENDENTE", "INICIADO")).toBe(false);
    expect(canTransition("APROVADO", "CONCLUIDO")).toBe(false);
    expect(canTransition("CONCLUIDO", "INICIADO")).toBe(false);
    expect(canTransition("RECUSADO", "APROVADO")).toBe(false);
  });
});

describe("isTerminal", () => {
  it("marca estados finais", () => {
    expect(isTerminal("CONCLUIDO")).toBe(true);
    expect(isTerminal("RECUSADO")).toBe(true);
    expect(isTerminal("EXPIRADO")).toBe(true);
    expect(isTerminal("CANCELADO")).toBe(true);
  });

  it("estados ativos não são terminais", () => {
    expect(isTerminal("PENDENTE")).toBe(false);
    expect(isTerminal("APROVADO")).toBe(false);
    expect(isTerminal("INICIADO")).toBe(false);
  });
});

describe("exceedsPendingLimit", () => {
  it(`barra a partir de ${MAX_PENDING_PER_ESPECIALIDADE} pendentes`, () => {
    expect(exceedsPendingLimit(0)).toBe(false);
    expect(exceedsPendingLimit(MAX_PENDING_PER_ESPECIALIDADE - 1)).toBe(false);
    expect(exceedsPendingLimit(MAX_PENDING_PER_ESPECIALIDADE)).toBe(true);
    expect(exceedsPendingLimit(MAX_PENDING_PER_ESPECIALIDADE + 1)).toBe(true);
  });
});

describe("computeExpiry", () => {
  it("soma 24h ao instante de criação", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    expect(computeExpiry(from)).toBe("2026-06-02T00:00:00.000Z");
  });
});

describe("serviceBlockWindow", () => {
  it("gera janela de 2h a partir da dataServico", () => {
    expect(serviceBlockWindow("2026-06-10T14:00:00.000Z")).toEqual({
      inicio: "2026-06-10T14:00:00.000Z",
      fim: "2026-06-10T16:00:00.000Z",
    });
  });
});
