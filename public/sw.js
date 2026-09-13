const CACHE_NAME = 'femperf-v6-push-active';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/gil-vicente-crest.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event: skip waiting immediately and cache assets safely
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe non-blocking asset caching: never fail service worker installation if one asset errors
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res && res.status === 200) {
                return cache.put(url, res);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
});

// Activate event: purge old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Allow client app to trigger instant update takeover
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

// Fetch event: Network-First strategy for HTML pages, NextJS chunks, and API routes
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass cache completely for credentials API so mobile devices always get fresh cloud PINs
  if (url.pathname === '/api/credentials') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-First for HTML navigation pages, API routes, and Next.js assets
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle incoming Web Push notifications on mobile devices (App closed or running in background)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '⚽ Gil Vicente FC • Lembrete';
  const options = {
    body: data.body || 'Tens questionários pendentes por responder hoje!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 100, 300],
    tag: data.tag || 'gvfc-reminder-push',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      date: new Date().toISOString(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle clicking on mobile notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url === targetUrl || client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client && client.url !== targetUrl) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

