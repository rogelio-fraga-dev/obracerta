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
  ANALYTICS: "profile.analytics", // analytics do perfil (visitas)
  TOP_SEARCH: "search.top", // destaque no topo das buscas
  PRO_TOOLS: "tools.documents", // ferramentas: orçamento + recibo (§8.5)
  // Comum (profissional/contratante)
  SEARCH_GEO: "search.geo",
  SEARCH_UNLIMITED: "search.unlimited",
  SUBMIT_BID: "bid.submit", // dar lances em obras
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
    Feature.SEARCH_GEO,
    Feature.SUBMIT_BID,
    Feature.TOP_SEARCH,
    Feature.SEARCH_UNLIMITED,
    Feature.PRO_TOOLS,
  ],
  [ContractorPlan.BASICO]: [Feature.SEARCH_GEO],
  [ContractorPlan.COMPLETO]: [Feature.SEARCH_GEO, Feature.SEARCH_UNLIMITED],
  [ContractorPlan.LANCE]: [Feature.SEARCH_GEO, Feature.SEARCH_UNLIMITED, Feature.SUBMIT_BID],
};

/** Função pura: o plano libera a feature? */
export function planAllows(plan: Plan, feature: Feature): boolean {
  return ENTITLEMENTS[plan]?.includes(feature) ?? false;
}

/** Features liberadas por um plano (vazio se o plano não tem entrada). */
export function featuresForPlan(plan: Plan | null): readonly Feature[] {
  return plan ? (ENTITLEMENTS[plan] ?? []) : [];
}
