"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@obracerta/ui";
import { HomeIcon, ObrasIcon, PedidosIcon, PerfilIcon } from "./icons";

interface Tab {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const TABS: Tab[] = [
  { href: "/inicio", label: "Início", Icon: HomeIcon },
  { href: "/pedidos", label: "Pedidos", Icon: PedidosIcon },
  { href: "/obras", label: "Obras", Icon: ObrasIcon },
  { href: "/perfil", label: "Perfil", Icon: PerfilIcon },
];

/**
 * Barra de abas inferior (mobile-first) com ícones SVG. A aba ativa ganha cor de
 * destaque + um traço superior. Fixa no rodapé, com safe-area do iOS.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="relative flex-1">
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary"
                />
              )}
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
