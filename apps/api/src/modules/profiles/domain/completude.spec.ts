import { computeProfessionalCompletude, type CompletudeInput } from "./completude.js";

const empty: CompletudeInput = {
  especialidades: [],
  anosExperiencia: null,
  bairro: null,
  fotoUrl: null,
  valores: null,
  formacaoDeclarada: null,
};

describe("computeProfessionalCompletude", () => {
  it("perfil vazio = 0%", () => {
    expect(computeProfessionalCompletude(empty)).toBe(0);
  });

  it("perfil totalmente preenchido = 100%", () => {
    expect(
      computeProfessionalCompletude({
        especialidades: ["Alvenaria"],
        anosExperiencia: 5,
        bairro: "Centro",
        fotoUrl: "https://x/y.jpg",
        valores: "a combinar",
        formacaoDeclarada: "Técnico",
      }),
    ).toBe(100);
  });

  it("metade dos campos = 50%", () => {
    expect(
      computeProfessionalCompletude({
        ...empty,
        especialidades: ["Pintura"],
        anosExperiencia: 3,
        bairro: "Vila",
      }),
    ).toBe(50);
  });

  it("anosExperiencia = 0 conta como preenchido", () => {
    expect(computeProfessionalCompletude({ ...empty, anosExperiencia: 0 })).toBeGreaterThan(0);
  });
});
