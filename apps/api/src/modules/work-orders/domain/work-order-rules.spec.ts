import {
  URGENCY_DEADLINE_HOURS,
  DIGNITY_FLOOR_FACTOR,
  MIN_BIDS_FOR_FLOOR,
  workOrderDeadline,
  dignityFloorCentavos,
  meetsDignityFloor,
  canSubmitProposal,
  canAcceptWorkOrder,
  visibleProposals,
} from "./work-order-rules.js";

describe("workOrderDeadline", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("URGENTE 48h, NORMAL 7d, FLEXIVEL 15d", () => {
    expect(workOrderDeadline("URGENTE", now).toISOString()).toBe("2026-06-03T00:00:00.000Z");
    expect(workOrderDeadline("NORMAL", now).toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(workOrderDeadline("FLEXIVEL", now).toISOString()).toBe("2026-06-16T00:00:00.000Z");
    expect(URGENCY_DEADLINE_HOURS.URGENTE).toBe(48);
  });
});

describe("dignityFloorCentavos (piso de dignidade pela média)", () => {
  it("sem lances suficientes → sem piso (null)", () => {
    expect(MIN_BIDS_FOR_FLOOR).toBe(3);
    expect(dignityFloorCentavos([])).toBeNull();
    expect(dignityFloorCentavos([10000, 20000])).toBeNull(); // < 3 lances
  });

  it("com lances suficientes → fração da média", () => {
    expect(DIGNITY_FLOOR_FACTOR).toBe(0.7);
    // média de 100/200/300 = 200; piso = 200 * 0,7 = 140
    expect(dignityFloorCentavos([10000, 20000, 30000])).toBe(14000);
  });
});

describe("meetsDignityFloor", () => {
  it("sem piso aceita qualquer valor positivo", () => {
    expect(meetsDignityFloor(5000, null)).toBe(true);
  });

  it("rejeita abaixo do piso, aceita no/acima", () => {
    expect(meetsDignityFloor(13999, 14000)).toBe(false);
    expect(meetsDignityFloor(14000, 14000)).toBe(true);
    expect(meetsDignityFloor(20000, 14000)).toBe(true);
  });
});

describe("máquinas de estado", () => {
  it("só obra ABERTA aceita lance e adjudicação", () => {
    expect(canSubmitProposal("ABERTA")).toBe(true);
    expect(canSubmitProposal("ADJUDICADA")).toBe(false);
    expect(canAcceptWorkOrder("ABERTA")).toBe(true);
    expect(canAcceptWorkOrder("EXPIRADA")).toBe(false);
  });
});

describe("visibleProposals (sigilo)", () => {
  const props = [
    { professionalId: "p1", valorCentavos: 100 },
    { professionalId: "p2", valorCentavos: 200 },
  ];

  it("o dono da obra vê todos os lances", () => {
    expect(visibleProposals("dono", "dono", props)).toHaveLength(2);
  });

  it("um profissional vê só o próprio lance", () => {
    expect(visibleProposals("p1", "dono", props)).toEqual([props[0]]);
  });

  it("quem não participa não vê nada", () => {
    expect(visibleProposals("x9", "dono", props)).toEqual([]);
  });
});
