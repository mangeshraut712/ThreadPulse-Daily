import { BUILT_ASSETS } from "./precache-manifest.js";
import {
  isStaticAsset,
  notificationDestination,
  precacheRequestUrls,
  relativeToScope,
  urlInScope,
} from "./sw-scope.js";

const CACHE_NAME = "threadpulse-daily-v2026.11.25-assets";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(precacheRequestUrls(self.registration.scope, BUILT_ASSETS)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  const shell = urlInScope(self.registration.scope, "index.html");
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(shell, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(shell);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request.url)) return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const relative = relativeToScope(self.registration.scope, url.pathname);
  if (relative && isStaticAsset(relative)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = notificationDestination(
    self.registration.scope,
    self.location.origin,
    event.notification?.data?.url
  );
  event.waitUntil(clients.openWindow(destination));
});
