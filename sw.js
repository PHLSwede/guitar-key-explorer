const CACHE = 'guitar-explorer-v3';
const ASSETS = [
  '/manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // NEVER intercept navigation requests — let them pass through unchanged
  // This is critical for OAuth callbacks which carry tokens in the URL hash
  if (e.request.mode === 'navigate') {
    return;
  }

  // Always use network for API calls
  if (url.hostname.indexOf('supabase') > -1 ||
      url.hostname.indexOf('workers.dev') > -1 ||
      url.hostname.indexOf('anthropic') > -1 ||
      url.hostname.indexOf('googleapis') > -1 ||
      url.hostname.indexOf('fonts.g') > -1 ||
      url.hostname.indexOf('google') > -1) {
    return;
  }

  // Cache static assets only
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (e.request.method === 'GET' && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    })
  );
});
