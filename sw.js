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

const CACHE_NAME = 'rs-dyno-v3.6.6-cache-v1';

// Alle Dateien, die für die Offline-Nutzung benötigt werden.
// WICHTIG: Fügen Sie hier die Icon-Dateien hinzu, falls Sie diese hochgeladen haben.
const FILES_TO_CACHE = [
  './', // Wichtig, um den Startpunkt (index.html) abzufangen
  'index.html',
  'manifest.json'
  // Optional, falls Sie diese erstellt haben:
  // 'icon-192x192.png',
  // 'icon-512x512.png'
];

// 1. Event: 'install'
// Wird ausgelöst, wenn der Service Worker installiert wird.
// Wir öffnen den Cache und fügen alle App-Dateien hinzu.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: App-Dateien werden im Cache gespeichert...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Zwingt den neuen Service Worker, sofort aktiv zu werden
        return self.skipWaiting();
      })
  );
});

// 2. Event: 'activate'
// Wird ausgelöst, wenn der Service Worker aktiv wird.
// Wir löschen alte Caches, falls sich der CACHE_NAME ändert.
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
      // Übernimmt die Kontrolle über alle offenen Seiten
      return self.clients.claim();
    })
  );
});

// 3. Event: 'fetch'
// Wird jedes Mal ausgelöst, wenn die App eine Datei laden will (z.B. index.html).
// Dies ist der "Offline-First"-Teil.
self.addEventListener('fetch', (event) => {
  // Wir antworten auf die Anfrage
  event.respondWith(
    // 1. Versuche, die Datei im Cache zu finden
    caches.match(event.request)
      .then((response) => {
        // Wenn die Datei im Cache gefunden wurde, gib sie zurück
        if (response) {
          console.log('Service Worker: Lade aus Cache:', event.request.url);
          return response;
        }

        // 2. Wenn nicht im Cache, versuche, sie aus dem Netzwerk zu laden
        // (Dies funktioniert nur, wenn Internet vorhanden ist, z.B. bei der Erstinstallation)
        console.log('Service Worker: Lade aus Netzwerk:', event.request.url);
        return fetch(event.request);
      })
  );
});
