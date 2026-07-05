import Link from "next/link";
import {
  formatCentavos,
  type WorkOrder,
  type WorkOrderStatus,
  type WorkOrdersPage,
} from "@obracerta/shared";
import { Badge, Button, Card, EmptyState } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { WORK_ORDER_STATUS_UI, WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { BackLink } from "../_shell/BackLink";
import { FilterTabs, type FilterTab } from "../_shell/FilterTabs";
import { ObrasIcon } from "../_shell/icons";
import { EspecialidadeFilter } from "./_components/EspecialidadeFilter";
import { ObrasMap, type ObraPin } from "./_components/ObrasMap";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Abas do **dono** (contratante/empresa) sobre as próprias obras, por estado. */
const OWNER_FILTERS: { key: string; label: string; statuses: WorkOrderStatus[] | null }[] = [
  { key: "todas", label: "Todas", statuses: null },
  { key: "abertas", label: "Abertas", statuses: ["ABERTA"] },
  { key: "andamento", label: "Em andamento", statuses: ["ADJUDICADA"] },
  { key: "encerradas", label: "Encerradas", statuses: ["CONCLUIDA", "CANCELADA", "EXPIRADA"] },
];

const str = (v: string | string[] | undefined): string | undefined =>
  typeof v === "string" ? v : undefined;

/**
 * Aba Obras (Fase 5). O **dono** (contratante/empresa) vê **as próprias obras** com
 * abas por estado (abertas / em andamento / encerradas) e publica novas. O
 * **profissional** procura obras abertas para dar lance e acompanha as que venceu
 * (em andamento).
 */
export default async function ObrasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const hint = await getProfileHint();
  const isOwner = hint?.tipo === "CONTRATANTE" || hint?.tipo === "EMPRESA";

  return isOwner ? (
    <OwnerObras filtroKey={str(params.filtro)} />
  ) : (
    <ProfessionalObras
      filtroKey={str(params.filtro)}
      especialidade={str(params.especialidade)}
      vista={str(params.vista)}
    />
  );
}

/** Visão do dono: todas as obras (todos os status), filtradas por estado na URL. */
async function OwnerObras({ filtroKey }: { filtroKey: string | undefined }) {
  const filtro = OWNER_FILTERS.find((f) => f.key === filtroKey) ?? OWNER_FILTERS[0]!;
  const all = await serverApi<WorkOrder[]>("GET", "/work-orders/me");
  const visiveis = filtro.statuses ? all.filter((o) => filtro.statuses!.includes(o.status)) : all;
  const tabs: FilterTab[] = OWNER_FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    count: f.statuses ? all.filter((o) => f.statuses!.includes(o.status)).length : all.length,
  }));

  return (
    <section aria-labelledby="obras-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="obras-heading" className="font-display text-3xl font-black text-foreground">
            Obras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas obras publicadas e os lances recebidos.
          </p>
        </div>
        <Button asChild size="sm" className="w-fit shrink-0">
          <Link href="/obras/nova">+ Nova obra</Link>
        </Button>
      </div>

      <FilterTabs
        ariaLabel="Filtrar obras"
        tabs={tabs}
        activeKey={filtro.key}
        hrefFor={(k) => (k === "todas" ? "/obras" : `/obras?filtro=${k}`)}
      />

      {visiveis.length === 0 ? (
        <EmptyState
          icon={<ObrasIcon className="h-8 w-8" />}
          title={filtro.key === "todas" ? "Nenhuma obra publicada" : "Nada neste filtro"}
          description={
            filtro.key === "todas"
              ? "Publique uma obra para receber lances de profissionais verificados."
              : "Troque o filtro acima para ver as demais obras."
          }
          action={
            filtro.key === "todas" && (
              <Button asChild size="sm">
                <Link href="/obras/nova">Publicar obra</Link>
              </Button>
            )
          }
        />
      ) : (
        <ObraGrid items={visiveis} />
      )}
    </section>
  );
}

/** Link de alternância (pílula) para Lista/Mapa na aba de busca. */
function ViewToggleLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
        active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

/** Visão do profissional: procurar obras abertas (lista ou mapa) + em andamento. */
async function ProfessionalObras({
  filtroKey,
  especialidade,
  vista,
}: {
  filtroKey: string | undefined;
  especialidade: string | undefined;
  vista: string | undefined;
}) {
  const tab = filtroKey === "andamento" ? "andamento" : "buscar";
  const isMapa = tab === "buscar" && vista === "mapa";
  const tabs: FilterTab[] = [
    { key: "buscar", label: "Procurar obras" },
    { key: "andamento", label: "Em andamento" },
  ];

  const items =
    tab === "andamento"
      ? await serverApi<WorkOrder[]>("GET", "/work-orders/me/professional")
      : (
          await serverApi<WorkOrdersPage>(
            "GET",
            especialidade
              ? `/work-orders?especialidade=${encodeURIComponent(especialidade)}`
              : "/work-orders",
          )
        ).items;

  // Só obras com coordenadas viram marcadores (anúncios públicos; sem profissionais).
  const pins: ObraPin[] = items
    .filter((o) => o.geo !== null)
    .map((o) => ({
      id: o.id,
      titulo: o.titulo,
      especialidade: o.especialidade,
      lat: o.geo!.lat,
      lng: o.geo!.lng,
    }));

  const espQs = especialidade ? `especialidade=${encodeURIComponent(especialidade)}` : "";
  const listaHref = espQs ? `/obras?${espQs}` : "/obras";
  const mapaHref = espQs ? `/obras?vista=mapa&${espQs}` : "/obras?vista=mapa";

  return (
    <section aria-labelledby="obras-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="obras-heading" className="font-display text-3xl font-black text-foreground">
          Obras
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tab === "andamento"
            ? "Obras que você venceu — combine os próximos passos com o contratante."
            : "Obras abertas — dê lances e conquiste novos clientes."}
        </p>
      </div>

      <FilterTabs
        ariaLabel="Filtrar obras"
        tabs={tabs}
        activeKey={tab}
        hrefFor={(k) => (k === "buscar" ? "/obras" : `/obras?filtro=${k}`)}
      />

      {tab === "buscar" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EspecialidadeFilter value={especialidade ?? ""} />
          <nav
            aria-label="Ver obras como lista ou mapa"
            className="flex shrink-0 gap-1 rounded-full border border-border p-1"
          >
            <ViewToggleLink href={listaHref} active={!isMapa}>
              Lista
            </ViewToggleLink>
            <ViewToggleLink href={mapaHref} active={isMapa}>
              Mapa
            </ViewToggleLink>
          </nav>
        </div>
      )}

      {isMapa ? (
        pins.length > 0 ? (
          <ObrasMap obras={pins} />
        ) : (
          <EmptyState
            icon={<ObrasIcon className="h-8 w-8" />}
            title="Nenhuma obra com localização no mapa"
            description="As obras abertas com endereço no mapa aparecem aqui. Use a lista para ver todas."
          />
        )
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ObrasIcon className="h-8 w-8" />}
          title={
            tab === "andamento"
              ? "Nenhuma obra em andamento"
              : especialidade
                ? "Nenhuma obra nesta especialidade"
                : "Nenhuma obra disponível"
          }
          description={
            tab === "andamento"
              ? "Quando um contratante aceitar o seu lance, a obra aparece aqui."
              : especialidade
                ? "Troque a especialidade ou volte em breve — novas obras surgem o tempo todo."
                : "Novas obras aparecem aqui conforme são publicadas. Volte em breve!"
          }
        />
      ) : (
        <ObraGrid items={items} />
      )}
    </section>
  );
}

/** Grade de cartões de obra (compartilhada entre as visões). */
function ObraGrid({ items }: { items: WorkOrder[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((o, i) => {
        const status = WORK_ORDER_STATUS_UI[o.status];
        const urg = WORK_URGENCY_UI[o.urgencia];
        return (
          <li key={o.id} className={`animate-fade-in delay-${Math.min(i + 1, 6)}`}>
            <Link href={`/obras/${o.id}`} className="block h-full">
              <Card interactive className="flex h-full flex-col gap-3 overflow-hidden">
                {o.fotoUrl && (
                  <img
                    src={o.fotoUrl}
                    alt=""
                    aria-hidden
                    width={640}
                    height={128}
                    loading="lazy"
                    decoding="async"
                    className="-mx-6 -mt-6 h-32 w-[calc(100%+3rem)] max-w-none object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-foreground">{o.titulo}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {o.especialidade}
                      {o.bairro ? ` · ${o.bairro}` : ""}
                    </p>
                  </div>
                  <Badge tone={urg.tone} size="sm">{urg.label}</Badge>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {o.pisoCentavos !== null && (
                    <span className="text-sm font-bold text-foreground">
                      A partir de {formatCentavos(o.pisoCentavos)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
