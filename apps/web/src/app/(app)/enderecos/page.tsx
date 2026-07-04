import type { Address } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { BackLink } from "../_shell/BackLink";
import { EnderecosClient } from "./_components/EnderecosClient";

/** Aba Endereços: endereços salvos do usuário (casa, obra, trabalho…). */
export default async function EnderecosPage() {
  const enderecos = await serverApi<Address[]>("GET", "/addresses/me");

  return (
    <section aria-labelledby="enderecos-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="enderecos-heading" className="font-display text-2xl font-black text-foreground">
          Endereços
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre os locais das suas obras e serviços. O principal agiliza novos pedidos.
        </p>
      </div>
      <EnderecosClient enderecos={enderecos} />
    </section>
  );
}
