"use client";

import { cn } from "@obracerta/ui";

interface MethodOption {
  value: string;
  label: string;
}

interface MethodTabsProps {
  value: string;
  onChange: (value: string) => void;
  options: MethodOption[];
}

/**
 * Segmented control (pílula) para escolher o método de acesso — e-mail x WhatsApp.
 * Acessível: `role="tablist"` + `aria-selected`. Visual alinhado aos protótipos
 * (fundo `muted`, aba ativa em superfície branca com sombra leve).
 */
export function MethodTabs({ value, onChange, options }: MethodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Método de acesso"
      className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
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
              "rounded-md px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
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
