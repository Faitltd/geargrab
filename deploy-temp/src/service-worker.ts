/**
 * Service Worker for GearGrab PWA
 * Provides offline functionality and caching strategies
 */

import { build, files, version } from '$service-worker';

// TypeScript declarations for service worker
declare const self: ServiceWorkerGlobalScope;

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Assets to cache on install
const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
];

// Install event - cache assets
self.addEventListener('install', (event: ExtendableEvent) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);

    console.log(`🔄 Service Worker: Caching ${ASSETS.length} assets...`);

    // Add files individually to handle failures gracefully
    const failedAssets: string[] = [];
    const successfulAssets: string[] = [];

    for (const asset of ASSETS) {
      try {
        // Verify the asset exists before caching
        const response = await fetch(asset);
        if (response.ok) {
          await cache.put(asset, response);
          successfulAssets.push(asset);
        } else {
          console.warn(`❌ Asset returned ${response.status}: ${asset}`);
          failedAssets.push(asset);
        }
      } catch (error) {
        console.warn(`❌ Failed to cache asset: ${asset}`, error);
        failedAssets.push(asset);
      }
    }

    console.log(`✅ Service Worker: Cached ${successfulAssets.length} assets successfully`);
    if (failedAssets.length > 0) {
      console.warn(`⚠️ Service Worker: Failed to cache ${failedAssets.length} assets:`, failedAssets);
    }
  }

  event.waitUntil(addFilesToCache());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event: FetchEvent) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // Serve build files from cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);
      if (response) {
        return response;
      }
    }

    // Try the network first for API calls and dynamic content
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await fetch(event.request);
        return response;
      } catch {
        // If network fails, return a custom offline response for API calls
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            message: 'This feature requires an internet connection' 
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // For other requests, try cache first, then network
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch(event.request);
      
      // Cache successful responses for future use
      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }
      
      return response;
    } catch {
      // Return a custom offline page for navigation requests
      if (event.request.mode === 'navigate') {
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
        
        // Fallback offline response
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>GearGrab - Offline</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, sans-serif; 
                  text-align: center; 
                  padding: 2rem;
                  background: linear-gradient(135deg, #10b981, #059669);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-direction: column;
                }
                h1 { margin-bottom: 1rem; }
                p { margin-bottom: 2rem; opacity: 0.9; }
                button {
                  background: white;
                  color: #059669;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 0.5rem;
                  font-weight: 600;
                  cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div>
                <h1>🏔️ GearGrab</h1>
                <h2>You're offline</h2>
                <p>Check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
          </html>
          `,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
      }
      
      // For other requests, return a generic error
      return new Response('Offline', { status: 503 });
    }
  }

  event.respondWith(respond());
});

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued actions when back online
  // This could include sending messages, updating bookings, etc.
  console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/geargrab-logo.png',
    badge: '/geargrab-logo.png',
    data: data.data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(event.notification.data.url || '/')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
    }
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Message handling for communication with the main app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
