import { type BookingListItem, isBookingContactReleased } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { AcceptedServicesList } from "@/components/AcceptedServicesList";
import { BackLink } from "../_shell/BackLink";

/**
 * Aba Orçamentos (contratante/empresa): reúne os **serviços aceitos** (aprovados,
 * em andamento ou concluídos) e oferece o atalho para gerar o resumo/orçamento
 * imprimível de cada um. O profissional acessa o mesmo conteúdo dentro de
 * "Orçamentos e recibos" (/ferramentas), junto do gerador de documentos.
 */
export default async function OrcamentosPage() {
  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const todos = await serverApi<BookingListItem[]>("GET", endpoint);
  const aceitos = todos.filter((p) => isBookingContactReleased(p.status));

  return (
    <section aria-labelledby="orcamentos-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="orcamentos-heading" className="font-display text-2xl font-black text-foreground sm:text-3xl">
          Orçamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Serviços aceitos e concluídos — gere o resumo/orçamento de cada um para imprimir ou enviar.
        </p>
      </div>

      <AcceptedServicesList services={aceitos} isProfissional={isProfissional} />
    </section>
  );
}
