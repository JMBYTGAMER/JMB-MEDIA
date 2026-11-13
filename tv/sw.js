// JMB TV channel directory: caches only the app shell and its own static assets.
const VERSION = "jmbtv-directory-v15";
const SHELL = [
  "./",
  "./index.html",
  "./app.js?v=15",
  "./directory.css",
  "/assets/css/styles.css",
  "/assets/css/theme.css",
  "/assets/css/premium.css",
  "/assets/js/common.js",
  "/assets/branding/jmb-tv-logo.svg",
  "/favicon/site.webmanifest?v=6",
  "/favicon/jmb-app-icon.svg?v=6"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.all(SHELL.map(path => cache.add(path).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("jmbtv-") && key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const fresh = await fetch(request);
        if (fresh.ok) await cache.put(url.pathname, fresh.clone());
        return fresh;
      } catch (error) {
        return await cache.match(url.pathname) || await cache.match("./index.html") ||
          new Response("JMB TV is offline. Reconnect and reload.", {
            status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    })());
    return;
  }
  if (SHELL.some(path => new URL(path, self.location.href).href === request.url.split("?")[0])) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const fresh = await fetch(request);
      if (fresh.ok) await cache.put(request, fresh.clone());
      return fresh;
    })());
  }
});
