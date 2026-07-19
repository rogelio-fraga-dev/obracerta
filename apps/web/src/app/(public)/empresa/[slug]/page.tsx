import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiEnvelopeError, type PublicCompanyProfile } from "@obracerta/shared";
import { Avatar, Card } from "@obracerta/ui";
import { Building2, MapPin, Users } from "lucide-react";
import { callApi } from "@/lib/server-api";
import { config } from "@/lib/config";
import { BackButton } from "@/components/BackButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadCompany(slug: string): Promise<PublicCompanyProfile | null> {
  try {
    return await callApi<PublicCompanyProfile>("GET", `/public/companies/${slug}`);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await loadCompany(slug);
  if (!company) return { title: "Empresa não encontrada" };
  const local = company.cidade ? ` · ${company.cidade}/${company.uf}` : "";
  return {
    title: `${company.nome} — ${config.brand.name}`,
    description: `${company.nome}${local}: equipe verificada de profissionais da construção.`,
  };
}

/**
 * Perfil público da empresa (diretório) — SSR, sem login, compartilhável. Lista
 * só os profissionais que **confirmaram** o vínculo (opt-in). Cada um linka para
 * o próprio perfil público (`/[slug]`) — a empresa vira uma porta de descoberta.
 */
export default async function CompanyPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await loadCompany(slug);
  if (!company) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <BackButton fallback="/empresas" />

      <header className="mt-4 flex items-start gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 aria-hidden className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-black text-foreground">{company.nome}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {company.cidade && (
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="h-4 w-4" /> {company.cidade}/{company.uf}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden className="h-4 w-4" /> {company.profissionais.length} profissional
              {company.profissionais.length === 1 ? "" : "is"}
            </span>
            {company.obrasConcluidas > 0 && (
              <span>{company.obrasConcluidas} obra{company.obrasConcluidas === 1 ? "" : "s"} concluída{company.obrasConcluidas === 1 ? "" : "s"}</span>
            )}
          </div>
        </div>
      </header>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Equipe da empresa
      </h2>
      {company.profissionais.length === 0 ? (
        <Card className="mt-3">
          <p className="text-sm text-muted-foreground">
            Esta empresa ainda não tem profissionais confirmados no perfil público.
          </p>
        </Card>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {company.profissionais.map((p, i) => {
            const inner = (
              <Card interactive={!!p.slug} className="flex h-full items-center gap-3">
                <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{p.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.especialidades.join(", ") || "Profissional"}
                  </p>
                </div>
              </Card>
            );
            return (
              <li key={p.slug ?? `${p.nome}-${i}`}>
                {p.slug ? (
                  <Link href={`/${p.slug}`} className="block h-full">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Precisa de uma equipe para sua obra?{" "}
          <Link href="/cadastro" className="font-semibold text-primary hover:underline">
            Crie sua conta
          </Link>{" "}
          e fale com profissionais verificados.
        </p>
      </div>
    </section>
  );
}
