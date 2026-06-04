import { Button } from "@obracerta/ui";
import { config } from "@/lib/config";

/**
 * Landing (placeholder de Fase 0). O conteúdo real (hero/stats/dores/planos/FAQ)
 * vem na Fase 5, derivado de docs/mockups/landing_page.html.
 */
export default function HomePage() {
  return (
    <section aria-labelledby="hero-heading" className="px-6 py-section">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[3px] text-orange">
        Fundação · Fase 0
      </p>
      <h1
        id="hero-heading"
        className="max-w-3xl text-5xl font-black leading-none tracking-tight text-foreground"
      >
        A reputação que <em className="italic text-orange">retém</em> o profissional.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        {config.brand.name} conecta contratantes e profissionais da construção civil com reputação
        verificada e agenda em tempo real.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg">Quero contratar</Button>
        <Button variant="secondary" size="lg">
          Sou profissional
        </Button>
      </div>
    </section>
  );
}
