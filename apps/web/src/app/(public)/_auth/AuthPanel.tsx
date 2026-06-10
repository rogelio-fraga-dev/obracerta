import type { ReactNode } from "react";
import Link from "next/link";
import { config } from "@/lib/config";

interface AuthPanelProps {
  /** Pequena etiqueta acima do título (ex.: "Entrar"). */
  eyebrow: string;
  /** Título principal; o `accent` é destacado em itálico/laranja (linguagem da marca). */
  title: string;
  accent?: string;
  subtitle: string;
  children: ReactNode;
  /** Linha de rodapé (ex.: "Não tem conta? Criar agora"). */
  footer?: ReactNode;
}

/** Provas de valor exibidas no painel de marca (desktop). */
const VALUE_PROPS = [
  { icon: "🔒", title: "Seu celular fica protegido", desc: "Seu WhatsApp só aparece para o contratante após o aceite do serviço." },
  { icon: "⭐", title: "Reputação que vale dinheiro", desc: "Profissionais avaliados fecham negócios muito mais rápido." },
  { icon: "⚖️", title: "Lances justos", desc: "Concorra em obras sem ter que expor seu valor para os rivais." },
];

/**
 * Moldura PC-first das telas de acesso (entrar/cadastro). Em telas grandes mostra
 * um painel de marca à esquerda + formulário à direita.
 */
export function AuthPanel({ eyebrow, title, accent, subtitle, children, footer }: AuthPanelProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* ── Lado Esquerdo: Brand Panel ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-14 lg:flex">
        {/* Decorative blur */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[100px]"
        />

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand font-display text-lg font-black text-white shadow-[var(--shadow-md)]">
            {config.brand.name.charAt(0)}
          </span>
          <span className="font-display text-2xl font-black text-cream">
            {config.brand.name}
          </span>
        </Link>

        <div className="relative z-10 my-auto py-12">
          <h2 className="max-w-md font-display text-4xl font-black leading-tight text-cream">
            A obra certa começa com a <em className="not-italic text-primary">pessoa certa</em>.
          </h2>
          <ul className="mt-12 space-y-8">
            {VALUE_PROPS.map((p, i) => (
              <li key={p.title} className={`flex items-start gap-4 animate-fade-in-up delay-${i + 1}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream/5 text-2xl shadow-[var(--shadow-sm)] border border-white/5">
                  {p.icon}
                </span>
                <div>
                  <p className="text-lg font-bold text-cream">{p.title}</p>
                  <p className="mt-1 text-sm text-cream/60 leading-relaxed">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <p className="relative z-10 text-xs font-semibold uppercase tracking-widest text-cream/40">
          Construção civil com confiança.
        </p>
      </aside>

      {/* ── Lado Direito: Form ── */}
      <div className="flex flex-col bg-background relative z-20">
        <div className="flex-1 overflow-y-auto px-5 py-12 sm:px-12 sm:py-16 md:px-24 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-sm">
            <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand font-display text-base font-black text-white">
                {config.brand.name.charAt(0)}
              </span>
              <span className="font-display text-xl font-black text-foreground">
                {config.brand.name}
              </span>
            </Link>

            <div className="animate-fade-in">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {title}
                {accent && <em className="not-italic text-primary"> {accent}</em>}
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="mt-10">{children}</div>

            {footer && (
              <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
