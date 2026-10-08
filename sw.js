// Service Worker: macht PRISMA offline spielbar (registriert in index.html, nur über http(s)).
// Beim Installieren landen alle Dateien des Spiels im Zwischenspeicher. Online kommt die Seite frisch vom Server und
// der Speicher wird nachgeführt; braucht das Netz länger als NETWORK_WAIT, antwortet der Speicher. Offline antwortet
// immer der Speicher. Die Bibliotheken unter vendor/ ändern sich nie (Version im Ordnernamen) und kommen direkt
// aus dem Speicher. Alle anderen Anfragen gehen am Service Worker vorbei.
// Neue Dateien in FILES eintragen (tests/logic.test.mjs prüft, dass alles, was index.html lädt, dort steht).
// CACHE hochzählen, wenn Dateien wegfallen oder vendor/ eine neue Version bekommt: Das räumt die alten Einträge weg.

const CACHE = 'prisma-v1';
const FILES = [
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/jost/jost-latin.woff2',
  'vendor/three-0.147.0/three.min.js',
  'vendor/three-0.147.0/CopyShader.js',
  'vendor/three-0.147.0/LuminosityHighPassShader.js',
  'vendor/three-0.147.0/EffectComposer.js',
  'vendor/three-0.147.0/RenderPass.js',
  'vendor/three-0.147.0/ShaderPass.js',
  'vendor/three-0.147.0/UnrealBloomPass.js',
  'vendor/three-0.147.0/Reflector.js',
];
const NETWORK_WAIT = 3000; // ms

const PAGE = new URL('index.html', self.location).href;
const ROOT = new URL('./', self.location).href;
const VENDOR = new URL('vendor/', self.location).href;
const KNOWN = new Set(FILES.map((f) => new URL(f, self.location).href));

/**
 * Speicherschlüssel einer Anfrage: die Datei ohne Parameter; ./ und index.html?… sind alle die Seite selbst.
 * Alles unter vendor/ zählt mit, auch was erst eine neuere index.html lädt (sonst fehlte es offline, solange
 * noch der alte Service Worker läuft).
 */
function cacheKey(url) {
  const u = new URL(url);
  u.search = '';
  u.hash = '';
  if (u.href === ROOT) return PAGE;
  return KNOWN.has(u.href) || u.href.startsWith(VENDOR) ? u.href : null;
}

/**
 * Antwort ohne Weiterleitungs-Kennzeichen: Leitet der Server index.html weiter (z. B. auf ./), lehnt der Browser
 * eine solche Antwort für einen Seitenaufruf ab.
 */
function clean(response) {
  return response.redirected
    ? new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers })
    : response;
}

self.addEventListener('install', (event) => {
  // cache: 'reload' – am HTTP-Cache des Browsers vorbei, sonst könnte eine veraltete Fassung im Speicher landen.
  // Eine fehlende Datei bricht die Installation ab (dann bleibt der bisherige Stand aktiv).
  event.waitUntil(caches.open(CACHE)
    .then((cache) => Promise.all(FILES.map(async (f) => {
      const response = await fetch(new Request(f, { cache: 'reload' }));
      if (!response.ok) throw new Error(`${f}: ${response.status}`);
      await cache.put(new URL(f, self.location).href, clean(response));
    })))
    .then(() => self.skipWaiting()));
});

// Alte Stände des Speichers aufräumen und die offenen Seiten sofort übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('prisma-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const key = event.request.method === 'GET' ? cacheKey(event.request.url) : null;
  if (!key) return;
  event.respondWith(key.includes('/vendor/') ? fromCache(event, key) : fromNetwork(event, key));
});

async function fromCache(event, key) {
  const hit = await caches.match(key);
  if (hit) return hit;
  const response = clean(await fetch(event.request));
  store(event, key, response);
  return response;
}

async function fromNetwork(event, key) {
  // no-cache: beim Server nachfragen (günstig dank ETag), nicht blind dem HTTP-Cache des Browsers glauben
  const network = fetch(key, { cache: 'no-cache' }).then(clean).then((response) => { store(event, key, response); return response; });
  event.waitUntil(network.catch(() => {})); // den Speicher auch dann nachführen, wenn er schon geantwortet hat
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_WAIT));
  try {
    const response = await Promise.race([network, timeout]);
    if (response) return response;
    return (await caches.match(key)) || await network; // Netz zu langsam: Speicher, sonst weiter warten
  } catch (err) {
    const hit = await caches.match(key); // offline
    if (hit) return hit;
    throw err;
  }
}

/** Gute Antwort im Hintergrund speichern; ein Fehler dabei (z. B. Speicher voll) stört die Antwort nicht. */
function store(event, key, response) {
  if (response.status !== 200) return;
  const copy = response.clone();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => {}));
}
