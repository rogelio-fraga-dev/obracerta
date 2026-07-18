import {
  nomeParcial,
  primeiroNome,
  isReducedVisibility,
  publicName,
  publicFoto,
} from "./public-profile-rules.js";

describe("nomeParcial", () => {
  it("primeiro nome + inicial do sobrenome", () => {
    expect(nomeParcial("João Silva")).toBe("João S.");
    expect(nomeParcial("Ana Paula Souza")).toBe("Ana S."); // primeiro + inicial do último
  });

  it("só um nome → mantém", () => {
    expect(nomeParcial("Maria")).toBe("Maria");
  });

  it("normaliza espaços", () => {
    expect(nomeParcial("  Carlos   Pereira ")).toBe("Carlos P.");
  });
});

describe("primeiroNome", () => {
  it("devolve só o primeiro nome", () => {
    expect(primeiroNome("João Silva")).toBe("João");
    expect(primeiroNome("  Ana Paula Souza ")).toBe("Ana");
  });
});

describe("isReducedVisibility", () => {
  it("Iniciante tem visibilidade reduzida; pagos não", () => {
    expect(isReducedVisibility("INICIANTE")).toBe(true);
    expect(isReducedVisibility("PRO")).toBe(false);
    expect(isReducedVisibility("ESPECIALISTA")).toBe(false);
  });
});

describe("publicName", () => {
  it("homologação 18/07: primeiro nome no Iniciante; completo nos pagos", () => {
    expect(publicName("João Silva", "INICIANTE")).toBe("João");
    expect(publicName("João Silva", "PRO")).toBe("João Silva");
    expect(publicName("Ana Paula Souza", "ESPECIALISTA")).toBe("Ana Paula Souza");
  });

  it("nome vazio → null", () => {
    expect(publicName("   ", "INICIANTE")).toBeNull();
  });
});

describe("publicFoto", () => {
  it("oculta a foto no Iniciante; mostra nos pagos", () => {
    expect(publicFoto("https://cdn/x.jpg", "INICIANTE")).toBeNull();
    expect(publicFoto("https://cdn/x.jpg", "ESPECIALISTA")).toBe("https://cdn/x.jpg");
    expect(publicFoto(null, "PRO")).toBeNull();
  });
});
