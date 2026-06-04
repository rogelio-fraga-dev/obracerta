import { describe, it, expect } from "vitest";
import {
  whatsappSchema,
  cpfSchema,
  slugSchema,
  createUserSchema,
  apiResponseSchema,
  userSchema,
  UserType,
  UserStatus,
} from "./index.js";

describe("primitives", () => {
  it("accepts a valid BR whatsapp in E.164", () => {
    expect(whatsappSchema.parse("+5534991234567")).toBe("+5534991234567");
  });

  it("rejects a whatsapp missing the country code", () => {
    expect(whatsappSchema.safeParse("34991234567").success).toBe(false);
  });

  it("accepts an 11-digit CPF and rejects formatted input", () => {
    expect(cpfSchema.parse("12345678901")).toBe("12345678901");
    expect(cpfSchema.safeParse("123.456.789-01").success).toBe(false);
  });

  it("accepts a kebab slug and rejects spaces/uppercase", () => {
    expect(slugSchema.parse("joao-pedreiro")).toBe("joao-pedreiro");
    expect(slugSchema.safeParse("Joao Pedreiro").success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("validates a contractor signup payload", () => {
    const parsed = createUserSchema.parse({
      nomeCompleto: "Maria Souza",
      whatsapp: "+5534991234567",
      tipo: UserType.CONTRATANTE,
    });
    expect(parsed.tipo).toBe("CONTRATANTE");
  });
});

describe("apiResponseSchema", () => {
  it("validates a success envelope wrapping a user", () => {
    const envelope = apiResponseSchema(userSchema);
    const result = envelope.safeParse({
      success: true,
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        nomeCompleto: "Maria Souza",
        whatsapp: "+5534991234567",
        tipo: UserType.CONTRATANTE,
        status: UserStatus.ATIVO,
        criadoEm: "2026-06-03T12:00:00.000Z",
      },
      error: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates an error envelope", () => {
    const envelope = apiResponseSchema(userSchema);
    const result = envelope.safeParse({
      success: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Usuário não encontrado" },
    });
    expect(result.success).toBe(true);
  });
});
