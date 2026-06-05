import {
  HIDE_WINDOW_HOURS,
  AUTO_SUSPEND_THRESHOLD,
  SUSPENSION_DAYS,
  precautionaryHideUntil,
  canResolveReport,
  shouldAutoSuspend,
  suspensionEnd,
  canAppeal,
  isSuspensionActive,
  appealOutcome,
} from "./moderation-rules.js";

describe("precautionaryHideUntil", () => {
  it("oculta por 48h a partir de agora", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(precautionaryHideUntil(now).toISOString()).toBe("2026-06-03T00:00:00.000Z");
    expect(HIDE_WINDOW_HOURS).toBe(48);
  });
});

describe("canResolveReport", () => {
  it("só denúncias abertas ou em análise podem ser resolvidas", () => {
    expect(canResolveReport("ABERTA")).toBe(true);
    expect(canResolveReport("EM_ANALISE")).toBe(true);
    expect(canResolveReport("PROCEDENTE")).toBe(false);
    expect(canResolveReport("IMPROCEDENTE")).toBe(false);
  });
});

describe("shouldAutoSuspend", () => {
  it("suspende ao atingir o limite de strikes procedentes", () => {
    expect(AUTO_SUSPEND_THRESHOLD).toBe(3);
    expect(shouldAutoSuspend(2)).toBe(false);
    expect(shouldAutoSuspend(3)).toBe(true);
    expect(shouldAutoSuspend(5)).toBe(true);
  });
});

describe("suspensionEnd", () => {
  it("suspensão dura 7 dias", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(suspensionEnd(now).toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(SUSPENSION_DAYS).toBe(7);
  });
});

describe("canAppeal", () => {
  it("só suspensão ativa pode ser apelada", () => {
    expect(canAppeal("ATIVA")).toBe(true);
    expect(canAppeal("APELADA")).toBe(false);
    expect(canAppeal("REVOGADA")).toBe(false);
    expect(canAppeal("EXPIRADA")).toBe(false);
  });
});

describe("isSuspensionActive", () => {
  const now = new Date("2026-06-05T00:00:00.000Z");

  it("ativa sem fim (indeterminada) está em vigor", () => {
    expect(isSuspensionActive("ATIVA", null, now)).toBe(true);
  });

  it("ativa com fim no futuro está em vigor", () => {
    expect(isSuspensionActive("ATIVA", new Date("2026-06-06T00:00:00.000Z"), now)).toBe(true);
  });

  it("ativa com fim no passado já expirou (expiração preguiçosa)", () => {
    expect(isSuspensionActive("ATIVA", new Date("2026-06-04T00:00:00.000Z"), now)).toBe(false);
  });

  it("estados não-ativos não estão em vigor", () => {
    expect(isSuspensionActive("REVOGADA", null, now)).toBe(false);
    expect(isSuspensionActive("APELADA", null, now)).toBe(false);
  });
});

describe("appealOutcome", () => {
  it("deferir revoga; indeferir mantém ativa", () => {
    expect(appealOutcome(true)).toBe("REVOGADA");
    expect(appealOutcome(false)).toBe("ATIVA");
  });
});
