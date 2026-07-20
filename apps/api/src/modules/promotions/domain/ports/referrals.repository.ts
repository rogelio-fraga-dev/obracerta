import type { Coupon } from "@obracerta/shared";

/** Dados para registrar uma indicação já recompensada (cupons emitidos). */
export interface CreateReferralData {
  referrerId: string;
  referredId: string;
  cupomIndicadorId: string | null;
  cupomIndicadoId: string | null;
}

/**
 * Porta de saída do programa de indicação: registra o par indicador→indicado e
 * responde às consultas do painel de indicação.
 */
export interface ReferralsRepository {
  create(data: CreateReferralData): Promise<void>;
  /** Quantas pessoas se cadastraram com o código de um usuário. */
  countByReferrer(referrerId: string): Promise<number>;
  /** Verdadeiro se este indicado já foi registrado (unicidade). */
  referredExists(referredId: string): Promise<boolean>;
  /**
   * Cupons de recompensa emitidos para o usuário (como indicador ou indicado)
   * que ele ainda não resgatou — para o painel "cupons disponíveis".
   */
  listMyRewardCoupons(userId: string): Promise<Coupon[]>;
}

export const REFERRALS_REPOSITORY = Symbol("REFERRALS_REPOSITORY");
