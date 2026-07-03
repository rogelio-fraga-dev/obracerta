import Link from "next/link";

/**
 * 404 com a cara da marca (antes caía no default do Next, cru e em inglês).
 * Cobre rota inexistente e perfil público não encontrado (`notFound()`).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <img src="/brand/obracerta-mark.png" alt="" className="h-16 w-auto opacity-90" />
      <p className="mt-8 font-display text-7xl font-black text-primary">404</p>
      <h1 className="mt-3 font-display text-2xl font-black text-foreground sm:text-3xl">
        Essa página não está de pé
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        O endereço pode ter mudado ou nunca existiu. Sem problema — a obra continua por aqui:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 font-extrabold text-primary-foreground transition-colors hover:bg-orange-400"
        >
          Ir para o início
        </Link>
        <Link
          href="/buscar"
          className="rounded-xl border-2 border-border px-6 py-3 font-bold text-foreground transition-colors hover:bg-muted"
        >
          Buscar profissionais
        </Link>
      </div>
    </main>
  );
}
