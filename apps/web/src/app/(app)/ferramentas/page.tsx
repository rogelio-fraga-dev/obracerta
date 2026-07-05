import Link from "next/link";
import {
  type BookingListItem,
  formatCentavos,
  isBookingContactReleased,
  type ProfessionalDocument,
} from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { DOCUMENT_TYPE_UI } from "@/lib/document-ui";
import { AcceptedServicesList } from "@/components/AcceptedServicesList";
import { BackLink } from "../_shell/BackLink";

/**
 * Orçamentos e recibos (§8.5) — tela única de orçamentos do profissional. No topo,
 * os **serviços fechados na plataforma** (resumo/orçamento pronto, liberado a todos);
 * abaixo, os **documentos personalizados** (orçamento/recibo do zero), premium — sem
 * a feature `tools.documents`, mostra o cadeado + upgrade. A trava real está na API.
 */
export default async function FerramentasPage() {
  const [ent, bookings] = await Promise.all([
    serverApi<{ features: string[] }>("GET", "/me/entitlements"),
    serverApi<BookingListItem[]>("GET", "/bookings/me/professional").catch(
      () => [] as BookingListItem[],
    ),
  ]);
  const canUseTools = ent.features.includes("tools.documents");
  const aceitos = bookings.filter((p) => isBookingContactReleased(p.status));
  const docs = canUseTools
    ? await serverApi<ProfessionalDocument[]>("GET", "/tools/documents")
    : [];

  return (
    <section aria-labelledby="ferr-heading" className="space-y-8">
      <BackLink href="/inicio" label="Início" />
      <h1 id="ferr-heading" className="font-display text-2xl font-black text-foreground">
        Orçamentos e recibos
      </h1>

      {/* Serviços fechados na plataforma — resumo/orçamento pronto (todos os planos). */}
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-black text-foreground">Serviços fechados</h2>
          <p className="text-sm text-muted-foreground">
            Gere o resumo/orçamento dos serviços que você fechou pela plataforma.
          </p>
        </div>
        <AcceptedServicesList services={aceitos} isProfissional />
      </div>

      {/* Documentos personalizados — premium (Especialista). */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-black text-foreground">
              Documentos personalizados
            </h2>
            <p className="text-sm text-muted-foreground">
              Monte orçamentos detalhados e emita recibos do zero para qualquer cliente.
            </p>
          </div>
          {canUseTools && (
            <Link href="/ferramentas/novo" className="shrink-0">
              <Button size="sm">Novo documento</Button>
            </Link>
          )}
        </div>

        {!canUseTools ? (
          <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
            <span className="text-3xl">🔒</span>
            <h3 className="font-display text-base font-black text-foreground">
              Ferramentas do plano Especialista
            </h3>
            <p className="text-sm text-muted-foreground">
              Monte orçamentos detalhados e emita recibos para seus clientes — direto pela plataforma.
            </p>
            <Link href="/cobrancas" className="block">
              <Button className="w-full">Fazer upgrade</Button>
            </Link>
          </Card>
        ) : docs.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">
              Você ainda não emitiu nenhum documento. Crie um orçamento ou recibo para começar.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => {
              const ui = DOCUMENT_TYPE_UI[doc.tipo];
              return (
                <li key={doc.id}>
                  <Link href={`/ferramentas/${doc.id}`} className="block">
                    <Card className="space-y-1 transition-colors hover:border-primary/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{doc.titulo}</p>
                          <p className="text-sm text-muted-foreground">{doc.clienteNome}</p>
                        </div>
                        <Badge tone={ui.tone}>{ui.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTimeBR(doc.criadoEm)}
                        </span>
                        <span className="font-black text-foreground">
                          {formatCentavos(doc.totalCentavos)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
