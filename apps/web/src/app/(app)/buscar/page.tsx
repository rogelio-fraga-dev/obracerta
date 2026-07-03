import { Suspense } from "react";
import Link from "next/link";
import {
  formatCentavos,
  professionalPlanCatalog,
  type ProfessionalPlan,
  type SearchProfessionalsResult,
} from "@obracerta/shared";
import { Avatar, Badge, Button, Card, type BadgeTone } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { SearchFilters } from "./_components/SearchFilters";
import { FavoriteButton } from "./_components/FavoriteButton";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Hierarquia visual do plano no card de resultado (Especialista em destaque). */
const PLANO_TONE: Record<ProfessionalPlan, BadgeTone> = {
  ESPECIALISTA: "primary",
  PRO: "warning",
  INICIANTE: "neutral",
};

function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const key of ["q", "especialidade", "plano", "lat", "lng", "raioKm", "notaMin", "ordem", "page"]) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) qs.set(key, value);
  }
  return qs.toString();
}

/**
 * Busca de profissionais (Fase 5), autenticada. **URL como estado**: os filtros
 * vêm da query string, então o resultado é compartilhável. Cada resultado leva
 * ao perfil público e oferece "Agendar" (preenche `/pedidos/novo`).
 */
export default async function BuscarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = buildQuery(params);
  const especialidadeBuscada = typeof params.especialidade === "string" ? params.especialidade : "";

  const hint = await getProfileHint();
  const canFavorite = hint?.tipo !== "PROFISSIONAL";

  const [{ items, meta, faixaPreco }, favoritedIds] = await Promise.all([
    serverApi<SearchProfessionalsResult>(
      "GET",
      `/search/professionals${query ? `?${query}` : ""}`,
    ),
    canFavorite
      ? serverApi<string[]>("GET", "/favorites/me/ids").catch(() => [] as string[])
      : Promise.resolve([] as string[]),
  ]);
  const favoritedSet = new Set(favoritedIds);

  return (
    <section aria-labelledby="buscar-heading" className="space-y-5">
      <h1 id="buscar-heading" className="font-display text-2xl font-black text-foreground">
        Encontrar profissional
      </h1>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando filtros…</div>}>
        <SearchFilters />
      </Suspense>

      <p className="text-sm text-muted-foreground">{meta.total} profissional(is) encontrado(s)</p>

      {/* Faixa de preço de referência (agregado anônimo de lances) — dor "quanto custa?". */}
      {faixaPreco && (
        <div className="rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-sm">
          <span className="font-bold text-foreground">
            💡 Faixa de preço em {faixaPreco.especialidade}:
          </span>{" "}
          <span className="text-foreground">
            {formatCentavos(faixaPreco.minCentavos)} a {formatCentavos(faixaPreco.maxCentavos)}
          </span>{" "}
          <span className="text-muted-foreground">
            (mediana {formatCentavos(faixaPreco.medianaCentavos)}, base de {faixaPreco.amostras}{" "}
            proposta(s) em obras)
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">
            Nenhum profissional para esses filtros. Tente outros termos ou amplie a área.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => {
            const esp = especialidadeBuscada || p.especialidades[0] || "";
            return (
              <li key={p.userId}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/${p.slug}`} className="font-display text-lg font-black text-foreground hover:underline">
                        {p.nome}
                      </Link>
                      <Badge tone={PLANO_TONE[p.plano]}>{professionalPlanCatalog[p.plano].nome}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.especialidades.join(" · ")}
                    </p>
                    {p.totalAvaliacoes > 0 ? (
                      <p className="flex items-center gap-1.5 text-sm" aria-label={`${p.mediaNota.toFixed(1)} de 5, ${p.totalAvaliacoes} avaliações`}>
                        <span aria-hidden className="tracking-tight text-warning">
                          {"★".repeat(Math.round(p.mediaNota))}
                          <span className="text-border">{"★".repeat(5 - Math.round(p.mediaNota))}</span>
                        </span>
                        <span className="font-bold text-foreground">{p.mediaNota.toFixed(1)}</span>
                        <span className="text-muted-foreground">({p.totalAvaliacoes})</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Ainda sem avaliações</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {[
                        p.bairro,
                        p.anosExperiencia ? `${p.anosExperiencia} anos de experiência` : null,
                        p.distanciaKm !== null ? `${p.distanciaKm.toFixed(1)} km de você` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
                    {canFavorite && (
                      <FavoriteButton
                        professionalId={p.userId}
                        initialFavorited={favoritedSet.has(p.userId)}
                      />
                    )}
                    <Link
                      href={`/pedidos/novo?prof=${p.userId}&esp=${encodeURIComponent(esp)}`}
                      className="min-w-0 flex-1 sm:flex-none"
                    >
                      <Button size="sm" className="w-full sm:w-auto">Agendar</Button>
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
