import { useEffect, type ReactNode } from "react";
import { Button } from "./button.js";

/** Triângulo de alerta inline (sem dependência de ícones no DS). */
function AlertIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmação para ações destrutivas (cancelar pedido, remover foto) — substitui
 * o `window.confirm`. `role="alertdialog"`, fecha no backdrop e no Escape.
 * Importe **apenas de client components** (o estado `open` é do chamador).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Voltar",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  // Escape fecha (padrão de dialog) — só escuta enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-xl)] animate-scale-in">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning"
          >
            <AlertIcon />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-black text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Aguarde…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
