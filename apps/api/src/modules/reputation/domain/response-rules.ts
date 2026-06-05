import { ReviewStatus } from "@obracerta/shared";

/**
 * Regras do direito de resposta pública (roadmap §4.3/§12, Etapa 3.2). Domínio puro:
 * só o AVALIADO pode responder, à avaliação já REVELADA, 1 única vez, dentro de 30
 * dias da revelação.
 */

/** Janela (em dias) para responder após a revelação. */
export const RESPONSE_WINDOW_DAYS = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Prazo limite para responder: revelação + 30 dias. */
export function responseDeadline(reveladaEm: Date): Date {
  return new Date(reveladaEm.getTime() + RESPONSE_WINDOW_DAYS * MS_POR_DIA);
}

/** Resultado da checagem de elegibilidade da resposta. */
export type RespondCheck =
  | "OK"
  | "NAO_REVELADA"
  | "NAO_E_ALVO"
  | "JANELA_EXPIRADA"
  | "JA_RESPONDIDA";

export interface RespondInput {
  status: ReviewStatus;
  alvoId: string;
  responderId: string;
  reveladaEm: Date | null;
  now: Date;
  hasResponse: boolean;
}

/** Verifica se a resposta é permitida; devolve o motivo da recusa quando não for. */
export function checkCanRespond(input: RespondInput): RespondCheck {
  if (input.status !== ReviewStatus.REVELADA || !input.reveladaEm) return "NAO_REVELADA";
  if (input.responderId !== input.alvoId) return "NAO_E_ALVO";
  if (input.hasResponse) return "JA_RESPONDIDA";
  if (input.now.getTime() > responseDeadline(input.reveladaEm).getTime()) return "JANELA_EXPIRADA";
  return "OK";
}
