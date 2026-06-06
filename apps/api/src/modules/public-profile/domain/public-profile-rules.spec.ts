import { nomeParcial, isReducedVisibility, publicName, publicFoto } from "./public-profile-rules.js";

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

describe("isReducedVisibility", () => {
  it("Iniciante tem visibilidade reduzida; pagos não", () => {
    expect(isReducedVisibility("INICIANTE")).toBe(true);
    expect(isReducedVisibility("PRO")).toBe(false);
    expect(isReducedVisibility("ESPECIALISTA")).toBe(false);
  });
});

describe("publicName", () => {
  it("oculta o nome no Iniciante; parcial nos pagos", () => {
    expect(publicName("João Silva", "INICIANTE")).toBeNull();
    expect(publicName("João Silva", "PRO")).toBe("João S.");
  });
});

describe("publicFoto", () => {
  it("oculta a foto no Iniciante; mostra nos pagos", () => {
    expect(publicFoto("https://cdn/x.jpg", "INICIANTE")).toBeNull();
    expect(publicFoto("https://cdn/x.jpg", "ESPECIALISTA")).toBe("https://cdn/x.jpg");
    expect(publicFoto(null, "PRO")).toBeNull();
  });
});
