import { CouponType } from "@obracerta/shared";

/**
 * Regras puras de promoções (sem I/O): geração de código de indicação, texto
 * amigável do desconto e cálculo do efeito de um cupom sobre o valor da fatura.
 * Testável sem banco.
 */

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L) para códigos fáceis de ditar. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;

/** Gera um código de indicação aleatório (8 chars, alfabeto sem ambiguidade). */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Normaliza um código digitado (trim + maiúsculas) para comparação/armazenamento. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Texto amigável do desconto (ex.: "20% de desconto", "7 dias grátis"). */
export function couponResumo(tipo: CouponType, valor: number): string {
  switch (tipo) {
    case CouponType.PERCENTUAL:
      return `${valor}% de desconto`;
    case CouponType.FIXO:
      return `R$ ${(valor / 100).toFixed(2).replace(".", ",")} de desconto`;
    case CouponType.DIAS_GRATIS:
      return `${valor} ${valor === 1 ? "dia" : "dias"} grátis`;
    default:
      return "Desconto";
  }
}

/** Efeito do cupom sobre uma cobrança: novo valor + dias grátis a somar no vencimento. */
export interface CouponEffect {
  valorCentavos: number;
  diasGratis: number;
}

/**
 * Aplica o cupom a um valor em centavos. PERCENTUAL/FIXO reduzem o valor (nunca
 * abaixo de 0); DIAS_GRATIS não mexe no valor, mas devolve os dias para estender
 * o vencimento da 1ª fatura.
 */
export function applyCouponToCentavos(
  tipo: CouponType,
  valor: number,
  valorCentavos: number,
): CouponEffect {
  switch (tipo) {
    case CouponType.PERCENTUAL: {
      const desconto = Math.round((valorCentavos * valor) / 100);
      return { valorCentavos: Math.max(0, valorCentavos - desconto), diasGratis: 0 };
    }
    case CouponType.FIXO:
      return { valorCentavos: Math.max(0, valorCentavos - valor), diasGratis: 0 };
    case CouponType.DIAS_GRATIS:
      return { valorCentavos, diasGratis: valor };
    default:
      return { valorCentavos, diasGratis: 0 };
  }
}

/** Motivos pelos quais um cupom pode não ser resgatável (para mensagem clara). */
export type CouponUnusableReason =
  | "INATIVO"
  | "EXPIRADO"
  | "ESGOTADO"
  | "JA_USADO";

/** Estado mínimo de um cupom para checar se pode ser usado por um usuário. */
export interface CouponUsableState {
  ativo: boolean;
  validoAte: Date | null;
  usosMax: number | null;
  usosCount: number;
  jaUsadoPeloUsuario: boolean;
}

/** Retorna o motivo do bloqueio, ou `null` se o cupom pode ser usado agora. */
export function couponUnusableReason(
  state: CouponUsableState,
  now: Date,
): CouponUnusableReason | null {
  if (!state.ativo) return "INATIVO";
  if (state.validoAte && state.validoAte.getTime() < now.getTime()) return "EXPIRADO";
  if (state.usosMax !== null && state.usosCount >= state.usosMax) return "ESGOTADO";
  if (state.jaUsadoPeloUsuario) return "JA_USADO";
  return null;
}

/** Recompensas do programa de indicação (roadmap §monetização). */
export const REFERRAL_REWARD = {
  /** Quem indicou ganha 20% de desconto na próxima fatura. */
  indicador: { tipo: CouponType.PERCENTUAL, valor: 20 },
  /** Quem foi indicado ganha 15 dias grátis de boas-vindas. */
  indicado: { tipo: CouponType.DIAS_GRATIS, valor: 15 },
} as const;
