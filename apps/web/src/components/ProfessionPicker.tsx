"use client";

import { useState } from "react";
import { professionCatalog } from "@obracerta/shared";
import { cn } from "@obracerta/ui";

interface ProfessionPickerProps {
  /** Rótulos selecionados (catálogo + "Outra" custom). */
  value: string[];
  onChange: (labels: string[]) => void;
  /** Máximo de seleções (regra de negócio: até 2 por especialidade no plano? deixamos amplo aqui). */
  max?: number;
}

/**
 * Seletor de profissões a partir do **catálogo fixo** (`@obracerta/shared`), com
 * opção "Outra" (texto livre). Multi-seleção por chips — usado no cadastro do
 * profissional (substitui o antigo input separado por vírgula).
 */
export function ProfessionPicker({ value, onChange, max = 10 }: ProfessionPickerProps) {
  const [outra, setOutra] = useState("");

  const toggle = (label: string) => {
    if (value.includes(label)) {
      onChange(value.filter((v) => v !== label));
    } else if (value.length < max) {
      onChange([...value, label]);
    }
  };

  const addOutra = () => {
    const label = outra.trim();
    if (label && !value.includes(label) && value.length < max) {
      onChange([...value, label]);
    }
    setOutra("");
  };

  // Selecionados que não estão no catálogo (entradas "Outra").
  const customSelecionadas = value.filter(
    (v) => !professionCatalog.some((p) => p.label === v),
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {professionCatalog.map((p) => {
          const selected = value.includes(p.label);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(p.label)}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60",
              )}
            >
              <span aria-hidden className="text-lg">
                {p.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      {customSelecionadas.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {customSelecionadas.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => toggle(label)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
              >
                {label}
                <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={outra}
          onChange={(e) => setOutra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOutra();
            }
          }}
          placeholder="Outra profissão…"
          className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-orange-200"
        />
        <button
          type="button"
          onClick={addOutra}
          className="shrink-0 rounded-md border-2 border-border px-4 text-sm font-bold text-foreground transition-colors hover:border-primary"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
