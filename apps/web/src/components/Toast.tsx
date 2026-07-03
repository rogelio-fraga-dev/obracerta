"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Toasts do app: feedback flutuante e não-bloqueante para ações rápidas
 * (favoritar, salvar, moderar). Auto-descarta em 4s; acessível via
 * `role="status"` (polite) — erros usam `role="alert"`.
 *
 * Uso: `const toast = useToast();  toast.success("Salvo!");`
 */

type Tone = "success" | "error";

interface ToastItem {
  id: number;
  msg: string;
  tone: Tone;
}

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string, tone: Tone) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (msg) => push(msg, "success"),
      error: (msg) => push(msg, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Container fixo — acima da TabBar/menus, abaixo de modais (z-50). */}
      <div className="pointer-events-none fixed inset-x-3 bottom-6 z-40 flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-lg)] animate-fade-in-up ${
              t.tone === "success"
                ? "border-success/30 bg-background text-foreground"
                : "border-danger/30 bg-background text-foreground"
            }`}
          >
            <span aria-hidden>{t.tone === "success" ? "✅" : "⚠️"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Toast fora do provider vira no-op silencioso — nunca quebra a tela. */
const NOOP: ToastApi = { success: () => undefined, error: () => undefined };

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}
