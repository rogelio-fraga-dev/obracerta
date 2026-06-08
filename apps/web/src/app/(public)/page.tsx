import Link from "next/link";
import { formatCentavos, professionalPlansOrdered } from "@obracerta/shared";
import { config } from "@/lib/config";
import { Card, Button } from "@obracerta/ui";

/** Landing pública (SSR). Hero + dores + como funciona + planos, com CTAs reais. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Dores />
      <ComoFunciona />
      <Planos />
      <CtaFinal />
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-5 py-20 sm:px-8 sm:py-28 overflow-hidden relative">
      {/* Elemento de fundo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl"
      />

      <div className="mx-auto max-w-4xl relative z-10 text-center">
        <p className="animate-fade-in-up mb-5 text-xs font-black uppercase tracking-[4px] text-primary">
          Construção civil · {config.brand.name}
        </p>
        <h1
          id="hero-heading"
          className="animate-fade-in-up delay-1 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-7xl"
        >
          O jeito certo de contratar quem <em className="italic text-primary" style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>faz a obra</em>.
        </h1>
        <p className="animate-fade-in-up delay-2 mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Reputação verificada, agenda em tempo real e avaliações honestas. Encontre o profissional
          certo — ou seja encontrado — sem depender de indicação.
        </p>
        <div className="animate-fade-in-up delay-3 mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/cadastro">
            <Button size="lg">Quero contratar</Button>
          </Link>
          <Link href="/cadastro">
            <Button size="lg" variant="secondary">Sou profissional</Button>
          </Link>
        </div>
        <p className="animate-fade-in-up delay-4 mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-primary transition-colors hover:text-orange-400">
            Entrar
          </Link>
        </p>

        <ul className="animate-fade-in-up delay-5 mt-16 flex flex-wrap justify-center gap-3">
          {["Reputação dupla-cega", "Agenda em tempo real", "Lances sigilosos", "Sem chat antes do aceite"].map(
            (f) => (
              <li
                key={f}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-sm"
              >
                {f}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}

const DORES = [
  {
    icon: "🎲",
    titulo: "Indicação é loteria",
    texto: "Sem histórico verificado, você só descobre que errou quando a parede já está torta.",
  },
  {
    icon: "📅",
    titulo: "Disponibilidade às cegas",
    texto: "Descobrir quem está livre exige ligar um por um, sem agenda pública visível.",
  },
  {
    icon: "💸",
    titulo: "Preço sem referência",
    texto: "Sem base de comparação, quem contrata sempre leva desvantagem na hora de fechar negócio.",
  },
];

function Dores() {
  return (
    <section aria-labelledby="dores-heading" className="border-t border-border bg-muted/30 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 id="dores-heading" className="text-3xl font-black text-foreground sm:text-4xl">
          As dores que a gente resolve
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
          {DORES.map((d, i) => (
            <Card key={d.titulo} interactive className={`animate-fade-in delay-${i + 1}`}>
              <div className="mb-4 text-4xl">{d.icon}</div>
              <h3 className="font-display text-xl font-black text-foreground">{d.titulo}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d.texto}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const PASSOS_CONTRATANTE = [
  "Busque por especialidade, cidade e avaliação — veja a agenda na hora.",
  "Escolha uma data livre e solicite o agendamento.",
  "O profissional aprova em até 24h e o contato é liberado.",
  "Confirme o início e avalie ao final. Sua nota ajuda a comunidade.",
];
const PASSOS_PROFISSIONAL = [
  "Crie seu perfil: adicione suas especialidades, bairro e monte sua agenda.",
  "Apareça nas buscas e comece a receber pedidos diretos.",
  "Aprove ou recuse (sua taxa de aceitação importa).",
  "Execute serviços e dê lances em obras abertas por contratantes.",
];

function ComoFunciona() {
  return (
    <section aria-labelledby="como-heading" className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 id="como-heading" className="text-center text-3xl font-black text-foreground sm:text-4xl">
          Como funciona
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-2">
          <Passos titulo="Para quem contrata" passos={PASSOS_CONTRATANTE} />
          <Passos titulo="Para profissionais" passos={PASSOS_PROFISSIONAL} />
        </div>
      </div>
    </section>
  );
}

function Passos({ titulo, passos }: { titulo: string; passos: string[] }) {
  return (
    <div className="animate-fade-in">
      <h3 className="font-display text-2xl font-black text-primary">{titulo}</h3>
      <ol className="mt-6 space-y-6">
        {passos.map((p, i) => (
          <li key={p} className="relative flex gap-4">
            {i !== passos.length - 1 && (
              <span className="absolute left-4 top-10 h-full w-px bg-border/80" aria-hidden />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-sm">
              {i + 1}
            </span>
            <span className="pt-1 text-base text-foreground leading-snug">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Planos() {
  return (
    <section aria-labelledby="planos-heading" className="border-t border-border bg-muted/30 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 id="planos-heading" className="text-3xl font-black text-foreground sm:text-4xl">
          Planos do profissional
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Comece grátis. Suba de plano quando quiser mais alcance e volume.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
          {professionalPlansOrdered.map((p, i) => (
            <div
              key={p.plano}
              className={`animate-fade-in delay-${i + 1} flex flex-col rounded-2xl border-2 bg-background p-8 transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-xl)] ${
                p.recomendado ? "border-primary shadow-[var(--shadow-lg)]" : "border-border shadow-[var(--shadow-sm)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-black text-foreground">{p.nome}</span>
                {p.recomendado && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="mt-4 text-4xl font-black text-primary">
                {p.precoCentavos === 0 ? "Grátis" : `${formatCentavos(p.precoCentavos)}`}
                {p.precoCentavos > 0 && <span className="text-base text-muted-foreground">/mês</span>}
              </div>
              <ul className="mt-8 flex-1 space-y-4">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm font-medium text-foreground">
                    <span aria-hidden className="mt-0.5 text-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="mt-8 w-full">
                <Button variant={p.recomendado ? "primary" : "secondary"} className="w-full">
                  Começar agora
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div
        className="animate-fade-in delay-2 mx-auto max-w-4xl rounded-3xl p-1 text-center shadow-[var(--shadow-xl)]"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="rounded-[22px] bg-dark px-6 py-16 text-cream sm:px-12 sm:py-20">
          <h2 className="font-display text-3xl font-black text-cream sm:text-5xl">
            Sua próxima obra começa aqui.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-cream/70">
            Crie sua conta em minutos. Profissional ou contratante, é o mesmo cadastro rápido.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/cadastro">
              <Button size="lg" className="bg-cream text-dark hover:bg-white hover:text-dark">
                Criar conta grátis
              </Button>
            </Link>
            <Link href="/entrar">
              <Button size="lg" variant="ghost" className="text-cream hover:bg-white/10 hover:text-white border-2 border-transparent">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
