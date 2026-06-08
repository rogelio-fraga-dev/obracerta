import type { LabelHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  ref?: Ref<HTMLLabelElement>;
}

/** Rótulo de formulário do Design System (par com `Input` via `htmlFor`). */
export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn("block text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}
