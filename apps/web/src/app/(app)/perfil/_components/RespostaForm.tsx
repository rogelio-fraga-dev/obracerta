"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@obracerta/ui";
import { bff } from "@/lib/client";

/**
 * Direito de resposta a uma avaliação revelada (1x, até 30 dias). Sem GET de "já
 * respondi?", então some após enviar; reenvio é recusado pelo backend.
 */
export function RespostaForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function responder() {
    setError(null);
    if (texto.trim().length < 3) {
      setError("Escreva ao menos 3 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await bff.post("/api/reviews/respond", { reviewId, texto: texto.trim() });
      setEnviado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível responder.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) return <Badge tone="success">Resposta publicada</Badge>;

  if (!aberto) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setAberto(true)}>
        Responder
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Sua resposta pública…"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary"
      />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setAberto(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button size="sm" onClick={responder} disabled={loading}>
          {loading ? "Enviando…" : "Publicar resposta"}
        </Button>
      </div>
    </div>
  );
}
