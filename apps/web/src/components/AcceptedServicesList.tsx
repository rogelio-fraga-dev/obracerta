import Link from "next/link";
import { FileText } from "lucide-react";
import type { BookingListItem } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";

/**
 * Lista de **serviços aceitos** (aprovados/em andamento/concluídos) com o atalho
 * para gerar o resumo/orçamento imprimível de cada um. Compartilhada entre a aba
 * Orçamentos (contratante/empresa) e Orçamentos e recibos (profissional).
 */
export function AcceptedServicesList({
  services,
  isProfissional,
}: {
  services: BookingListItem[];
  isProfissional: boolean;
}) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Nenhum serviço aceito ainda"
        description="Assim que um pedido for aprovado, ele aparece aqui para você gerar o resumo/orçamento do serviço."
        action={
          <Button asChild size="sm">
            <Link href="/pedidos">Ver pedidos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {services.map((p) => {
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
                <Button asChild size="sm">
                  <Link href={`/pedidos/${p.id}/resumo`}>Gerar orçamento/resumo</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/pedidos/${p.id}`}>Ver pedido</Link>
                </Button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
