"use client";

import { useEffect, useState } from "react";
import type { PushPublicKey } from "@obracerta/shared";
import { Button } from "@obracerta/ui";
import { bff } from "@/lib/client";

type Estado = "verificando" | "indisponivel" | "desativado" | "ativado" | "negado";

/** Converte a chave VAPID (base64url) no Uint8Array que o pushManager exige. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Opt-in de Web Push: com as chaves VAPID no servidor, oferece "ativar
 * notificações no aparelho". Sem suporte do browser ou sem chave, não aparece.
 */
export function PushOptIn() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function verificar() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("indisponivel");
        return;
      }
      try {
        const { key } = await bff.get<PushPublicKey>("/api/notifications/push");
        if (!key) {
          setEstado("indisponivel");
          return;
        }
        setPublicKey(key);
        if (Notification.permission === "denied") {
          setEstado("negado");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setEstado(sub ? "ativado" : "desativado");
      } catch {
        setEstado("indisponivel");
      }
    }
    void verificar();
  }, []);

  async function ativar() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEstado(permission === "denied" ? "negado" : "desativado");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await bff.post("/api/notifications/push", sub.toJSON());
      setEstado("ativado");
    } catch {
      setEstado("desativado");
    } finally {
      setBusy(false);
    }
  }

  async function desativar() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("desativado");
    } catch {
      /* mantém o estado atual */
    } finally {
      setBusy(false);
    }
  }

  if (estado === "verificando" || estado === "indisponivel") return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">🔔 Avisos no aparelho</p>
        <p className="text-xs text-muted-foreground">
          {estado === "ativado"
            ? "Você recebe as notificações mesmo com o app fechado."
            : estado === "negado"
              ? "Bloqueado nas permissões do navegador — libere em Configurações do site."
              : "Receba pedidos, mensagens e avisos mesmo com o app fechado."}
        </p>
      </div>
      {estado === "desativado" && (
        <Button size="sm" onClick={ativar} disabled={busy}>
          {busy ? "Ativando…" : "Ativar"}
        </Button>
      )}
      {estado === "ativado" && (
        <Button size="sm" variant="secondary" onClick={desativar} disabled={busy}>
          {busy ? "…" : "Desativar"}
        </Button>
      )}
    </div>
  );
}
