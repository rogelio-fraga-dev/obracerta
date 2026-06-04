/**
 * Cálculo de completude do perfil profissional (roadmap §4.2 — gamificação).
 * Função pura: dado o estado dos campos, devolve 0–100. Centralizar aqui evita
 * espalhar a regra; a UI mostra a barra a partir do mesmo número.
 */
export interface CompletudeInput {
  especialidades: string[];
  anosExperiencia: number | null;
  bairro: string | null;
  fotoUrl: string | null;
  valores: string | null;
  formacaoDeclarada: string | null;
}

/** Campos que contam para a completude (peso igual). */
const FIELDS: ((p: CompletudeInput) => boolean)[] = [
  (p) => p.especialidades.length > 0,
  (p) => p.anosExperiencia !== null,
  (p) => Boolean(p.bairro),
  (p) => Boolean(p.fotoUrl),
  (p) => Boolean(p.valores),
  (p) => Boolean(p.formacaoDeclarada),
];

export function computeProfessionalCompletude(profile: CompletudeInput): number {
  const filled = FIELDS.filter((isFilled) => isFilled(profile)).length;
  return Math.round((filled / FIELDS.length) * 100);
}
