import Link from "next/link";
import {
  professionalPlanCatalog,
  type SearchProfessionalsResult,
} from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { planoRecebePedidos } from "@/lib/billing-ui";
import { SearchFilters } from "./_components/SearchFilters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const key of ["q", "especialidade", "plano", "lat", "lng", "raioKm", "page"]) {
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

  const { items, meta } = await serverApi<SearchProfessionalsResult>(
    "GET",
    `/search/professionals${query ? `?${query}` : ""}`,
  );

  return (
    <section aria-labelledby="buscar-heading" className="space-y-5">
      <h1 id="buscar-heading" className="font-display text-2xl font-black text-foreground">
        Encontrar profissional
      </h1>

      <SearchFilters />

      <p className="text-sm text-muted-foreground">{meta.total} profissional(is) encontrado(s)</p>

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
                <Card className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/${p.slug}`} className="font-semibold text-foreground hover:underline">
                        {p.nome}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {p.especialidades.join(", ")}
                        {p.bairro ? ` · ${p.bairro}` : ""}
                      </p>
                    </div>
                    <Badge tone="warning">{professionalPlanCatalog[p.plano].nome}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {p.distanciaKm !== null ? `${p.distanciaKm.toFixed(1)} km de você` : ""}
                    </span>
                    {planoRecebePedidos(p.plano) ? (
                      <Link href={`/pedidos/novo?prof=${p.userId}&esp=${encodeURIComponent(esp)}`}>
                        <Button size="sm">Agendar</Button>
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        🔒 Não recebe pedidos
                      </span>
                    )}
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
