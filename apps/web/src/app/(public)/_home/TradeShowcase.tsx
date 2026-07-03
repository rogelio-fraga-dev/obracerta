import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

/**
 * Vitrine de profissões — grade ilustrada (SVG próprios, sem depender de fotos
 * externas por conta da CSP) e **clicável**: cada ofício leva à busca já
 * filtrada (`/buscar?especialidade=`; sem sessão, o guard manda ao login).
 * Os rótulos casam com o `professionCatalog` do shared.
 */

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Trade {
  label: string;
  desc: string;
  Icon: Icon;
  /** Par de cores do gradiente da tile (do → para). */
  from: string;
  to: string;
}

const stroke = {
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function HammerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
      <path d="M17.64 15 22 10.64" />
      <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.34 2.25.93l1.25 1.25" />
    </svg>
  );
}

function WrenchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0 5 5l-6.4 6.4a2.8 2.8 0 1 1-4-4l6.4-6.4a4 4 0 0 0-1-1Z" />
    </svg>
  );
}

function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  );
}

function RollerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <rect x="3" y="4" width="14" height="6" rx="1.5" />
      <path d="M17 7h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-8a1 1 0 0 0-1 1v2" />
      <rect x="9" y="18" width="4" height="4" rx="1" />
      <path d="M11 15v3" />
    </svg>
  );
}

function BrickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9.3h18M3 14.6h18M9 4v5.3M15 9.3v5.3M9 14.6V20" />
    </svg>
  );
}

function RulerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" {...stroke} {...props}>
      <path d="M16 3 3 16l5 5L21 8l-5-5Z" />
      <path d="M9.5 6.5 11 8M12.5 3.5 14 5M6.5 9.5 8 11M6 13l1.5 1.5" />
    </svg>
  );
}

// Rótulos idênticos ao professionCatalog (shared) — o filtro da busca casa exato.
const TRADES: Trade[] = [
  { label: "Pedreiro", desc: "Alvenaria e acabamento", Icon: BrickIcon, from: "#e8560a", to: "#a53a07" },
  { label: "Eletricista", desc: "Instalações e reparos", Icon: BoltIcon, from: "#e8a00a", to: "#c44408" },
  { label: "Encanador", desc: "Hidráulica e vazamentos", Icon: WrenchIcon, from: "#2563eb", to: "#1e3a8a" },
  { label: "Gesseiro", desc: "Paredes, forros e sancas", Icon: RollerIcon, from: "#1a9e5c", to: "#0f5c37" },
  { label: "Marceneiro", desc: "Móveis sob medida", Icon: HammerIcon, from: "#c44408", to: "#7e2d06" },
  { label: "Serralheiro", desc: "Portões e estruturas", Icon: RulerIcon, from: "#221f16", to: "#18160f" },
];

export function TradeShowcase() {
  return (
    <section id="profissoes" className="border-t border-border px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
      <div className="mx-auto max-w-[1600px]">
        <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">
          Profissões na plataforma
        </span>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
          Do alicerce ao acabamento, o <em className="italic text-primary">especialista certo</em>
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Reúna toda a sua obra num só lugar. Cada profissional tem histórico, agenda e reputação
          verificada — você escolhe com segurança.
        </p>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {TRADES.map(({ label, desc, Icon, from, to }) => (
            <li key={label}>
              <Link
                href={`/buscar?especialidade=${encodeURIComponent(label)}`}
                className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6"
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105 sm:h-16 sm:w-16"
                  style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  <Icon aria-hidden className="h-7 w-7 sm:h-8 sm:w-8" />
                </span>
                <div>
                  <div className="font-display text-sm font-black text-foreground sm:text-base">{label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
          E muitas outras — azulejista, telhadista, vidraceiro, piscineiro, paisagista e mais.
        </p>
      </div>
    </section>
  );
}
