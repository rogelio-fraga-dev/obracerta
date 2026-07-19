"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyInvite } from "@obracerta/shared";
import { Button, Card } from "@obracerta/ui";
import { Building2 } from "lucide-react";
import { bff } from "@/lib/client";

/**
 * Convites de empresa que o profissional recebeu (opt-in do diretório público).
 * Confirmar faz ele aparecer no perfil público da empresa; recusar remove o
 * vínculo. Só aparece quando há convites pendentes.
 */
export function CompanyInvites({ invites }: { invites: CompanyInvite[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function agir(id: string, acao: "confirm" | "reject") {
    setError(null);
    setLoadingId(id);
    try {
      await bff.post("/api/company/invites", { id, acao });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 aria-hidden className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-black text-foreground">Convites de empresa</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Estas empresas querem listar você na equipe pública delas. Confirmar te torna visível no
        perfil público da empresa (as pessoas te encontram por lá também).
      </p>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {invites.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
          >
            <span className="font-bold text-foreground">{inv.empresaNome}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => agir(inv.id, "confirm")} disabled={loadingId === inv.id}>
                {loadingId === inv.id ? "…" : "Confirmar"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => agir(inv.id, "reject")}
                disabled={loadingId === inv.id}
              >
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
