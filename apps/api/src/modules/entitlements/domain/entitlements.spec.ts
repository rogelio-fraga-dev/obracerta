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

  it("receber pedidos é grátis: todo plano do profissional recebe (reprecificação)", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.RECEIVE_BOOKINGS)).toBe(true);
    expect(planAllows(ProfessionalPlan.PRO, Feature.RECEIVE_BOOKINGS)).toBe(true);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.RECEIVE_BOOKINGS)).toBe(true);
  });

  it("dar lances sai a partir do Pro (Iniciante não; Pro e Especialista sim)", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.SUBMIT_BID)).toBe(false);
    expect(planAllows(ProfessionalPlan.PRO, Feature.SUBMIT_BID)).toBe(true);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.SUBMIT_BID)).toBe(true);
  });

  it("ferramentas (orçamento/recibo) são exclusivas do Especialista", () => {
    expect(planAllows(ProfessionalPlan.PRO, Feature.PRO_TOOLS)).toBe(false);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.PRO_TOOLS)).toBe(true);
  });
});
