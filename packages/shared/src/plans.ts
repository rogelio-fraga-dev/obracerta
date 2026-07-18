import { ContractorPlan, ProfessionalPlan, UserType } from "./enums.js";

/**
 * Catálogo de planos para **apresentação** (telas de escolha de plano). Fonte
 * única do front; espelha os preços que a regra de cobrança usa no backend
 * (`billing-rules`) — o teste trava esses valores para flagrar divergência.
 *
 * Homologação 18/07: todos os planos são pagos. Profissional: Iniciante
 * R$ 19,90 (7 dias grátis com cartão), Profissional R$ 49,90, Especialista
 * R$ 99,90. Contratante (assinatura mensal): Essencial R$ 19,90, Completo
 * R$ 39,90, Lance R$ 69,90. Empresa (mesmos códigos de plano do contratante,
 * preço próprio): Essencial R$ 49,90, Completo R$ 99,90, Empresa PRO R$ 149,90.
 */
export interface ProfessionalPlanInfo {
  plano: ProfessionalPlan;
  nome: string;
  /** Preço mensal em centavos. */
  precoCentavos: number;
  /** Dias de teste grátis (cartão obrigatório; cobrança só após o período). */
  trialDias?: number;
  /** Marca o plano sugerido (mitiga escolha errada, §4.2). */
  recomendado: boolean;
  resumo: string;
  beneficios: string[];
}

export const professionalPlanCatalog: Record<ProfessionalPlan, ProfessionalPlanInfo> = {
  [ProfessionalPlan.INICIANTE]: {
    plano: ProfessionalPlan.INICIANTE,
    nome: "Iniciante",
    precoCentavos: 1990,
    trialDias: 7,
    recomendado: false,
    resumo: "Essencial — seja encontrado",
    beneficios: [
      "7 primeiros dias grátis",
      "Perfil aparece nas buscas",
      "Cidade e raio de atuação",
      "Receber pedidos de orçamento",
    ],
  },
  [ProfessionalPlan.PRO]: {
    plano: ProfessionalPlan.PRO,
    nome: "Profissional",
    precoCentavos: 4990,
    recomendado: true,
    resumo: "Conquiste a confiança dos clientes",
    beneficios: [
      "Tudo do Iniciante",
      "Perfil completo com foto e portfólio",
      "Responder pedidos de orçamento",
      "Contato do cliente liberado",
    ],
  },
  [ProfessionalPlan.ESPECIALISTA]: {
    plano: ProfessionalPlan.ESPECIALISTA,
    nome: "Especialista",
    precoCentavos: 9990,
    recomendado: false,
    resumo: "Mais oportunidades, mais crescimento",
    beneficios: [
      "Tudo do Profissional",
      "Dar lances em obras",
      "Topo das buscas",
      "Prioridade no suporte",
    ],
  },
};

/** Planos na ordem de apresentação (do essencial ao premium). */
export const professionalPlansOrdered: ProfessionalPlanInfo[] = [
  professionalPlanCatalog[ProfessionalPlan.INICIANTE],
  professionalPlanCatalog[ProfessionalPlan.PRO],
  professionalPlanCatalog[ProfessionalPlan.ESPECIALISTA],
];

/**
 * Catálogo de planos de acesso de quem contrata (**assinatura mensal** com
 * renovação automática — cancele quando quiser). Os mesmos códigos de plano
 * servem contratante e empresa; nome e preço variam por tipo de conta.
 */
export interface ContractorPlanInfo {
  plano: ContractorPlan;
  nome: string;
  /** Preço mensal em centavos. */
  precoCentavos: number;
  recomendado: boolean;
  resumo: string;
  beneficios: string[];
}

export const contractorPlanCatalog: Record<ContractorPlan, ContractorPlanInfo> = {
  [ContractorPlan.BASICO]: {
    plano: ContractorPlan.BASICO,
    nome: "Essencial",
    precoCentavos: 1990,
    recomendado: false,
    resumo: "Conheça a plataforma",
    beneficios: ["Buscar profissionais", "Filtrar por profissão", "Visualizar disponibilidade", "Solicitar contato"],
  },
  [ContractorPlan.COMPLETO]: {
    plano: ContractorPlan.COMPLETO,
    nome: "Completo",
    precoCentavos: 3990,
    recomendado: true,
    resumo: "Contrate com confiança",
    beneficios: [
      "Tudo do Essencial",
      "Foto, nome e avaliações dos profissionais",
      "Agenda detalhada e agendamento",
      "Contato liberado após aprovação",
    ],
  },
  [ContractorPlan.LANCE]: {
    plano: ContractorPlan.LANCE,
    nome: "Lance",
    precoCentavos: 6990,
    recomendado: false,
    resumo: "Receba propostas pela sua obra",
    beneficios: [
      "Tudo do Completo",
      "Publicar obras",
      "Receber propostas de diversos profissionais",
      "Comparar propostas lado a lado",
    ],
  },
};

/** Planos do contratante na ordem de apresentação (do mais barato ao premium). */
export const contractorPlansOrdered: ContractorPlanInfo[] = [
  contractorPlanCatalog[ContractorPlan.BASICO],
  contractorPlanCatalog[ContractorPlan.COMPLETO],
  contractorPlanCatalog[ContractorPlan.LANCE],
];

/**
 * Catálogo de planos da **empresa** — mesmos códigos (`ContractorPlan`), com
 * nome, preço e benefícios próprios. O backend precifica pela combinação
 * plano + tipo de conta (`contractorPriceCentavos`).
 */
export const companyPlanCatalog: Record<ContractorPlan, ContractorPlanInfo> = {
  [ContractorPlan.BASICO]: {
    plano: ContractorPlan.BASICO,
    nome: "Essencial",
    precoCentavos: 4990,
    recomendado: false,
    resumo: "Sua empresa na plataforma",
    beneficios: [
      "Cadastre sua empresa com CNPJ",
      "Adicione pessoas da sua equipe",
      "Busque profissionais por profissão e região",
      "Solicite contato",
    ],
  },
  [ContractorPlan.COMPLETO]: {
    plano: ContractorPlan.COMPLETO,
    nome: "Completo",
    precoCentavos: 9990,
    recomendado: true,
    resumo: "Contrate com mais segurança",
    beneficios: [
      "Tudo do Essencial",
      "Perfil completo dos profissionais",
      "Publicar demandas de contratação",
      "Comparar profissionais antes de contratar",
    ],
  },
  [ContractorPlan.LANCE]: {
    plano: ContractorPlan.LANCE,
    nome: "Empresa PRO",
    precoCentavos: 14990,
    recomendado: false,
    resumo: "Disputa de oportunidades e gestão",
    beneficios: [
      "Tudo do Completo",
      "Receber lances de diversos profissionais",
      "Comparar valores e prazos lado a lado",
      "Relatórios e histórico de contratações",
    ],
  },
};

/** Planos da empresa na ordem de apresentação. */
export const companyPlansOrdered: ContractorPlanInfo[] = [
  companyPlanCatalog[ContractorPlan.BASICO],
  companyPlanCatalog[ContractorPlan.COMPLETO],
  companyPlanCatalog[ContractorPlan.LANCE],
];

/** Catálogo de planos de contratação conforme o tipo da conta (empresa tem preço próprio). */
export function hiringPlanCatalogFor(tipo: UserType | string | undefined): Record<ContractorPlan, ContractorPlanInfo> {
  return tipo === UserType.EMPRESA ? companyPlanCatalog : contractorPlanCatalog;
}

/** Planos de contratação ordenados conforme o tipo da conta. */
export function hiringPlansOrderedFor(tipo: UserType | string | undefined): ContractorPlanInfo[] {
  return tipo === UserType.EMPRESA ? companyPlansOrdered : contractorPlansOrdered;
}

/** Formata centavos (inteiro) como moeda BRL: 4990 → "R$ 49,90". */
export function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
