"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@obracerta/ui";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
];

/**
 * Header da landing — **sticky e sempre legível**. No topo é translúcido (deixa o
 * hero respirar); ao rolar fica sólido com sombra e borda, garantindo contraste dos
 * botões sobre qualquer seção (corrige o sumiço dos botões ao descer a página).
 */
export function PublicHeader({ brandName }: { brandName: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/entrar" || pathname === "/cadastro") {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
          : "border-b border-border/60 bg-background/85 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-10 sm:py-3.5 lg:px-14">
        <Link href="/" aria-label={brandName} className="flex shrink-0 items-center">
          {/* Celular: só o símbolo (a logo completa + botões estouram 320–360px). */}
          <img
            src="/brand/obracerta-mark.png"
            alt={brandName}
            className="h-9 w-auto sm:hidden"
          />
          <img
            src="/brand/obracerta-logo.png"
            alt={brandName}
            width={1120}
            height={305}
            className="hidden h-10 w-auto sm:block"
          />
        </Link>

        {/* Âncoras (desktop) */}
        <nav aria-label="Seções" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Acesso — sempre visível */}
        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3" aria-label="Acesso">
          <Link
            href="/entrar"
            className="rounded-md px-2.5 py-2 text-sm font-bold text-foreground transition-colors hover:text-primary sm:px-3"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground shadow-[0_2px_12px_rgba(196,68,8,0.25)] transition-colors hover:bg-orange-400 sm:px-4"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
