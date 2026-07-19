import Link from "next/link";
import { ApiEnvelopeError, type CompanyTeam } from "@obracerta/shared";
import { Button, Card } from "@obracerta/ui";
import { Lock } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";
import { EquipeClient } from "./_components/EquipeClient";

/**
 * Equipe da empresa (homologação 18/07 — evolução do modelo 1-admin): membros
 * com acesso à conta (agem pela empresa nas obras/relatórios) e o roster de
 * profissionais vinculados. Só o administrador (a conta EMPRESA) gerencia; a
 * trava real é a API (403 → cadeado aqui).
 */
export default async function EquipePage() {
  const hint = await getProfileHint();
  if (hint?.tipo !== "EMPRESA") {
    return (
      <section className="space-y-4">
        <BackLink href="/inicio" label="Início" />
        <Card>
          <p className="text-sm text-muted-foreground">
            A gestão de equipe é exclusiva de contas de empresa.
          </p>
        </Card>
      </section>
    );
  }

  let team: CompanyTeam | null = null;
  let bloqueado = false;
  try {
    team = await serverApi<CompanyTeam>("GET", "/company/me/team");
  } catch (e) {
    if (e instanceof ApiEnvelopeError && e.status === 403) bloqueado = true;
    else throw e;
  }

  return (
    <section aria-labelledby="equipe-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="equipe-heading" className="font-display text-3xl font-black text-foreground">
          Equipe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pessoas que acessam a conta e profissionais vinculados à sua empresa.
        </p>
      </div>

      {bloqueado || !team ? (
        <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
          <Lock aria-hidden className="mx-auto h-8 w-8 text-primary" />
          <h2 className="font-display text-lg font-black text-foreground">
            A gestão de equipe faz parte dos planos de empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            Assine um plano de acesso para adicionar pessoas da sua equipe e vincular os
            profissionais que trabalham com você.
          </p>
          <Button asChild className="mx-auto w-fit">
            <Link href="/cobrancas">Assinar em Cobranças</Link>
          </Button>
        </Card>
      ) : (
        <EquipeClient team={team} />
      )}
    </section>
  );
}
