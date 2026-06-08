import { serverApi } from "@/lib/server-api";
import { Badge, Card } from "@obracerta/ui";
import type { BookingRequest } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import Link from "next/link";

import { PaginationControls } from "../_components/PaginationControls";
import type { PaginatedResponse } from "@obracerta/shared";

export default async function AdminPedidosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const data = await serverApi<PaginatedResponse<BookingRequest>>("GET", `/admin/bookings?page=${page}&limit=20`);
  const pedidos = data.items;
  const meta = data.meta;

  return (
    <section aria-labelledby="admin-pedidos-heading" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-pedidos-heading" className="font-display text-3xl font-black text-foreground">
            Gestão de Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão global de todos os pedidos de agendamento do sistema.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">{meta.total} pedidos totais</Badge>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Pedido / Esp.</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Descrição Curta</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contratante & Profissional</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Agendado / Criado</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidos.map((pedido, i) => (
                <tr key={pedido.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)} hover:bg-muted/30 transition-colors`}>
                  <td className="px-6 py-4">
                    <Link href={`/admin/pedidos/${pedido.id}`} className="hover:opacity-80 transition-opacity block">
                      <p className="font-bold text-foreground text-primary hover:underline">{pedido.especialidade}</p>
                      <p className="text-xs text-muted-foreground font-mono">{pedido.id.substring(0, 8)}...</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-xs text-muted-foreground">
                    {pedido.descricao}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground space-y-1">
                    <p>
                      C: <Link href={`/admin/usuarios/${pedido.contractorId}`} className="text-primary hover:underline">{pedido.contractorId.substring(0, 8)}...</Link>
                    </p>
                    <p>
                      P: <Link href={`/admin/usuarios/${pedido.professionalId}`} className="text-primary hover:underline">{pedido.professionalId.substring(0, 8)}...</Link>
                    </p>
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <Badge
                      className="block w-fit"
                      tone={
                        pedido.status === "PENDENTE"
                          ? "warning"
                          : pedido.status === "APROVADO" || pedido.status === "CONCLUIDO"
                            ? "success"
                            : pedido.status === "RECUSADO" || pedido.status === "CANCELADO" || pedido.status === "EXPIRADO"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {pedido.status}
                    </Badge>
                    {pedido.motivoRecusa && (
                      <p className="text-[10px] text-destructive truncate max-w-[120px]">
                        Recusado: {pedido.motivoRecusa}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    <p className="text-foreground font-medium">Agendado: {formatDateTimeBR(pedido.dataServico)}</p>
                    <p className="text-muted-foreground">Criado: {formatDateTimeBR(pedido.criadoEm)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/pedidos/${pedido.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>
        <PaginationControls 
          page={meta.page} 
          totalPages={meta.totalPages} 
          totalItems={meta.total} 
          baseUrl="/admin/pedidos" 
        />
      </Card>
    </section>
  );
}
