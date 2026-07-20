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

/**
 * Sub-serviços por profissão (pedido guiado / concierge). Ajudam o contratante a
 * descrever a necessidade com precisão e melhoram o match. `label` da profissão →
 * lista de tarefas comuns; a última entrada de cada uma é sempre aberta ("Outro").
 */
export const subServicesByProfession: Readonly<Record<string, readonly string[]>> = {
  Pedreiro: ["Levantar parede/alvenaria", "Reboco e chapisco", "Contrapiso", "Assentar piso", "Reforma geral", "Outro serviço de pedreiro"],
  Eletricista: ["Instalar tomadas/interruptores", "Trocar fiação", "Instalar chuveiro", "Quadro de energia", "Iluminação", "Outro serviço elétrico"],
  Encanador: ["Vazamento", "Instalar pia/torneira", "Desentupimento", "Instalar aquecedor", "Tubulação nova", "Outro serviço hidráulico"],
  Marceneiro: ["Móvel planejado", "Reparar móvel", "Portas/janelas de madeira", "Armário embutido", "Outro serviço de marcenaria"],
  Gesseiro: ["Forro de gesso", "Sanca/moldura", "Parede de drywall", "Reparo em gesso", "Outro serviço de gesso"],
  Serralheiro: ["Portão", "Grade/proteção", "Estrutura metálica", "Reparo de solda", "Outro serviço de serralheria"],
  Azulejista: ["Assentar azulejo/porcelanato", "Rejunte", "Revestir banheiro/cozinha", "Outro serviço de azulejista"],
  Impermeabilizador: ["Laje/terraço", "Banheiro/box", "Piscina", "Parede com infiltração", "Outro serviço"],
  Piscineiro: ["Limpeza/manutenção", "Tratamento de água", "Reparo/vazamento", "Outro serviço de piscina"],
  Soldador: ["Solda de estrutura", "Reparo metálico", "Portão/grade", "Outro serviço de solda"],
  Paisagista: ["Projeto de jardim", "Plantio/gramado", "Manutenção de jardim", "Outro serviço de paisagismo"],
  Vidraceiro: ["Box de banheiro", "Janela/porta de vidro", "Espelho", "Troca de vidro", "Outro serviço de vidraçaria"],
  Telhadista: ["Telhado novo", "Reparo/troca de telhas", "Calha/rufo", "Outro serviço de telhado"],
  "Marido de aluguel": ["Pequenos reparos", "Montagem de móveis", "Instalação (suporte, prateleira)", "Outro serviço"],
  "Limpeza pós-obra": ["Limpeza fina pós-obra", "Remoção de entulho", "Outro serviço de limpeza"],
};

/** Sub-serviços de uma profissão (vazio = a profissão não tem lista guiada). */
export function subServicesFor(profissao: string): readonly string[] {
  return subServicesByProfession[profissao] ?? [];
}
