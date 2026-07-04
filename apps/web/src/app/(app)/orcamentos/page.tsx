import Link from "next/link";
import { type BookingListItem, isBookingContactReleased } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../_shell/BackLink";

/**
 * Aba Orçamentos: reúne os **serviços aceitos** (aprovados, em andamento ou
 * concluídos) e oferece o atalho para **gerar o resumo/orçamento** de cada um —
 * o documento imprimível já existente por pedido. Ciente de papel: contratante vê
 * os serviços que contratou; profissional, os que prestou.
 */
export default async function OrcamentosPage() {
  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const todos = await serverApi<BookingListItem[]>("GET", endpoint);
  const aceitos = todos.filter((p) => isBookingContactReleased(p.status));

  return (
    <section aria-labelledby="orcamentos-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="orcamentos-heading" className="font-display text-2xl font-black text-foreground sm:text-3xl">
          Orçamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Serviços aceitos e concluídos — gere o resumo/orçamento de cada um para imprimir ou enviar.
        </p>
      </div>

      {aceitos.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Nenhum serviço aceito ainda"
          description="Assim que um pedido for aprovado, ele aparece aqui para você gerar o orçamento/resumo do serviço."
          action={
            <Link href="/pedidos">
              <Button size="sm">Ver pedidos</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {aceitos.map((p) => {
            const ui = BOOKING_STATUS_UI[p.status];
            return (
              <li key={p.id}>
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 truncate text-base font-bold text-foreground">
                        {p.especialidade}
                      </span>
                      <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                    </div>
                    {p.outraParteNome && (
                      <p className="mt-0.5 truncate text-sm font-semibold text-foreground/80">
                        {isProfissional ? "Cliente" : "Profissional"}: {p.outraParteNome}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDateTimeBR(p.dataServico)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/pedidos/${p.id}/resumo`}>
                      <Button size="sm">Gerar orçamento/resumo</Button>
                    </Link>
                    <Link href={`/pedidos/${p.id}`}>
                      <Button size="sm" variant="secondary">Ver pedido</Button>
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
