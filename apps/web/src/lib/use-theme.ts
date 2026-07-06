"use client";

import { useCallback, useSyncExternalStore } from "react";

const THEME_KEY = "oc-theme";
const THEME_EVENT = "oc-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function snapshot(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

/**
 * Tema claro/escuro como estado EXTERNO (o `data-theme` do documento é a fonte
 * de verdade; o boot script do root layout o aplica antes do primeiro paint).
 * Vários consumidores (botão do header + card do Perfil) ficam sincronizados
 * pelo evento — trocar num deles atualiza todos.
 */
export function useTheme(): { dark: boolean; setTheme: (dark: boolean) => void } {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);

  const setTheme = useCallback((next: boolean) => {
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
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { dark, setTheme };
}
