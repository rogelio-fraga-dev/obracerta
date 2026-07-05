"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "@obracerta/ui";

/**
 * Cartão de visita digital do profissional: QR Code do perfil público para
 * mostrar/imprimir na obra, no cartão ou no uniforme — o cliente escaneia e cai
 * direto no `/[slug]` com reputação e portfólio. Diferencial para um público
 * que fecha negócio no boca a boca, offline.
 */
export function ProfileQrCard({ slug }: { slug: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const publicUrl = `${window.location.origin}/${slug}`;
    setUrl(publicUrl);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    let active = true;
    QRCode.toDataURL(publicUrl, { width: 220, margin: 1 })
      .then((data) => {
        if (active) setQrDataUrl(data);
      })
      .catch(() => {
        /* sem QR — o link continua visível */
      });
    return () => {
      active = false;
    };
  }, [slug]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard bloqueado */
    }
  }

  async function compartilhar() {
    try {
      await navigator.share({
        title: "Meu perfil profissional",
        text: "Veja meu perfil com avaliações e portfólio:",
        url,
      });
    } catch {
      /* usuário cancelou ou share indisponível — o "Copiar link" continua como alternativa */
    }
  }

  return (
    <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR Code do seu perfil público (${url})`}
          width={140}
          height={140}
          className="h-[140px] w-[140px] shrink-0 rounded-lg border border-border"
        />
      ) : (
        <div className="animate-skeleton h-[140px] w-[140px] shrink-0 rounded-lg bg-muted" />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="font-display text-lg font-black text-foreground">Seu cartão de visita digital</h3>
        <p className="text-sm text-muted-foreground">
          Mostre este QR na obra ou imprima no cartão — o cliente escaneia e vê seu perfil
          com avaliações e portfólio.
        </p>
        <p className="truncate text-xs font-semibold text-primary">{url}</p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {canShare && (
            <Button size="sm" onClick={compartilhar}>
              Compartilhar
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={copiar}>
            {copied ? "Link copiado ✓" : "Copiar link"}
          </Button>
          {qrDataUrl && (
            <a href={qrDataUrl} download="meu-perfil-obracerta.png">
              <Button size="sm">Baixar QR</Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
