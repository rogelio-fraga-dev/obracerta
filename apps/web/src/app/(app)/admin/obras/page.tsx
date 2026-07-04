import { serverApi } from "@/lib/server-api";
import { Badge } from "@obracerta/ui";
import type { WorkOrder, User } from "@obracerta/shared";
import type { PaginatedResponse } from "@obracerta/shared";
import { BackLink } from "../../_shell/BackLink";
import { AdminObrasClient } from "./_components/AdminObrasClient";

export default async function AdminObrasPage() {
  const [obrasData, usersData] = await Promise.all([
    serverApi<PaginatedResponse<WorkOrder>>("GET", "/admin/work-orders?page=1&limit=100"),
    serverApi<PaginatedResponse<User>>("GET", "/admin/users?page=1&limit=100"),
  ]);

  const obras = obrasData.items;
  const userMap: Record<string, string> = {};
  for (const u of usersData.items) {
    userMap[u.id] = u.nomeCompleto;
  }

  return (
    <section aria-labelledby="admin-obras-heading" className="space-y-6">
      <BackLink href="/admin" label="Painel" />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-obras-heading" className="font-display text-3xl font-black text-foreground">
            Gestão de Obras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão global de todas as obras cadastradas na plataforma.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">{obras.length} obras totais</Badge>
      </header>

      <AdminObrasClient initialObras={obras} userMap={userMap} />
    </section>
  );
}
