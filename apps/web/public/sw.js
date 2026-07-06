/* global self, caches */
/**
 * Service Worker do PWA. Estratégia:
 * - Navegações: **network-first**; sucesso alimenta o cache de dados; sem rede,
 *   serve a última versão vista da página (modo offline de LEITURA) e, se nunca
 *   visitou, o offline.html.
 * - Estáticos (`/_next/static`, marca, ícones): cache com revalidação.
 * - GETs do BFF (`/api/*`): network-first com fallback ao último dado bom —
 *   só usado quando a rede FALHA (nunca serve dado velho com rede ok).
 * - Escritas (POST/PUT/…) e cross-origin: nunca cacheadas.
 * - O cache de DADOS é apagado no logout (mensagem CLEAR_DATA do app).
 */
const CACHE = "oc-shell-v3";
const DATA_CACHE = "oc-data-v1";
const OFFLINE_URL = "/offline.html";
// Casca do PWA: offline + ícones + marca (renderizada em toda página) — evita
// repetir essas requisições a cada navegação no 4G.
const PRECACHE = [
  OFFLINE_URL,
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/brand/obracerta-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE && k !== DATA_CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

/* ── Logout: o app manda CLEAR_DATA e os dados pessoais saem do aparelho. ── */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_DATA") {
    event.waitUntil(caches.delete(DATA_CACHE));
  }
});

/* ── Web Push: mostra a notificação e abre o link ao clicar. ── */
self.addEventListener("push", (event) => {
  let data = { title: "ObraCerta", body: "", link: "/notificacoes" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* payload não-JSON: usa os defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: data.link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notificacoes";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Reaproveita uma aba aberta do app se existir; senão abre uma nova.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // só same-origin

  // GETs do BFF: network-first; a última resposta boa fica no DATA_CACHE e só é
  // servida quando a REDE FALHA (leitura offline). Escritas nunca passam por aqui.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request, { cacheName: DATA_CACHE })),
    );
    return;
  }

  if (request.mode === "navigate") {
    // Página navegada com sucesso vira "última versão vista" — sem rede, o
    // usuário reabre e ainda enxerga os dados de quando tinha sinal.
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request, { cacheName: DATA_CACHE })
            .then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/illustrations/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png";
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
