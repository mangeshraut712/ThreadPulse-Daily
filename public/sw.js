// PWA Service Worker for ThreadPulse Daily 2026
// Provides offline capabilities and performance optimizations

const CACHE_NAME = 'threadpulse-daily-v2026.02.04';
const STATIC_CACHE = 'threadpulse-static-v2026.02.04';
const DYNAMIC_CACHE = 'threadpulse-dynamic-v2026.02.04';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/GameBoard.tsx',
  '/src/hooks/useGameStore.ts',
  '/src/hooks/useAIAdaptive.ts',
  '/src/hooks/useGameMaker.ts',
  '/src/hooks/useMobileGestures.ts',
  '/src/hooks/useHapticFeedback.ts',
  '/src/types/index.ts',
  '/packages/wasm/pkg/game_engine.js',
  '/packages/gamemaker/dist/gamemaker.js',
  '/src/data/puzzleBank.mjs',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing ThreadPulse Daily 2026...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating ThreadPulse Daily 2026...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request.url)) {
    // Static assets - cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // API requests - network first strategy
    event.respondWith(networkFirst(request));
  } else {
    // Other requests - try network then cache
    event.respondWith(networkFirst(request));
  }
});

// Cache first strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('💾 Cached new asset:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first failed:', error);
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network first strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('🌐 Cached API response:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📱 Network failed, trying cache for:', request.url);
    
    try {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        console.log('📦 Serving cached API response:', request.url);
        return cachedResponse;
      }
      
      // Return offline fallback for API requests
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'No network connection available',
        offline: true
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (cacheError) {
      console.error('❌ Network first strategy failed completely:', cacheError);
      return new Response('Offline - No network connection available', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  }
}

// Helper functions
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('.js') ||
         url.includes('.css') ||
         url.includes('.wasm') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg');
}

function isAPIRequest(url) {
  return url.includes('/api/') || 
         url.includes('reddit.com') ||
         url.includes('developers.reddit.com');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-guesses') {
    event.waitUntil(syncOfflineGuesses());
  } else if (event.tag === 'background-sync-clues') {
    event.waitUntil(syncOfflineClues());
  }
});

// Sync offline guesses when back online
async function syncOfflineGuesses() {
  try {
    const offlineGuesses = await getOfflineData('offline-guesses');
    
    for (const guess of offlineGuesses) {
      try {
        const response = await fetch('/api/guesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(guess)
        });
        
        if (response.ok) {
          console.log('✅ Synced offline guess:', guess.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync guess:', guess.id, error);
      }
    }
    
    // Clear synced guesses
    await clearOfflineData('offline-guesses');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Sync offline clues when back online
async function syncOfflineClues() {
  try {
    const offlineClues = await getOfflineData('offline-clues');
    
    for (const clue of offlineClues) {
      try {
        const response = await fetch('/api/clues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clue)
        });
        
        if (response.ok) {
          console.log('✅ Synced offline clue:', clue.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync clue:', clue.id, error);
      }
    }
    
    // Clear synced clues
    await clearOfflineData('offline-clues');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getOfflineData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ThreadPulseOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get(key);
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result || []);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data');
      }
    };
  });
}

async function clearOfflineData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ThreadPulseOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const deleteRequest = store.delete(key);
      
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  const options = {
    body: 'Today\'s ThreadPulse puzzle is ready!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfMessage: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ThreadPulse Daily', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 ThreadPulse Daily 2026 Service Worker loaded');
