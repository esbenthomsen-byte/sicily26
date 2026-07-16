const CACHE = "sicily26-v5";
/* kun index.html caches ved install — "./" ville downloade de samme ~15 MB én gang til */
const ASSETS = ["./index.html", "./manifest.webmanifest", "./ikon-192.png", "./ikon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const vaert = new URL(e.request.url).hostname;
  if (vaert === "api.github.com" || vaert === "api.anthropic.com") return;
  // navigationer: cache først (øjeblikkelig åbning), frisk udgave hentes i baggrunden til NÆSTE åbning
  if (e.request.mode === "navigate") {
    e.respondWith(
      caches.match("./index.html").then(cached => {
        const net = fetch(e.request)
          .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return res; })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r =>
      r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })
    )
  );
});
