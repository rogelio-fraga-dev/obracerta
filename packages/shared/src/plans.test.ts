import { describe, expect, it } from "vitest";
import { ContractorPlan, ProfessionalPlan, UserType } from "./enums.js";
import {
  companyPlanCatalog,
  companyPlansOrdered,
  contractorPlanCatalog,
  contractorPlansOrdered,
  formatCentavos,
  hiringPlanCatalogFor,
  hiringPlansOrderedFor,
  professionalPlanCatalog,
  professionalPlansOrdered,
} from "./plans.js";

describe("professionalPlanCatalog", () => {
  it("espelha os preços da regra de cobrança do backend (homologação 18/07)", () => {
    expect(professionalPlanCatalog[ProfessionalPlan.INICIANTE].precoCentavos).toBe(1990);
    expect(professionalPlanCatalog[ProfessionalPlan.PRO].precoCentavos).toBe(4990);
    expect(professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA].precoCentavos).toBe(9990);
  });

  it("só o Iniciante tem teste grátis (7 dias, com cartão)", () => {
    expect(professionalPlanCatalog[ProfessionalPlan.INICIANTE].trialDias).toBe(7);
    expect(professionalPlanCatalog[ProfessionalPlan.PRO].trialDias).toBeUndefined();
    expect(professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA].trialDias).toBeUndefined();
  });

  it("recomenda exatamente um plano (o Profissional)", () => {
    const recomendados = professionalPlansOrdered.filter((p) => p.recomendado);
    expect(recomendados).toHaveLength(1);
    expect(recomendados[0]?.plano).toBe(ProfessionalPlan.PRO);
  });

  it("lista os três planos do essencial ao premium", () => {
    expect(professionalPlansOrdered.map((p) => p.plano)).toEqual([
      ProfessionalPlan.INICIANTE,
      ProfessionalPlan.PRO,
      ProfessionalPlan.ESPECIALISTA,
    ]);
  });
});

describe("contractorPlanCatalog", () => {
  it("espelha os preços mensais do contratante (homologação 18/07)", () => {
    expect(contractorPlanCatalog[ContractorPlan.BASICO].precoCentavos).toBe(1990);
    expect(contractorPlanCatalog[ContractorPlan.COMPLETO].precoCentavos).toBe(3990);
    expect(contractorPlanCatalog[ContractorPlan.LANCE].precoCentavos).toBe(6990);
  });

  it("apresenta o BASICO como Essencial", () => {
    expect(contractorPlanCatalog[ContractorPlan.BASICO].nome).toBe("Essencial");
  });

  it("lista os três planos do mais barato ao premium", () => {
    expect(contractorPlansOrdered.map((p) => p.plano)).toEqual([
      ContractorPlan.BASICO,
      ContractorPlan.COMPLETO,
      ContractorPlan.LANCE,
    ]);
  });
});

describe("companyPlanCatalog", () => {
  it("espelha os preços mensais da empresa (homologação 18/07)", () => {
    expect(companyPlanCatalog[ContractorPlan.BASICO].precoCentavos).toBe(4990);
    expect(companyPlanCatalog[ContractorPlan.COMPLETO].precoCentavos).toBe(9990);
    expect(companyPlanCatalog[ContractorPlan.LANCE].precoCentavos).toBe(14990);
  });

  it("apresenta o LANCE como Empresa PRO", () => {
    expect(companyPlanCatalog[ContractorPlan.LANCE].nome).toBe("Empresa PRO");
  });

  it("lista os três planos ordenados", () => {
    expect(companyPlansOrdered.map((p) => p.plano)).toEqual([
      ContractorPlan.BASICO,
      ContractorPlan.COMPLETO,
      ContractorPlan.LANCE,
    ]);
  });
});

describe("hiringPlanCatalogFor / hiringPlansOrderedFor", () => {
  it("empresa recebe o catálogo com preço próprio", () => {
    expect(hiringPlanCatalogFor(UserType.EMPRESA)).toBe(companyPlanCatalog);
    expect(hiringPlansOrderedFor(UserType.EMPRESA)).toBe(companyPlansOrdered);
  });

  it("contratante (ou tipo desconhecido) recebe o catálogo padrão", () => {
    expect(hiringPlanCatalogFor(UserType.CONTRATANTE)).toBe(contractorPlanCatalog);
    expect(hiringPlanCatalogFor(undefined)).toBe(contractorPlanCatalog);
    expect(hiringPlansOrderedFor("CONTRATANTE")).toBe(contractorPlansOrdered);
  });
});

describe("formatCentavos", () => {
  it("formata centavos como moeda BRL", () => {
    // O ICU separa "R$" do número com NBSP; `\s` no regex casa NBSP sem literal no fonte.
    expect(formatCentavos(4990)).toMatch(/^R\$\s?49,90$/);
    expect(formatCentavos(0)).toMatch(/^R\$\s?0,00$/);
  });
});
