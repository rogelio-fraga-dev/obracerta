import type { CreateAvailabilitySlotInput } from "@obracerta/shared";
import { dedupeSlots } from "./grade.js";

const s = (diaSemana: number, horaInicio: string, horaFim: string): CreateAvailabilitySlotInput => ({
  diaSemana,
  horaInicio,
  horaFim,
});

describe("dedupeSlots", () => {
  it("remove faixas idênticas preservando a ordem", () => {
    const result = dedupeSlots([s(1, "09:00", "12:00"), s(1, "09:00", "12:00"), s(2, "08:00", "10:00")]);
    expect(result).toEqual([s(1, "09:00", "12:00"), s(2, "08:00", "10:00")]);
  });

  it("mantém faixas que diferem em qualquer campo", () => {
    const slots = [s(1, "09:00", "12:00"), s(1, "09:00", "13:00"), s(1, "10:00", "12:00")];
    expect(dedupeSlots(slots)).toHaveLength(3);
  });

  it("lida com grade vazia", () => {
    expect(dedupeSlots([])).toEqual([]);
  });
});
