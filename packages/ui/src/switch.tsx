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
 *
 * Geometria à prova de estouro: trilho `relative` (44×24) e bolinha `absolute`
 * (18px) posicionada por `left` com **3px de folga em todos os lados** nos dois
 * estados — a bolinha nunca encosta na borda (o bug do mobile era o knob no
 * tamanho exato do trilho, que vazava por 1px de arredondamento).
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
        "relative inline-block h-6 w-11 shrink-0 rounded-full align-middle transition-colors disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          // top-[3px] centra os 18px na altura de 24px; left desliza entre 3px
          // (desligado) e 23px (ligado → 44−3−18): 3px de folga nas duas pontas.
          "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-[left] duration-200",
          checked ? "left-[23px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
