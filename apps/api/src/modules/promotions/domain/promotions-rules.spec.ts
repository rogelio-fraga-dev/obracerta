import { CouponType } from "@obracerta/shared";
import {
  applyCouponToCentavos,
  couponResumo,
  couponUnusableReason,
  generateReferralCode,
  normalizeCode,
} from "./promotions-rules.js";

describe("promotions-rules", () => {
  describe("generateReferralCode", () => {
    it("gera código de 8 chars sem caracteres ambíguos", () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    });

    it("gera códigos diferentes em chamadas sucessivas (probabilístico)", () => {
      const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe("normalizeCode", () => {
    it("apara espaços e converte para maiúsculas", () => {
      expect(normalizeCode("  abc123 ")).toBe("ABC123");
    });
  });

  describe("couponResumo", () => {
    it("descreve percentual", () => {
      expect(couponResumo(CouponType.PERCENTUAL, 20)).toBe("20% de desconto");
    });

    it("descreve valor fixo em reais", () => {
      expect(couponResumo(CouponType.FIXO, 1500)).toBe("R$ 15,00 de desconto");
    });

    it("descreve dias grátis no singular e plural", () => {
      expect(couponResumo(CouponType.DIAS_GRATIS, 1)).toBe("1 dia grátis");
      expect(couponResumo(CouponType.DIAS_GRATIS, 7)).toBe("7 dias grátis");
    });
  });

  describe("applyCouponToCentavos", () => {
    it("aplica desconto percentual", () => {
      expect(applyCouponToCentavos(CouponType.PERCENTUAL, 20, 5000)).toEqual({
        valorCentavos: 4000,
        diasGratis: 0,
      });
    });

    it("aplica desconto fixo sem passar de zero", () => {
      expect(applyCouponToCentavos(CouponType.FIXO, 8000, 5000)).toEqual({
        valorCentavos: 0,
        diasGratis: 0,
      });
    });

    it("dias grátis não mexem no valor e retornam os dias", () => {
      expect(applyCouponToCentavos(CouponType.DIAS_GRATIS, 15, 5000)).toEqual({
        valorCentavos: 5000,
        diasGratis: 15,
      });
    });
  });

  describe("couponUnusableReason", () => {
    const now = new Date("2026-07-19T00:00:00.000Z");
    const base = { ativo: true, validoAte: null, usosMax: null, usosCount: 0, jaUsadoPeloUsuario: false };

    it("retorna null quando o cupom pode ser usado", () => {
      expect(couponUnusableReason(base, now)).toBeNull();
    });

    it("bloqueia cupom inativo", () => {
      expect(couponUnusableReason({ ...base, ativo: false }, now)).toBe("INATIVO");
    });

    it("bloqueia cupom expirado", () => {
      const validoAte = new Date("2026-07-18T00:00:00.000Z");
      expect(couponUnusableReason({ ...base, validoAte }, now)).toBe("EXPIRADO");
    });

    it("bloqueia cupom esgotado", () => {
      expect(couponUnusableReason({ ...base, usosMax: 3, usosCount: 3 }, now)).toBe("ESGOTADO");
    });

    it("bloqueia cupom já usado pelo usuário", () => {
      expect(couponUnusableReason({ ...base, jaUsadoPeloUsuario: true }, now)).toBe("JA_USADO");
    });
  });
});
