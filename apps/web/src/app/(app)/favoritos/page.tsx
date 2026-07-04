import Link from "next/link";
import {
  professionalPlanCatalog,
  type ProfessionalPlan,
  type SearchResult,
} from "@obracerta/shared";
import { Avatar, Badge, Button, Card, EmptyState, type BadgeTone } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { BackLink } from "../_shell/BackLink";
import { FavoriteButton } from "../buscar/_components/FavoriteButton";

const PLANO_TONE: Record<ProfessionalPlan, BadgeTone> = {
  ESPECIALISTA: "primary",
  PRO: "warning",
  INICIANTE: "neutral",
};

/**
 * Favoritos: profissionais salvos pelo contratante/empresa. Mesmo card da
 * busca (shape `SearchResult`), com o coração para remover.
 */
export default async function FavoritosPage() {
  const items = await serverApi<SearchResult[]>("GET", "/favorites/me");

  return (
    <section aria-labelledby="fav-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="fav-heading" className="font-display text-2xl font-black text-foreground">
          Favoritos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profissionais que você salvou para contratar depois.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="♡"
          title="Nenhum favorito ainda"
          description="Toque no coração de um profissional na busca para salvá-lo aqui."
          action={
            <Link href="/buscar">
              <Button size="sm">Buscar profissionais</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.userId}>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${p.slug}`}
                      className="font-display text-lg font-black text-foreground hover:underline"
                    >
                      {p.nome}
                    </Link>
                    <Badge tone={PLANO_TONE[p.plano]}>{professionalPlanCatalog[p.plano].nome}</Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.especialidades.join(" · ")}
                  </p>
                  {p.totalAvaliacoes > 0 && (
                    <p className="text-sm">
                      <span aria-hidden className="text-warning">★</span>{" "}
                      <span className="font-bold text-foreground">{p.mediaNota.toFixed(1)}</span>{" "}
                      <span className="text-muted-foreground">({p.totalAvaliacoes})</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
                  <FavoriteButton professionalId={p.userId} initialFavorited />
                  <Link
                    href={`/pedidos/novo?prof=${p.userId}&esp=${encodeURIComponent(p.especialidades[0] ?? "")}&nome=${encodeURIComponent(p.nome)}`}
                    className="min-w-0 flex-1 sm:flex-none"
                  >
                    <Button size="sm" className="w-full sm:w-auto">Agendar</Button>
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
