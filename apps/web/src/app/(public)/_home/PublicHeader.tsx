"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3.5 sm:px-10 lg:px-14">
        <Link href="/" aria-label={brandName} className="flex shrink-0 items-center">
          <img
            src="/brand/obracerta-logo.png"
            alt={brandName}
            width={1120}
            height={305}
            className="h-9 w-auto sm:h-10"
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
        <nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Acesso">
          <Link
            href="/entrar"
            className="rounded-md px-3 py-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-[0_2px_12px_rgba(196,68,8,0.25)] transition-colors hover:bg-orange-400"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
