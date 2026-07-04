import type { Address, City } from "@obracerta/shared";
import { callApi, serverApi } from "@/lib/server-api";
import { BackLink } from "../../_shell/BackLink";
import { NovaObraForm } from "./_components/NovaObraForm";

/**
 * Abertura de obra — busca as cidades (público) e os endereços salvos do
 * usuário (atalho de pré-preenchimento) e entrega ao formulário cliente.
 */
export default async function NovaObraPage() {
  const [cities, enderecos] = await Promise.all([
    callApi<City[]>("GET", "/cities"),
    serverApi<Address[]>("GET", "/addresses/me").catch(() => [] as Address[]),
  ]);

  return (
    <section aria-labelledby="nova-obra-heading" className="space-y-4">
      <BackLink href="/obras" label="Obras" />
      <h1 id="nova-obra-heading" className="font-display text-2xl font-black text-foreground">
        Nova obra
      </h1>
      <NovaObraForm cities={cities} enderecos={enderecos} />
    </section>
  );
}
