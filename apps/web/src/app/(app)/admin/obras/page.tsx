import { serverApi } from "@/lib/server-api";
import { Badge, Card } from "@obracerta/ui";
import type { WorkOrder } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import Link from "next/link";

import { PaginationControls } from "../_components/PaginationControls";
import type { PaginatedResponse } from "@obracerta/shared";

export default async function AdminObrasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const data = await serverApi<PaginatedResponse<WorkOrder>>("GET", `/admin/work-orders?page=${page}&limit=20`);
  const obras = data.items;
  const meta = data.meta;

  return (
    <section aria-labelledby="admin-obras-heading" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-obras-heading" className="font-display text-3xl font-black text-foreground">
            Gestão de Obras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão global de todas as obras cadastradas na plataforma.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">{meta.total} obras totais</Badge>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Obra / Título</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Detalhes</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contratante (ID)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Status & Piso</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Criada em</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {obras.map((obra, i) => (
                <tr key={obra.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)} hover:bg-muted/30 transition-colors`}>
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
                    <Link href={`/admin/usuarios/${obra.contractorId}`} className="font-mono text-xs text-primary hover:underline">
                      {obra.contractorId.substring(0, 8)}...
                    </Link>
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
          {obras.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma obra encontrada.
            </div>
          )}
        </div>
        <PaginationControls 
          page={meta.page} 
          totalPages={meta.totalPages} 
          totalItems={meta.total} 
          baseUrl="/admin/obras" 
        />
      </Card>
    </section>
  );
}
