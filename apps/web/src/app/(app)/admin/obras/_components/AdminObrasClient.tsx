"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@obracerta/ui";
import type { WorkOrder } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface AdminObrasClientProps {
  initialObras: WorkOrder[];
  userMap: Record<string, string>;
}

export function AdminObrasClient({ initialObras, userMap }: AdminObrasClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filteredObras = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return initialObras;
    return initialObras.filter((o) => {
      const contractorName = userMap[o.contractorId]?.toLowerCase() ?? "";
      return (
        o.titulo.toLowerCase().includes(term) ||
        o.especialidade.toLowerCase().includes(term) ||
        (o.bairro && o.bairro.toLowerCase().includes(term)) ||
        contractorName.includes(term)
      );
    });
  }, [search, initialObras, userMap]);

  const totalItems = filteredObras.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Reset page if search filter changes the list length
  const currentPage = Math.min(page, totalPages);

  const paginatedObras = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredObras.slice(start, start + limit);
  }, [filteredObras, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Procurar por título, especialidade, contratante..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset page on search
          }}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
        />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Obra / Título</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Detalhes</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contratante</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status & Piso</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Criada em</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
            {paginatedObras.map((obra) => (
                <tr key={obra.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/obras/${obra.id}`} className="hover:opacity-80 transition-opacity block">
                      <p className="font-bold text-foreground text-primary hover:underline">{obra.titulo}</p>
                      <p className="text-xs text-muted-foreground font-mono">{obra.id.substring(0, 8)}...</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <Badge tone="neutral" className="block w-fit mb-1">{obra.especialidade}</Badge>
                    {obra.urgencia && <Badge tone="warning" className="block w-fit mb-1">Urgência: {obra.urgencia}</Badge>}
                    {obra.bairro && <p className="text-xs text-muted-foreground">{obra.bairro}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/usuarios/${obra.contractorId}`} className="text-primary hover:underline font-medium text-sm block">
                      {userMap[obra.contractorId] ?? "Usuário Desconhecido"}
                    </Link>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {obra.contractorId.substring(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <Badge tone={obra.status === "ABERTA" ? "primary" : obra.status === "ADJUDICADA" ? "success" : "neutral"} className="block w-fit">
                      {obra.status}
                    </Badge>
                    {obra.pisoCentavos != null && (
                      <p className="text-xs font-bold text-foreground">
                        Piso: R$ {(obra.pisoCentavos / 100).toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs space-y-1">
                    <p>Criada: {formatDateTimeBR(obra.criadoEm)}</p>
                    <p>Expira: {formatDateTimeBR(obra.expiraEm)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/obras/${obra.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedObras.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma obra encontrada.
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {paginatedObras.map((obra) => (
            <div key={obra.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/obras/${obra.id}`} className="hover:opacity-80 transition-opacity block flex-1">
                  <p className="font-bold text-foreground text-primary hover:underline">{obra.titulo}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{obra.id.substring(0, 8)}...</p>
                </Link>
                <Badge tone={obra.status === "ABERTA" ? "primary" : obra.status === "ADJUDICADA" ? "success" : "neutral"}>
                  {obra.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-b border-border/50 py-2.5 my-2">
                <div className="space-y-1">
                  <p><span className="font-semibold text-foreground">Especialidade:</span> {obra.especialidade}</p>
                  {obra.bairro && <p><span className="font-semibold text-foreground">Bairro:</span> {obra.bairro}</p>}
                </div>
                <div className="space-y-1">
                  <p><span className="font-semibold text-foreground">Urgência:</span> {obra.urgencia}</p>
                  {obra.pisoCentavos != null && (
                    <p className="font-bold text-foreground">
                      Piso: R$ {(obra.pisoCentavos / 100).toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Contratante: {userMap[obra.contractorId] ?? "Desconhecido"}
                  </span>
                  <span className="text-[9px] text-muted-foreground/70 block">
                    Criada em: {formatDateTimeBR(obra.criadoEm)}
                  </span>
                </div>
                <Link href={`/admin/obras/${obra.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide shrink-0 ml-2">
                  Ver Obra
                </Link>
              </div>
            </div>
          ))}
          {paginatedObras.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma obra encontrada.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{paginatedObras.length}</span> de <span className="font-bold text-foreground">{totalItems}</span> obras
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
