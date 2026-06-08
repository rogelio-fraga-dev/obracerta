"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@obracerta/ui";
import { PRIMARY_NAV, ADMIN_NAV } from "./nav-items";

/**
 * Barra de abas inferior — **só no mobile** (`lg:hidden`).
 * A aba ativa ganha cor de destaque + um traço superior animado.
 */
export function TabBar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const navItems = isAdminRoute ? ADMIN_NAV : PRIMARY_NAV;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(24,22,15,0.04)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-2xl px-2">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="relative flex-1">
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-4 top-0 h-[3px] rounded-b-md bg-primary animate-scale-in origin-top"
                />
              )}
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 text-[11px] font-extrabold transition-all duration-200",
                  active
                    ? "text-primary -translate-y-0.5"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-transform duration-300",
                    active && "scale-110",
                  )}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
