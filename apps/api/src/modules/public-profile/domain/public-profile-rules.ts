import { ProfessionalPlan } from "@obracerta/shared";

/**
 * Domínio puro do perfil público (roadmap §18/§24). Regras de anti-desintermediação
 * e minimização (LGPD): nome parcial, e ocultação de foto/nome no plano Iniciante.
 */

/** "João Silva" → "João S."; um nome só é mantido como está. */
export function nomeParcial(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiro = partes[0] ?? "";
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return ultimo ? `${primeiro} ${ultimo[0]!.toUpperCase()}.` : primeiro;
}

/** Iniciante tem visibilidade reduzida (foto/nome ocultos) — §24. */
export function isReducedVisibility(plano: ProfessionalPlan): boolean {
  return plano === ProfessionalPlan.INICIANTE;
}

/** Nome público: parcial nos planos pagos; oculto (null) no Iniciante. */
export function publicName(nomeCompleto: string, plano: ProfessionalPlan): string | null {
  return isReducedVisibility(plano) ? null : nomeParcial(nomeCompleto);
}

/** Foto pública: visível nos planos pagos; oculta (null) no Iniciante. */
export function publicFoto(fotoUrl: string | null, plano: ProfessionalPlan): string | null {
  return isReducedVisibility(plano) ? null : fotoUrl;
}
