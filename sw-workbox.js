/**
 * Service Worker for PWA Get Started Demo (Workbox Version)
 * Uses Google Workbox library for caching and offline functionality
 * 
 * Compare with sw.js (vanilla implementation) to see the difference
 */

// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Check if Workbox loaded successfully
if (workbox) {
    console.log('[Workbox] Workbox is loaded 🎉');
} else {
    console.log('[Workbox] Workbox failed to load 😬');
}

// ============================================
// Workbox Configuration
// ============================================
workbox.setConfig({
    debug: true // Set to false in production
});

// Set custom cache names
workbox.core.setCacheNameDetails({
    prefix: 'pwa-getstarted',
    suffix: 'v1',
    precache: 'precache',
    runtime: 'runtime'
});

// ============================================
// Precaching - Similar to CACHE_URLS in sw.js
// ============================================
// Workbox precaches these files during install and manages versioning automatically
workbox.precaching.precacheAndRoute([
    { url: './', revision: '1' },
    { url: './index.html', revision: '1' },
    { url: './styles.css', revision: '1' },
    { url: './app.js', revision: '1' },
    { url: './manifest.json', revision: '1' },
    { url: './icons/icon-72.png', revision: '1' },
    { url: './icons/icon-96.png', revision: '1' },
    { url: './icons/icon-128.png', revision: '1' },
    { url: './icons/icon-144.png', revision: '1' },
    { url: './icons/icon-152.png', revision: '1' },
    { url: './icons/icon-192.png', revision: '1' },
    { url: './icons/icon-384.png', revision: '1' },
    { url: './icons/icon-512.png', revision: '1' }
]);

// ============================================
// Skip Waiting & Clients Claim
// Equivalent to self.skipWaiting() and self.clients.claim() in sw.js
// ============================================
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// ============================================
// Runtime Caching Strategies
// ============================================

// Cache-First Strategy for images (similar to our fetch handler in sw.js)
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
        cacheName: 'pwa-getstarted-images',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Stale-While-Revalidate for CSS and JS (more aggressive update checking)
workbox.routing.registerRoute(
    ({ request }) => 
        request.destination === 'style' || 
        request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'pwa-getstarted-assets',
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Network-First for HTML pages (ensures fresh content when online)
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'pwa-getstarted-pages',
        networkTimeoutSeconds: 3,
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// ============================================
// Offline Fallback
// Similar to returning index.html in sw.js when navigation fails offline
// ============================================
workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.mode === 'navigate') {
        return workbox.precaching.matchPrecache('./index.html');
    }
    return Response.error();
});

// ============================================
// Background Sync (if supported)
// Workbox makes background sync much easier!
// ============================================
// Register a route that uses background sync for failed POST requests
// This is more powerful than the vanilla sw.js implementation
if ('BackgroundSyncPlugin' in workbox) {
    const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('syncQueue', {
        maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
        onSync: async ({ queue }) => {
            console.log('[Workbox] Background sync triggered');
            let entry;
            while ((entry = await queue.shiftRequest())) {
                try {
                    await fetch(entry.request);
                    console.log('[Workbox] Replay successful for:', entry.request.url);
                } catch (error) {
                    console.error('[Workbox] Replay failed:', error);
                    await queue.unshiftRequest(entry);
                    throw error;
                }
            }
        },
    });

    // Example: Queue failed POST requests for retry when online
    workbox.routing.registerRoute(
        ({ request }) => request.method === 'POST',
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin],
        }),
        'POST'
    );
}

// ============================================
// Push Notifications (same as vanilla sw.js)
// Workbox doesn't handle push notifications, so we use the same approach
// ============================================
self.addEventListener('push', (event) => {
    console.log('[Workbox SW] Push received:', event);
    
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
        self.registration.showNotification('PWA Get Started (Workbox)', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Workbox SW] Notification click:', event);
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});

// ============================================
// Message Event - Handle Messages from Client
// ============================================
self.addEventListener('message', (event) => {
    console.log('[Workbox SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[Workbox SW] Script loaded');
