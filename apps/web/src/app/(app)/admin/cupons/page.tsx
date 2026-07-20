import { ApiEnvelopeError, type Coupon } from "@obracerta/shared";
import { Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { BackLink } from "../../_shell/BackLink";
import { CuponsAdminClient } from "./_components/CuponsAdminClient";

export const dynamic = "force-dynamic";

/** Catálogo de cupons/promoções (admin): cria e ativa/desativa cupons. */
export default async function AdminCuponsPage() {
  let cupons: Coupon[];
  try {
    cupons = await serverApi<Coupon[]>("GET", "/admin/cupons");
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Cupons</h1>
          <Card>
            <p className="text-muted-foreground">Área restrita a administradores.</p>
          </Card>
        </section>
      );
    }
    throw e;
  }

  return (
    <section aria-labelledby="admin-cupons-heading" className="space-y-6">
      <BackLink href="/admin" label="Painel" />
      <div>
        <h1 id="admin-cupons-heading" className="font-display text-3xl font-black text-foreground">
          Cupons e promoções
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie cupons de desconto (percentual, valor fixo ou dias grátis) para campanhas. Os cupons
          de indicação são gerados automaticamente.
        </p>
      </div>

      <CuponsAdminClient cuponsIniciais={cupons} />
    </section>
  );
}
