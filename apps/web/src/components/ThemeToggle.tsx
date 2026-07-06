"use client";

import { Moon } from "lucide-react";
import { Card, Switch } from "@obracerta/ui";
import { useTheme } from "@/lib/use-theme";

/**
 * Modo escuro (opt-in): card do Perfil. A fonte de verdade é o `data-theme` do
 * documento (hook useTheme) — sincronizado com o botão sol/lua do header.
 */
export function ThemeToggle() {
  const { dark, setTheme } = useTheme();

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"
        >
          <Moon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Modo escuro</p>
          <p className="text-xs text-muted-foreground">
            Melhor para pouca luz — a preferência fica salva neste aparelho.
          </p>
        </div>
      </div>
      <Switch checked={dark} onCheckedChange={setTheme} aria-label="Modo escuro" />
    </Card>
  );
}
