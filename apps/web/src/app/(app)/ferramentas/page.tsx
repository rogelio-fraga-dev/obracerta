import Link from "next/link";
import { formatCentavos, type ProfessionalDocument } from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { DOCUMENT_TYPE_UI } from "@/lib/document-ui";
import { BackLink } from "../_shell/BackLink";

/**
 * Ferramentas do profissional (§8.5): lista de orçamentos e recibos. Premium —
 * sem a feature `tools.documents`, mostra o cadeado + upgrade. A trava real de
 * emissão está na API.
 */
export default async function FerramentasPage() {
  const ent = await serverApi<{ features: string[] }>("GET", "/me/entitlements");
  const canUseTools = ent.features.includes("tools.documents");

  if (!canUseTools) {
    return (
      <section aria-labelledby="ferr-heading" className="space-y-4">
        <BackLink href="/inicio" label="Início" />
        <h1 id="ferr-heading" className="font-display text-2xl font-black text-foreground">
          Orçamentos e recibos
        </h1>
        <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
          <span className="text-3xl">🔒</span>
          <h2 className="font-display text-lg font-black text-foreground">
            Ferramentas do plano Especialista
          </h2>
          <p className="text-sm text-muted-foreground">
            Monte orçamentos detalhados e emita recibos para seus clientes — direto pela plataforma.
          </p>
          <Link href="/cobrancas" className="block">
            <Button className="w-full">Fazer upgrade</Button>
          </Link>
        </Card>
      </section>
    );
  }

  const docs = await serverApi<ProfessionalDocument[]>("GET", "/tools/documents");

  return (
    <section aria-labelledby="ferr-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="ferr-heading" className="font-display text-2xl font-black text-foreground">
          Orçamentos e recibos
        </h1>
        <Link href="/ferramentas/novo" className="shrink-0">
          <Button size="sm">Novo documento</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
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
                      <span className="text-xs text-muted-foreground">{formatDateTimeBR(doc.criadoEm)}</span>
                      <span className="font-black text-foreground">{formatCentavos(doc.totalCentavos)}</span>
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
