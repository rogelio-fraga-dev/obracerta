"use client";

import { useEffect } from "react";

/**
 * Registra o Service Worker (`/sw.js`) no cliente. Sem UI — roda uma vez no mount.
 * Em navegadores sem suporte, é no-op.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registro best-effort — falha não quebra o app */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
