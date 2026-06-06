import { describe, expect, it } from "vitest";
import { ApiEnvelopeError, unwrapEnvelope } from "./envelope.js";

describe("unwrapEnvelope", () => {
  it("retorna data quando success=true", () => {
    const data = unwrapEnvelope<{ id: string }>({
      success: true,
      data: { id: "abc" },
      error: null,
    });
    expect(data).toEqual({ id: "abc" });
  });

  it("lança ApiEnvelopeError com code+message quando success=false", () => {
    expect(() =>
      unwrapEnvelope({
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "Não encontrado." },
      }),
    ).toThrow(ApiEnvelopeError);

    try {
      unwrapEnvelope({
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: "Não encontrado." },
      });
    } catch (e) {
      const err = e as ApiEnvelopeError;
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("Não encontrado.");
    }
  });

  it("lança erro genérico quando o corpo não é um envelope válido", () => {
    expect(() => unwrapEnvelope(null)).toThrow(ApiEnvelopeError);
    expect(() => unwrapEnvelope({ foo: "bar" })).toThrow(ApiEnvelopeError);
  });

  it("preserva o status HTTP quando informado", () => {
    try {
      unwrapEnvelope({ success: false, data: null, error: { code: "X", message: "m" } }, 503);
    } catch (e) {
      expect((e as ApiEnvelopeError).status).toBe(503);
    }
  });
});
