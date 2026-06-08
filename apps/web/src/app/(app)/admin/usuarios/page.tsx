import { serverApi } from "@/lib/server-api";
import { Badge, Card, Avatar } from "@obracerta/ui";
import type { User } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import Link from "next/link";

import { PaginationControls } from "../_components/PaginationControls";
import type { PaginatedResponse } from "@obracerta/shared";

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const data = await serverApi<PaginatedResponse<User>>("GET", `/admin/users?page=${page}&limit=20`);
  const users = data.items;
  const meta = data.meta;

  return (
    <section aria-labelledby="admin-usuarios-heading" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-usuarios-heading" className="font-display text-3xl font-black text-foreground">
            Gestão de Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista completa de contratantes, profissionais e administradores.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">{meta.total} usuários totais</Badge>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
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
              {users.map((u, i) => (
                <tr key={u.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)} hover:bg-muted/30 transition-colors`}>
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
          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
        <PaginationControls 
          page={meta.page} 
          totalPages={meta.totalPages} 
          totalItems={meta.total} 
          baseUrl="/admin/usuarios" 
        />
      </Card>
    </section>
  );
}
