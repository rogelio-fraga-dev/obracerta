import { rate, media, estimateLtvCentavos, MAX_MESES_VIDA } from "./metrics-rules.js";

describe("rate", () => {
  it("razão parte/total arredondada a 2 casas", () => {
    expect(rate(3, 4)).toBe(0.75);
    expect(rate(1, 3)).toBe(0.33);
  });

  it("total zero → 0 (sem divisão por zero)", () => {
    expect(rate(0, 0)).toBe(0);
    expect(rate(5, 0)).toBe(0);
  });

  it("nunca passa de 1", () => {
    expect(rate(4, 4)).toBe(1);
  });
});

describe("media", () => {
  it("média soma/quantidade arredondada a 2 casas", () => {
    expect(media(10, 4)).toBe(2.5);
    expect(media(10, 3)).toBe(3.33);
  });

  it("quantidade zero → 0 (sem divisão por zero)", () => {
    expect(media(0, 0)).toBe(0);
    expect(media(7, 0)).toBe(0);
  });

  it("pode passar de 1 (não é razão)", () => {
    expect(media(12, 4)).toBe(3);
  });
});

describe("estimateLtvCentavos", () => {
  it("projeta ARPA pela vida útil ≈ 1/churn", () => {
    // churn 0.1 → vida 10 meses → 4990 * 10
    expect(estimateLtvCentavos(4990, 0.1)).toBe(49900);
  });

  it("churn zero → usa o teto de meses de vida", () => {
    expect(estimateLtvCentavos(4990, 0)).toBe(4990 * MAX_MESES_VIDA);
  });

  it("churn baixíssimo é limitado pelo teto", () => {
    expect(estimateLtvCentavos(4990, 0.001)).toBe(4990 * MAX_MESES_VIDA);
  });

  it("ARPA zero → 0", () => {
    expect(estimateLtvCentavos(0, 0.1)).toBe(0);
  });
});
