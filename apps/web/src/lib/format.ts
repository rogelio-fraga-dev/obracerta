/** Rótulos de dia da semana (0 = domingo) — alinhado a `weekDaySchema` do shared. */
export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const WEEKDAY_LABELS_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/** Primeiro nome de um nome completo (evita estourar o header em telas pequenas). */
export function firstName(nome: string | null | undefined): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Formata "YYYY-MM-DD" como "DD/MM" (sem fuso — a data já vem só com o dia). */
export function formatDayBR(isoDate: string): string {
  const [, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}`;
}

/** Formata um timestamp ISO como "DD/MM/AAAA às HH:MM" (horário local). */
export function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}
