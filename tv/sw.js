// JMB TV app shell. Third-party streams are never cached or relayed.
const VERSION = "jmbtv-world-v18";
const SHELL = [
  "./",
  "./index.html",
  "./app.js?v=18",
  "./directory.css?v=18",
  "/assets/branding/jmb-tv-logo.svg",
  "/favicon/favicon.svg",
  "/favicon/media.webmanifest"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION)
    .then(cache => Promise.all(SHELL.map(path => cache.add(path).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith("jmbtv-") && key !== VERSION).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const shellPaths = SHELL.map(path => new URL(path, self.location.href).pathname);
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch(request);
        if (response && response.ok) await cache.put(url.pathname, response.clone());
        return response;
      } catch (error) {
        return await cache.match(url.pathname) || await cache.match("./index.html") ||
          new Response("JMB TV is offline. Reconnect and reload.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }
  if (shellPaths.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request, {ignoreSearch:true});
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
