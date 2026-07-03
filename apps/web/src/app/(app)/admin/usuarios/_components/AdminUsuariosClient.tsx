"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar, Badge } from "@obracerta/ui";
import type { User } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export function AdminUsuariosClient({ initialUsers }: { initialUsers: User[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return initialUsers;
    return initialUsers.filter((u) => 
      u.nomeCompleto.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      u.whatsapp.includes(term)
    );
  }, [search, initialUsers]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Reset page if search filter changes the list length
  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Procurar por nome, e-mail ou celular..."
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
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Usuário</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Tipo</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contato</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Cadastro em</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
            {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar nome={u.nomeCompleto} size="sm" />
                      <div>
                        <p className="font-bold text-foreground text-primary hover:underline">{u.nomeCompleto}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.id.substring(0, 8)}...</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {u.tipo === "PROFISSIONAL" ? (
                      <Badge tone="primary">Profissional</Badge>
                    ) : (
                      <Badge tone="neutral">Contratante</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <p className="text-foreground">{u.whatsapp}</p>
                    {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {u.status === "ATIVO" ? (
                      <Badge tone="success">Ativo</Badge>
                    ) : u.status === "SUSPENSO" ? (
                      <Badge tone="danger">Suspenso</Badge>
                    ) : (
                      <Badge tone="warning">{u.status}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDateTimeBR(u.criadoEm)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${u.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border">
          {paginatedUsers.map((u) => (
            <div key={u.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3">
                  <Avatar nome={u.nomeCompleto} size="sm" />
                  <div>
                    <p className="font-bold text-foreground text-primary hover:underline">{u.nomeCompleto}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.id.substring(0, 8)}...</p>
                  </div>
                </Link>
                {u.status === "ATIVO" ? (
                  <Badge tone="success" size="sm">Ativo</Badge>
                ) : u.status === "SUSPENSO" ? (
                  <Badge tone="danger" size="sm">Suspenso</Badge>
                ) : (
                  <Badge tone="warning" size="sm">{u.status}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Tipo: </span>
                  {u.tipo === "PROFISSIONAL" ? "Profissional" : "Contratante"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">WhatsApp: </span>
                  {u.whatsapp}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">
                  Cadastrado: {formatDateTimeBR(u.criadoEm)}
                </span>
                <Link href={`/admin/usuarios/${u.id}`} className="text-primary hover:underline text-xs font-bold uppercase tracking-wide">
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))}
          {paginatedUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{paginatedUsers.length}</span> de <span className="font-bold text-foreground">{totalItems}</span> usuários
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
