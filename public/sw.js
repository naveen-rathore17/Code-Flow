// Bump this string every time you change files that ship inside APP_SHELL
// (index.html, manifest, icons). It forces old caches to be deleted.
const CACHE_VERSION = "v2";
const CACHE_NAME = `codersvibe-shell-${CACHE_VERSION}`;

// Minimal shell we want available offline. We do NOT hard-cache
// background-images.png here anymore — it's handled by the
// network-first path below so updates show up immediately.
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/faviconn-clean.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Vite's build output (JS/CSS chunks) is content-hashed — the filename
// itself changes whenever the content changes, so it's 100% safe to
// cache these forever with a cache-first strategy.
function isHashedBuildAsset(url) {
  return url.pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // --- Hashed build assets: cache-first (immutable) ---
  if (isHashedBuildAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // --- Everything else: network-first ---
  // This covers index.html, manifest.webmanifest, favicon,
  // and background-images.png / background.jpg / etc.
  // Always try the network so a newly-uploaded background image
  // (same filename, new content) is picked up on the very next
  // reload instead of being stuck behind a stale cache entry.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/index.html"))
      )
  );
});