/**
 * Domínio puro das métricas admin (roadmap §10). Sem framework: razões seguras
 * (proteção contra divisão por zero) para o snapshot de saúde.
 */

/** Razão parte/total (0..1), arredondada a 2 casas; 0 quando o total é 0. */
export function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100) / 100;
}
