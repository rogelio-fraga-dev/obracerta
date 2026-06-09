import { describe, expect, it } from "vitest";
import { canHireServices, isValidCnpj, normalizeCnpj } from "./company.js";
import { UserType } from "./enums.js";

describe("canHireServices", () => {
  it("contratante e empresa podem contratar; profissional não", () => {
    expect(canHireServices(UserType.CONTRATANTE)).toBe(true);
    expect(canHireServices(UserType.EMPRESA)).toBe(true);
    expect(canHireServices(UserType.PROFISSIONAL)).toBe(false);
  });
});

describe("isValidCnpj", () => {
  it("aceita CNPJ válido (com e sem máscara)", () => {
    expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
    expect(isValidCnpj("11444777000161")).toBe(true);
  });

  it("rejeita dígitos verificadores errados, tamanho errado e repetição", () => {
    expect(isValidCnpj("11444777000160")).toBe(false);
    expect(isValidCnpj("123")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
  });
});

describe("normalizeCnpj", () => {
  it("remove a máscara", () => {
    expect(normalizeCnpj("11.444.777/0001-61")).toBe("11444777000161");
  });
});
