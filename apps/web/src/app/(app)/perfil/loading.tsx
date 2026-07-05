/** Skeleton do Perfil: cabeçalho com avatar + blocos de seção (menos layout shift). */
export default function PerfilLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando perfil" className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="animate-skeleton h-20 w-20 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="animate-skeleton h-6 w-48 max-w-full rounded-lg bg-muted" />
          <div className="animate-skeleton h-4 w-32 rounded bg-muted" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-skeleton h-32 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
