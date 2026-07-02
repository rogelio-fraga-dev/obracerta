import Link from "next/link";
import type { BookingRequest } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { PedidosIcon } from "../_shell/icons";

/**
 * Aba Pedidos (Fase 2), ciente de papel: o contratante vê os pedidos que fez (e
 * cria novos); o profissional vê os que recebeu.
 */
export default async function PedidosPage() {
  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const pedidos = await serverApi<BookingRequest[]>("GET", endpoint);

  return (
    <section aria-labelledby="pedidos-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 id="pedidos-heading" className="font-display text-3xl font-black text-foreground">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProfissional
              ? "Pedidos de serviço recebidos de contratantes."
              : "Seus agendamentos e solicitações de serviço."}
          </p>
        </div>
        {!isProfissional && (
          <Link href="/pedidos/novo" className="w-fit">
            <Button size="sm" className="w-full sm:w-auto">+ Novo pedido</Button>
          </Link>
        )}
      </div>

      {pedidos.length === 0 ? (
        <EmptyState
          icon={<PedidosIcon className="h-8 w-8" />}
          title={isProfissional ? "Nenhum pedido recebido" : "Nenhum pedido feito"}
          description={
            isProfissional
              ? "Quando contratantes solicitarem seus serviços, os pedidos aparecem aqui."
              : "Busque um profissional e faça seu primeiro pedido de serviço."
          }
          action={
            !isProfissional && (
              <Link href="/buscar">
                <Button size="sm">Buscar profissional</Button>
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p, i) => {
            const ui = BOOKING_STATUS_UI[p.status];
            return (
              <li key={p.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)}`}>
                <Link href={`/pedidos/${p.id}`} className="block">
                  <Card interactive>
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <PedidosIcon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-foreground">{p.especialidade}</span>
                          <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDateTimeBR(p.dataServico)}
                          {p.descricao && ` · ${p.descricao.substring(0, 50)}${p.descricao.length > 50 ? "…" : ""}`}
                        </p>
                      </div>
                      <span aria-hidden className="text-lg text-muted-foreground">→</span>
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
