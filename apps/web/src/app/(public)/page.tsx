import Link from "next/link";
import { cn } from "@obracerta/ui";
import { DEPOIMENTOS, DORES, HERO_CARDS, STATS } from "./_home/data";
import { ComoFunciona } from "./_home/ComoFunciona";
import { Planos } from "./_home/Planos";
import { Faq } from "./_home/Faq";
import { TradeShowcase } from "./_home/TradeShowcase";

/**
 * Landing pública (refatorada sobre `docs/mockups/landing_page.html`). Hero estático;
 * o seletor de persona (Sou cliente / Sou profissional / Sou empresa) vive na sua
 * própria seção {@link ./ComoFunciona} (estilo quemfaz), não no hero.
 */
export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 py-16 sm:px-10 sm:py-24 lg:px-14">
        {/* Atmosfera de fundo: grade de pontos + glows suaves (decorativo) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(24,22,15,0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse 75% 60% at 50% 0%, #000 25%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 60% at 50% 0%, #000 25%, transparent 80%)",
            }}
          />
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-3xl" />
          <div className="absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-orange-200/40 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-[1600px] items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Construção civil com confiança
            </span>

            <h1 className="mt-6 font-display text-[2.5rem] font-black leading-[1.05] tracking-tight text-foreground sm:text-7xl sm:leading-[1.02]">
              O profissional <em className="italic text-primary">certo</em> para sua obra
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Encontre pedreiros, eletricistas, encanadores e mais — com histórico real, agenda
              transparente e reputação verificada. Sem boca a boca, sem surpresas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-extrabold text-white shadow-[0_4px_24px_rgba(232,86,10,0.3)] transition-colors hover:bg-orange-400"
              >
                Quero contratar →
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-6 py-3 font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Sou profissional
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ <strong className="text-foreground">7 dias grátis</strong> para profissionais · Sem cartão de crédito
            </p>

            <div className="mt-12 flex flex-wrap gap-10 border-t border-border pt-8">
              {STATS.map((s) => (
                <div key={s.lbl}>
                  <span className="block font-display text-3xl font-black leading-none text-foreground">
                    {s.num}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual: ilustração + cards. Antes escondido no mobile ("sem imagens");
              agora aparece em todas as telas — no mobile empilhado, no desktop
              com os cards flutuando sobre a ilustração. */}
          <div className="relative mt-2 lg:mt-0">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-gradient-brand-soft p-6 shadow-[var(--shadow-lg)] lg:max-w-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <img
                src="/illustrations/hero-blueprint.svg"
                alt="Planta de obra com casa e selo de verificação"
                width={440}
                height={420}
                className="mx-auto w-full max-w-[300px] opacity-95 sm:max-w-[360px] lg:max-w-[440px]"
              />
            </div>

            <div className="mt-4 space-y-3 lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:flex-col lg:items-end lg:justify-center">
              {HERO_CARDS.map((c, i) => (
                <div
                  key={c.nome}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-border bg-background p-3 shadow-[var(--shadow-lg)] lg:w-64",
                    i === 1 && "lg:mr-8",
                    // No mobile mostramos só 2 cards (a lista de 3 alongava demais o hero).
                    i === 2 && "hidden lg:flex",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-xl">
                    {c.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-foreground">{c.nome}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.role}</div>
                    <div className="text-xs font-bold text-primary">{c.rating}</div>
                  </div>
                  <span className="shrink-0 rounded-md bg-success/12 px-2 py-1 text-[11px] font-bold text-success">
                    Livre
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DORES ── */}
      <section id="problema" className="border-t border-border bg-muted/40 px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1600px]">
          <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">
            As dores que a gente resolve
          </span>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
            Você ainda depende de indicação para achar os{" "}
            <em className="italic text-primary">melhores profissionais?</em>
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DORES.map((d) => (
              <div
                key={d.titulo}
                className="rounded-2xl border-2 border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-md)]"
              >
                <span className="text-3xl">{d.emoji}</span>
                <h3 className="mt-4 font-bold text-foreground">{d.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROFISSÕES (vitrine ilustrada) ── */}
      <TradeShowcase />

      {/* ── COMO FUNCIONA (toggle de persona) ── */}
      <ComoFunciona />

      {/* ── PLANOS ── */}
      <Planos />

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-3xl"
        />
        <div className="relative mx-auto max-w-[1600px]">
          <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">Depoimentos</span>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Quem já usou <em className="italic text-primary">aprovou</em>
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
              <figure key={d.nome} className="rounded-2xl border border-border bg-muted/40 p-7">
                <div className="text-sm text-primary">★★★★★</div>
                <blockquote className="mt-4 text-foreground">“{d.texto}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-lg">
                    {d.avatar}
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-foreground">{d.nome}</div>
                    <div className="text-xs text-muted-foreground">{d.info}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <Faq />

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-20 sm:px-10 sm:py-24 lg:px-14">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-brand p-1 text-center shadow-[var(--shadow-xl)]">
          <div className="rounded-[22px] bg-dark px-6 py-16 sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl font-black tracking-tight text-cream sm:text-5xl">
              Pronto para achar o profissional <em className="italic text-primary">certo?</em>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-cream/70">
              Crie sua conta em minutos. Profissional, contratante ou empresa — é o mesmo cadastro rápido.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/cadastro"
                className="rounded-xl bg-cream px-7 py-3.5 font-extrabold text-dark transition-colors hover:bg-white"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/entrar"
                className="rounded-xl border-2 border-white/20 px-6 py-3 font-bold text-cream transition-colors hover:bg-white/10"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
