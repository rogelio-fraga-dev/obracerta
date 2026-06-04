import type { Metadata } from "next";

interface PublicProfilePageProps {
  // Next.js 15: params is async (a Promise) in Server Components.
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Perfil ${slug}` };
}

/**
 * Perfil público /[slug] — SSR para SEO (placeholder de Fase 0).
 * Na Fase 5: dados limitados sem login, foto/valores/agenda bloqueados,
 * CTA "Crie sua conta", cacheado na Cloudflare (anti-desintermediação §18/§24).
 */
export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;

  return (
    <section aria-labelledby="profile-heading" className="px-6 py-section">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[3px] text-orange">
        Perfil público
      </p>
      <h1 id="profile-heading" className="text-4xl font-black text-foreground">
        /{slug}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Placeholder SSR. O perfil público com dados limitados será implementado na Fase 5.
      </p>
    </section>
  );
}
