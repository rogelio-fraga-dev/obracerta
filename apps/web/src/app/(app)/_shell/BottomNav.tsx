"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@obracerta/ui";
import { ADMIN_NAV, navForTipo } from "./nav-items";

/**
 * Barra de navegação inferior do mobile (padrão Material 3 / HIG): os 3–5
 * destinos **primários** da persona a um toque, na zona do polegar. O restante
 * continua no drawer (Menu, header). Some no desktop (`lg:hidden`), onde a
 * Sidebar assume. Alvos ≥ 44px (HIG).
 */
export function BottomNav({
  tipo,
  isAdmin = false,
  pendingPedidos = 0,
}: {
  tipo?: string;
  isAdmin?: boolean;
  /** Pedidos aguardando ação — badge no item Pedidos. */
  pendingPedidos?: number;
}) {
  const pathname = usePathname();
  const items = isAdmin ? ADMIN_NAV.slice(0, 4) : navForTipo(tipo).primary;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
    >
      <ul className="flex">
        {items.map(({ href, label, shortLabel, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-xs font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {href === "/pedidos" && pendingPedidos > 0 && (
                    <span
                      aria-label={`${pendingPedidos} pedido(s) pendente(s)`}
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white ring-2 ring-background"
                    >
                      {pendingPedidos > 9 ? "9+" : pendingPedidos}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{shortLabel ?? label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
