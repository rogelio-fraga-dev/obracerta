import type { City } from "@obracerta/shared";
import { callApi } from "@/lib/server-api";
import { BackLink } from "../../_shell/BackLink";
import { NovaObraForm } from "./_components/NovaObraForm";

/** Abertura de obra — busca as cidades (público) e entrega ao formulário cliente. */
export default async function NovaObraPage() {
  const cities = await callApi<City[]>("GET", "/cities");

  return (
    <section aria-labelledby="nova-obra-heading" className="space-y-4">
      <BackLink href="/obras" label="Obras" />
      <h1 id="nova-obra-heading" className="font-display text-2xl font-black text-foreground">
        Nova obra
      </h1>
      <NovaObraForm cities={cities} />
    </section>
  );
}
