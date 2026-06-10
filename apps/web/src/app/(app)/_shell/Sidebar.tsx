"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@obracerta/ui";
import { navForTipo, tipoLabel, ADMIN_NAV, type NavItem } from "./nav-items";

interface SidebarProps {
  brandName: string;
  /** Inicial do usuário (ou da marca) para o avatar. */
  inicial: string;
  /** Nome exibido no rodapé do perfil (quando houver dica de sessão). */
  nome?: string;
  /** Tipo do perfil para exibir badge. */
  tipo?: string;
  /** Mostra o grupo de administração (só para usuários com papel ADMIN). */
  isAdmin?: boolean;
  /** Slot do rodapé (ex.: botão Sair). */
  children?: ReactNode;
}

/**
 * Navegação lateral — **só no desktop** (`hidden lg:flex`). Fixa à esquerda, com
 * marca no topo, grupos de navegação e o cartão de perfil + sair no rodapé.
 */
export function Sidebar({ brandName, inicial, nome, tipo, isAdmin, children }: SidebarProps) {
  const pathname = usePathname();
  const { primary, secondary } = navForTipo(tipo);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderItem = ({ href, label, Icon }: NavItem) => {
    const active = isActive(href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-bold transition-all duration-200",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {/* Barra indicadora ativa */}
          {active && (
            <span className="absolute left-0 top-1/2 h-8 w-[4px] -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <Icon className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 flex-col border-r border-border bg-background px-5 py-6 lg:flex">
      {/* ── Marca ── */}
      <Link href="/inicio" className="flex items-center gap-3 px-2" aria-label="Início">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand font-display text-lg font-black text-white">
          {inicial}
        </span>
        <span className="font-display text-[1.5rem] font-black tracking-tight text-foreground">
          {brandName}
        </span>
      </Link>

      {/* ── Navegação ── */}
      <nav aria-label="Navegação principal" className="mt-8 flex-1 overflow-y-auto">
        {isAdmin ? (
          <>
            <p className="px-4 pb-3 text-xs font-extrabold uppercase tracking-wider text-primary/70">
              Administração
            </p>
            <ul className="space-y-1">{ADMIN_NAV.map(renderItem)}</ul>
          </>
        ) : (
          <>
            <ul className="space-y-1">{primary.map(renderItem)}</ul>
            <div className="mx-4 my-6 h-px bg-border/60" />
            <p className="px-4 pb-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground/60">
              Atalhos
            </p>
            <ul className="space-y-1">{secondary.map(renderItem)}</ul>
          </>
        )}
      </nav>

      {/* ── Perfil no rodapé ── */}
      <div className="mt-4 border-t border-border pt-4">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand font-display text-sm font-black text-white">
            {inicial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">
              {nome ?? "Meu perfil"}
            </span>
            {(tipo || isAdmin) && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {tipoLabel(tipo, isAdmin)}
              </span>
            )}
          </span>
        </Link>
        <div className="px-2 pt-2">{children}</div>
      </div>
    </aside>
  );
}
