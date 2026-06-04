import { slugify, slugWithSuffix } from "./slug.js";

describe("slugify", () => {
  it("remove acentos e baixa caixa", () => {
    expect(slugify("João da Silva")).toBe("joao-da-silva");
    expect(slugify("Eletricista Ção")).toBe("eletricista-cao");
  });

  it("colapsa separadores e apara hífens nas pontas", () => {
    expect(slugify("  Maria   --  Souza  ")).toBe("maria-souza");
  });

  it("garante o mínimo de 3 caracteres", () => {
    expect(slugify("Jo").length).toBeGreaterThanOrEqual(3);
  });
});

describe("slugWithSuffix", () => {
  it("não altera para n<=1 e adiciona sufixo para n>1", () => {
    expect(slugWithSuffix("joao-silva", 1)).toBe("joao-silva");
    expect(slugWithSuffix("joao-silva", 2)).toBe("joao-silva-2");
    expect(slugWithSuffix("joao-silva", 3)).toBe("joao-silva-3");
  });
});
