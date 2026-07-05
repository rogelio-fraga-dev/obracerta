"use client";

import { useState, useTransition } from "react";
import { MAX_PORTFOLIO_PHOTOS, type PortfolioPhoto } from "@obracerta/shared";
import { Button, ConfirmDialog, Field, Input } from "@obracerta/ui";
import {
  deletePortfolioPhotoAction,
  updatePortfolioLegendaAction,
  uploadPortfolioPhotoAction,
} from "../portfolio-actions";

/**
 * Gerencia o portfólio do profissional: grade de fotos com remover + upload de
 * nova foto (com legenda opcional). A trava de plano e o limite estão na API.
 */
export function PortfolioManager({ fotos }: { fotos: PortfolioPhoto[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [legendaEdit, setLegendaEdit] = useState("");
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

  function salvarLegenda(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updatePortfolioLegendaAction(id, legendaEdit.trim() || null);
        setEditandoId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao editar a legenda.");
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {fotos.map((f) => (
            <li key={f.id} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={f.url} alt={f.legenda ?? "Obra do portfólio"} className="aspect-square w-full object-cover" />
              {editandoId === f.id ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/70 p-1.5">
                  <input
                    value={legendaEdit}
                    onChange={(e) => setLegendaEdit(e.target.value)}
                    maxLength={140}
                    autoFocus
                    placeholder="Legenda da obra"
                    className="min-w-0 flex-1 rounded bg-white/95 px-2 py-1 text-xs text-black"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") salvarLegenda(f.id);
                      if (e.key === "Escape") setEditandoId(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => salvarLegenda(f.id)}
                    disabled={pending}
                    aria-label="Salvar legenda"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-success text-xs font-bold text-white"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                f.legenda && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-xs text-white">
                    {f.legenda}
                  </span>
                )
              )}
              <div className="absolute right-1.5 top-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(f.id);
                    setLegendaEdit(f.legenda ?? "");
                  }}
                  disabled={pending}
                  aria-label="Editar legenda"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-primary"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => setRemovendoId(f.id)}
                  disabled={pending}
                  aria-label="Remover foto"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-danger"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cheio ? (
        <p className="text-sm text-muted-foreground">
          Você atingiu o máximo de {MAX_PORTFOLIO_PHOTOS} fotos. Remova uma para adicionar outra.
        </p>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-2.5 sm:p-3">
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
