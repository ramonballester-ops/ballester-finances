/* Ballester Finances — service worker. Network-first for shell + data (updates land
   immediately when online), cache-first for libraries and icons → works offline in flight. */
const VERSION = "bf-v17";
const CACHE = "ballester-finances-" + VERSION;
const PRECACHE = ["./", "./index.html", "./chart.umd.js", "./sankey.js", "./data.enc.json",
                  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];
const NETWORK_FIRST = /(\/$|index\.html$|data\.enc\.json)/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
      }))
    );
  }
});
