"use client";

import { useState, useTransition } from "react";
import { MAX_PORTFOLIO_PHOTOS, type PortfolioPhoto } from "@obracerta/shared";
import { Button, Field, Input } from "@obracerta/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deletePortfolioPhotoAction, uploadPortfolioPhotoAction } from "../portfolio-actions";

/**
 * Gerencia o portfólio do profissional: grade de fotos com remover + upload de
 * nova foto (com legenda opcional). A trava de plano e o limite estão na API.
 */
export function PortfolioManager({ fotos }: { fotos: PortfolioPhoto[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cheio = fotos.length >= MAX_PORTFOLIO_PHOTOS;

  function enviar() {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (legenda.trim()) fd.append("legenda", legenda.trim());
    startTransition(async () => {
      try {
        await uploadPortfolioPhotoAction(fd);
        setFile(null);
        setLegenda("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar a foto.");
      }
    });
  }

  function remover(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deletePortfolioPhotoAction(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover a foto.");
      } finally {
        setRemovendoId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f) => (
            <li key={f.id} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={f.url} alt={f.legenda ?? "Obra do portfólio"} className="aspect-square w-full object-cover" />
              {f.legenda && (
                <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-xs text-white">
                  {f.legenda}
                </span>
              )}
              <button
                type="button"
                onClick={() => setRemovendoId(f.id)}
                disabled={pending}
                aria-label="Remover foto"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-danger"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {cheio ? (
        <p className="text-sm text-muted-foreground">
          Você atingiu o máximo de {MAX_PORTFOLIO_PHOTOS} fotos. Remova uma para adicionar outra.
        </p>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <Field label="Foto da obra">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
            />
          </Field>
          <Field label="Legenda (opcional)">
            <Input
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Ex.: Reforma de cozinha em Pinheiros"
              maxLength={140}
            />
          </Field>
          <Button size="sm" onClick={enviar} disabled={!file || pending}>
            {pending ? "Enviando…" : "Adicionar foto"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={removendoId !== null}
        title="Remover esta foto?"
        description="Ela some do seu portfólio e do perfil público na hora."
        confirmLabel="Sim, remover"
        cancelLabel="Manter foto"
        loading={pending}
        onConfirm={() => removendoId && remover(removendoId)}
        onClose={() => setRemovendoId(null)}
      />
    </div>
  );
}
