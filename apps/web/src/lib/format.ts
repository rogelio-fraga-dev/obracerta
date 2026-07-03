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

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * Data **relativa** em pt-BR ("há 2 h", "amanhã às 14:00", "em 3 dias") — leitura
 * rápida em listas; o detalhe continua com {@link formatDateTimeBR}. Fora da
 * janela de ±7 dias, cai na data completa.
 */
export function formatRelativeBR(iso: string): string {
  const alvo = new Date(iso);
  const diff = alvo.getTime() - Date.now();
  const abs = Math.abs(diff);

  if (abs < MINUTO) return "agora";
  if (abs > 7 * DIA) return formatDateTimeBR(iso);

  const hora = alvo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hojeIni = new Date().setHours(0, 0, 0, 0);
  const alvoIni = new Date(alvo).setHours(0, 0, 0, 0); // cópia — não muta `alvo`
  const diasCal = Math.floor((alvoIni - hojeIni) / DIA);

  if (diff > 0) {
    if (diasCal === 0) return `hoje às ${hora}`;
    if (diasCal === 1) return `amanhã às ${hora}`;
    if (abs < HORA) return `em ${Math.round(abs / MINUTO)} min`;
    return `em ${diasCal} dias`;
  }
  if (abs < HORA) return `há ${Math.round(abs / MINUTO)} min`;
  if (diasCal === 0) return `hoje às ${hora}`;
  if (diasCal === -1) return `ontem às ${hora}`;
  return `há ${-diasCal} dias`;
}
