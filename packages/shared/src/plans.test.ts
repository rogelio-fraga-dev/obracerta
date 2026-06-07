import { describe, expect, it } from "vitest";
import { ProfessionalPlan } from "./enums.js";
import {
  formatCentavos,
  professionalPlanCatalog,
  professionalPlansOrdered,
} from "./plans.js";

describe("professionalPlanCatalog", () => {
  it("espelha os preços da regra de cobrança do backend", () => {
    expect(professionalPlanCatalog[ProfessionalPlan.INICIANTE].precoCentavos).toBe(0);
    expect(professionalPlanCatalog[ProfessionalPlan.PRO].precoCentavos).toBe(4900);
    expect(professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA].precoCentavos).toBe(9900);
  });

  it("recomenda exatamente um plano (o PRO)", () => {
    const recomendados = professionalPlansOrdered.filter((p) => p.recomendado);
    expect(recomendados).toHaveLength(1);
    expect(recomendados[0]?.plano).toBe(ProfessionalPlan.PRO);
  });

  it("lista os três planos do grátis ao premium", () => {
    expect(professionalPlansOrdered.map((p) => p.plano)).toEqual([
      ProfessionalPlan.INICIANTE,
      ProfessionalPlan.PRO,
      ProfessionalPlan.ESPECIALISTA,
    ]);
  });
});

describe("formatCentavos", () => {
  it("formata centavos como moeda BRL", () => {
    // O ICU separa "R$" do número com NBSP; `\s` no regex casa NBSP sem literal no fonte.
    expect(formatCentavos(4900)).toMatch(/^R\$\s?49,00$/);
    expect(formatCentavos(0)).toMatch(/^R\$\s?0,00$/);
  });
});
