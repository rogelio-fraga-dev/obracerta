"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type DocumentType,
  type ProfessionalDocument,
  createDocumentSchema,
  documentTotalCentavos,
  formatCentavos,
} from "@obracerta/shared";
import { Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { BackLink } from "../../_shell/BackLink";

/** Linha do formulário: valor é texto (reais) até virar centavos no envio. */
interface ItemForm {
  descricao: string;
  quantidade: string;
  valor: string;
}

const EMPTY_ITEM: ItemForm = { descricao: "", quantidade: "1", valor: "" };

/** Converte "1.234,56" / "1234.56" em centavos inteiros (0 se inválido). */
function toCentavos(valor: string): number {
  const reais = Number(valor.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(reais) && reais > 0 ? Math.round(reais * 100) : 0;
}

export default function NovoDocumentoPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<DocumentType>("ORCAMENTO");
  const [clienteNome, setClienteNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const itensCalculados = itens.map((it) => ({
    descricao: it.descricao.trim(),
    quantidade: Math.max(0, Math.trunc(Number(it.quantidade) || 0)),
    valorUnitarioCentavos: toCentavos(it.valor),
  }));
  const totalCentavos = documentTotalCentavos(
    itensCalculados.filter((it) => it.descricao && it.quantidade > 0),
  );

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItens((prev) => [...prev, { ...EMPTY_ITEM }]);
  }
  function removeItem(index: number) {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function criar() {
    setError(null);
    setLoading(true);
    try {
      const itensValidos = itensCalculados.filter((it) => it.descricao && it.quantidade > 0);
      const payload = {
        tipo,
        clienteNome: clienteNome.trim(),
        titulo: titulo.trim(),
        observacoes: observacoes.trim() || undefined,
        itens: itensValidos,
      };
      const parsed = createDocumentSchema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      const doc = await bff.post<ProfessionalDocument>("/api/tools/documents", payload);
      router.replace(`/ferramentas/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar o documento.");
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="novo-doc-heading" className="space-y-4">
      <BackLink href="/ferramentas" label="Orçamentos e recibos" />
      <h1 id="novo-doc-heading" className="font-display text-2xl font-black text-foreground">
        Novo documento
      </h1>

      <Card className="space-y-4">
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <Field label="Tipo">
          <div className="flex gap-2">
            {(["ORCAMENTO", "RECIBO"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={tipo === t ? "primary" : "secondary"}
                onClick={() => setTipo(t)}
              >
                {t === "ORCAMENTO" ? "Orçamento" : "Recibo"}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Cliente">
          <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" />
        </Field>
        <Field label="Título">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Reforma da cozinha" />
        </Field>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Itens</p>
          {itens.map((it, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <Input
                value={it.descricao}
                onChange={(e) => updateItem(i, { descricao: e.target.value })}
                placeholder="Descrição do item"
              />
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  value={it.quantidade}
                  onChange={(e) => updateItem(i, { quantidade: e.target.value })}
                  placeholder="Qtd"
                  className="w-20"
                  aria-label="Quantidade"
                />
                <Input
                  inputMode="decimal"
                  value={it.valor}
                  onChange={(e) => updateItem(i, { valor: e.target.value })}
                  placeholder="Valor unitário (R$)"
                  aria-label="Valor unitário"
                />
                {itens.length > 1 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)} aria-label="Remover item">
                    ✕
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={addItem}>
            + Adicionar item
          </Button>
        </div>

        <Field label="Observações" hint="Opcional">
          <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-black text-foreground">
            {formatCentavos(totalCentavos)}
          </span>
        </div>

        <Button className="w-full" onClick={criar} disabled={loading}>
          {loading ? "Salvando…" : "Salvar documento"}
        </Button>
      </Card>
    </section>
  );
}
