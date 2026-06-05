import {
  REVIEW_WINDOW_DAYS,
  reviewDeadline,
  reviewParticipant,
  canReviewStatus,
  shouldReveal,
  averageRating,
  isWindowClosed,
} from "./review-rules.js";

describe("reviewDeadline", () => {
  it("soma a janela de 7 dias à conclusão", () => {
    const concluido = new Date("2026-06-01T12:00:00.000Z");
    expect(reviewDeadline(concluido).toISOString()).toBe("2026-06-08T12:00:00.000Z");
    expect(REVIEW_WINDOW_DAYS).toBe(7);
  });
});

describe("reviewParticipant", () => {
  const contractorId = "c1";
  const professionalId = "p1";

  it("contratante avalia o profissional (papel CONTRATANTE)", () => {
    expect(reviewParticipant(contractorId, contractorId, professionalId)).toEqual({
      alvoId: professionalId,
      papelAutor: "CONTRATANTE",
    });
  });

  it("profissional avalia o contratante (papel PROFISSIONAL)", () => {
    expect(reviewParticipant(professionalId, contractorId, professionalId)).toEqual({
      alvoId: contractorId,
      papelAutor: "PROFISSIONAL",
    });
  });

  it("estranho ao pedido não é participante", () => {
    expect(reviewParticipant("x9", contractorId, professionalId)).toBeNull();
  });
});

describe("canReviewStatus", () => {
  it("só pedidos CONCLUIDO podem ser avaliados", () => {
    expect(canReviewStatus("CONCLUIDO")).toBe(true);
    expect(canReviewStatus("INICIADO")).toBe(false);
    expect(canReviewStatus("APROVADO")).toBe(false);
    expect(canReviewStatus("CANCELADO")).toBe(false);
  });
});

describe("shouldReveal", () => {
  it("revela quando ambos os lados avaliaram (2 avaliações)", () => {
    expect(shouldReveal(0)).toBe(false);
    expect(shouldReveal(1)).toBe(false);
    expect(shouldReveal(2)).toBe(true);
  });
});

describe("averageRating", () => {
  it("sem avaliações → 0", () => {
    expect(averageRating([])).toBe(0);
  });

  it("média simples", () => {
    expect(averageRating([5])).toBe(5);
    expect(averageRating([4, 5])).toBe(4.5);
  });

  it("arredonda para 2 casas", () => {
    expect(averageRating([5, 4, 4])).toBe(4.33);
  });
});

describe("isWindowClosed", () => {
  const prazo = new Date("2026-06-08T12:00:00.000Z");

  it("antes do prazo → aberta", () => {
    expect(isWindowClosed(prazo, new Date("2026-06-08T11:59:59.000Z"))).toBe(false);
  });

  it("no/após o prazo → fechada", () => {
    expect(isWindowClosed(prazo, new Date("2026-06-08T12:00:00.000Z"))).toBe(true);
    expect(isWindowClosed(prazo, new Date("2026-06-09T00:00:00.000Z"))).toBe(true);
  });
});
