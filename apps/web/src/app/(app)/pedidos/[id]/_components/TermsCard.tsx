"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type TermsAcceptance, TERMO_VERSAO_ATUAL, type UserType } from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { formatDateTimeBR } from "@/lib/format";

const PAPEL_LABEL: Record<UserType, string> = {
  PROFISSIONAL: "Profissional",
  CONTRATANTE: "Contratante",
};

/**
 * Termos de ciência bilaterais (§7.4): mostra quem já aceitou (append-only) e
 * permite o usuário atual aceitar a versão corrente. O aceite é prova jurídica.
 */
export function TermsCard({
  bookingId,
  tipo,
  acceptances,
}: {
  bookingId: string;
  tipo: UserType;
  acceptances: TermsAcceptance[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const jaAceitei = acceptances.some((a) => a.papel === tipo);

  async function aceitar() {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/terms", { bookingId, termoVersao: TERMO_VERSAO_ATUAL });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar o aceite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-black text-foreground">Termos de ciência</h2>
      <p className="text-sm text-muted-foreground">
        Ambas as partes registram ciência das regras (sem intermediação de pagamento). O aceite é
        permanente e serve de comprovação.
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <ul className="space-y-1.5 text-sm">
        {(["CONTRATANTE", "PROFISSIONAL"] as UserType[]).map((papel) => {
          const aceite = acceptances.find((a) => a.papel === papel);
          return (
            <li key={papel} className="flex items-center justify-between gap-3">
              <span className="text-foreground">{PAPEL_LABEL[papel]}</span>
              {aceite ? (
                <Badge tone="success">Aceito em {formatDateTimeBR(aceite.aceitoEm)}</Badge>
              ) : (
                <Badge tone="neutral">Pendente</Badge>
              )}
            </li>
          );
        })}
      </ul>

      {!jaAceitei && (
        <Button className="w-full" onClick={aceitar} disabled={loading}>
          {loading ? "Registrando…" : `Aceitar termos (v${TERMO_VERSAO_ATUAL})`}
        </Button>
      )}
    </Card>
  );
}
