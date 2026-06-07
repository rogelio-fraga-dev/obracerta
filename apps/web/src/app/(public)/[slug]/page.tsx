import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiEnvelopeError, type PublicProfile, professionalPlanCatalog } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { callApi } from "@/lib/server-api";
import { config } from "@/lib/config";

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
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  const nome = profile.nome ?? "Profissional";
  const planoNome = professionalPlanCatalog[profile.plano].nome;

  return (
    <section aria-labelledby="profile-heading" className="mx-auto max-w-2xl px-6 py-12">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[3px] text-primary">Perfil público</p>

      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted font-display text-2xl font-black text-muted-foreground"
        >
          {profile.fotoUrl ? (
            <img src={profile.fotoUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            nome.charAt(0)
          )}
        </div>
        <div>
          <h1 id="profile-heading" className="font-display text-3xl font-black text-foreground">
            {nome}
          </h1>
          {profile.bairro && <p className="text-sm text-muted-foreground">{profile.bairro}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Stars nota={profile.reputacao.mediaNota} />
        <span className="text-sm text-muted-foreground">
          {profile.reputacao.mediaNota.toFixed(1)} · {profile.reputacao.totalAvaliacoes} avaliações
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {profile.especialidades.map((esp) => (
          <Badge key={esp} tone="neutral">
            {esp}
          </Badge>
        ))}
        {profile.anosExperiencia !== null && (
          <Badge tone="info">{profile.anosExperiencia} anos de experiência</Badge>
        )}
        <Badge tone="warning">Plano {planoNome}</Badge>
      </div>

      {profile.reputacao.badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.reputacao.badges.map((b) => (
            <Badge key={b} tone="success">
              🏅 {b}
            </Badge>
          ))}
        </div>
      )}

      <Card className="mt-8 space-y-3 text-center">
        <p className="text-muted-foreground">
          Para agendar com {nome}, entre na sua conta — protegemos os contatos até a aprovação.
        </p>
        <Link
          href="/entrar"
          className="inline-block rounded-md bg-primary px-5 py-2.5 font-extrabold text-primary-foreground"
        >
          Entrar para agendar
        </Link>
      </Card>
    </section>
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
