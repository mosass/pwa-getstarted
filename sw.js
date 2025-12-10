/**
 * Service Worker for PWA Get Started Demo
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'pwa-getstarted-v1';
const CACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-72.png',
    './icons/icon-96.png',
    './icons/icon-128.png',
    './icons/icon-144.png',
    './icons/icon-152.png',
    './icons/icon-192.png',
    './icons/icon-384.png',
    './icons/icon-512.png'
];

// ============================================
// Install Event - Cache Resources
// ============================================
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Cache failed:', error);
            })
    );
});

// ============================================
// Activate Event - Clean Old Caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Removing old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// ============================================
// Fetch Event - Serve from Cache, Fallback to Network
// ============================================
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[ServiceWorker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                console.log('[ServiceWorker] Fetching:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Clone the response since it can only be consumed once
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[ServiceWorker] Fetch failed:', error);
                        
                        // Return a custom offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// ============================================
// Message Event - Handle Messages from Client
// ============================================
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================
// Background Sync (if supported)
// ============================================
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Perform background sync tasks here
            Promise.resolve()
        );
    }
});

// ============================================
// Push Notifications (if supported)
// ============================================
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from PWA Demo',
        icon: './icons/icon-192.png',
        badge: './icons/icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('PWA Get Started', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event);
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});

console.log('[ServiceWorker] Script loaded');
