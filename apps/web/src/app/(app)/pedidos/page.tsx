import Link from "next/link";
import type { BookingListItem, BookingStatus } from "@obracerta/shared";
import { Avatar, Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatRelativeBR } from "@/lib/format";
import { BackLink } from "../_shell/BackLink";
import { FilterTabs, type FilterTab } from "../_shell/FilterTabs";
import { PedidosIcon } from "../_shell/icons";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Abas de filtro por estado (agrupadas do jeito que o usuário pensa). */
const FILTROS: { key: string; label: string; statuses: BookingStatus[] | null }[] = [
  { key: "todos", label: "Todos", statuses: null },
  { key: "pendentes", label: "Pendentes", statuses: ["PENDENTE"] },
  { key: "andamento", label: "Em andamento", statuses: ["APROVADO", "INICIADO"] },
  { key: "concluidos", label: "Concluídos", statuses: ["CONCLUIDO"] },
  { key: "encerrados", label: "Encerrados", statuses: ["RECUSADO", "EXPIRADO", "CANCELADO"] },
];

/**
 * Aba Pedidos (Fase 2), ciente de papel: o contratante vê os pedidos que fez (e
 * cria novos); o profissional vê os que recebeu. Filtro por estado via URL.
 */
export default async function PedidosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filtroKey = typeof params.filtro === "string" ? params.filtro : "todos";
  const filtro = FILTROS.find((f) => f.key === filtroKey) ?? FILTROS[0]!;

  const hint = await getProfileHint();
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const endpoint = isProfissional ? "/bookings/me/professional" : "/bookings/me/contractor";
  const pedidos = await serverApi<BookingListItem[]>("GET", endpoint);
  const visiveis = filtro.statuses
    ? pedidos.filter((p) => filtro.statuses!.includes(p.status))
    : pedidos;
  const tabs: FilterTab[] = FILTROS.map((f) => ({
    key: f.key,
    label: f.label,
    count: f.statuses ? pedidos.filter((p) => f.statuses!.includes(p.status)).length : pedidos.length,
  }));

  return (
    <section aria-labelledby="pedidos-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 id="pedidos-heading" className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProfissional
              ? "Pedidos de serviço recebidos de contratantes."
              : "Seus agendamentos e solicitações de serviço."}
          </p>
        </div>
        {!isProfissional && (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/pedidos/novo">+ Novo pedido</Link>
          </Button>
        )}
      </div>

      {/* Filtro por estado — URL como estado (compartilhável, voltar/avançar). */}
      <FilterTabs
        ariaLabel="Filtrar pedidos"
        tabs={tabs}
        activeKey={filtro.key}
        hrefFor={(k) => (k === "todos" ? "/pedidos" : `/pedidos?filtro=${k}`)}
      />

      {visiveis.length === 0 ? (
        <EmptyState
          icon={<PedidosIcon className="h-8 w-8" />}
          title={
            filtro.key !== "todos"
              ? "Nada neste filtro"
              : isProfissional
                ? "Nenhum pedido recebido"
                : "Nenhum pedido feito"
          }
          description={
            filtro.key !== "todos"
              ? "Troque o filtro acima para ver os demais pedidos."
              : isProfissional
                ? "Quando contratantes solicitarem seus serviços, os pedidos aparecem aqui."
                : "Busque um profissional e faça seu primeiro pedido de serviço."
          }
          action={
            filtro.key === "todos" &&
            !isProfissional && (
              <Button asChild size="sm">
                <Link href="/buscar">Buscar profissional</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visiveis.map((p) => {
            const ui = BOOKING_STATUS_UI[p.status];
            return (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="block">
                  <Card interactive className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                      {p.outraParteNome ? (
                        <Avatar
                          nome={p.outraParteNome}
                          src={p.outraParteFotoUrl ?? undefined}
                          size="md"
                          className="shrink-0"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                          <PedidosIcon className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="min-w-0 max-w-full truncate text-base font-bold text-foreground">
                            {p.especialidade}
                          </span>
                          <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                        </div>
                        {p.outraParteNome && (
                          <p className="truncate text-sm font-semibold text-foreground/80">
                            {isProfissional ? "Cliente" : "Profissional"}: {p.outraParteNome}
                          </p>
                        )}
                        {/* Quebra em até 2 linhas (line-clamp) — sem estourar o card no celular. */}
                        <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted-foreground">
                          {formatRelativeBR(p.dataServico)}
                          {p.descricao && ` · ${p.descricao}`}
                        </p>
                      </div>
                      <span aria-hidden className="hidden text-lg text-muted-foreground sm:block">→</span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
