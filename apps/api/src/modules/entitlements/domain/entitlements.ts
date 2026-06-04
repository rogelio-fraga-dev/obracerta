import { ProfessionalPlan, ContractorPlan } from "@obracerta/shared";

/**
 * Capacidades (features) controladas por plano (roadmap §3/§17). Centralizar
 * aqui evita `if (plano === ...)` espalhado pelo código — o gating é uma
 * consulta a este mapa. Versão base (Fase 1); expande na monetização (Fase 4).
 */
export const Feature = {
  SEARCH_GEO: "search.geo",
  SEARCH_UNLIMITED: "search.unlimited",
  PUBLIC_PROFILE: "profile.public",
  SUBMIT_BID: "bid.submit",
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];

export type Plan = ProfessionalPlan | ContractorPlan;

/** Mapa plano → features liberadas. Plano ausente = sem features extras. */
const ENTITLEMENTS: Partial<Record<Plan, readonly Feature[]>> = {
  [ProfessionalPlan.INICIANTE]: [Feature.PUBLIC_PROFILE],
  [ProfessionalPlan.PRO]: [Feature.PUBLIC_PROFILE, Feature.SEARCH_GEO],
  [ProfessionalPlan.ESPECIALISTA]: [
    Feature.PUBLIC_PROFILE,
    Feature.SEARCH_GEO,
    Feature.SEARCH_UNLIMITED,
  ],
  [ContractorPlan.BASICO]: [Feature.SEARCH_GEO],
  [ContractorPlan.COMPLETO]: [Feature.SEARCH_GEO, Feature.SEARCH_UNLIMITED],
  [ContractorPlan.LANCE]: [Feature.SEARCH_GEO, Feature.SEARCH_UNLIMITED, Feature.SUBMIT_BID],
};

/** Função pura: o plano libera a feature? */
export function planAllows(plan: Plan, feature: Feature): boolean {
  return ENTITLEMENTS[plan]?.includes(feature) ?? false;
}
