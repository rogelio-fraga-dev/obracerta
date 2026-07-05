import type { SelectHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Marca visualmente o campo como inválido (par com `Field error`). */
  invalid?: boolean;
  // React 19: `ref` é prop comum (sem forwardRef).
  ref?: Ref<HTMLSelectElement>;
}

const base =
  "w-full appearance-none rounded-md border bg-background px-3.5 py-2.5 pr-9 font-sans " +
  "text-foreground transition-colors duration-150 outline-none " +
  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-orange-200 " +
  "disabled:opacity-50 disabled:pointer-events-none";

/**
 * Select do Design System — mesma moldura/foco do {@link Input} (tokens via Tailwind),
 * com chevron próprio. Evita os `<select>` com classes duplicadas espalhados nas telas.
 */
export function Select({ className, invalid = false, ref, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(base, invalid ? "border-danger" : "border-border-strong", className)}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        ▾
      </span>
    </div>
  );
}
