/**
 * Service Worker — this is what makes NicheNews work like a real app.
 *
 * A service worker is a script that runs in background, separate from
 * your web page. It enables:
 * - Offline support (cached pages still load without internet)
 * - "Add to Home Screen" install prompt on phones
 * - Background sync (future feature)
 *
 * Think of it as a middleman between your app and the internet.
 */

const CACHE_NAME = "nichenews-v1";

// Files to cache for offline use
const PRECACHE_URLS = ["/", "/manifest.json"];

// When the service worker is first installed
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activate immediately (don't wait for old service worker to finish)
  self.skipWaiting();
});

// When a new service worker takes over
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercept network requests
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Don't cache API calls (we always want fresh news)
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version, but also fetch fresh copy in background
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Update the cache with the fresh version
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => cached); // If offline, fall back to cache

      return cached || fetchPromise;
    })
  );
});
