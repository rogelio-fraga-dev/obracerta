import { UserType } from "@obracerta/shared";

/**
 * Domínio puro da equipe da empresa (homologação 18/07). Sem framework/ORM:
 * quem pode ser membro, normalização de e-mail de convite.
 */

/** Pessoas físicas podem ser membros; outra EMPRESA não (empresa não gerencia empresa). */
export function canBeMember(tipo: UserType): boolean {
  return tipo !== UserType.EMPRESA;
}

/** E-mail de convite normalizado (trim + minúsculas) — casa com o vínculo por e-mail. */
export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}
