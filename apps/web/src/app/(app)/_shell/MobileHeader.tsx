"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, Bell } from "lucide-react";
import { Avatar, cn } from "@obracerta/ui";
import { firstName } from "@/lib/format";
import { navForTipo, tipoLabel, ADMIN_NAV } from "./nav-items";
import { LogoutButton } from "./LogoutButton";

interface MobileHeaderProps {
  brandName: string;
  inicial: string;
  nome?: string;
  tipo?: string;
  isAdmin?: boolean;
  /** Foto de perfil (avatar real em vez da inicial). */
  fotoUrl?: string;
  /** Pedidos aguardando ação — ponto no Menu + badge no drawer. */
  pendingPedidos?: number;
  /** Notificações não lidas — sino no header + badge no drawer. */
  naoLidas?: number;
}

export function MobileHeader({
  brandName,
  inicial,
  nome,
  tipo,
  isAdmin,
  fotoUrl,
  pendingPedidos = 0,
  naoLidas = 0,
}: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { primary, secondary } = navForTipo(tipo);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const menuItems = isAdmin ? ADMIN_NAV : [...primary, ...secondary];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <header className="pt-safe sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/perfil" className="flex items-center gap-2.5 min-w-0" aria-label="Meu perfil">
            {fotoUrl ? (
              <Avatar nome={nome ?? inicial} src={fotoUrl} size="sm" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-black text-primary-foreground">
                {inicial}
              </span>
            )}
            <span className="font-display text-sm font-bold text-foreground truncate">
              Olá, {firstName(nome) || "Usuário"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Link
                href="/notificacoes"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
              >
                <Bell className="h-4 w-4" />
                {naoLidas > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white ring-2 ring-background"
                  >
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </Link>
            )}
            <Link
              href={isAdmin ? "/admin" : "/inicio"}
              className="flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={pendingPedidos > 0 ? `Abrir menu (${pendingPedidos} pendente(s))` : "Abrir menu"}
            >
              Menu
              {pendingPedidos > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-background"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Slide-over Menu (Drawer) ── */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer content container */}
        <div
          className={cn(
            "pt-safe absolute inset-y-0 right-0 w-full max-w-xs bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link href={isAdmin ? "/admin" : "/inicio"} className="flex shrink-0 items-center" onClick={() => setIsOpen(false)}>
              <img
                src="/brand/obracerta-logo.png"
                alt={brandName}
                width={1120}
                height={305}
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info Section */}
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                <Avatar nome={nome ?? inicial} src={fotoUrl} size="md" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand font-display text-sm font-black text-white">
                  {inicial}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">
                  {nome ?? "Meu perfil"}
                </span>
                {(tipo || isAdmin) && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {tipoLabel(tipo, isAdmin)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-1">
              {menuItems.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={handleLinkClick}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-bold transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {((href === "/pedidos" && pendingPedidos > 0) ||
                        (href === "/notificacoes" && naoLidas > 0)) && (
                        <span
                          aria-label="pendências"
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-black text-white"
                        >
                          {href === "/pedidos" ? pendingPedidos : naoLidas}
                        </span>
                      )}
                      <ArrowRight className={cn("h-4 w-4 opacity-0 transition-opacity", active && "opacity-40")} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Drawer Footer */}
          <div className="pb-safe border-t border-border p-4">
            <LogoutButton className="w-full py-2.5" />
          </div>
        </div>
      </div>
    </>
  );
}
