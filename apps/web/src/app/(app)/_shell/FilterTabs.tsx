import Link from "next/link";

export interface FilterTab {
  key: string;
  label: string;
  /** Contador opcional exibido entre parênteses. */
  count?: number;
}

/**
 * Abas de filtro em "pílulas" que **quebram em linhas** (wrap) no mobile — nunca
 * cortam nem exigem rolagem horizontal; todos os filtros ficam sempre visíveis.
 * Fonte única para as telas de Pedidos e Obras — o estado do filtro vive na URL.
 */
export function FilterTabs({
  tabs,
  activeKey,
  hrefFor,
  ariaLabel,
}: {
  tabs: FilterTab[];
  activeKey: string;
  hrefFor: (key: string) => string;
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <Link
            key={t.key}
            href={hrefFor(t.key)}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
          </Link>
        );
      })}
    </nav>
  );
}
