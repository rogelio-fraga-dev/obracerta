import Link from "next/link";
import { serverApi } from "@/lib/server-api";
import { Card, Button } from "@obracerta/ui";
import { formatRelativeBR } from "@/lib/format";
import { BackLink } from "@/app/(app)/_shell/BackLink";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface ReviewItem {
  nota: number;
  comentario: string | null;
  criadoEm: string;
  autorNome: string;
  resposta: string | null;
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
}

function Stars({ nota }: { nota: number }) {
  const cheias = Math.round(nota);
  return (
    <span aria-label={`${nota} de 5`} className="text-lg text-primary">
      {"★".repeat(cheias)}
      <span className="text-border">{"★".repeat(5 - cheias)}</span>
    </span>
  );
}

export default async function AvaliacoesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sParams = await searchParams;

  const page = typeof sParams.page === "string" ? Math.max(1, parseInt(sParams.page, 10)) : 1;
  const nota = typeof sParams.nota === "string" ? parseInt(sParams.nota, 10) : undefined;

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", "10");
  if (nota && nota >= 1 && nota <= 5) query.set("nota", String(nota));

  let data: ReviewsResponse = { items: [], total: 0 };
  let profNome = "Profissional";
  try {
    const [revData, profData] = await Promise.all([
      serverApi<ReviewsResponse>("GET", `/public/p/${slug}/reviews?${query.toString()}`),
      serverApi<{ nome: string | null }>("GET", `/public/p/${slug}`),
    ]);
    data = revData;
    profNome = profData.nome || "Profissional";
  } catch {
    // Fallback
  }

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  function buildFilterHref(selectedNota?: number) {
    const qs = new URLSearchParams();
    if (selectedNota) qs.set("nota", String(selectedNota));
    return `/${slug}/avaliacoes${qs.toString() ? `?${qs.toString()}` : ""}`;
  }

  function buildPageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (nota) qs.set("nota", String(nota));
    if (targetPage > 1) qs.set("page", String(targetPage));
    return `/${slug}/avaliacoes${qs.toString() ? `?${qs.toString()}` : ""}`;
  }

  return (
    <section aria-labelledby="heading" className="space-y-6 max-w-2xl mx-auto">
      <BackLink href={`/${slug}`} label={`Voltar para perfil de ${profNome}`} />

      <header className="space-y-1">
        <h1 id="heading" className="font-display text-2xl font-black text-foreground">
          Avaliações de {profNome}
        </h1>
        <p className="text-sm text-muted-foreground">
          Veja o feedback sincero e comentários deixados por clientes anteriores.
        </p>
      </header>

      {/* Filtro por Estrelas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-2">
          Filtrar por nota:
        </span>
        <Button asChild size="sm" variant={nota === undefined ? "primary" : "secondary"}>
          <Link href={buildFilterHref(undefined)}>Todas ({data.total})</Link>
        </Button>
        {[5, 4, 3, 2, 1].map((star) => (
          <Button
            asChild
            key={star}
            size="sm"
            variant={nota === star ? "primary" : "secondary"}
            className="flex items-center gap-1"
          >
            <Link href={buildFilterHref(star)}>{star}★</Link>
          </Button>
        ))}
      </div>

      {data.items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          Nenhuma avaliação encontrada para os filtros selecionados.
        </Card>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-3">
            {data.items.map((av, i) => (
              <li key={`${av.criadoEm}-${i}`}>
                <Card className="space-y-2 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2">
                      <Stars nota={av.nota} />
                      <span className="text-sm font-bold text-foreground">{av.autorNome}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeBR(av.criadoEm)}
                    </span>
                  </div>
                  {av.comentario && (
                    <p className="text-sm leading-relaxed text-foreground">“{av.comentario}”</p>
                  )}
                  {av.resposta && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Resposta do profissional
                      </p>
                      <p className="mt-1 text-sm text-foreground">{av.resposta}</p>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>

          {/* Paginação */}
          {totalPages > 1 && (
            <nav aria-label="Paginação de avaliações" className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              {page > 1 ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={buildPageHref(page - 1)}>← Anterior</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-sm font-semibold text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={buildPageHref(page + 1)}>Próxima →</Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
