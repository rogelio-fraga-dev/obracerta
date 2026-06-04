import { generateOtpCode, otpKeys } from "./otp.js";

describe("generateOtpCode", () => {
  it("gera sempre 6 dígitos numéricos", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it("preserva zeros à esquerda (padding)", () => {
    // Estatisticamente improvável colidir, mas o formato é o que importa:
    const codes = Array.from({ length: 50 }, () => generateOtpCode());
    expect(codes.every((c) => c.length === 6)).toBe(true);
  });
});

describe("otpKeys", () => {
  it("namespaceia as chaves por WhatsApp", () => {
    const w = "+5511999999999";
    expect(otpKeys.code(w)).toBe("otp:code:+5511999999999");
    expect(otpKeys.attempts(w)).toBe("otp:attempts:+5511999999999");
    expect(otpKeys.verified(w)).toBe("otp:verified:+5511999999999");
  });
});
