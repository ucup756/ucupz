// ============================================================
// sw.js — Service Worker UcupzConvert
// Ganti CACHE_VERSION setiap kali ada update agar SW refresh
// ============================================================

const CACHE_VERSION = "ucupz-v1";
const CACHE_STATIC  = CACHE_VERSION + "-static";

// File yang di-cache untuk offline
const STATIC_FILES = [
  "/",
  "/index.html",
  "/404.html",
  "/manifest.json",
  "/css/style.css",
  "/css/pages.css",
  "/js/config.js",
  "/js/auth.js",
  "/js/ui.js",
  "/js/pages/converter.js",
  "/pages/profil.html",
  "/pages/converter.html",
  "/pages/qrcode.html",
  "/pages/share.html",
  "/pages/setting.html",
  "/favicon.svg",
];

// ── Install: cache semua file statis ─────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
  // Langsung aktif tanpa tunggu tab lama ditutup
  self.skipWaiting();
});

// ── Activate: hapus cache lama ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Ambil alih semua tab yang terbuka
  self.clients.claim();
});

// ── Fetch: Network first, fallback ke cache ───────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request ke API, Google, atau eksternal
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("google") ||
    url.hostname.includes("peerjs") ||
    url.hostname.includes("cdnjs") ||
    url.hostname.includes("unpkg") ||
    url.hostname.includes("fonts")
  ) {
    return; // Biarkan browser handle langsung
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Simpan response terbaru ke cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: ambil dari cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/index.html");
        });
      })
  );
});

// ── Update detection: beritahu app ada versi baru ─────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
