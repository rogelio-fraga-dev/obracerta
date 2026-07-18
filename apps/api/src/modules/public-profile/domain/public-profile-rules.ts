import { ProfessionalPlan } from "@obracerta/shared";

/**
 * Domínio puro do perfil público (roadmap §18 · homologação 18/07). Régua de
 * visibilidade por plano do profissional: **Iniciante** mostra só o primeiro
 * nome e nenhuma foto; **planos pagos** mostram nome completo e foto. O nome
 * parcial segue em uso para autores de avaliações (minimização LGPD).
 */

/** "João Silva" → "João S."; um nome só é mantido como está. */
export function nomeParcial(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiro = partes[0] ?? "";
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return ultimo ? `${primeiro} ${ultimo[0]!.toUpperCase()}.` : primeiro;
}

/** "João Silva" → "João" (vitrine do Iniciante: só o primeiro nome). */
export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] ?? "";
}

/** Iniciante tem visibilidade reduzida (primeiro nome, sem foto). */
export function isReducedVisibility(plano: ProfessionalPlan): boolean {
  return plano === ProfessionalPlan.INICIANTE;
}

/** Nome público: completo nos planos pagos; só o primeiro nome no Iniciante. */
export function publicName(nomeCompleto: string, plano: ProfessionalPlan): string | null {
  const nome = isReducedVisibility(plano) ? primeiroNome(nomeCompleto) : nomeCompleto.trim();
  return nome || null;
}

/** Foto pública: visível nos planos pagos; oculta (null) no Iniciante. */
export function publicFoto(fotoUrl: string | null, plano: ProfessionalPlan): string | null {
  return isReducedVisibility(plano) ? null : fotoUrl;
}
