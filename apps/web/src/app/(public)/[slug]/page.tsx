import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiEnvelopeError, type PublicProfile, professionalPlanCatalog } from "@obracerta/shared";
import { Badge, Card, Button } from "@obracerta/ui";
import { callApi } from "@/lib/server-api";
import { config } from "@/lib/config";
import { formatRelativeBR } from "@/lib/format";
import { getSession } from "@/lib/session";
import { BackButton } from "@/components/BackButton";
import { ShareButton } from "./ShareButton";

interface PageProps {
  // Next.js 15: params é assíncrono (Promise) em Server Components.
  params: Promise<{ slug: string }>;
}

async function loadProfile(slug: string): Promise<PublicProfile | null> {
  try {
    return await callApi<PublicProfile>("GET", `/public/p/${slug}`);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return { title: "Perfil não encontrado" };
  const nome = profile.nome ?? "Profissional";
  return {
    title: `${nome} — ${config.brand.name}`,
    description: `${nome}: ${profile.especialidades.join(", ")}${profile.bairro ? ` · ${profile.bairro}` : ""}.`,
  };
}

/**
 * Perfil público /[slug] — SSR, sem login, **compartilhável** (SEO). View
 * limitada (§18/§24): sem contato/valores/agenda; nome parcial e, no plano
 * Iniciante, foto/nome ocultos. A reputação é o que vende. O `userId` NÃO é
 * exposto — agendar exige entrar e descobrir o profissional pela busca.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [profile, session] = await Promise.all([loadProfile(slug), getSession()]);
  if (!profile) notFound();

  const nome = profile.nome ?? "Profissional";
  const planoNome = professionalPlanCatalog[profile.plano].nome;

  return (
    <section aria-labelledby="profile-heading" className="mx-auto max-w-5xl px-6 py-10">
      {/* Volta para a busca (histórico preserva os filtros); deslogado cai na home. */}
      <div className="mb-4">
        <BackButton
          fallback={session ? "/buscar" : "/"}
          label={session ? "Voltar à busca" : "Voltar"}
        />
      </div>
      {/* Header hero — vitrine do profissional */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-hero px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[3px] text-white/70">Perfil público</p>
          <ShareButton nome={nome} />
        </div>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            aria-hidden={!profile.fotoUrl}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-display text-4xl font-black text-white sm:h-28 sm:w-28"
          >
            {profile.fotoUrl ? (
              <img
                src={profile.fotoUrl}
                alt={`Foto de ${nome}`}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              nome.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h1 id="profile-heading" className="font-display text-3xl font-black sm:text-4xl">
              {nome}
            </h1>
            <p className="mt-1 text-white/80">{profile.especialidades.join(" · ")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Stars nota={profile.reputacao.mediaNota} />
                <span className="font-bold">{profile.reputacao.mediaNota.toFixed(1)}</span>
                <span className="text-white/70">({profile.reputacao.totalAvaliacoes} avaliações)</span>
              </span>
              {profile.bairro && <span className="text-white/70">{profile.bairro}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_2fr]">
        {/* Confiança + CTA (sticky no desktop) */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-black text-foreground">Confiança</h2>
            <dl className="space-y-2 text-sm">
              <Stat label="Obras concluídas" value={`${(profile as unknown as { obrasConcluidas?: number }).obrasConcluidas ?? 0}`} />
              <Stat label="Avaliações" value={`${profile.reputacao.totalAvaliacoes}`} />
              <Stat label="Nota média" value={`${profile.reputacao.mediaNota.toFixed(1)} / 5`} />
              {profile.taxaAceitacao !== null && (
                <Stat label="Aceita pedidos" value={`${Math.round(profile.taxaAceitacao * 100)}%`} />
              )}
              {profile.anosExperiencia !== null && (
                <Stat label="Experiência" value={`${profile.anosExperiencia} anos`} />
              )}
              <Stat label="Plano" value={planoNome} />
            </dl>
            {profile.taxaAceitacao !== null && profile.taxaAceitacao >= 0.8 && (
              <Badge tone="success">⚡ Responde rápido</Badge>
            )}
            {profile.especialidades.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {profile.especialidades.map((esp) => (
                  <Badge key={esp} tone="neutral">
                    {esp}
                  </Badge>
                ))}
              </div>
            )}
            {profile.reputacao.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.reputacao.badges.map((b) => (
                  <Badge key={b} tone="success">
                    🏅 {b}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
          <Card className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              {session
                ? `Para agendar com ${nome}, use o botão Agendar no card dele na busca.`
                : `Para agendar com ${nome}, entre na sua conta — protegemos os contatos até a aprovação.`}
            </p>
            <Link
              href={session ? "/buscar" : "/entrar"}
              className="inline-block rounded-md bg-primary px-5 py-2.5 font-extrabold text-primary-foreground transition-colors hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              {session ? "Ir para a busca" : "Entrar para agendar"}
            </Link>
          </Card>
        </aside>

        {/* Portfólio + avaliações */}
        <div className="space-y-8">
          <section aria-labelledby="avaliacoes-heading">
            <h2 id="avaliacoes-heading" className="font-display text-lg font-black text-foreground">
              O que dizem os clientes
            </h2>
            {profile.avaliacoes.length > 0 ? (
              <div className="mt-3 space-y-4">
                <ul className="space-y-3">
                  {profile.avaliacoes.slice(0, 2).map((av, i) => (
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
                {profile.reputacao.totalAvaliacoes > 2 && (
                  <div className="text-center">
                    <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto text-primary border border-primary/20 hover:bg-primary/5">
                      <Link href={`/${profile.slug}/avaliacoes`}>
                        Ver todas as avaliações ({profile.reputacao.totalAvaliacoes})
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Ainda sem avaliações públicas — seja o primeiro a contratar e avaliar.
                </p>
              </Card>
            )}
          </section>

          <section aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading" className="font-display text-lg font-black text-foreground">Portfólio de obras</h2>
          {profile.portfolio.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {profile.portfolio.map((foto, i) => (
                <li key={foto.url ?? i} className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={foto.url}
                    alt={foto.legenda ?? `Obra de ${nome}`}
                    className="aspect-square w-full object-cover"
                  />
                  {foto.legenda && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">{foto.legenda}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Card className="mt-3">
              <p className="text-sm text-muted-foreground">
                Este profissional ainda não publicou fotos de obras.
              </p>
            </Card>
          )}
          </section>
        </div>
      </div>
    </section>
  );
}

/** Linha de estatística (rótulo + valor) do bloco de confiança. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}

function Stars({ nota }: { nota: number }) {
  const cheias = Math.round(nota);
  return (
    <span aria-label={`${nota.toFixed(1)} de 5`} className="text-lg text-primary">
      {"★".repeat(cheias)}
      <span className="text-border">{"★".repeat(5 - cheias)}</span>
    </span>
  );
}
