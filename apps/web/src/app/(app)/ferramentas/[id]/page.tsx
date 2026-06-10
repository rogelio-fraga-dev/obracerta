import { notFound } from "next/navigation";
import {
  ApiEnvelopeError,
  formatCentavos,
  type ProfessionalDocument,
} from "@obracerta/shared";
import { Badge } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { DOCUMENT_TYPE_UI } from "@/lib/document-ui";
import { BackLink } from "../../_shell/BackLink";

/** Visão de um orçamento/recibo — pronta para imprimir/compartilhar (§8.5). */
export default async function DocumentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let doc: ProfessionalDocument;
  try {
    doc = await serverApi<ProfessionalDocument>("GET", `/tools/documents/${id}`);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) notFound();
    throw e;
  }

  const ui = DOCUMENT_TYPE_UI[doc.tipo];

  return (
    <section aria-labelledby="doc-heading" className="space-y-4">
      <BackLink href="/ferramentas" label="Orçamentos e recibos" />

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground">
              {ui.label} · {formatDateTimeBR(doc.criadoEm)}
            </p>
            <h1 id="doc-heading" className="font-display text-2xl font-black text-foreground">
              {doc.titulo}
            </h1>
            <p className="text-sm text-muted-foreground">Cliente: {doc.clienteNome}</p>
          </div>
          <Badge tone={ui.tone}>{ui.label}</Badge>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 text-center font-semibold">Qtd</th>
              <th className="py-2 text-right font-semibold">Unit.</th>
              <th className="py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {doc.itens.map((item, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2 text-foreground">{item.descricao}</td>
                <td className="py-2 text-center text-muted-foreground">{item.quantidade}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {formatCentavos(item.valorUnitarioCentavos)}
                </td>
                <td className="py-2 text-right font-semibold text-foreground">
                  {formatCentavos(item.quantidade * item.valorUnitarioCentavos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-black text-foreground">
            {formatCentavos(doc.totalCentavos)}
          </span>
        </div>

        {doc.observacoes && (
          <div className="mt-4 rounded-lg bg-muted px-3.5 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</p>
            <p className="mt-1 text-sm text-foreground">{doc.observacoes}</p>
          </div>
        )}
      </div>
    </section>
  );
}
