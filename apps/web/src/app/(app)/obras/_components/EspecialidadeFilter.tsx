"use client";

import { useRouter } from "next/navigation";
import { professionCatalog } from "@obracerta/shared";
import { Select } from "@obracerta/ui";

/**
 * Seletor de especialidade para "procurar obras" (feed do profissional). Muda a
 * URL (`?especialidade=`) ao selecionar — o valor é o rótulo canônico do catálogo,
 * compatível com o filtro exato do backend.
 */
export function EspecialidadeFilter({ value }: { value: string }) {
  const router = useRouter();
  return (
    <Select
      aria-label="Filtrar obras por especialidade"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        router.push(
          v ? `/obras?especialidade=${encodeURIComponent(v)}` : "/obras",
        );
      }}
      className="max-w-xs"
    >
      <option value="">Todas as especialidades</option>
      {professionCatalog.map((p) => (
        <option key={p.id} value={p.label}>
          {p.icon} {p.label}
        </option>
      ))}
    </Select>
  );
}
