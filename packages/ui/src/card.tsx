import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** Cartão interativo (hover com elevação). */
  interactive?: boolean;
}

/** Superfície base do Design System (cartão sobre o fundo cream). */
export function Card({ className, ref, interactive, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-background p-6",
        "shadow-[var(--shadow-card)]",
        "transition-all duration-[var(--duration-normal)]",
        interactive && [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:border-primary/30",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ],
        className,
      )}
      {...props}
    />
  );
}
