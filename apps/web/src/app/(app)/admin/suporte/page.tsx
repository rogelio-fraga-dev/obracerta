import type { AdminSupportTicket } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { BackLink } from "../../_shell/BackLink";
import { AdminSuporteClient } from "./_components/AdminSuporteClient";

/** Gestão de chamados de suporte (painel admin). */
export default async function AdminSuportePage() {
  const tickets = await serverApi<AdminSupportTicket[]>("GET", "/admin/support/tickets");
  const abertos = tickets.filter((t) => t.status === "ABERTO").length;

  return (
    <section aria-labelledby="suporte-heading" className="space-y-5">
      <BackLink href="/admin" label="Painel" />
      <div>
        <h1 id="suporte-heading" className="font-display text-2xl font-black text-foreground">
          Suporte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {abertos > 0
            ? `${abertos} chamado(s) aguardando resposta.`
            : "Nenhum chamado aguardando resposta."}
        </p>
      </div>
      <AdminSuporteClient tickets={tickets} />
    </section>
  );
}
