import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marca visualmente o campo como inválido (par com `Field error`). */
  invalid?: boolean;
  // React 19: `ref` é prop comum (sem forwardRef).
  ref?: Ref<HTMLInputElement>;
}

const base =
  "w-full rounded-md border bg-background px-3.5 py-2.5 font-sans text-foreground " +
  "placeholder:text-muted-foreground/70 transition-colors duration-150 outline-none " +
  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-orange-200 " +
  "disabled:opacity-50 disabled:pointer-events-none";

/** Input de texto do Design System (tokens via Tailwind). */
export function Input({ className, invalid = false, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(base, invalid ? "border-danger" : "border-border-strong", className)}
      {...props}
    />
  );
}
