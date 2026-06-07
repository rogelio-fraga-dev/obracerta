import Link from "next/link";
import type { BookingRequest } from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";

/**
 * Aba Pedidos (Fase 2), ciente de papel: o contratante vê os pedidos que fez (e
 * cria novos); o profissional vê os que recebeu. A lista vem do endpoint
 * já escopado por papel.
 */
export default async function PedidosPage() {
  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const pedidos = await serverApi<BookingRequest[]>("GET", endpoint);

  return (
    <section aria-labelledby="pedidos-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 id="pedidos-heading" className="font-display text-2xl font-black text-foreground">
          Pedidos
        </h1>
        {!isProfissional && (
          <Link href="/pedidos/novo">
            <Button size="sm">Novo pedido</Button>
          </Link>
        )}
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">
            {isProfissional
              ? "Nenhum pedido recebido ainda."
              : "Você ainda não fez pedidos. Comece por “Novo pedido”."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => {
            const ui = BOOKING_STATUS_UI[p.status];
            return (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="block">
                  <Card className="transition-colors hover:border-primary">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{p.especialidade}</div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDateTimeBR(p.dataServico)}
                        </p>
                      </div>
                      <Badge tone={ui.tone}>{ui.label}</Badge>
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
