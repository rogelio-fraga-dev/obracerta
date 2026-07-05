"use client";

import { useRouter } from "next/navigation";
import { SegmentedControl } from "@obracerta/ui";

/**
 * Alterna a visão da busca de obras (Lista × Mapa) — SegmentedControl do DS com
 * o estado na URL (`?vista=mapa`), preservando o filtro de especialidade.
 */
export function VistaToggle({
  vista,
  especialidade,
}: {
  vista: "lista" | "mapa";
  especialidade?: string;
}) {
  const router = useRouter();
  const espQs = especialidade ? `especialidade=${encodeURIComponent(especialidade)}` : "";

  function hrefFor(v: string): string {
    if (v === "mapa") return espQs ? `/obras?vista=mapa&${espQs}` : "/obras?vista=mapa";
    return espQs ? `/obras?${espQs}` : "/obras";
  }

  return (
    <SegmentedControl
      aria-label="Ver obras como lista ou mapa"
      value={vista}
      onChange={(v) => router.push(hrefFor(v))}
      options={[
        { value: "lista", label: "Lista" },
        { value: "mapa", label: "Mapa" },
      ]}
      className="w-40 shrink-0"
    />
  );
}
