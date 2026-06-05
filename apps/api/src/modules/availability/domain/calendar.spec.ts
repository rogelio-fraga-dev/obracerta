import type { AvailabilitySlot, ScheduleBlock } from "@obracerta/shared";
import { hhmmToMinutes, minutesToHhmm, subtractRanges, projectCalendar, hasConflict } from "./calendar.js";

const slot = (
  diaSemana: number,
  horaInicio: string,
  horaFim: string,
  id = "00000000-0000-0000-0000-000000000000",
): AvailabilitySlot => ({ id, diaSemana, horaInicio, horaFim });

const block = (inicio: string, fim: string): ScheduleBlock => ({
  id: "00000000-0000-0000-0000-000000000000",
  inicio,
  fim,
  bookingId: null,
  motivo: "obra",
});

describe("hhmm <-> minutos", () => {
  it("converte ida e volta", () => {
    expect(hhmmToMinutes("09:00")).toBe(540);
    expect(hhmmToMinutes("23:59")).toBe(1439);
    expect(minutesToHhmm(540)).toBe("09:00");
    expect(minutesToHhmm(1439)).toBe("23:59");
    expect(minutesToHhmm(0)).toBe("00:00");
  });
});

describe("subtractRanges", () => {
  it("sem bloqueios devolve a janela inteira", () => {
    expect(subtractRanges([540, 1020], [])).toEqual([[540, 1020]]);
  });

  it("bloqueio no meio divide em duas janelas", () => {
    expect(subtractRanges([540, 1020], [[600, 660]])).toEqual([
      [540, 600],
      [660, 1020],
    ]);
  });

  it("bloqueio cobrindo tudo zera a janela", () => {
    expect(subtractRanges([540, 1020], [[480, 1080]])).toEqual([]);
  });

  it("apara nas bordas (início e fim)", () => {
    expect(subtractRanges([540, 1020], [[480, 600]])).toEqual([[600, 1020]]);
    expect(subtractRanges([540, 1020], [[960, 1080]])).toEqual([[540, 960]]);
  });

  it("funde bloqueios sobrepostos", () => {
    expect(subtractRanges([540, 1020], [[600, 700], [650, 720]])).toEqual([
      [540, 600],
      [720, 1020],
    ]);
  });
});

describe("projectCalendar", () => {
  // 2026-06-01 é uma segunda-feira (diaSemana 1).
  const monday = new Date("2026-06-01T00:00:00.000Z");

  it("projeta as ocorrências do dia da semana dentro da janela de meses", () => {
    const days = projectCalendar([slot(1, "09:00", "12:00")], [], monday, 1);
    // junho/2026 tem segundas em 01, 08, 15, 22, 29 → 5 ocorrências
    expect(days).toHaveLength(5);
    expect(days[0]).toEqual({
      data: "2026-06-01",
      diaSemana: 1,
      janelas: [{ horaInicio: "09:00", horaFim: "12:00" }],
    });
    expect(days.map((d) => d.data)).toEqual([
      "2026-06-01",
      "2026-06-08",
      "2026-06-15",
      "2026-06-22",
      "2026-06-29",
    ]);
  });

  it("remove o período bloqueado da janela do dia", () => {
    const days = projectCalendar(
      [slot(1, "09:00", "17:00")],
      [block("2026-06-01T12:00:00.000Z", "2026-06-01T13:00:00.000Z")],
      monday,
      1,
    );
    expect(days[0]?.janelas).toEqual([
      { horaInicio: "09:00", horaFim: "12:00" },
      { horaInicio: "13:00", horaFim: "17:00" },
    ]);
    // a segunda seguinte não é afetada pelo bloqueio
    expect(days[1]?.janelas).toEqual([{ horaInicio: "09:00", horaFim: "17:00" }]);
  });

  it("omite dias totalmente bloqueados", () => {
    const days = projectCalendar(
      [slot(1, "09:00", "17:00")],
      [block("2026-06-01T00:00:00.000Z", "2026-06-02T00:00:00.000Z")],
      monday,
      1,
    );
    expect(days.map((d) => d.data)).not.toContain("2026-06-01");
    expect(days[0]?.data).toBe("2026-06-08");
  });

  it("omite dias sem grade definida", () => {
    const days = projectCalendar([slot(3, "09:00", "12:00")], [], monday, 1);
    expect(days.every((d) => d.diaSemana === 3)).toBe(true);
  });

  it("limita a projeção a 6 meses mesmo se pedirem mais", () => {
    const semProjecao = projectCalendar([slot(1, "09:00", "12:00")], [], monday, 0);
    expect(semProjecao).toEqual([]);
    const seisMeses = projectCalendar([slot(1, "09:00", "12:00")], [], monday, 99);
    const ultima = seisMeses[seisMeses.length - 1];
    // 6 meses a partir de 2026-06-01 → não passa de 2026-12-01
    expect(ultima !== undefined && ultima.data < "2026-12-01").toBe(true);
  });
});

describe("hasConflict", () => {
  const blocks = [block("2026-06-01T09:00:00.000Z", "2026-06-01T12:00:00.000Z")];

  it("detecta sobreposição", () => {
    expect(
      hasConflict(blocks, { inicio: "2026-06-01T11:00:00.000Z", fim: "2026-06-01T13:00:00.000Z" }),
    ).toBe(true);
  });

  it("intervalos que apenas se tocam não conflitam", () => {
    expect(
      hasConflict(blocks, { inicio: "2026-06-01T12:00:00.000Z", fim: "2026-06-01T14:00:00.000Z" }),
    ).toBe(false);
  });

  it("sem bloqueios nunca conflita", () => {
    expect(
      hasConflict([], { inicio: "2026-06-01T09:00:00.000Z", fim: "2026-06-01T12:00:00.000Z" }),
    ).toBe(false);
  });
});
