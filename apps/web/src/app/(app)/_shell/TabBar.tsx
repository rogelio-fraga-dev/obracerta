"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@obracerta/ui";
import { TABS } from "./tabs";

/**
 * Barra de abas inferior da área logada (mobile-first). Destaca a aba ativa pelo
 * pathname. Fixa no rodapé; o conteúdo reserva espaço com `pb` no layout.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden className="text-lg leading-none">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
