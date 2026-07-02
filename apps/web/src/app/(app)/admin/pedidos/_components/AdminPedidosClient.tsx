"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@obracerta/ui";
import type { BookingRequest } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface AdminPedidosClientProps {
  initialPedidos: BookingRequest[];
  userMap: Record<string, string>;
}

export function AdminPedidosClient({ initialPedidos, userMap }: AdminPedidosClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filteredPedidos = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return initialPedidos;
    return initialPedidos.filter((p) => {
      const contractorName = userMap[p.contractorId]?.toLowerCase() ?? "";
      const professionalName = userMap[p.professionalId]?.toLowerCase() ?? "";
      return (
        p.especialidade.toLowerCase().includes(term) ||
        (p.descricao && p.descricao.toLowerCase().includes(term)) ||
        contractorName.includes(term) ||
        professionalName.includes(term)
      );
    });
  }, [search, initialPedidos, userMap]);

  const totalItems = filteredPedidos.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Reset page if search filter changes the list length
  const currentPage = Math.min(page, totalPages);

  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredPedidos.slice(start, start + limit);
  }, [filteredPedidos, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Procurar por especialidade, contratante, profissional..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset page on search
          }}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
            {paginatedPedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/pedidos/${pedido.id}`} className="hover:opacity-80 transition-opacity block">
                      <p className="font-bold text-foreground text-primary hover:underline">{pedido.especialidade}</p>
                      <p className="text-xs text-muted-foreground font-mono">{pedido.id.substring(0, 8)}...</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-xs text-muted-foreground">
                    {pedido.descricao}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground space-y-2">
                    <div>
                      <span className="font-semibold text-foreground">C: </span>
                      <Link href={`/admin/usuarios/${pedido.contractorId}`} className="text-primary hover:underline font-medium">
                        {userMap[pedido.contractorId] ?? "Desconhecido"}
                      </Link>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">P: </span>
                      <Link href={`/admin/usuarios/${pedido.professionalId}`} className="text-primary hover:underline font-medium">
                        {userMap[pedido.professionalId] ?? "Desconhecido"}
                      </Link>
                    </div>
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
          {paginatedPedidos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {paginatedPedidos.map((pedido) => (
            <div key={pedido.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/pedidos/${pedido.id}`} className="hover:opacity-80 transition-opacity block flex-1">
                  <p className="font-bold text-foreground text-primary hover:underline">{pedido.especialidade}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{pedido.id.substring(0, 8)}...</p>
                </Link>
                <Badge
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
              </div>

              {pedido.descricao && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  &ldquo;{pedido.descricao}&rdquo;
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-b border-border/50 py-2.5 my-2">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-foreground">Contratante:</span>{" "}
                    {userMap[pedido.contractorId] ?? "Desconhecido"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Profissional:</span>{" "}
                    {userMap[pedido.professionalId] ?? "Desconhecido"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-foreground">Agendado:</span>{" "}
                    {formatDateTimeBR(pedido.dataServico)}
                  </p>
                  {pedido.motivoRecusa && (
                    <p className="text-[10px] text-danger font-medium">
                      Motivo Recusa: {pedido.motivoRecusa}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  Criado em: {formatDateTimeBR(pedido.criadoEm)}
                </span>
                <Link href={`/admin/pedidos/${pedido.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide shrink-0 ml-2">
                  Ver Pedido
                </Link>
              </div>
            </div>
          ))}
          {paginatedPedidos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{paginatedPedidos.length}</span> de <span className="font-bold text-foreground">{totalItems}</span> pedidos
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-sm text-muted-foreground px-2">
                Página <span className="font-semibold text-foreground">{currentPage}</span> de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
