"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { professionCatalog } from "@obracerta/shared";
import { Button, Field, Input, Select } from "@obracerta/ui";

/**
 * Filtros da busca com **URL como estado**: cada busca empurra os parâmetros para
 * a query string (`?q=&especialidade=&lat=&lng=`), tornando o resultado
 * compartilhável e navegável (voltar/avançar). O "perto de mim" usa a geolocation.
 */
export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [especialidade, setEspecialidade] = useState(params.get("especialidade") ?? "");
  const [notaMin, setNotaMin] = useState(params.get("notaMin") ?? "");
  const [ordem, setOrdem] = useState(params.get("ordem") ?? "relevancia");
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(
    params.get("lat") && params.get("lng")
      ? { lat: params.get("lat")!, lng: params.get("lng")! }
      : null,
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function aplicar() {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (especialidade.trim()) next.set("especialidade", especialidade.trim());
    if (notaMin) next.set("notaMin", notaMin);
    if (ordem && ordem !== "relevancia") next.set("ordem", ordem);
    if (coords) {
      next.set("lat", coords.lat);
      next.set("lng", coords.lng);
    }
    router.push(`/buscar?${next.toString()}`);
  }

  function usarLocalizacao() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocalização indisponível neste navegador.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setGeoLoading(false);
      },
      () => {
        setGeoError("Não foi possível obter sua localização.");
        setGeoLoading(false);
      },
    );
  }

  return (
    <div className="space-y-3">
      <Field label="O que você procura?">
        <Input
          placeholder="Ex.: pintor, eletricista…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicar()}
        />
      </Field>
      <Field label="Profissão" hint="Opcional">
        <Select value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
          <option value="">Todas as profissões</option>
          {professionCatalog.map((p) => (
            <option key={p.id} value={p.label}>
              {p.icon} {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nota mínima" hint="Opcional">
          <Select value={notaMin} onChange={(e) => setNotaMin(e.target.value)}>
            <option value="">Qualquer nota</option>
            <option value="4.5">★ 4,5+</option>
            <option value="4">★ 4,0+</option>
            <option value="3">★ 3,0+</option>
          </Select>
        </Field>
        <Field label="Ordenar por">
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="relevancia">Relevância</option>
            <option value="nota">Melhor nota</option>
            <option value="distancia">Mais perto</option>
          </Select>
        </Field>
      </div>

      {geoError && (
        <p role="alert" className="text-xs text-danger">
          {geoError}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={usarLocalizacao} disabled={geoLoading}>
          {geoLoading ? "Localizando…" : coords ? "📍 Perto de mim ✓" : "📍 Perto de mim"}
        </Button>
        <Button size="sm" className="flex-1" onClick={aplicar}>
          Buscar
        </Button>
      </div>
    </div>
  );
}
