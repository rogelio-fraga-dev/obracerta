import { ContractorPlan, ProfessionalPlan } from "./enums.js";

/**
 * Catálogo de planos do profissional para **apresentação** (tela de escolha de
 * plano — roadmap §4.2). Fonte única do front; espelha os preços que a regra de
 * cobrança usa no backend (`billing-rules`): INICIANTE grátis, PRO R$49, ESP R$99.
 * O teste trava esses valores para flagrar qualquer divergência. Pós-reprecificação
 * (Fase 8+): receber pedidos é grátis; lances saem no Pro; ferramentas no Especialista.
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
    beneficios: ["Perfil público", "Apareça nas buscas do seu bairro", "Receba pedidos de clientes"],
  },
  [ProfessionalPlan.PRO]: {
    plano: ProfessionalPlan.PRO,
    nome: "Pro",
    precoCentavos: 4900,
    recomendado: true,
    resumo: "Mais visibilidade",
    beneficios: ["Tudo do Iniciante", "Perfil completo", "Dê lances em obras", "Busca por proximidade"],
  },
  [ProfessionalPlan.ESPECIALISTA]: {
    plano: ProfessionalPlan.ESPECIALISTA,
    nome: "Especialista",
    precoCentavos: 9900,
    recomendado: false,
    resumo: "Alcance máximo",
    beneficios: ["Tudo do Pro", "Orçamentos e recibos", "Busca ilimitada", "Topo nos resultados"],
  },
};

/** Planos na ordem de apresentação (do grátis ao premium). */
export const professionalPlansOrdered: ProfessionalPlanInfo[] = [
  professionalPlanCatalog[ProfessionalPlan.INICIANTE],
  professionalPlanCatalog[ProfessionalPlan.PRO],
  professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA],
];

/**
 * Catálogo de planos avulsos do **contratante/empresa** (acesso por 30 dias).
 * Preços espelham `billing-rules` (BASICO R$19 · COMPLETO R$39 · LANCE R$69).
 */
export interface ContractorPlanInfo {
  plano: ContractorPlan;
  nome: string;
  /** Preço do acesso (30 dias) em centavos. */
  precoCentavos: number;
  recomendado: boolean;
  resumo: string;
  beneficios: string[];
}

export const contractorPlanCatalog: Record<ContractorPlan, ContractorPlanInfo> = {
  [ContractorPlan.BASICO]: {
    plano: ContractorPlan.BASICO,
    nome: "Básico",
    precoCentavos: 1900,
    recomendado: false,
    resumo: "Explore a oferta",
    beneficios: ["Ver todos os profissionais", "Filtro por profissão", "Disponibilidade geral"],
  },
  [ContractorPlan.COMPLETO]: {
    plano: ContractorPlan.COMPLETO,
    nome: "Completo",
    precoCentavos: 3900,
    recomendado: true,
    resumo: "Contrate com segurança",
    beneficios: ["Tudo do Básico", "Ranking e recomendados", "Agendar serviços", "Valores e agenda visíveis"],
  },
  [ContractorPlan.LANCE]: {
    plano: ContractorPlan.LANCE,
    nome: "Lance",
    precoCentavos: 6900,
    recomendado: false,
    resumo: "Profissionais competem",
    beneficios: ["Tudo do Completo", "Publicar obra para lances", "Receber propostas sigilosas"],
  },
};

/** Planos do contratante na ordem de apresentação (do mais barato ao premium). */
export const contractorPlansOrdered: ContractorPlanInfo[] = [
  contractorPlanCatalog[ContractorPlan.BASICO],
  contractorPlanCatalog[ContractorPlan.COMPLETO],
  contractorPlanCatalog[ContractorPlan.LANCE],
];

/** Formata centavos (inteiro) como moeda BRL: 4900 → "R$ 49,00". */
export function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
