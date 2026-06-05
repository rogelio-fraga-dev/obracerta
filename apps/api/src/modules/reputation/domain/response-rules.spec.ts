import { RESPONSE_WINDOW_DAYS, responseDeadline, checkCanRespond } from "./response-rules.js";

describe("responseDeadline", () => {
  it("soma a janela de 30 dias à revelação", () => {
    const revelada = new Date("2026-06-01T00:00:00.000Z");
    expect(responseDeadline(revelada).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(RESPONSE_WINDOW_DAYS).toBe(30);
  });
});

describe("checkCanRespond", () => {
  const base = {
    status: "REVELADA" as const,
    alvoId: "alvo1",
    responderId: "alvo1",
    reveladaEm: new Date("2026-06-01T00:00:00.000Z"),
    now: new Date("2026-06-10T00:00:00.000Z"),
    hasResponse: false,
  };

  it("OK quando alvo responde avaliação revelada dentro da janela e sem resposta prévia", () => {
    expect(checkCanRespond(base)).toBe("OK");
  });

  it("NAO_REVELADA se a avaliação ainda está oculta", () => {
    expect(checkCanRespond({ ...base, status: "PENDENTE", reveladaEm: null })).toBe("NAO_REVELADA");
  });

  it("NAO_E_ALVO se quem responde não é o avaliado", () => {
    expect(checkCanRespond({ ...base, responderId: "outro" })).toBe("NAO_E_ALVO");
  });

  it("JANELA_EXPIRADA após 30 dias da revelação", () => {
    expect(checkCanRespond({ ...base, now: new Date("2026-07-01T00:00:00.001Z") })).toBe(
      "JANELA_EXPIRADA",
    );
  });

  it("JA_RESPONDIDA se já existe resposta", () => {
    expect(checkCanRespond({ ...base, hasResponse: true })).toBe("JA_RESPONDIDA");
  });
});
