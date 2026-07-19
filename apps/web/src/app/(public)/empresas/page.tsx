import type { Metadata } from "next";
import Link from "next/link";
import { type CompanyDirectoryItem } from "@obracerta/shared";
import { Card } from "@obracerta/ui";
import { Building2, MapPin, Search, Users } from "lucide-react";
import { callApi } from "@/lib/server-api";
import { config } from "@/lib/config";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: `Empresas — ${config.brand.name}`,
  description: "Encontre construtoras e empreiteiras com equipe verificada de profissionais.",
};

type SearchParams = Promise<{ q?: string }>;

async function loadDirectory(q: string): Promise<CompanyDirectoryItem[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return callApi<CompanyDirectoryItem[]>("GET", `/public/companies${query}`).catch(() => []);
}

/**
 * Diretório público de empresas (SSR, sem login) — os profissionais querem ser
 * encontrados via a empresa. Busca por nome via **URL como estado** (`?q=`),
 * compartilhável. Só empresas com equipe confirmada aparecem.
 */
export default async function EmpresasPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const empresas = await loadDirectory(q.trim());

  return (
    <section className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <BackButton fallback="/" />
      <h1 className="mt-4 font-display text-3xl font-black text-foreground sm:text-4xl">
        Empresas na plataforma
      </h1>
      <p className="mt-2 text-muted-foreground">
        Construtoras e empreiteiras com equipe verificada. Clique para ver os profissionais.
      </p>

      <form method="GET" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar empresa pelo nome…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-400"
        >
          Buscar
        </button>
      </form>

      {empresas.length === 0 ? (
        <Card className="mt-6 text-center">
          <Building2 aria-hidden className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {q
              ? `Nenhuma empresa encontrada para “${q}”.`
              : "Ainda não há empresas com equipe pública. Volte em breve."}
          </p>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {empresas.map((e) => (
            <li key={e.slug}>
              <Link href={`/empresa/${e.slug}`} className="block h-full">
                <Card interactive className="flex h-full items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground">{e.nome}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {e.cidade && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden className="h-3.5 w-3.5" /> {e.cidade}/{e.uf}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users aria-hidden className="h-3.5 w-3.5" /> {e.totalProfissionais} profissional
                        {e.totalProfissionais === 1 ? "" : "is"}
                      </span>
                      {e.obrasConcluidas > 0 && <span>{e.obrasConcluidas} obra(s)</span>}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
