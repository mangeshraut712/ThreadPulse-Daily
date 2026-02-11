const a = "threadpulse-static-v2026.02.04", i = "threadpulse-dynamic-v2026.02.04", l = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/components/GameBoard.tsx",
  "/src/hooks/useGameStore.ts",
  "/src/hooks/useAIAdaptive.ts",
  "/src/hooks/useGameMaker.ts",
  "/src/hooks/useMobileGestures.ts",
  "/src/hooks/useHapticFeedback.ts",
  "/src/types/index.ts",
  "/packages/wasm/pkg/game_engine.js",
  "/packages/gamemaker/dist/gamemaker.js",
  "/src/data/puzzleBank.mjs"
  // Add other static assets as needed
];
self.addEventListener("install", (e) => {
  console.log("🔧 Service Worker installing ThreadPulse Daily 2026..."), e.waitUntil(
    caches.open(a).then((s) => (console.log("📦 Caching static assets"), s.addAll(l))).then(() => (console.log("✅ Static assets cached successfully"), self.skipWaiting())).catch((s) => {
      console.error("❌ Failed to cache static assets:", s);
    })
  );
});
self.addEventListener("activate", (e) => {
  console.log("🚀 Service Worker activating ThreadPulse Daily 2026..."), e.waitUntil(
    caches.keys().then((s) => Promise.all(
      s.map((o) => {
        if (o !== a && o !== i)
          return console.log("🗑️ Deleting old cache:", o), caches.delete(o);
      })
    )).then(() => (console.log("✅ Service Worker activated"), self.clients.claim()))
  );
});
self.addEventListener("fetch", (e) => {
  const { request: s } = e;
  new URL(s.url), s.method === "GET" && (p(s.url) ? e.respondWith(g(s)) : (y(s.url), e.respondWith(r(s))));
});
async function g(e) {
  try {
    const s = await caches.match(e);
    if (s)
      return console.log("📦 Serving from cache:", e.url), s;
    const o = await fetch(e);
    return o.ok && ((await caches.open(a)).put(e, o.clone()), console.log("💾 Cached new asset:", e.url)), o;
  } catch (s) {
    return console.error("❌ Cache first failed:", s), new Response("Offline - No cached version available", {
      status: 503,
      statusText: "Service Unavailable"
    });
  }
}
async function r(e) {
  try {
    const s = await fetch(e);
    return s.ok && ((await caches.open(i)).put(e, s.clone()), console.log("🌐 Cached API response:", e.url)), s;
  } catch {
    console.log("📱 Network failed, trying cache for:", e.url);
    try {
      const o = await caches.match(e);
      return o ? (console.log("📦 Serving cached API response:", e.url), o) : new Response(JSON.stringify({
        error: "Offline",
        message: "No network connection available",
        offline: !0
      }), {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (o) {
      return console.error("❌ Network first strategy failed completely:", o), new Response("Offline - No network connection available", {
        status: 503,
        statusText: "Service Unavailable"
      });
    }
  }
}
function p(e) {
  return l.some((s) => e.includes(s)) || e.includes(".js") || e.includes(".css") || e.includes(".wasm") || e.includes(".png") || e.includes(".jpg") || e.includes(".svg");
}
function y(e) {
  return e.includes("/api/") || e.includes("reddit.com") || e.includes("developers.reddit.com");
}
self.addEventListener("sync", (e) => {
  console.log("🔄 Background sync triggered:", e.tag), e.tag === "background-sync-guesses" ? e.waitUntil(k()) : e.tag === "background-sync-clues" && e.waitUntil(w());
});
async function k() {
  try {
    const e = await d("offline-guesses");
    for (const s of e)
      try {
        (await fetch("/api/guesses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(s)
        })).ok && console.log("✅ Synced offline guess:", s.id);
      } catch (o) {
        console.error("❌ Failed to sync guess:", s.id, o);
      }
    await f("offline-guesses");
  } catch (e) {
    console.error("❌ Background sync failed:", e);
  }
}
async function w() {
  try {
    const e = await d("offline-clues");
    for (const s of e)
      try {
        (await fetch("/api/clues", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(s)
        })).ok && console.log("✅ Synced offline clue:", s.id);
      } catch (o) {
        console.error("❌ Failed to sync clue:", s.id, o);
      }
    await f("offline-clues");
  } catch (e) {
    console.error("❌ Background sync failed:", e);
  }
}
async function d(e) {
  return new Promise((s, o) => {
    const n = indexedDB.open("ThreadPulseOffline", 1);
    n.onerror = () => o(n.error), n.onsuccess = () => {
      const t = n.result.transaction(["offline-data"], "readonly").objectStore("offline-data").get(e);
      t.onerror = () => o(t.error), t.onsuccess = () => s(t.result || []);
    }, n.onupgradeneeded = () => {
      const c = n.result;
      c.objectStoreNames.contains("offline-data") || c.createObjectStore("offline-data");
    };
  });
}
async function f(e) {
  return new Promise((s, o) => {
    const n = indexedDB.open("ThreadPulseOffline", 1);
    n.onerror = () => o(n.error), n.onsuccess = () => {
      const t = n.result.transaction(["offline-data"], "readwrite").objectStore("offline-data").delete(e);
      t.onerror = () => o(t.error), t.onsuccess = () => s();
    };
  });
}
self.addEventListener("push", (e) => {
  console.log("📬 Push notification received:", e);
  const s = {
    body: "Today's ThreadPulse puzzle is ready!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfMessage: Date.now(),
      url: "/"
    },
    actions: [
      {
        action: "explore",
        title: "Play Now",
        icon: "/icons/checkmark.png"
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png"
      }
    ]
  };
  e.waitUntil(
    self.registration.showNotification("ThreadPulse Daily", s)
  );
});
self.addEventListener("notificationclick", (e) => {
  console.log("🔔 Notification clicked:", e), e.notification.close(), e.action === "explore" && e.waitUntil(
    clients.openWindow("/")
  );
});
console.log("🚀 ThreadPulse Daily 2026 Service Worker loaded");
