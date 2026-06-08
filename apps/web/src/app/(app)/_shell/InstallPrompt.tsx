"use client";

import { useEffect, useState } from "react";
import { Button } from "@obracerta/ui";

/** Evento `beforeinstallprompt` (não tipado no lib.dom padrão). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "oc_install_dismissed";

/**
 * Banner "Adicionar à tela inicial" (PWA). Aparece quando o navegador dispara
 * `beforeinstallprompt`; ao instalar ou dispensar, some e lembra a dispensa.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  }

  async function instalar() {
    await deferred!.prompt();
    await deferred!.userChoice;
    setDeferred(null);
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-20 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-lg">
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">Instalar o app</div>
        <p className="text-xs text-muted-foreground">Acesso rápido na tela inicial, como um app.</p>
      </div>
      <button type="button" onClick={dismiss} className="text-sm text-muted-foreground" aria-label="Dispensar">
        Agora não
      </button>
      <Button size="sm" onClick={instalar}>
        Instalar
      </Button>
    </div>
  );
}
