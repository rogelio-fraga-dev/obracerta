import {
  RefundReason,
  REGRET_WINDOW_DAYS,
  canRefundInvoice,
  proportionalRefundCentavos,
  computeRefundCentavos,
} from "./refund-rules.js";

describe("canRefundInvoice", () => {
  it("só fatura PAGA pode ser estornada", () => {
    expect(canRefundInvoice("PAGA")).toBe(true);
    expect(canRefundInvoice("PENDENTE")).toBe(false);
    expect(canRefundInvoice("VENCIDA")).toBe(false);
    expect(canRefundInvoice("ESTORNADA")).toBe(false);
  });
});

describe("proportionalRefundCentavos", () => {
  const inicio = new Date("2026-06-01T00:00:00.000Z");
  const fim = new Date("2026-07-01T00:00:00.000Z"); // 30 dias

  it("metade do período → metade do valor", () => {
    const meio = new Date("2026-06-16T00:00:00.000Z");
    expect(proportionalRefundCentavos(3900, inicio, fim, meio)).toBe(1950);
  });

  it("antes do início → valor cheio; depois do fim → 0", () => {
    expect(proportionalRefundCentavos(3900, inicio, fim, inicio)).toBe(3900);
    expect(proportionalRefundCentavos(3900, inicio, fim, new Date("2026-07-02T00:00:00.000Z"))).toBe(
      0,
    );
  });
});

describe("computeRefundCentavos (4 cenários CDC §21)", () => {
  const pagoEm = new Date("2026-06-01T00:00:00.000Z");

  it("ARREPENDIMENTO (Art. 49): integral dentro de 7 dias, 0 depois", () => {
    expect(REGRET_WINDOW_DAYS).toBe(7);
    const dentro = new Date("2026-06-05T00:00:00.000Z");
    const fora = new Date("2026-06-09T00:00:00.000Z");
    expect(
      computeRefundCentavos({ reason: RefundReason.ARREPENDIMENTO, valorPagoCentavos: 4900, pagoEm, now: dentro, vigenciaInicio: null, vigenciaFim: null }),
    ).toBe(4900);
    expect(
      computeRefundCentavos({ reason: RefundReason.ARREPENDIMENTO, valorPagoCentavos: 4900, pagoEm, now: fora, vigenciaInicio: null, vigenciaFim: null }),
    ).toBe(0);
  });

  it("COBRANCA_INDEVIDA e FALHA_SERVICO: estorno integral", () => {
    const now = new Date("2026-06-20T00:00:00.000Z");
    expect(
      computeRefundCentavos({ reason: RefundReason.COBRANCA_INDEVIDA, valorPagoCentavos: 4900, pagoEm, now, vigenciaInicio: null, vigenciaFim: null }),
    ).toBe(4900);
    expect(
      computeRefundCentavos({ reason: RefundReason.FALHA_SERVICO, valorPagoCentavos: 9900, pagoEm, now, vigenciaInicio: null, vigenciaFim: null }),
    ).toBe(9900);
  });

  it("CANCELAMENTO_PROPORCIONAL: pro-rata do período restante (0 sem vigência)", () => {
    const inicio = new Date("2026-06-01T00:00:00.000Z");
    const fim = new Date("2026-07-01T00:00:00.000Z");
    const meio = new Date("2026-06-16T00:00:00.000Z");
    expect(
      computeRefundCentavos({ reason: RefundReason.CANCELAMENTO_PROPORCIONAL, valorPagoCentavos: 3900, pagoEm, now: meio, vigenciaInicio: inicio, vigenciaFim: fim }),
    ).toBe(1950);
    expect(
      computeRefundCentavos({ reason: RefundReason.CANCELAMENTO_PROPORCIONAL, valorPagoCentavos: 3900, pagoEm, now: meio, vigenciaInicio: null, vigenciaFim: null }),
    ).toBe(0);
  });
});
