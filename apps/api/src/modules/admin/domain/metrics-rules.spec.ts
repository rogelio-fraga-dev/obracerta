import { rate } from "./metrics-rules.js";

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
