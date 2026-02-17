// Service Worker for PWA functionality
const CACHE_NAME = 'shumelahire-v1.0.0';
const STATIC_CACHE_NAME = 'shumelahire-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'shumelahire-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/applications',
  '/interviews',
  '/analytics',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/globals.css',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/applications/statistics',
  '/api/interviews/statistics',
  '/api/analytics/recruitment-metrics'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('shumelahire-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response for caching
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
        }
        
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Handle navigation requests (pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return caches.match('/offline');
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful API responses for statistics endpoints
    if (networkResponse.status === 200 && shouldCache) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      // Set expiration for API cache (5 minutes)
      const responseWithExpiry = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...networkResponse.headers,
          'sw-cache-timestamp': Date.now().toString()
        }
      });
      cache.put(request, responseWithExpiry.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache for statistics endpoints
    if (shouldCache) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Check if cache is still valid (5 minutes)
        const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (!cacheTimestamp || (now - parseInt(cacheTimestamp)) < fiveMinutes) {
          return cachedResponse;
        }
      }
    }
    
    // Return a fallback response for failed API calls
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true,
        message: 'This data is not available offline'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    // Return a placeholder or throw error
    throw error;
  }
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-applications') {
    event.waitUntil(syncApplications());
  } else if (event.tag === 'background-sync-interviews') {
    event.waitUntil(syncInterviews());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'ShumelaHire',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      tag: 'shumelahire-notification',
      renotify: true,
      requireInteraction: false,
      silent: false
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            const targetUrl = event.notification.data?.url || '/dashboard';
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// Background sync functions
async function syncApplications() {
  try {
    // Retrieve pending offline actions from IndexedDB
    const pendingActions = await getOfflineActions('applications');
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from offline storage
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to sync application action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed for applications:', error);
  }
}

async function syncInterviews() {
  try {
    const pendingActions = await getOfflineActions('interviews');
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to sync interview action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed for interviews:', error);
  }
}

// Helper functions for IndexedDB operations
async function getOfflineActions(type) {
  // Implement IndexedDB operations for offline actions
  return [];
}

async function removeOfflineAction(id) {
  // Implement IndexedDB removal
  return true;
}

console.log('[SW] Service Worker script loaded');
