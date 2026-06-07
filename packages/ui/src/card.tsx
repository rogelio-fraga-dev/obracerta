import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Superfície base do Design System (cartão sobre o fundo cream). */
export function Card({ className, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border border-border bg-background p-5 shadow-sm", className)}
      {...props}
    />
  );
}
