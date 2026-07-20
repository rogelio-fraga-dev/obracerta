import type { Coupon, CouponType } from "@obracerta/shared";

/** Dados para criar um cupom (admin ou gerado por indicação). */
export interface CreateCouponData {
  codigo: string;
  descricao: string | null;
  tipo: CouponType;
  valor: number;
  validoAte: Date | null;
  usosMax: number | null;
}

/**
 * Porta de saída para o catálogo de cupons e seus resgates. A aplicação depende
 * desta interface; o adapter Drizzle a implementa.
 */
export interface CouponsRepository {
  create(data: CreateCouponData): Promise<Coupon>;
  findByCodigo(codigo: string): Promise<Coupon | null>;
  findById(id: string): Promise<Coupon | null>;
  listAll(): Promise<Coupon[]>;
  setAtivo(id: string, ativo: boolean): Promise<void>;
  /** Verdadeiro se o usuário já resgatou este cupom (unicidade por par). */
  hasRedeemed(couponId: string, userId: string): Promise<boolean>;
  /**
   * Registra o resgate e incrementa `usos_count` atomicamente. Retorna `false`
   * se o usuário já havia resgatado (conflito de índice único) — idempotente.
   */
  redeem(couponId: string, userId: string): Promise<boolean>;
}

export const COUPONS_REPOSITORY = Symbol("COUPONS_REPOSITORY");
