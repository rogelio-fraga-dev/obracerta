import { describe, expect, it } from "vitest";
import { documentTotalCentavos } from "./professional-tools.js";

describe("documentTotalCentavos", () => {
  it("soma quantidade × valor unitário de cada item", () => {
    const total = documentTotalCentavos([
      { descricao: "Mão de obra", quantidade: 2, valorUnitarioCentavos: 15000 },
      { descricao: "Material", quantidade: 3, valorUnitarioCentavos: 5000 },
    ]);
    expect(total).toBe(2 * 15000 + 3 * 5000); // 45000
  });

  it("é 0 para lista vazia", () => {
    expect(documentTotalCentavos([])).toBe(0);
  });
});
