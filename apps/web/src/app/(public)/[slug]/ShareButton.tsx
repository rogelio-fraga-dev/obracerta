"use client";

import { useState } from "react";

/**
 * Compartilhar o perfil público: usa o share nativo (mobile) quando existe;
 * senão copia o link. Atalho direto para WhatsApp — canal padrão do segmento.
 */
export function ShareButton({ nome }: { nome: string }) {
  const [copied, setCopied] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    const title = `${nome} no ObraCerta`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* usuário cancelou — cai no copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard bloqueado — sem feedback */
    }
  }

  function whatsappHref(): string {
    if (typeof window === "undefined") return "#";
    const texto = `Olha o perfil de ${nome} no ObraCerta: ${window.location.href}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={compartilhar}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
      >
        {copied ? "Link copiado ✓" : "↗ Compartilhar"}
      </button>
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // href é calculado no clique (SSR não conhece a URL)
          e.currentTarget.href = whatsappHref();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
      >
        WhatsApp
      </a>
    </div>
  );
}
