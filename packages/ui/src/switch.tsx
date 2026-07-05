import type { Ref } from "react";
import { cn } from "./cn.js";

export interface SwitchProps {
  /** Estado ligado/desligado. */
  checked: boolean;
  /** Chamado com o novo valor ao alternar. */
  onCheckedChange: (checked: boolean) => void;
  /** Rótulo acessível (obrigatório — o switch não tem texto visível). */
  "aria-label": string;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Interruptor (toggle) do Design System — `role="switch"` + `aria-checked`,
 * alvo de toque confortável e trilho/botão com tokens. Para preferências e
 * opções liga/desliga (não substitui checkbox em formulários de múltipla escolha).
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ref,
  ...aria
}: SwitchProps) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={aria["aria-label"]}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
