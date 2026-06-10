import type { Review, ReviewResponse } from "@obracerta/shared";
import type { ReviewRepository } from "../domain/ports/review.repository.js";
import type { ReviewResponseRepository } from "../domain/ports/review-response.repository.js";
import { ReputationService } from "./reputation.service.js";

/**
 * Enriquecimento das avaliações recebidas com a resposta pública (FE-3) e a checagem
 * "já avaliei este pedido?" (FE-2). Só `repo` e `responses` participam — os demais
 * colaboradores são irrelevantes para estes casos.
 */
describe("ReputationService — recebidas com resposta e checagem por pedido", () => {
  function build(opts: {
    revealed?: Review[];
    responses?: ReviewResponse[];
    reviewedByBooking?: Review | null;
  }) {
    const repo = {
      listRevealedForTarget: jest.fn().mockResolvedValue(opts.revealed ?? []),
      findByBookingAndAuthor: jest.fn().mockResolvedValue(opts.reviewedByBooking ?? null),
    } as unknown as ReviewRepository;
    const responses = {
      findByReviews: jest.fn().mockResolvedValue(opts.responses ?? []),
    } as unknown as ReviewResponseRepository;

    const service = new ReputationService(
      repo,
      {} as never, // badges
      responses,
      {} as never, // events
      {} as never, // bookings
      {} as never, // scheduler
      {} as never, // audit
    );
    return { service, responses };
  }

  const review = (id: string): Review =>
    ({
      id,
      bookingId: "b1",
      autorId: "a1",
      alvoId: "alvo",
      papelAutor: "CONTRATANTE",
      nota: 5,
      comentario: "Ótimo",
      status: "REVELADA",
      prazoEm: "2026-01-01T00:00:00.000Z",
      reveladaEm: "2026-01-01T00:00:00.000Z",
      criadoEm: "2026-01-01T00:00:00.000Z",
    }) as Review;

  it("anexa a resposta quando a avaliação já foi respondida", async () => {
    const { service } = build({
      revealed: [review("r1"), review("r2")],
      responses: [
        {
          id: "resp1",
          reviewId: "r1",
          autorId: "alvo",
          texto: "Obrigado!",
          criadoEm: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    const recebidas = await service.listReceived("alvo");

    const r1 = recebidas.find((r) => r.id === "r1");
    const r2 = recebidas.find((r) => r.id === "r2");
    expect(r1?.resposta).toBe("Obrigado!");
    expect(r1?.respostaEm).toBe("2026-02-01T00:00:00.000Z");
    expect(r2?.resposta).toBeNull();
    expect(r2?.respostaEm).toBeNull();
  });

  it("não consulta respostas quando não há avaliações recebidas", async () => {
    const { service, responses } = build({ revealed: [] });
    const recebidas = await service.listReceived("alvo");
    expect(recebidas).toHaveLength(0);
    expect(responses.findByReviews).not.toHaveBeenCalled();
  });

  it("hasReviewedBooking reflete se existe avaliação do autor no pedido", async () => {
    const semAvaliacao = build({ reviewedByBooking: null });
    expect(await semAvaliacao.service.hasReviewedBooking("a1", "b1")).toEqual({ jaAvaliou: false });

    const comAvaliacao = build({ reviewedByBooking: review("r1") });
    expect(await comAvaliacao.service.hasReviewedBooking("a1", "b1")).toEqual({ jaAvaliou: true });
  });
});
