import type { TextareaHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Marca visualmente o campo como inválido (par com `Field error`). */
  invalid?: boolean;
  // React 19: `ref` é prop comum (sem forwardRef).
  ref?: Ref<HTMLTextAreaElement>;
}

const base =
  "w-full rounded-md border bg-background px-3.5 py-2.5 font-sans text-foreground " +
  "placeholder:text-muted-foreground/70 transition-colors duration-150 outline-none " +
  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-orange-200 " +
  "disabled:opacity-50 disabled:pointer-events-none resize-y";

/** Área de texto do Design System (mesma linguagem do Input). */
export function Textarea({ className, invalid = false, rows = 4, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(base, invalid ? "border-danger" : "border-border", className)}
      {...props}
    />
  );
}
