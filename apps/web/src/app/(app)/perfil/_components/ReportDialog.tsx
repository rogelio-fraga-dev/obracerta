"use client";

import { useState } from "react";
import type { ReportTarget } from "@obracerta/shared";
import { Badge, Button, Select } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { REPORT_REASONS } from "@/lib/moderation-ui";

/**
 * Denúncia de um conteúdo/perfil. Reutilizável: recebe a entidade alvo
 * (REVIEW/USER/PROFILE) e o id. A denúncia entra na fila de moderação (§13).
 */
export function ReportDialog({ entidade, entidadeId }: { entidade: ReportTarget; entidadeId: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(REPORT_REASONS[0]!.value);
  const [detalhe, setDetalhe] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function denunciar() {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/reports", {
        entidade,
        entidadeId,
        motivo,
        detalhe: detalhe.trim() || undefined,
      });
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível denunciar.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) return <Badge tone="neutral">Denúncia registrada</Badge>;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs font-semibold text-muted-foreground hover:text-danger"
      >
        Denunciar
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <Select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="text-sm">
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <textarea
        value={detalhe}
        onChange={(e) => setDetalhe(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Detalhe (opcional)"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary"
      />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setAberto(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button size="sm" onClick={denunciar} disabled={loading}>
          {loading ? "Enviando…" : "Enviar denúncia"}
        </Button>
      </div>
    </div>
  );
}
