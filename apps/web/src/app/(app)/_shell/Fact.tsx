import type { ReactNode } from "react";

/**
 * Linha de "fato" (ícone + rótulo + valor) usada nos detalhes de pedido e obra.
 * Extraída para um único lugar (antes era definida idêntica nas duas telas).
 */
export function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 first:pt-0 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{children}</p>
      </div>
    </div>
  );
}
