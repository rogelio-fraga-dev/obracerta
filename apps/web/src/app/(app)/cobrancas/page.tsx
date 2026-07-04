import { type Invoice, type Refund } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";
import { CobrancasClient } from "./_components/CobrancasClient";

interface EntitlementsView {
  plano: string | null;
  features: string[];
}

export default async function CobrancasPage() {
  const [invoices, refunds, ent, hint] = await Promise.all([
    serverApi<Invoice[]>("GET", "/invoices/me"),
    serverApi<Refund[]>("GET", "/refunds/me"),
    serverApi<EntitlementsView>("GET", "/me/entitlements"),
    getProfileHint(),
  ]);

  return (
    <section aria-labelledby="cobrancas-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <h1 id="cobrancas-heading" className="font-display text-2xl font-black text-foreground">
        Cobranças
      </h1>

      <CobrancasClient
        invoices={invoices}
        refunds={refunds}
        plano={ent.plano}
        features={ent.features}
        tipo={hint?.tipo}
      />
    </section>
  );
}
