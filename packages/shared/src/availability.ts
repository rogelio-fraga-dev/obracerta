import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Contratos de agenda (roadmap §4.2/§10). A disponibilidade é uma grade semanal
 * recorrente (dia da semana + janela de horário); a partir dela o front projeta
 * o calendário de 6 meses. Bloqueios (`schedule_blocks`) cobrem períodos de obra.
 */

/** Dia da semana: 0 = domingo ... 6 = sábado. */
export const weekDaySchema = z.number().int().min(0).max(6);
export type WeekDay = z.infer<typeof weekDaySchema>;

/** Horário "HH:MM" (24h). */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário deve estar no formato HH:MM (24h).");
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

/** Uma faixa de disponibilidade recorrente do profissional. */
export const availabilitySlotSchema = z
  .object({
    id: uuidSchema,
    diaSemana: weekDaySchema,
    horaInicio: timeOfDaySchema,
    horaFim: timeOfDaySchema,
  })
  .refine((s) => s.horaInicio < s.horaFim, {
    message: "horaInicio deve ser anterior a horaFim.",
    path: ["horaFim"],
  });
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

/** Entrada para criar/substituir uma faixa (sem id — gerado pelo servidor). */
export const createAvailabilitySlotSchema = z
  .object({
    diaSemana: weekDaySchema,
    horaInicio: timeOfDaySchema,
    horaFim: timeOfDaySchema,
  })
  .refine((s) => s.horaInicio < s.horaFim, {
    message: "horaInicio deve ser anterior a horaFim.",
    path: ["horaFim"],
  });
export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;

/** Substituição da grade semanal inteira (idempotente). */
export const setAvailabilitySchema = z.object({
  slots: z.array(createAvailabilitySlotSchema).max(50),
});
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;

/** Bloqueio de período (obra aprovada ou bloqueio manual). */
export const scheduleBlockSchema = z.object({
  id: uuidSchema,
  inicio: isoTimestampSchema,
  fim: isoTimestampSchema,
  bookingId: uuidSchema.nullable(),
  motivo: z.string().trim().max(200).nullable(),
});
export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;
