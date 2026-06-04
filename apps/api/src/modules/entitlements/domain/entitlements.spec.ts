import { ProfessionalPlan, ContractorPlan } from "@obracerta/shared";
import { Feature, planAllows } from "./entitlements.js";

describe("planAllows", () => {
  it("INICIANTE tem perfil público mas não busca geo", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.PUBLIC_PROFILE)).toBe(true);
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.SEARCH_GEO)).toBe(false);
  });

  it("ESPECIALISTA tem busca ilimitada", () => {
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.SEARCH_UNLIMITED)).toBe(true);
  });

  it("apenas o plano LANCE do contratante permite enviar lance", () => {
    expect(planAllows(ContractorPlan.LANCE, Feature.SUBMIT_BID)).toBe(true);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.SUBMIT_BID)).toBe(false);
  });
});
