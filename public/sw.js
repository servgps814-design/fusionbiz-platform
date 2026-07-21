// ─── Service Worker ────────────────────────────────────────────────────────────
// This Service Worker enables offline support and caching for the FusionBiz Platform

const CACHE_NAME = 'fusionbiz-v1'
const ASSETS_CACHE = 'fusionbiz-assets-v1'
const API_CACHE = 'fusionbiz-api-v1'

// ─── Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
]

// ─── Install Event: Cache assets
self.addEventListener('install', (event: ExtendedEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).then(() => {
        return self.skipWaiting()
      })
    })
  )
})

// ─── Activate Event: Clean up old caches
self.addEventListener('activate', (event: ExtendedEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName)
          }
        })
      ).then(() => {
        return self.clients.claim()
      })
    })
  )
})

// ─── Fetch Event: Network-first for API, cache-first for assets
self.addEventListener('fetch', (event: ExtendedEvent) => {
  const url = new URL(event.request.url)

  // ─── Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // ─── API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // ─── Cache successful API responses
          if (response.status === 200) {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // ─── Fallback to cache if network fails
          return caches.match(event.request).then((cached) => {
            return cached || new Response('Offline - cached response not available', { status: 503 })
          })
        })
    )
  }

  // ─── Static assets: cache-first with network fallback
  else if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (!response || response.status !== 200) {
              return response
            }
            const clone = response.clone()
            caches.open(ASSETS_CACHE).then((cache) => {
              cache.put(event.request, clone)
            })
            return response
          })
        )
      })
    )
  }

  // ─── HTML pages: network-first
  else if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response('Offline - page not available', { status: 503 })
          })
        })
    )
  }
})

// ─── Background Sync (when back online)
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  try {
    const cache = await caches.open(API_CACHE)
    // Implement your offline sync logic here
    return cache
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

// ─── Type definitions
interface ExtendedEvent extends Event {
  waitUntil(promise: Promise<any>): void
}

export {}
