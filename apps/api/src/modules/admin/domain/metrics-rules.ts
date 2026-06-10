/**
 * Domínio puro das métricas admin (roadmap §10). Sem framework: razões seguras
 * (proteção contra divisão por zero) para o snapshot de saúde e o analytics
 * estratégico (funil, liquidez, LTV).
 */

/** Razão parte/total (0..1), arredondada a 2 casas; 0 quando o total é 0. */
export function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100) / 100;
}

/**
 * Média soma/quantidade arredondada a 2 casas; 0 quando a quantidade é 0.
 * Diferente de `rate`, não é limitada a 1 (ex.: média de lances por obra).
 */
export function media(soma: number, quantidade: number): number {
  if (quantidade <= 0) return 0;
  return Math.round((soma / quantidade) * 100) / 100;
}

/** Teto (em meses) de vida útil presumida de um assinante para a estimativa de LTV. */
export const MAX_MESES_VIDA = 24;

/**
 * LTV estimado (em centavos) = receita média por assinante (ARPA) projetada pela
 * vida útil esperada. Vida útil ≈ 1/churn, limitada a {@link MAX_MESES_VIDA} para
 * não explodir quando o churn é baixíssimo ou zero (base nova). É uma ESTIMATIVA.
 */
export function estimateLtvCentavos(arpaCentavos: number, churnPct: number): number {
  if (arpaCentavos <= 0) return 0;
  const mesesVida = churnPct > 0 ? Math.min(1 / churnPct, MAX_MESES_VIDA) : MAX_MESES_VIDA;
  return Math.round(arpaCentavos * mesesVida);
}
