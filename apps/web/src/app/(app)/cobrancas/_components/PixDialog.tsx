"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { formatCentavos, type PixCharge } from "@obracerta/shared";
import { Badge, Button } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { formatDateTimeBR } from "@/lib/format";

/**
 * Pagamento Pix de uma fatura: QR Code + copia-e-cola. Em **sandbox** (gateway
 * fake) aparece o botão "Simular pagamento", que confirma a fatura pelo mesmo
 * pipeline do webhook real — com o Asaas de verdade, o QR vem do provedor e a
 * simulação some sozinha (`simulavel: false`).
 */
export function PagarPixButton({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Pagar com Pix
      </Button>
      {open && <PixDialog invoiceId={invoiceId} onClose={() => setOpen(false)} />}
    </>
  );
}

function PixDialog({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const router = useRouter();
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let active = true;
    bff
      .get<PixCharge>(`/api/billing/pix?invoiceId=${invoiceId}`)
      .then(async (data) => {
        if (!active) return;
        setPix(data);
        const url = await QRCode.toDataURL(data.payload, { width: 240, margin: 1 });
        if (active) setQrDataUrl(url);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível gerar o Pix.");
      });
    return () => {
      active = false;
    };
  }, [invoiceId]);

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar — selecione o texto manualmente.");
    }
  }

  async function simular() {
    setError(null);
    setPaying(true);
    try {
      await bff.post(`/api/billing/pix`, { invoiceId });
      setPaid(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível confirmar o pagamento.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pagamento Pix"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-xl)]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-black text-foreground">Pagar com Pix</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md px-2 text-lg text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {paid ? (
          <div className="mt-4 space-y-3 text-center">
            <span className="text-4xl">✅</span>
            <p className="font-bold text-foreground">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">
              Sua fatura foi marcada como paga e o plano ativado.
            </p>
            <Button className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : !pix ? (
          <div className="mt-4 space-y-3">
            <div className="animate-skeleton mx-auto h-[240px] w-[240px] rounded-lg bg-muted" />
            <div className="animate-skeleton h-9 w-full rounded-lg bg-muted" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <p className="font-display text-2xl font-black text-foreground">
                {formatCentavos(pix.valorCentavos)}
              </p>
              <p className="text-xs text-muted-foreground">
                Vence em {formatDateTimeBR(pix.vencimentoEm)}
              </p>
            </div>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code Pix"
                width={240}
                height={240}
                className="mx-auto rounded-lg border border-border"
              />
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pix copia e cola
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2.5 py-2 text-xs text-foreground">
                  {pix.payload}
                </code>
                <Button variant="secondary" size="sm" onClick={copiar} className="shrink-0">
                  {copied ? "Copiado ✓" : "Copiar"}
                </Button>
              </div>
            </div>

            {pix.simulavel && (
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Badge tone="warning" size="sm">Ambiente de testes</Badge>
                </div>
                <Button className="w-full" onClick={simular} disabled={paying}>
                  {paying ? "Confirmando…" : "Simular pagamento"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Em produção, a confirmação chega sozinha pelo banco após o Pix real.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
