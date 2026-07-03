"use client";

import { useState } from "react";
import { bff } from "@/lib/client";

/**
 * Coração de favoritar (otimista: muda na hora, desfaz se a chamada falhar).
 * Aparece na busca e na página de favoritos — padrão do segmento para "salvar
 * um profissional para depois".
 */
export function FavoriteButton({
  professionalId,
  initialFavorited,
}: {
  professionalId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !favorited;
    setFavorited(next); // otimista
    setBusy(true);
    try {
      await bff.post("/api/favorites", { professionalId, favoritar: next });
    } catch {
      setFavorited(!next); // rollback com feedback visual (volta o coração)
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      title={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition-all ${
        favorited
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-border bg-background text-muted-foreground hover:border-danger/30 hover:text-danger"
      }`}
    >
      {favorited ? "♥" : "♡"}
    </button>
  );
}
