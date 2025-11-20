/*
 * ==========================================================
 * RS Dyno Sport V3.6.6
 * OFFLINE SERVICE WORKER (sw.js)
 *
 * Dieser Service Worker implementiert eine "Cache-First"-Strategie,
 * damit die PWA auch ohne Internetverbindung funktioniert
 * (z.B. wenn das Handy mit dem ESP8266-Hotspot verbunden ist).
 * ==========================================================
 */

const CACHE_NAME = 'rs-dyno-v5.0-cache-v1';

// Alle Dateien, die für die Offline-Nutzung benötigt werden.
const FILES_TO_CACHE = [
  './', 
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/database.js',
  'js/app.js',
  'js/dyno.js',
  'js/logbook.js',
  'js/championship.js'
];

// 1. Event: 'install'
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: App-Dateien werden im Cache gespeichert...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 2. Event: 'activate'
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Event: 'fetch'
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});