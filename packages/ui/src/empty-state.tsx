import type { ReactNode } from "react";
import { cn } from "./cn.js";

export interface EmptyStateProps {
  /** Ícone ou emoji exibido em destaque. */
  icon: ReactNode;
  /** Título (ex.: "Nenhum pedido ainda"). */
  title: string;
  /** Descrição (ex.: "Comece buscando um profissional"). */
  description?: string;
  /** CTA abaixo (ex.: um botão ou link). */
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state para listas vazias — substitui o padrão texto-cinza-triste
 * por um componente visualmente agradável com ícone, texto e CTA.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center",
        "animate-fade-in",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-3xl text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-black text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
