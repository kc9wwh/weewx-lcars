/* LCARS skin for WeeWX: Progressive Web App service worker.
 * Network-first for live weather HTML/CSS/JS/data; cache-first for static bundled assets. */
'use strict';

var SHELL_CACHE = 'lcars-shell-v2';
var RUNTIME_CACHE = 'lcars-runtime-v1';

var SHELL_ASSETS = [
  './',
  './index.html',
  './lcars.css',
  './lcars.js',
  './favicon.svg',
  './manifest.webmanifest',
  './fonts/antonio-latin-400-normal.woff2',
  './fonts/antonio-latin-600-normal.woff2',
  './fonts/antonio-latin-700-normal.woff2',
  './vendor/apexcharts.min.js',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return Promise.all(
        SHELL_ASSETS.map(function (asset) {
          return cache.add(new Request(asset, { cache: 'reload' })).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k !== SHELL_CACHE && k !== RUNTIME_CACHE;
        }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isStaticAsset(pathname) {
  return /\/(fonts|vendor|icons)\//.test(pathname) || /\/favicon\.svg$/.test(pathname);
}

function isShellMutable(pathname) {
  return /\/lcars\.(css|js)$/.test(pathname) || /\/manifest\.webmanifest$/.test(pathname);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(SHELL_CACHE).then(function (cache) { cache.put(req, copy); }).catch(function () {});
          }
          return res;
        });
      })
    );
    return;
  }

  var targetCache = isShellMutable(url.pathname) ? SHELL_CACHE : RUNTIME_CACHE;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(targetCache).then(function (cache) { cache.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (exact) {
        return exact || caches.match(req, { ignoreSearch: true });
      }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === 'navigate') {
          return caches.match('./index.html').then(function (idx) {
            return idx || caches.match('./');
          });
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
