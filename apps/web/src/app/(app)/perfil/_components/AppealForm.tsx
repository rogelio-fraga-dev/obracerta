"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@obracerta/ui";
import { bff } from "@/lib/client";

/**
 * Apelação de uma suspensão ativa. O texto (mín. 10 caracteres) vai para o
 * julgamento do moderador (§13); o status passa a "Em apelação".
 */
export function AppealForm({ suspensionId }: { suspensionId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function apelar() {
    setError(null);
    if (texto.trim().length < 10) {
      setError("A apelação precisa de ao menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await bff.post("/api/suspensions/appeal", { suspensionId, texto: texto.trim() });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível apelar.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Explique por que a suspensão deve ser revista…"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary"
      />
      <Button size="sm" onClick={apelar} disabled={loading}>
        {loading ? "Enviando…" : "Apelar"}
      </Button>
    </div>
  );
}
