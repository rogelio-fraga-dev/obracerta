import Link from "next/link";
import { serverApi } from "@/lib/server-api";
import { Avatar, Badge, Card } from "@obracerta/ui";
import { BackLink } from "../_shell/BackLink";

export const revalidate = 60; // Cache por 1 minuto

interface RankingItem {
  userId: string;
  slug: string;
  fotoUrl: string | null;
  nome: string;
  obrasConcluidas: number;
  mediaNota: number;
  totalAvaliacoes: number;
}

export default async function RankingPage() {
  let ranking: RankingItem[] = [];
  try {
    ranking = await serverApi<RankingItem[]>("GET", "/public/ranking");
  } catch {
    // Silently fall back to empty ranking
  }

  // Separar o pódio (top 3) do restante
  const podium = ranking.slice(0, 3);
  const remaining = ranking.slice(3);

  // Ordenar o pódio para exibição visual: [2º colocado, 1º colocado, 3º colocado] para ficar bonito
  const podiumVisual = [...podium];
  if (podiumVisual.length === 3) {
    const first = podiumVisual[0];
    const second = podiumVisual[1];
    const third = podiumVisual[2];
    podiumVisual[0] = second; // 2º na esquerda
    podiumVisual[1] = first;  // 1º no centro
    podiumVisual[2] = third;  // 3º na direita
  }

  const PODIUM_STYLES = [
    {
      place: 2,
      medal: "🥈",
      height: "h-36",
      bg: "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50",
      text: "text-zinc-500",
    },
    {
      place: 1,
      medal: "🥇",
      height: "h-44",
      bg: "bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
      text: "text-amber-500 font-extrabold",
    },
    {
      place: 3,
      medal: "🥉",
      height: "h-32",
      bg: "bg-orange-100 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/20",
      text: "text-orange-600",
    },
  ];

  return (
    <section aria-labelledby="ranking-heading" className="space-y-6 max-w-4xl mx-auto">
      <BackLink href="/buscar" label="Voltar para busca" />
      <header className="text-center space-y-2">
        <h1 id="ranking-heading" className="font-display text-3xl font-black text-foreground">
          Ranking de Profissionais 🏆
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Os profissionais que mais se destacam no ObraCerta, classificados por volume de obras finalizadas e avaliações.
        </p>
      </header>

      {/* Pódio (Top 3) */}
      {podium.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4 max-w-2xl mx-auto">
          {podiumVisual.map((p) => {
            // Se mudou o tamanho do array do podium (menos de 3), recomputa o índice do original
            const originalIndex = podium.findIndex((x) => x.userId === p.userId);
            const style = (PODIUM_STYLES[originalIndex] || PODIUM_STYLES[1])!;
            return (
              <div key={p.userId} className="flex flex-col items-center space-y-3">
                <Link href={`/${p.slug}`} className="group relative block text-center">
                  <div className="relative inline-block">
                    <Avatar
                      nome={p.nome}
                      src={p.fotoUrl ?? undefined}
                      size="xl"
                      className="border-4 border-background ring-4 ring-primary/20 group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -top-2 -right-2 text-2xl animate-bounce-slow">
                      {style.medal}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-sm font-bold text-foreground truncate max-w-[120px] group-hover:underline">
                    {p.nome}
                  </p>
                </Link>

                <div
                  className={`w-full ${style.height} ${style.bg} border rounded-t-2xl flex flex-col justify-end p-4 text-center shadow-[var(--shadow-sm)]`}
                >
                  <span className={`text-2xl font-black block ${style.text}`}>
                    #{originalIndex + 1}
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    <span className="font-bold text-foreground block">
                      {p.obrasConcluidas} {p.obrasConcluidas === 1 ? "obra" : "obras"}
                    </span>
                    {p.totalAvaliacoes > 0 ? (
                      <span className="text-warning font-semibold">
                        ★ {p.mediaNota.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Sem nota</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista do Ranking (4º a 20º colocado) */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="font-display font-bold text-foreground">Classificação Geral</h2>
        </div>
        {ranking.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum profissional qualificado no ranking no momento.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {remaining.map((p, idx) => {
              const rank = idx + 4;
              return (
                <div key={p.userId} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 font-display font-black text-muted-foreground text-center">
                      {rank}
                    </span>
                    <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="md" />
                    <div className="min-w-0">
                      <Link href={`/${p.slug}`} className="font-bold text-foreground text-sm hover:underline block truncate">
                        {p.nome}
                      </Link>
                      {p.totalAvaliacoes > 0 ? (
                        <span className="text-xs text-warning font-semibold">
                          ★ {p.mediaNota.toFixed(1)} ({p.totalAvaliacoes} avaliações)
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ainda sem avaliações</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <Badge tone="primary">
                      {p.obrasConcluidas} {p.obrasConcluidas === 1 ? "obra" : "obras"}
                    </Badge>
                    <Link href={`/${p.slug}`}>
                      <span className="text-xs text-primary font-bold hover:underline">
                        Ver Perfil
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
