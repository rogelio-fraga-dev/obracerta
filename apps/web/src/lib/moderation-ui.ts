import type { BadgeTone } from "@obracerta/ui";
import type { SuspensionStatus } from "@obracerta/shared";

/** Motivos de denúncia (catálogo de apresentação; o backend aceita string livre). */
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "CONTEUDO_OFENSIVO", label: "Conteúdo ofensivo" },
  { value: "SPAM", label: "Spam ou propaganda" },
  { value: "INFORMACAO_FALSA", label: "Informação falsa" },
  { value: "FORA_DA_PLATAFORMA", label: "Tentativa de combinar por fora" },
  { value: "OUTRO", label: "Outro" },
];

/** Rótulo + tom de cada estado da suspensão. */
export const SUSPENSION_STATUS_UI: Record<SuspensionStatus, { label: string; tone: BadgeTone }> = {
  ATIVA: { label: "Ativa", tone: "danger" },
  APELADA: { label: "Em apelação", tone: "warning" },
  REVOGADA: { label: "Revogada", tone: "success" },
  EXPIRADA: { label: "Expirada", tone: "neutral" },
};
