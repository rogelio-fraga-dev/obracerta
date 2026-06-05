/**
 * Catálogo e critérios de badges (roadmap §4.3/§12, Etapa 3.2). Domínio puro: a
 * partir dos agregados de reputação (total de avaliações reveladas + média) decide
 * quais badges automáticos o usuário merece, e reconcilia com os que ele já tem.
 *
 * O catálogo é "string livre" no banco (`badges.codigo`) para evoluir sem migration;
 * aqui ficam só os AUTOMÁTICOS — badges manuais/legados fora deste enum nunca são
 * revogados pelo recompute.
 */

/** Badges concedidos automaticamente pela reputação. */
export const BadgeCode = {
  /** Média alta com volume mínimo de avaliações. */
  BEM_AVALIADO: "BEM_AVALIADO",
  /** Muitas avaliações recebidas (experiência comprovada). */
  VETERANO: "VETERANO",
} as const;
export type BadgeCode = (typeof BadgeCode)[keyof typeof BadgeCode];

/** Códigos gerenciados automaticamente (passíveis de concessão/revogação no recompute). */
const MANAGED_CODES: ReadonlySet<string> = new Set(Object.values(BadgeCode));

const BEM_AVALIADO_MIN_MEDIA = 4.5;
const BEM_AVALIADO_MIN_TOTAL = 5;
const VETERANO_MIN_TOTAL = 20;

/** Badges que o usuário merece dados o total de avaliações reveladas e a média. */
export function computeBadges(total: number, media: number): BadgeCode[] {
  const earned: BadgeCode[] = [];
  if (total >= BEM_AVALIADO_MIN_TOTAL && media >= BEM_AVALIADO_MIN_MEDIA) {
    earned.push(BadgeCode.BEM_AVALIADO);
  }
  if (total >= VETERANO_MIN_TOTAL) {
    earned.push(BadgeCode.VETERANO);
  }
  return earned;
}

/** Diferença entre badges ativos e merecidos: o que conceder e o que revogar. */
export interface BadgeReconciliation {
  toGrant: BadgeCode[];
  toRevoke: string[];
}

/**
 * Reconcilia: concede os merecidos que faltam e revoga os AUTOMÁTICOS que não são
 * mais merecidos. Badges fora do catálogo automático (`MANAGED_CODES`) ficam intactos.
 */
export function reconcileBadges(active: string[], earned: BadgeCode[]): BadgeReconciliation {
  const earnedSet = new Set<string>(earned);
  const activeSet = new Set(active);
  const toGrant = earned.filter((code) => !activeSet.has(code));
  const toRevoke = active.filter((code) => MANAGED_CODES.has(code) && !earnedSet.has(code));
  return { toGrant, toRevoke };
}
