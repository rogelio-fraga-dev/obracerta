"use client";

import { useEffect, useState } from "react";
import { Button } from "@obracerta/ui";

/** Evento `beforeinstallprompt` (não tipado no lib.dom padrão). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "oc_install_dismissed";

/** Já está rodando como app instalado? (Android/desktop: display-mode; iOS: navigator.standalone) */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Convite "Instalar o app" (PWA). Aparece na área logada logo após cadastrar/entrar
 * — **exceto** quando o usuário já está usando o app instalado (standalone) ou já
 * dispensou. No Android/desktop usa o prompt nativo (`beforeinstallprompt`); no iOS,
 * onde esse evento não existe, mostra o passo a passo (Compartilhar → Adicionar à Tela).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Nunca no app instalado nem se já foi dispensado.
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS não dispara o evento — mostramos as instruções após um instante.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function instalar() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar o aplicativo"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-background p-3.5 shadow-[var(--shadow-xl)] lg:bottom-6"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-foreground">Instalar o app</div>
        {iosHint ? (
          <p className="text-xs text-muted-foreground">
            Toque em <span aria-hidden>⎋</span> Compartilhar e depois em “Adicionar à Tela de Início”.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Acesso rápido na tela inicial, como um app.</p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {iosHint ? "Entendi" : "Agora não"}
      </button>
      {!iosHint && (
        <Button size="sm" onClick={instalar} className="shrink-0">
          Instalar
        </Button>
      )}
    </div>
  );
}
