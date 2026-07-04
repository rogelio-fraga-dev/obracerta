"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchProfessionalsResult, SearchResult } from "@obracerta/shared";
import { Avatar, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";

/** Espera após a última tecla antes de buscar (evita uma chamada por caractere). */
const DEBOUNCE_MS = 350;

export interface SelectedProfessional {
  id: string;
  nome: string;
  especialidades: string[];
}

/**
 * Autocomplete de profissional: digite o nome → resultados da busca real →
 * seleção preenche o pedido. Substitui o antigo campo de ID cru.
 */
export function ProfessionalSearchField({
  selected,
  onSelect,
}: {
  selected: SelectedProfessional | null;
  onSelect: (p: SelectedProfessional | null) => void;
}) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = busca.trim();
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      bff
        .get<SearchProfessionalsResult>(
          `/api/search/professionals?q=${encodeURIComponent(q)}&limit=5`,
        )
        .then((r) => setResultados(r.items))
        .catch(() => setResultados([]))
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [busca]);

  if (selected) {
    return (
      <Field label="Profissional">
        <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/5 px-3.5 py-2.5">
          <Avatar nome={selected.nome} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">{selected.nome}</span>
            {selected.especialidades.length > 0 && (
              <span className="block truncate text-xs text-muted-foreground">
                {selected.especialidades.join(" · ")}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setBusca("");
            }}
            className="shrink-0 text-sm font-semibold text-muted-foreground hover:text-danger"
          >
            Trocar
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="Profissional" hint={searching ? "Buscando…" : "Digite o nome para buscar"}>
      <div className="relative">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex.: Joana, Marcos…"
          autoComplete="off"
        />
        {resultados.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-lg)]">
            {resultados.map((p) => (
              <li key={p.userId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ id: p.userId, nome: p.nome, especialidades: p.especialidades });
                    setResultados([]);
                    setBusca("");
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">{p.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.especialidades.join(" · ")}
                      {p.totalAvaliacoes > 0 ? ` · ★ ${p.mediaNota.toFixed(1)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {busca.trim().length >= 2 && !searching && resultados.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ninguém encontrado com esse nome — tente a{" "}
            <a href="/buscar" className="font-semibold text-primary hover:underline">
              busca completa
            </a>
            .
          </p>
        )}
      </div>
    </Field>
  );
}
