import { UserStatus } from "@obracerta/shared";

/**
 * Domínio puro: a conta pode autenticar? Só `ATIVO` (roadmap §6/§13). `SUSPENSO`
 * (moderação) e `REMOVIDO` (LGPD) ficam de fora — o login é recusado. O status é
 * a denormalização da suspensão: a moderação carimba SUSPENSO/ATIVO (evita o ciclo
 * auth↔moderation), e tirar suspensos do login também os tira de busca/perfil público.
 */
export function canAuthenticate(status: UserStatus): boolean {
  return status === UserStatus.ATIVO;
}
