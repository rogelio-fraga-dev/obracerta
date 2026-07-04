import { serverApi } from "@/lib/server-api";
import { Badge } from "@obracerta/ui";
import type { User } from "@obracerta/shared";
import type { PaginatedResponse } from "@obracerta/shared";
import { BackLink } from "../../_shell/BackLink";
import { AdminUsuariosClient } from "./_components/AdminUsuariosClient";

export default async function AdminUsuariosPage() {
  const data = await serverApi<PaginatedResponse<User>>("GET", "/admin/users?page=1&limit=100");
  const users = data.items;

  return (
    <section aria-labelledby="admin-usuarios-heading" className="space-y-6">
      <BackLink href="/admin" label="Painel" />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-usuarios-heading" className="font-display text-3xl font-black text-foreground">
            Gestão de Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista completa de contratantes, profissionais e administradores.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit">{users.length} usuários totais</Badge>
      </header>

      <AdminUsuariosClient initialUsers={users} />
    </section>
  );
}
