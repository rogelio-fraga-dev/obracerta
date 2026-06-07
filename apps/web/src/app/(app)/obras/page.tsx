import Link from "next/link";
import { formatCentavos, type WorkOrdersPage } from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";

/**
 * Aba Obras (Fase 5): descoberta de obras abertas (FOMO). O profissional acha
 * obras para dar lance; o contratante vê as abertas e pode publicar uma nova.
 */
export default async function ObrasPage() {
  const hint = await getProfileHint();
  const isContratante = hint?.tipo === "CONTRATANTE";
  const { items } = await serverApi<WorkOrdersPage>("GET", "/work-orders");

  return (
    <section aria-labelledby="obras-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 id="obras-heading" className="font-display text-2xl font-black text-foreground">
          Obras
        </h1>
        {isContratante && (
          <Link href="/obras/nova">
            <Button size="sm">Nova obra</Button>
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">
            {isContratante
              ? "Nenhuma obra aberta. Publique a primeira em “Nova obra”."
              : "Nenhuma obra aberta no momento. Volte em breve."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => {
            const status = WORK_ORDER_STATUS_UI[o.status];
            const urg = WORK_URGENCY_UI[o.urgencia];
            return (
              <li key={o.id}>
                <Link href={`/obras/${o.id}`} className="block">
                  <Card className="space-y-2 transition-colors hover:border-primary">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{o.titulo}</div>
                        <p className="text-sm text-muted-foreground">
                          {o.especialidade}
                          {o.bairro ? ` · ${o.bairro}` : ""}
                        </p>
                      </div>
                      <Badge tone={urg.tone}>{urg.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {o.pisoCentavos !== null && (
                        <span className="text-xs text-muted-foreground">
                          Piso {formatCentavos(o.pisoCentavos)}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
