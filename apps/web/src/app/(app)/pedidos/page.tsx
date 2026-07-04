import Link from "next/link";
import type { BookingListItem, BookingStatus } from "@obracerta/shared";
import { Avatar, Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatRelativeBR } from "@/lib/format";
import { BackLink } from "../_shell/BackLink";
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

  return (
    <section aria-labelledby="pedidos-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 id="pedidos-heading" className="font-display text-3xl font-black text-foreground">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProfissional
              ? "Pedidos de serviço recebidos de contratantes."
              : "Seus agendamentos e solicitações de serviço."}
          </p>
        </div>
        {!isProfissional && (
          <Link href="/pedidos/novo" className="w-fit">
            <Button size="sm" className="w-full sm:w-auto">+ Novo pedido</Button>
          </Link>
        )}
      </div>

      {/* Filtro por estado — URL como estado (compartilhável, voltar/avançar). */}
      <nav aria-label="Filtrar pedidos" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTROS.map((f) => {
          const count = f.statuses
            ? pedidos.filter((p) => f.statuses!.includes(p.status)).length
            : pedidos.length;
          const active = f.key === filtro.key;
          return (
            <Link
              key={f.key}
              href={f.key === "todos" ? "/pedidos" : `/pedidos?filtro=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f.label} <span className="text-xs opacity-70">({count})</span>
            </Link>
          );
        })}
      </nav>

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
              <Link href="/buscar">
                <Button size="sm">Buscar profissional</Button>
              </Link>
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
                  <Card interactive>
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
                          <span className="text-base font-bold text-foreground">{p.especialidade}</span>
                          <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                        </div>
                        {p.outraParteNome && (
                          <p className="truncate text-sm font-semibold text-foreground/80">
                            {isProfissional ? "Cliente" : "Profissional"}: {p.outraParteNome}
                          </p>
                        )}
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {formatRelativeBR(p.dataServico)}
                          {p.descricao &&
                            ` · ${p.descricao.substring(0, 50)}${p.descricao.length > 50 ? "…" : ""}`}
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
