"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@obracerta/shared";
import { Badge, Button, Card, Field } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { attachReviewPhotoAction } from "./review-foto-action";

/**
 * Avaliação dupla-cega de um pedido CONCLUIDO: a nota nasce **oculta** e só é
 * revelada quando ambos avaliam (ou a janela de 7 dias fecha). Sem GET de "já
 * avaliei?", então mostramos o agradecimento após enviar.
 */
export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoAviso, setFotoAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    setError(null);
    setFotoAviso(null);
    if (nota < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setLoading(true);
    try {
      const review = await bff.post<Review>("/api/reviews", {
        bookingId,
        nota,
        comentario: comentario.trim() || undefined,
      });
      // A foto do serviço é opcional: uma falha aqui não invalida a avaliação já criada.
      if (foto && review?.id) {
        try {
          const fd = new FormData();
          fd.append("file", foto);
          await attachReviewPhotoAction(review.id, fd);
        } catch {
          setFotoAviso("A avaliação foi enviada, mas a foto não pôde ser anexada.");
        }
      }
      setEnviado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a avaliação.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <Card className="space-y-2">
        <Badge tone="success">Avaliação enviada</Badge>
        <p className="text-sm text-muted-foreground">
          Sua nota fica oculta até a outra parte avaliar (avaliação dupla-cega). Assim ninguém é
          influenciado pela nota do outro.
        </p>
        {fotoAviso && (
          <p role="alert" className="text-sm font-medium text-warning">
            {fotoAviso}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-lg font-black text-foreground">Avaliar</h2>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Field label="Sua nota">
        <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nota === n}
              aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              onClick={() => setNota(n)}
              className={`text-3xl leading-none transition-colors ${
                n <= nota ? "text-primary" : "text-border hover:text-orange-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </Field>

      <Field label="Comentário" hint="Opcional">
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground outline-none focus-visible:border-primary"
        />
      </Field>

      <Field label="Foto do serviço concluído" hint="Opcional">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
      </Field>

      <Button className="w-full" onClick={enviar} disabled={loading}>
        {loading ? "Enviando…" : "Enviar avaliação"}
      </Button>
    </Card>
  );
}
