"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Aviso de conexão (modo offline, nível 1): barra fina quando o aparelho perde a
 * rede — comum em canteiro de obra. O conteúdo já carregado continua visível e o
 * service worker serve os últimos dados salvos (nível 2).
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // SSR: assume online (o banner só aparece no cliente)
  );
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-xs font-bold text-background"
    >
      <WifiOff aria-hidden className="h-3.5 w-3.5" />
      Sem conexão — mostrando os últimos dados salvos.
    </div>
  );
}
