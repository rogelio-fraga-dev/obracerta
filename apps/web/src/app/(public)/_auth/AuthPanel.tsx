import type { ReactNode } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { ArrowLeft } from "lucide-react";

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
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1a1711] via-[#0d0c0a] to-[#2b1708] p-14 lg:flex border-r border-border/20">
        {/* Glow Effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-[450px] w-[450px] rounded-full bg-primary/20 blur-[120px] animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -bottom-20 h-[350px] w-[350px] rounded-full bg-amber-600/10 blur-[100px]"
        />

        <Link href="/" className="relative z-10 flex shrink-0 items-center" aria-label="Voltar para a página inicial">
          <img
            src="/brand/obracerta-logo.png"
            alt={config.brand.name}
            width={1120}
            height={305}
            className="h-10 w-auto filter brightness-0 invert"
          />
        </Link>

        <div className="relative z-10 my-auto py-12">
          <h2 className="max-w-md font-display text-4xl font-black leading-tight text-cream">
            A obra certa começa com a <em className="not-italic text-primary">pessoa certa</em>.
          </h2>
          <ul className="mt-12 space-y-8">
            {VALUE_PROPS.map((p, i) => (
              <li key={p.title} className={`flex items-start gap-5 animate-fade-in-up delay-${i + 1}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl shadow-inner border border-white/10 text-white">
                  {p.icon}
                </span>
                <div>
                  <p className="text-lg font-bold text-cream">{p.title}</p>
                  <p className="mt-1 text-sm text-cream opacity-70 leading-relaxed max-w-sm">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <p className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-cream opacity-40">
          Construção civil com confiança.
        </p>
      </aside>

      {/* ── Lado Direito: Form ── */}
      <div className="flex flex-col bg-background justify-center relative z-20 min-h-dvh">
        <div className="overflow-y-auto px-5 py-12 sm:px-12 sm:py-16 md:px-24 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a página inicial
            </Link>

            <Link href="/" className="mb-10 flex shrink-0 items-center lg:hidden">
              <img
                src="/brand/obracerta-logo.png"
                alt={config.brand.name}
                width={1120}
                height={305}
                className="h-9 w-auto"
              />
            </Link>

            <div className="animate-fade-in">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {title}
                {accent && <em className="not-italic text-primary font-serif italic"> {accent}</em>}
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
