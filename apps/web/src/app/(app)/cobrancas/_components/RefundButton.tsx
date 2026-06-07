"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { REFUND_REASONS } from "@/lib/billing-ui";

/**
 * Solicita reembolso de uma fatura paga (CDC §21). O valor (integral/proporcional)
 * é calculado no backend conforme o motivo e a janela; um financeiro resolve depois.
 */
export function RefundButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(REFUND_REASONS[0]!.value);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function solicitar() {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/refunds", { invoiceId, motivo });
      setEnviado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível solicitar o reembolso.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) return <Badge tone="warning">Reembolso solicitado</Badge>;

  if (!aberto) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setAberto(true)}>
        Solicitar reembolso
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <select
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        {REFUND_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setAberto(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button size="sm" onClick={solicitar} disabled={loading}>
          {loading ? "Enviando…" : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
