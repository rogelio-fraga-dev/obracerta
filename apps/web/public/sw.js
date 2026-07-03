/* global self, caches */
/**
 * Service Worker do PWA (Melhoria #3). Estratégia conservadora:
 * - Navegações: **network-first** com fallback offline (mudanças sempre aparecem).
 * - Estáticos (`/_next/static`, ícone): cache com revalidação.
 * - `/api/*` (BFF) e cross-origin: **nunca** cacheados (dados/sessão sempre frescos).
 */
const CACHE = "oc-shell-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // só same-origin
  if (url.pathname.startsWith("/api/")) return; // nunca cachear o BFF

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const cacheable = url.pathname.startsWith("/_next/static/") || url.pathname === "/icon-192.png";
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok && cacheable) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
