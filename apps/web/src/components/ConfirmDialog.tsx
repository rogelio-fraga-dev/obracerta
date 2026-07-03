"use client";

import type { ReactNode } from "react";
import { Button } from "@obracerta/ui";

/**
 * Confirmação estilizada para ações destrutivas (cancelar pedido, remover foto)
 * — substitui o `window.confirm` cru e o clique-direto sem volta.
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
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
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
          <span aria-hidden className="text-2xl">⚠️</span>
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
