import {
  PenaltyReason,
  isDeclinePenalizable,
  declineToPenaltyReason,
  escalatePoints,
  computeAcceptanceRate,
} from "./penalty-rules.js";

describe("isDeclinePenalizable", () => {
  it("motivos legítimos não penalizam", () => {
    expect(isDeclinePenalizable("AGENDA_INDISPONIVEL")).toBe(false);
    expect(isDeclinePenalizable("FORA_DA_AREA")).toBe(false);
    expect(isDeclinePenalizable("ESCOPO_INCOMPATIVEL")).toBe(false);
    expect(isDeclinePenalizable("VALOR_INCOMPATIVEL")).toBe(false);
    expect(isDeclinePenalizable("OUTRO")).toBe(false);
  });

  it("desistência sem justificativa penaliza", () => {
    expect(isDeclinePenalizable("DESISTENCIA")).toBe(true);
  });
});

describe("declineToPenaltyReason", () => {
  it("mapeia DESISTENCIA → RECUSA_INJUSTIFICADA", () => {
    expect(declineToPenaltyReason("DESISTENCIA")).toBe(PenaltyReason.RECUSA_INJUSTIFICADA);
  });

  it("retorna null para motivo válido", () => {
    expect(declineToPenaltyReason("FORA_DA_AREA")).toBeNull();
  });
});

describe("escalatePoints", () => {
  it("escala 1x → 2x → 3x e satura em 3x", () => {
    expect(escalatePoints("RECUSA_INJUSTIFICADA", 0)).toBe(1);
    expect(escalatePoints("RECUSA_INJUSTIFICADA", 1)).toBe(2);
    expect(escalatePoints("RECUSA_INJUSTIFICADA", 2)).toBe(3);
    expect(escalatePoints("RECUSA_INJUSTIFICADA", 9)).toBe(3);
  });

  it("usa os pontos-base de cada motivo", () => {
    expect(escalatePoints("NAO_RESPONDEU", 0)).toBe(2);
    expect(escalatePoints("NAO_RESPONDEU", 1)).toBe(4);
    expect(escalatePoints("NAO_RESPONDEU", 5)).toBe(6); // 2 × 3 (saturado)
  });
});

describe("computeAcceptanceRate", () => {
  it("sem histórico → 1 (benefício da dúvida)", () => {
    expect(computeAcceptanceRate(0, 0, 0)).toBe(1);
  });

  it("ignora pendentes/cancelados (só os três informados contam)", () => {
    expect(computeAcceptanceRate(3, 1, 0)).toBeCloseTo(0.75);
    expect(computeAcceptanceRate(2, 1, 1)).toBeCloseTo(0.5);
  });

  it("tudo recusado/expirado → 0", () => {
    expect(computeAcceptanceRate(0, 1, 1)).toBe(0);
  });
});
