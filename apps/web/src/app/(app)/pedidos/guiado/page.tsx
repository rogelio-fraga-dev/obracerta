import type { Address, City } from "@obracerta/shared";
import { callApi, serverApi } from "@/lib/server-api";
import { BackLink } from "../../_shell/BackLink";
import { GuidedRequestWizard } from "./_components/GuidedRequestWizard";

/**
 * Pedido guiado (concierge): o contratante escolhe a profissão → o sub-serviço →
 * descreve a necessidade → e o sistema apresenta os melhores profissionais
 * (match) com a opção de chamar direto ou publicar a obra para lances.
 */
export default async function PedidoGuiadoPage() {
  const [cities, enderecos] = await Promise.all([
    callApi<City[]>("GET", "/cities"),
    serverApi<Address[]>("GET", "/addresses/me").catch(() => [] as Address[]),
  ]);

  return (
    <section aria-labelledby="guiado-heading" className="space-y-4">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="guiado-heading" className="font-display text-2xl font-black text-foreground">
          Pedido guiado
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Responda 3 passos e a gente encontra os profissionais certos para você.
        </p>
      </div>
      <GuidedRequestWizard cities={cities} enderecos={enderecos} />
    </section>
  );
}
