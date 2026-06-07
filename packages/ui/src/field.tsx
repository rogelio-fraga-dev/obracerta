import type { ReactNode } from "react";

export interface FieldProps {
  /** Rótulo do campo. */
  label: string;
  /** Dica auxiliar (some quando há erro). */
  hint?: string;
  /** Mensagem de erro (substitui a dica e marca `role="alert"`). */
  error?: string;
  children: ReactNode;
}

/**
 * Campo de formulário do Design System: rótulo + controle + dica/erro. Envolve o
 * controle num `<label>` (associação acessível sem precisar de `id`).
 */
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {children}
      {error && (
        <span role="alert" className="block text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
