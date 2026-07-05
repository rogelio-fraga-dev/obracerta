/** Skeleton da Busca: barra de busca + chips de filtro + grade de resultados. */
export default function BuscarLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando busca" className="space-y-6">
      <div className="animate-skeleton h-8 w-40 rounded-lg bg-muted" />
      <div className="animate-skeleton h-12 w-full rounded-xl bg-muted" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-skeleton h-8 w-24 rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-skeleton h-40 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
