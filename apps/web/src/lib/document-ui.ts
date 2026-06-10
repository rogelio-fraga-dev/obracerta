import type { BadgeTone } from "@obracerta/ui";
import type { DocumentType } from "@obracerta/shared";

/** Rótulo + tom (Badge) de cada tipo de documento do profissional (orçamento/recibo). */
export const DOCUMENT_TYPE_UI: Record<DocumentType, { label: string; tone: BadgeTone }> = {
  ORCAMENTO: { label: "Orçamento", tone: "info" },
  RECIBO: { label: "Recibo", tone: "success" },
};
