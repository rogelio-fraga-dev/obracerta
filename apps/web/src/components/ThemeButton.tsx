"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

/**
 * Botão sol/lua do header — troca o tema com um toque. Mostra o ícone do tema
 * PARA O QUAL o clique leva (lua no claro, sol no escuro).
 */
export function ThemeButton() {
  const { dark, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(!dark)}
      aria-label={dark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
