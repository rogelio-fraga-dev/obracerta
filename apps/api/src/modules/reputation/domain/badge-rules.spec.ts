import { BadgeCode, computeBadges, reconcileBadges } from "./badge-rules.js";

describe("computeBadges", () => {
  it("sem avaliações suficientes → nenhum badge", () => {
    expect(computeBadges(0, 0)).toEqual([]);
    expect(computeBadges(4, 5)).toEqual([]); // média ótima, mas poucas avaliações
  });

  it("BEM_AVALIADO exige média >= 4.5 e >= 5 avaliações", () => {
    expect(computeBadges(5, 4.5)).toEqual([BadgeCode.BEM_AVALIADO]);
    expect(computeBadges(10, 4.49)).toEqual([]); // média abaixo do corte
  });

  it("VETERANO exige >= 20 avaliações", () => {
    expect(computeBadges(20, 3)).toEqual([BadgeCode.VETERANO]);
  });

  it("acumula badges quando ambos os critérios batem", () => {
    expect(computeBadges(20, 4.8)).toEqual([BadgeCode.BEM_AVALIADO, BadgeCode.VETERANO]);
  });
});

describe("reconcileBadges", () => {
  it("concede os que faltam e revoga os que não são mais merecidos", () => {
    const { toGrant, toRevoke } = reconcileBadges(["VETERANO"], [
      BadgeCode.BEM_AVALIADO,
      BadgeCode.VETERANO,
    ]);
    expect(toGrant).toEqual([BadgeCode.BEM_AVALIADO]);
    expect(toRevoke).toEqual([]);
  });

  it("revoga um badge que deixou de ser merecido", () => {
    const { toGrant, toRevoke } = reconcileBadges(["BEM_AVALIADO"], []);
    expect(toGrant).toEqual([]);
    expect(toRevoke).toEqual(["BEM_AVALIADO"]);
  });

  it("sem mudança quando ativos == merecidos", () => {
    const { toGrant, toRevoke } = reconcileBadges(["BEM_AVALIADO"], [BadgeCode.BEM_AVALIADO]);
    expect(toGrant).toEqual([]);
    expect(toRevoke).toEqual([]);
  });

  it("preserva badges ativos fora do catálogo automático (não revoga manual/legado)", () => {
    // "VERIFICADO" não é um badge calculado: o recompute não pode revogá-lo
    const { toGrant, toRevoke } = reconcileBadges(["VERIFICADO"], []);
    expect(toGrant).toEqual([]);
    expect(toRevoke).toEqual([]);
  });
});
