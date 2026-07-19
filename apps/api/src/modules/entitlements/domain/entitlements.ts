import { ProfessionalPlan, ContractorPlan } from "@obracerta/shared";

/**
 * Capacidades (features) controladas por plano (roadmap §3/§17). Centralizar
 * aqui evita `if (plano === ...)` espalhado pelo código — o gating é uma
 * consulta a este mapa. Versão base (Fase 1); expande na monetização (Fase 4).
 */
export const Feature = {
  // Profissional
  PUBLIC_PROFILE: "profile.public", // perfil aparece na busca
  FULL_PROFILE: "profile.full", // foto, nome completo, cidade e valores visíveis
  PORTFOLIO: "profile.portfolio", // galeria de obras
  RECEIVE_BOOKINGS: "booking.receive", // recebe pedidos de serviço
  RESPOND_BOOKINGS: "booking.respond", // aceita pedidos (libera o contato do cliente)
  ANALYTICS: "profile.analytics", // analytics do perfil (KPIs básicos)
  ADVANCED_ANALYTICS: "profile.analytics.advanced", // analytics avançados (lances, tendências)
  TOP_SEARCH: "search.top", // destaque no topo das buscas
  EARLY_OPPORTUNITIES: "workorder.early", // obras novas notificadas em primeira mão
  PRO_TOOLS: "tools.documents", // ferramentas: orçamento + recibo (§8.5)
  // Contratante/empresa
  REQUEST_BOOKING: "booking.request", // solicitar contato/agendamento com profissional
  COMPANY_TEAM: "company.team", // equipe: membros com acesso + roster de profissionais
  COMPANY_VISIBILITY: "company.visibility", // identidade da empresa visível nas obras
  COMPANY_REPORTS: "company.reports", // relatórios da operação + indicadores
  FEATURED_ORDERS: "workorder.featured", // destaque das obras publicadas na listagem
  // Comum (profissional/contratante)
  SEARCH_GEO: "search.geo",
  SEARCH_UNLIMITED: "search.unlimited",
  SUBMIT_BID: "bid.submit", // profissional: dar lances · contratante: publicar obra p/ lances
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];

export type Plan = ProfessionalPlan | ContractorPlan;

/**
 * Mapa plano → features liberadas (gating). Espelha os benefícios anunciados na
 * landing/planos (homologação 18/07): **Iniciante** aparece na busca e recebe
 * pedidos, mas **não responde** (sem `RESPOND_BOOKINGS` → sem contato do cliente)
 * e não tem perfil completo; **Profissional** desbloqueia perfil completo,
 * portfólio, analytics e resposta a pedidos; **lances são exclusivos do
 * Especialista** (topo das buscas, ferramentas, busca ilimitada). Plano ausente = nada.
 */
const ENTITLEMENTS: Partial<Record<Plan, readonly Feature[]>> = {
  [ProfessionalPlan.INICIANTE]: [Feature.PUBLIC_PROFILE, Feature.RECEIVE_BOOKINGS],
  [ProfessionalPlan.PRO]: [
    Feature.PUBLIC_PROFILE,
    Feature.FULL_PROFILE,
    Feature.PORTFOLIO,
    Feature.RECEIVE_BOOKINGS,
    Feature.RESPOND_BOOKINGS,
    Feature.ANALYTICS,
    Feature.SEARCH_GEO,
  ],
  [ProfessionalPlan.ESPECIALISTA]: [
    Feature.PUBLIC_PROFILE,
    Feature.FULL_PROFILE,
    Feature.PORTFOLIO,
    Feature.RECEIVE_BOOKINGS,
    Feature.RESPOND_BOOKINGS,
    Feature.ANALYTICS,
    Feature.ADVANCED_ANALYTICS,
    Feature.SEARCH_GEO,
    Feature.SUBMIT_BID,
    Feature.TOP_SEARCH,
    Feature.EARLY_OPPORTUNITIES,
    Feature.SEARCH_UNLIMITED,
    Feature.PRO_TOOLS,
  ],
  // Empresa usa os mesmos códigos com preço próprio; as features company.* só têm
  // efeito para contas EMPRESA (o enforcement também checa o tipo).
  [ContractorPlan.BASICO]: [Feature.SEARCH_GEO, Feature.REQUEST_BOOKING, Feature.COMPANY_TEAM],
  [ContractorPlan.COMPLETO]: [
    Feature.SEARCH_GEO,
    Feature.SEARCH_UNLIMITED,
    Feature.REQUEST_BOOKING,
    Feature.COMPANY_TEAM,
    Feature.COMPANY_VISIBILITY,
  ],
  [ContractorPlan.LANCE]: [
    Feature.SEARCH_GEO,
    Feature.SEARCH_UNLIMITED,
    Feature.REQUEST_BOOKING,
    Feature.SUBMIT_BID,
    Feature.COMPANY_TEAM,
    Feature.COMPANY_VISIBILITY,
    Feature.COMPANY_REPORTS,
    Feature.FEATURED_ORDERS,
  ],
};

/** Função pura: o plano libera a feature? */
export function planAllows(plan: Plan, feature: Feature): boolean {
  return ENTITLEMENTS[plan]?.includes(feature) ?? false;
}

/** Features liberadas por um plano (vazio se o plano não tem entrada). */
export function featuresForPlan(plan: Plan | null): readonly Feature[] {
  return plan ? (ENTITLEMENTS[plan] ?? []) : [];
}
