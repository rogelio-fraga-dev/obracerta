import type { ReactNode } from "react";
import { cn } from "./cn.js";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  /** Valor selecionado. */
  value: string;
  /** Chamado com o novo valor ao trocar de aba. */
  onChange: (value: string) => void;
  options: SegmentedOption[];
  /** Rótulo acessível do grupo (obrigatório). */
  "aria-label": string;
  className?: string;
}

/**
 * Segmented control (pílula) do Design System — escolha exclusiva entre 2–4
 * opções (ex.: e-mail × WhatsApp, Lista × Mapa). `role="tablist"` +
 * `aria-selected`; aba ativa em superfície clara com sombra leve. Para filtros
 * com estado na URL e contadores, use o padrão de pílulas-link (FilterTabs).
 */
export function SegmentedControl({
  value,
  onChange,
  options,
  className,
  ...aria
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={aria["aria-label"]}
      className={cn("flex gap-1 rounded-lg bg-muted p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
