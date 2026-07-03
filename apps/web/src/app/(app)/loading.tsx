/**
 * Skeleton global da área logada — o App Router o exibe automaticamente enquanto
 * a página (Server Component) busca dados, melhorando a percepção de velocidade
 * em navegações. Formato genérico: título + linha de KPIs + lista de cards.
 */
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-6">
      {/* Título + subtítulo */}
      <div className="space-y-2">
        <div className="animate-skeleton h-8 w-44 rounded-lg bg-muted" />
        <div className="animate-skeleton h-4 w-72 max-w-full rounded bg-muted" />
      </div>

      {/* Linha de destaques */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-skeleton h-24 rounded-2xl bg-muted" />
        ))}
      </div>

      {/* Lista de cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-skeleton h-20 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
