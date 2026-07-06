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
      // Layout por flex + padding (sem posicionamento absoluto): a bolinha vive
      // DENTRO do trilho por construção — não tem como escapar em nenhum tema.
      className={cn(
        "box-content flex h-5 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
