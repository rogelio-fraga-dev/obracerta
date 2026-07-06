"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { Card, Switch } from "@obracerta/ui";

const THEME_KEY = "oc-theme";

/**
 * Modo escuro (opt-in): alterna o `data-theme` do documento e persiste em
 * localStorage — o boot script do root layout reaplica antes do primeiro paint.
 * O padrão continua o tema claro da marca.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Lê o estado real do documento após montar (o boot script já o aplicou).
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle(next: boolean) {
    setDark(next);
    if (next) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* armazenamento indisponível: o tema vale só nesta visita */
    }
  }

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
      <Switch checked={dark} onCheckedChange={toggle} aria-label="Modo escuro" />
    </Card>
  );
}
