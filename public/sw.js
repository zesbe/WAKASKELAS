const CACHE_NAME = 'kas-kelas-v1'
const DYNAMIC_CACHE = 'kas-kelas-dynamic-v1'

const urlsToCache = [
  '/',
  '/kas-kelas',
  '/wali-murid',
  '/payment-center',
  '/reminder-tagihan',
  '/laporan-keuangan',
  '/pengeluaran',
  '/offline.html',
  '/manifest.json'
]

// Install Service Worker
self.addEventListener('install', event => {
  console.log('SW: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache opened')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('SW: Skip waiting')
        return self.skipWaiting()
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('SW: Activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('SW: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('SW: Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch Strategy: Network First with Cache Fallback
self.addEventListener('fetch', event => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      networkFirstWithCacheFallback(request)
    )
    return
  }

  // Handle page requests
  event.respondWith(
    cacheFirstWithNetworkFallback(request)
  )
})

// Network First Strategy (for API calls)
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('SW: Network failed, trying cache', error)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Offline - Data tidak tersedia',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Cache First Strategy (for pages and static assets)
async function cacheFirstWithNetworkFallback(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, networkResponse)
        })
      }
    }).catch(() => {
      // Network failed, but we have cache
    })
    
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('SW: Network failed, no cache available', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-kas') {
    console.log('SW: Background sync triggered')
    event.waitUntil(syncOfflineData())
  }
})

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    const offlineData = await getOfflineData()
    
    for (const data of offlineData) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        })
        
        // Remove from offline storage after successful sync
        await removeOfflineData(data.id)
        
        // Notify client about successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              data: data
            })
          })
        })
      } catch (error) {
        console.error('SW: Failed to sync data', error)
      }
    }
  } catch (error) {
    console.error('SW: Background sync failed', error)
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('SW: Push received')
  
  const options = {
    body: event.data ? event.data.text() : 'Notifikasi baru dari Kas Kelas',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Aplikasi',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icons/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Kas Kelas Notification', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Utility functions for offline storage
async function getOfflineData() {
  // This would typically use IndexedDB
  return []
}

async function removeOfflineData(id) {
  // Remove from IndexedDB
  return true
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'kas-sync') {
    event.waitUntil(syncOfflineData())
  }
})
