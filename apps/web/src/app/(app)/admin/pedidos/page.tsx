import { serverApi } from "@/lib/server-api";
import { Badge } from "@obracerta/ui";
import type { BookingRequest, User } from "@obracerta/shared";
import type { PaginatedResponse } from "@obracerta/shared";
import { AdminPedidosClient } from "./_components/AdminPedidosClient";

export default async function AdminPedidosPage() {
  const [bookingsData, usersData] = await Promise.all([
    serverApi<PaginatedResponse<BookingRequest>>("GET", "/admin/bookings?page=1&limit=100"),
    serverApi<PaginatedResponse<User>>("GET", "/admin/users?page=1&limit=100"),
  ]);

  const pedidos = bookingsData.items;
  const userMap: Record<string, string> = {};
  for (const u of usersData.items) {
    userMap[u.id] = u.nomeCompleto;
  }

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
        <Badge tone="neutral" className="w-fit">{pedidos.length} pedidos totais</Badge>
      </header>

      <AdminPedidosClient initialPedidos={pedidos} userMap={userMap} />
    </section>
  );
}
