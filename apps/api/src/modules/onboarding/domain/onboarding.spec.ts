import { ONBOARDING_SEQUENCE, stepDelayMs, buildChecklist } from "./onboarding.js";

describe("ONBOARDING_SEQUENCE", () => {
  it("segue D1/D3/D5/D7", () => {
    expect(ONBOARDING_SEQUENCE.map((s) => s.dia)).toEqual([1, 3, 5, 7]);
  });
});

describe("stepDelayMs", () => {
  it("D1 = 1 dia em ms", () => {
    expect(stepDelayMs(1)).toBe(86_400_000);
  });

  it("speedupFactor acelera o atraso (dev/teste)", () => {
    expect(stepDelayMs(1, 86_400)).toBe(1000); // 1 dia -> 1s
  });
});

describe("buildChecklist", () => {
  it("reflete o estado do perfil", () => {
    const items = buildChecklist({
      temPerfil: true,
      temEspecialidades: false,
      temFoto: false,
      completudePct: 25,
    });
    expect(items.find((i) => i.chave === "perfil")?.feito).toBe(true);
    expect(items.find((i) => i.chave === "foto")?.feito).toBe(false);
    expect(items.find((i) => i.chave === "completo")?.feito).toBe(false);
  });
});
