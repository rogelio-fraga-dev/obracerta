"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input } from "@obracerta/ui";

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
      <Field label="Especialidade" hint="Opcional">
        <Input
          placeholder="Ex.: Pintura"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicar()}
        />
      </Field>

      {geoError && <p className="text-xs text-danger">{geoError}</p>}

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
