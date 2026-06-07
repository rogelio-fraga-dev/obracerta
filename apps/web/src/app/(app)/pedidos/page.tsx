import { Card } from "@obracerta/ui";

/** Aba Pedidos — agendamentos (placeholder; fluxo real na etapa 7.2). */
export default function PedidosPage() {
  return (
    <section aria-labelledby="pedidos-heading" className="space-y-4">
      <h1 id="pedidos-heading" className="font-display text-2xl font-black text-foreground">
        Pedidos
      </h1>
      <Card>
        <p className="text-muted-foreground">
          Seus agendamentos aparecem aqui (agenda & agendamento — etapa 7.2).
        </p>
      </Card>
    </section>
  );
}
