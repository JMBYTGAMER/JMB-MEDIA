// JMB TV media hub — offline app shell for the main site.
const CACHE = "jmb-tv-hub-v6";
const SHELL = [
  "/",
  "/index.html",
  "/newspaper/",
  "/radio/",
  "/social/",
  "/legal/",
  "/assets/css/legal.css",
  "/tv/app.js?v=17",
  "/tv/directory.css",
  "/tv/sw.js",
  "/social/app.js?v=2",
  "/newspaper/app.js?v=2",
  "/tv/",
  "/tv/directory.css?v=17",
  "/newspaper/app.js",
  "/radio/app.js",
  "/social/app.js",
  "/tv/index.html",
  "/tv/app.js?v=17",
  "/tv/directory.css",
  "/tv/sw.js",
  "/legal/",
  "/assets/css/legal.css",
  "/social/app.js?v=2",
  "/newspaper/app.js?v=2",
  "/assets/css/styles.css",
  "/assets/css/theme.css",
  "/assets/css/premium.css",
  "/assets/js/common.js",
  "/assets/branding/jmb-tv-logo.svg",
  "/favicon/favicon.svg",
  "/favicon/media.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("jmb-tv-hub-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function updateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return cache.match(request);
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(url.pathname, response.clone());
          return response;
        }
      } catch (error) {}
      return await cache.match(url.pathname) ||
        await cache.match(url.pathname.replace(/\/$/, "/index.html")) ||
        await cache.match("/") ||
        new Response("JMB TV is offline. Reconnect and reload this page.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
    })());
    return;
  }

  const path = url.pathname;
  if (/\.(css|js|svg|webmanifest|png|jpe?g|webp|woff2?)$/i.test(path)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const refreshed = updateCache(request, cache);
      return cached || await refreshed;
    })());
  }
});
