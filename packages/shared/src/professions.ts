import { z } from "zod";

/**
 * Catálogo **fixo** de profissões da construção civil (decisão jun/2026). É a
 * fonte única do front (cadastro multi-seleção + filtros de busca) e da
 * normalização de dados. O `label` é o valor canônico armazenado em
 * `especialidades` (mantém a busca por string compatível com o backend atual);
 * o `id` é estável para chaves de UI e uma futura migração para tabela editável.
 */
export interface Profession {
  /** Identificador estável (kebab-case) — chaves de UI e futura FK. */
  id: string;
  /** Rótulo de exibição e **valor canônico** salvo em `especialidades`. */
  label: string;
  /** Ícone (emoji) para o cadastro e a busca. */
  icon: string;
}

export const professionCatalog: readonly Profession[] = [
  { id: "pedreiro", label: "Pedreiro", icon: "🧱" },
  { id: "eletricista", label: "Eletricista", icon: "⚡" },
  { id: "encanador", label: "Encanador", icon: "🚰" },
  { id: "marceneiro", label: "Marceneiro", icon: "🪵" },
  { id: "gesseiro", label: "Gesseiro", icon: "🛠️" },
  { id: "serralheiro", label: "Serralheiro", icon: "🔩" },
  { id: "azulejista", label: "Azulejista", icon: "🟫" },
  { id: "impermeabilizador", label: "Impermeabilizador", icon: "💧" },
  { id: "piscineiro", label: "Piscineiro", icon: "🏊" },
  { id: "soldador", label: "Soldador", icon: "🔥" },
  { id: "paisagista", label: "Paisagista", icon: "🌳" },
  { id: "vidraceiro", label: "Vidraceiro", icon: "🪟" },
  { id: "telhadista", label: "Telhadista", icon: "🏠" },
  { id: "marido-de-aluguel", label: "Marido de aluguel", icon: "🧰" },
  { id: "limpeza-pos-obra", label: "Limpeza pós-obra", icon: "🧽" },
] as const;

/** Apenas os rótulos canônicos (ex.: para validar/filtrar). */
export const professionLabels: readonly string[] = professionCatalog.map((p) => p.label);

/** Resolve o ícone de uma profissão pelo rótulo (fallback genérico). */
export function professionIcon(label: string): string {
  return professionCatalog.find((p) => p.label === label)?.icon ?? "🔨";
}

/** True se o rótulo pertence ao catálogo fixo (o resto é "Outra", texto livre). */
export function isCatalogProfession(label: string): boolean {
  return professionLabels.includes(label);
}

/** Schema de uma especialidade: string aparada de 2..60 (catálogo ou "Outra"). */
export const especialidadeSchema = z.string().trim().min(2).max(60);
