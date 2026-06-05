import type { CreateAvailabilitySlotInput } from "@obracerta/shared";

/**
 * Remove faixas duplicadas da grade semanal antes de persistir. A tabela tem
 * UNIQUE(professional, dia, início, fim); deduplicar aqui mantém o `setGrade`
 * idempotente e evita violar a constraint quando o cliente envia repetições.
 */
export function dedupeSlots(
  slots: readonly CreateAvailabilitySlotInput[],
): CreateAvailabilitySlotInput[] {
  const seen = new Set<string>();
  const unique: CreateAvailabilitySlotInput[] = [];
  for (const slot of slots) {
    const key = `${slot.diaSemana}|${slot.horaInicio}|${slot.horaFim}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(slot);
  }
  return unique;
}
