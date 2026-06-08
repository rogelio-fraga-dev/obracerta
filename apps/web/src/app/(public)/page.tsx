import Link from "next/link";
import { formatCentavos, professionalPlansOrdered } from "@obracerta/shared";
import { config } from "@/lib/config";

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

const CTA_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-extrabold text-primary-foreground transition-colors hover:bg-orange-400";
const CTA_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-md border-2 border-foreground px-6 py-3 font-extrabold text-foreground transition-colors hover:bg-foreground hover:text-background";

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[3px] text-primary">
          Construção civil · {config.brand.name}
        </p>
        <h1
          id="hero-heading"
          className="text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl"
        >
          O jeito certo de contratar quem <em className="italic text-primary">faz a obra</em>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Reputação verificada, agenda em tempo real e avaliações honestas. Encontre o profissional
          certo — ou seja encontrado — sem depender de indicação.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cadastro" className={CTA_PRIMARY}>
            Quero contratar
          </Link>
          <Link href="/cadastro" className={CTA_SECONDARY}>
            Sou profissional
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>

        <ul className="mt-10 flex flex-wrap gap-2">
          {["Reputação dupla-cega", "Agenda em tempo real", "Lances sigilosos", "Sem chat — contato após aprovação"].map(
            (f) => (
              <li
                key={f}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
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
    titulo: "Indicação não escala",
    texto: "Sem histórico verificado, você só descobre que errou quando o estrago já está feito.",
  },
  {
    titulo: "Disponibilidade às cegas",
    texto: "Descobrir quem está livre exige ligar um por um, sem agenda visível.",
  },
  {
    titulo: "Preço sem referência",
    texto: "Sem base de comparação, quem contrata sempre leva desvantagem na negociação.",
  },
];

function Dores() {
  return (
    <section aria-labelledby="dores-heading" className="border-t border-border bg-muted/40 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 id="dores-heading" className="max-w-2xl text-3xl font-black text-foreground">
          As dores que a gente resolve
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {DORES.map((d) => (
            <div key={d.titulo} className="rounded-lg border border-border bg-background p-5">
              <h3 className="font-display text-lg font-black text-foreground">{d.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PASSOS_CONTRATANTE = [
  "Busque por especialidade, cidade e avaliação — veja agenda e perfil.",
  "Escolha uma data livre e solicite o agendamento.",
  "O profissional aprova em até 24h; o contato é liberado.",
  "Confirme o início e, ao final, avalie.",
];
const PASSOS_PROFISSIONAL = [
  "Crie seu perfil: especialidades, bairro e agenda.",
  "Apareça nas buscas e receba pedidos.",
  "Aprove ou recuse — sua taxa de aceitação conta.",
  "Execute, seja avaliado e dê lances em obras abertas.",
];

function ComoFunciona() {
  return (
    <section aria-labelledby="como-heading" className="px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 id="como-heading" className="text-3xl font-black text-foreground">
          Como funciona
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <Passos titulo="Para quem contrata" passos={PASSOS_CONTRATANTE} />
          <Passos titulo="Para profissionais" passos={PASSOS_PROFISSIONAL} />
        </div>
      </div>
    </section>
  );
}

function Passos({ titulo, passos }: { titulo: string; passos: string[] }) {
  return (
    <div>
      <h3 className="font-display text-xl font-black text-primary">{titulo}</h3>
      <ol className="mt-4 space-y-3">
        {passos.map((p, i) => (
          <li key={p} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm text-foreground">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Planos() {
  return (
    <section aria-labelledby="planos-heading" className="border-t border-border bg-muted/40 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 id="planos-heading" className="text-3xl font-black text-foreground">
          Planos do profissional
        </h2>
        <p className="mt-2 text-muted-foreground">Comece grátis. Suba de plano quando quiser mais alcance.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {professionalPlansOrdered.map((p) => (
            <div
              key={p.plano}
              className={`flex flex-col rounded-lg border-2 bg-background p-5 ${
                p.recomendado ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-black text-foreground">{p.nome}</span>
                {p.recomendado && (
                  <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-bold text-success">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-black text-primary">
                {p.precoCentavos === 0 ? "Grátis" : `${formatCentavos(p.precoCentavos)}`}
                {p.precoCentavos > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
              </div>
              <ul className="mt-3 flex-1 space-y-1.5">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-sm text-foreground">
                    <span aria-hidden className="text-primary">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className={`${CTA_PRIMARY} mt-4 w-full`}>
                Começar
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
    <section className="px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-foreground px-6 py-12 text-center text-background">
        <h2 className="font-display text-3xl font-black text-background">Pronto para começar?</h2>
        <p className="mx-auto mt-3 max-w-md text-background/80">
          Crie sua conta em minutos. Profissional ou contratante, é o mesmo cadastro.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-extrabold text-primary-foreground transition-colors hover:bg-orange-400"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center rounded-md border-2 border-background/40 px-6 py-3 font-extrabold text-background transition-colors hover:bg-background/10"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}
