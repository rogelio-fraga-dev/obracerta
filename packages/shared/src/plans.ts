import { ProfessionalPlan } from "./enums.js";

/**
 * Catálogo de planos do profissional para **apresentação** (tela de escolha de
 * plano — roadmap §4.2). Fonte única do front; espelha os preços que a regra de
 * cobrança usa no backend (`billing-rules`): INICIANTE grátis, PRO R$49, ESP R$99.
 * O teste trava esses valores para flagrar qualquer divergência.
 */
export interface ProfessionalPlanInfo {
  plano: ProfessionalPlan;
  nome: string;
  /** Preço mensal em centavos (0 = grátis). */
  precoCentavos: number;
  /** Marca o plano sugerido (mitiga escolha errada, §4.2). */
  recomendado: boolean;
  resumo: string;
  beneficios: string[];
}

export const professionalPlanCatalog: Record<ProfessionalPlan, ProfessionalPlanInfo> = {
  [ProfessionalPlan.INICIANTE]: {
    plano: ProfessionalPlan.INICIANTE,
    nome: "Iniciante",
    precoCentavos: 0,
    recomendado: false,
    resumo: "Comece de graça",
    beneficios: ["Perfil público", "Apareça nas buscas do seu bairro"],
  },
  [ProfessionalPlan.PRO]: {
    plano: ProfessionalPlan.PRO,
    nome: "Pro",
    precoCentavos: 4900,
    recomendado: true,
    resumo: "Mais visibilidade",
    beneficios: ["Tudo do Iniciante", "Busca por proximidade", "Destaque no seu perfil"],
  },
  [ProfessionalPlan.ESPECIALISTA]: {
    plano: ProfessionalPlan.ESPECIALISTA,
    nome: "Especialista",
    precoCentavos: 9900,
    recomendado: false,
    resumo: "Alcance máximo",
    beneficios: ["Tudo do Pro", "Busca ilimitada", "Prioridade nos resultados"],
  },
};

/** Planos na ordem de apresentação (do grátis ao premium). */
export const professionalPlansOrdered: ProfessionalPlanInfo[] = [
  professionalPlanCatalog[ProfessionalPlan.INICIANTE],
  professionalPlanCatalog[ProfessionalPlan.PRO],
  professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA],
];

/** Formata centavos (inteiro) como moeda BRL: 4900 → "R$ 49,00". */
export function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
