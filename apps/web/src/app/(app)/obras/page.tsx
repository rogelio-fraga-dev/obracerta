import Link from "next/link";
import { formatCentavos, type WorkOrdersPage } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { ObrasIcon } from "../_shell/icons";

/**
 * Aba Obras (Fase 5): descoberta de obras abertas (FOMO). O profissional acha
 * obras para dar lance; o contratante vê as abertas e pode publicar uma nova.
 */
export default async function ObrasPage() {
  const hint = await getProfileHint();
  const isContratante = hint?.tipo === "CONTRATANTE";
  const { items } = await serverApi<WorkOrdersPage>("GET", "/work-orders");

  return (
    <section aria-labelledby="obras-heading" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 id="obras-heading" className="font-display text-3xl font-black text-foreground">
            Obras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isContratante
              ? "Suas obras publicadas e os lances recebidos."
              : "Obras abertas — dê lances e conquiste novos clientes."}
          </p>
        </div>
        {isContratante && (
          <Link href="/obras/nova">
            <Button size="sm">+ Nova obra</Button>
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ObrasIcon className="h-8 w-8" />}
          title={isContratante ? "Nenhuma obra publicada" : "Nenhuma obra disponível"}
          description={
            isContratante
              ? "Publique uma obra para receber lances de profissionais verificados."
              : "Novas obras aparecem aqui conforme são publicadas. Volte em breve!"
          }
          action={
            isContratante && (
              <Link href="/obras/nova">
                <Button size="sm">Publicar obra</Button>
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((o, i) => {
            const status = WORK_ORDER_STATUS_UI[o.status];
            const urg = WORK_URGENCY_UI[o.urgencia];
            return (
              <li key={o.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)}`}>
                <Link href={`/obras/${o.id}`} className="block h-full">
                  <Card interactive className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-foreground">{o.titulo}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {o.especialidade}
                          {o.bairro ? ` · ${o.bairro}` : ""}
                        </p>
                      </div>
                      <Badge tone={urg.tone} size="sm">{urg.label}</Badge>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {o.pisoCentavos !== null && (
                        <span className="text-sm font-bold text-foreground">
                          A partir de {formatCentavos(o.pisoCentavos)}
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
