self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin && u.hostname !== 'www.gstatic.com') return;
  e.respondWith(
    fetch(e.request, { cache: 'reload' }).then(function (r) {
      if (r && r.ok) {
        var copy = r.clone();
        caches.open('hilali-v4').then(function (c) { c.put(e.request, copy); });
      }
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
