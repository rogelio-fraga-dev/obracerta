"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Rodapé padrão de landing — multi-coluna com marca, navegação por seção, conta e
 * links institucionais. Os links legais ainda são placeholders (`#`) até as páginas
 * existirem. Marca/domínio vêm do config (desacoplados).
 */
export function PublicFooter({ brandName, domain }: { brandName: string; domain: string }) {
  const pathname = usePathname();
  const ano = new Date().getFullYear();
  const contato = `contato@${domain}`;

  if (pathname === "/entrar" || pathname === "/cadastro") {
    return null;
  }

  const columns: FooterColumn[] = [
    {
      title: "Produto",
      links: [
        { label: "Como funciona", href: "/#como-funciona" },
        { label: "Planos e preços", href: "/#planos" },
        { label: "Dúvidas frequentes", href: "/#faq" },
      ],
    },
    {
      title: "Conta",
      links: [
        { label: "Entrar", href: "/entrar" },
        { label: "Criar conta", href: "/cadastro" },
        { label: "Sou profissional", href: "/cadastro" },
        { label: "Sou empresa", href: "/cadastro" },
      ],
    },
    {
      title: "Institucional",
      links: [
        { label: "Termos de uso", href: "/termos" },
        { label: "Privacidade (LGPD)", href: "#" },
        { label: "Falar com a gente", href: `mailto:${contato}` },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-[1600px] px-6 py-14 sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Marca */}
          <div className="max-w-sm">
            <span className="font-display text-2xl font-black tracking-tight text-foreground">
              {brandName}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              O jeito certo de contratar e ser contratado na construção civil: reputação
              verificada, agenda transparente e propostas sigilosas.
            </p>
            <a
              href={`mailto:${contato}`}
              className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
            >
              {contato}
            </a>
          </div>

          {/* Colunas de links */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {ano} {brandName} · {domain}
          </span>
          <span>Construção civil com confiança.</span>
        </div>
      </div>
    </footer>
  );
}
