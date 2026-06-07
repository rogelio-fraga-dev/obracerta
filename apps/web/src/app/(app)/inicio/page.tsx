import { Card } from "@obracerta/ui";

/** Aba Início — visão geral (placeholder; o conteúdo real vem nas etapas 7.2–7.5). */
export default function InicioPage() {
  return (
    <section aria-labelledby="inicio-heading" className="space-y-4">
      <h1 id="inicio-heading" className="font-display text-2xl font-black text-foreground">
        Início
      </h1>
      <Card>
        <p className="text-muted-foreground">
          Sua visão geral aparece aqui. Próximas etapas trazem agenda, pedidos e obras.
        </p>
      </Card>
    </section>
  );
}
