import type { BadgeTone } from "@obracerta/ui";

/** Rótulos dos códigos de penalidade gravados em `penalties.motivo` (domínio §8). */
const PENALTY_REASON_LABEL: Record<string, string> = {
  RECUSA_INJUSTIFICADA: "Recusa injustificada",
  NAO_RESPONDEU: "Não respondeu a tempo",
};

/** Rótulo legível de um código de penalidade (fallback: o próprio código). */
export function penaltyReasonLabel(motivo: string): string {
  return PENALTY_REASON_LABEL[motivo] ?? motivo;
}

/** Taxa de aceitação (0–1) → "84%". */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Tom do Badge para a taxa de aceitação (verde alto, amarelo médio, vermelho baixo). */
export function acceptanceTone(rate: number): BadgeTone {
  if (rate >= 0.8) return "success";
  if (rate >= 0.5) return "warning";
  return "danger";
}
