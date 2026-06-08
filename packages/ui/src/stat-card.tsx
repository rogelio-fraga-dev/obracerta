import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn.js";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Título do stat (ex.: "Pedidos pendentes"). */
  label: string;
  /** Valor numérico principal. */
  value: string | number;
  /** Ícone ou emoji à esquerda. */
  icon?: ReactNode;
  /** Texto secundário (ex.: "+2 esta semana"). */
  detail?: string;
  /** Tom de destaque para o valor. */
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  ref?: Ref<HTMLDivElement>;
}

const toneClasses = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Card de estatística — exibe um KPI com ícone, rótulo, valor destaque e detalhe.
 * Ideal para dashboards e painéis de resumo.
 */
export function StatCard({
  label,
  value,
  icon,
  detail,
  tone = "default",
  className,
  ref,
  ...props
}: StatCardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border bg-background p-5",
        "shadow-[var(--shadow-card)]",
        "transition-all duration-200 hover:shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary text-xl">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 font-display text-3xl font-black animate-count-up", toneClasses[tone])}>
          {value}
        </p>
        {detail && (
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}
