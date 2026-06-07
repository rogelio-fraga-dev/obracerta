import { Card } from "@obracerta/ui";

/** Aba Obras — obras e lances sigilosos (placeholder; fluxo real na etapa 7.3). */
export default function ObrasPage() {
  return (
    <section aria-labelledby="obras-heading" className="space-y-4">
      <h1 id="obras-heading" className="font-display text-2xl font-black text-foreground">
        Obras
      </h1>
      <Card>
        <p className="text-muted-foreground">
          Obras abertas e seus lances aparecem aqui (busca & obras — etapa 7.3).
        </p>
      </Card>
    </section>
  );
}
