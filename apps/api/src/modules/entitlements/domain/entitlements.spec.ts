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

  it("apenas o plano LANCE do contratante permite publicar obra para lances", () => {
    expect(planAllows(ContractorPlan.LANCE, Feature.SUBMIT_BID)).toBe(true);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.SUBMIT_BID)).toBe(false);
  });

  it("todo plano de contratante/empresa permite solicitar agendamento; sem plano, não", () => {
    expect(planAllows(ContractorPlan.BASICO, Feature.REQUEST_BOOKING)).toBe(true);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.REQUEST_BOOKING)).toBe(true);
    expect(planAllows(ContractorPlan.LANCE, Feature.REQUEST_BOOKING)).toBe(true);
    expect(planAllows(ProfessionalPlan.PRO, Feature.REQUEST_BOOKING)).toBe(false);
  });

  it("todo plano do profissional recebe pedidos (Iniciante inclusive)", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.RECEIVE_BOOKINGS)).toBe(true);
    expect(planAllows(ProfessionalPlan.PRO, Feature.RECEIVE_BOOKINGS)).toBe(true);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.RECEIVE_BOOKINGS)).toBe(true);
  });

  it("responder pedidos (e liberar contato) exige o Profissional (homologação 18/07)", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.RESPOND_BOOKINGS)).toBe(false);
    expect(planAllows(ProfessionalPlan.PRO, Feature.RESPOND_BOOKINGS)).toBe(true);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.RESPOND_BOOKINGS)).toBe(true);
  });

  it("dar lances é exclusivo do Especialista (homologação 18/07)", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.SUBMIT_BID)).toBe(false);
    expect(planAllows(ProfessionalPlan.PRO, Feature.SUBMIT_BID)).toBe(false);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.SUBMIT_BID)).toBe(true);
  });

  it("ferramentas (orçamento/recibo) são exclusivas do Especialista", () => {
    expect(planAllows(ProfessionalPlan.PRO, Feature.PRO_TOOLS)).toBe(false);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.PRO_TOOLS)).toBe(true);
  });

  it("analytics: base a partir do Profissional; avançado só Especialista", () => {
    expect(planAllows(ProfessionalPlan.INICIANTE, Feature.ANALYTICS)).toBe(false);
    expect(planAllows(ProfessionalPlan.PRO, Feature.ANALYTICS)).toBe(true);
    expect(planAllows(ProfessionalPlan.PRO, Feature.ADVANCED_ANALYTICS)).toBe(false);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.ADVANCED_ANALYTICS)).toBe(true);
  });

  it("oportunidades em primeira mão são exclusivas do Especialista", () => {
    expect(planAllows(ProfessionalPlan.PRO, Feature.EARLY_OPPORTUNITIES)).toBe(false);
    expect(planAllows(ProfessionalPlan.ESPECIALISTA, Feature.EARLY_OPPORTUNITIES)).toBe(true);
  });

  it("empresa: visibilidade no Completo+; relatórios e destaque só no PRO (LANCE)", () => {
    expect(planAllows(ContractorPlan.BASICO, Feature.COMPANY_VISIBILITY)).toBe(false);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.COMPANY_VISIBILITY)).toBe(true);
    expect(planAllows(ContractorPlan.LANCE, Feature.COMPANY_VISIBILITY)).toBe(true);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.COMPANY_REPORTS)).toBe(false);
    expect(planAllows(ContractorPlan.LANCE, Feature.COMPANY_REPORTS)).toBe(true);
    expect(planAllows(ContractorPlan.COMPLETO, Feature.FEATURED_ORDERS)).toBe(false);
    expect(planAllows(ContractorPlan.LANCE, Feature.FEATURED_ORDERS)).toBe(true);
  });
});
