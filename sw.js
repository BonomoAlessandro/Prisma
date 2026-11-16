// Service Worker: macht PRISMA offline spielbar (registriert in index.html, nur über http(s)).
// Beim Installieren landen alle Dateien des Spiels im Zwischenspeicher. Online kommt die Seite frisch vom Server und
// der Speicher wird nachgeführt; braucht das Netz länger als NETWORK_WAIT, antwortet der Speicher. Offline antwortet
// immer der Speicher. Die Bibliotheken unter vendor/ (Version im Ordnernamen) und die Teile der Skyboxen (Stand im
// Dateinamen) ändern sich nie und kommen direkt aus dem Speicher – auch wenn der Server erst aufwachen muss. Alle
// anderen Anfragen gehen am Service Worker vorbei.
// Die Listen FILES und LAZY entstehen beim Build (vite.config.mjs, npm run build) aus dem, was in dist/ liegt: alles
// kommt nach FILES, ausser sw.js selbst und den Lizenztexten; Teile der Skyboxen ohne precache im Register
// backgrounds/skies.js (tools/blender/pack.mjs) kommen nach LAZY (gespeichert erst beim ersten Gebrauch, nicht jedes
// Gerät braucht sie). Ihr Stand steht im Dateinamen; beim Aktivieren verschwindet aus dem Speicher, was keine der Listen
// mehr kennt (alte Stände). SKIES (Stand des Registers, von pack.mjs nachgeführt) ändert diese Datei mit jedem neuen
// Register: So holt jeder Browser den neuen Stand. Dateien mit Hash im Namen aus dem Build (assets/) ändern sich nie
// und kommen wie vendor/ direkt aus dem Speicher.
// CACHE hochzählen, wenn vendor/ eine neue Version bekommt: Das räumt die alten Einträge weg.
// APP_VERSION (Datum und Ticketstand) setzt der Build aus appVersion in package.json ein, wie in index.html; sie wird
// mit jedem Stand für einen Handy-Durchlauf nachgeführt: Die geänderte sw.js lässt jeden Browser beim nächsten Besuch
// einen neuen Service Worker installieren, der alle FILES frisch vom Server holt. Welche Fassung läuft, zeigt die
// Leistungsanzeige (Taste F); ist es noch die alte (das Netz brauchte länger als NETWORK_WAIT), bringt ein Neuladen die
// neue. Die Quelldatei selbst läuft nicht (die Listen sind leer); der Dev-Server registriert keinen Service Worker.

const APP_VERSION = '__APP_VERSION__';
const CACHE = 'prisma-v1';
const SKIES = 'd892a061';
const FILES = []; // beim Build gefüllt
const LAZY = []; // beim Build gefüllt
const NETWORK_WAIT = 3000; // ms

const PAGE = new URL('index.html', self.location).href;
const ROOT = new URL('./', self.location).href;
const VENDOR = new URL('vendor/', self.location).href;
const SKY_PARTS = new URL('backgrounds/', self.location).href; // darin je Skybox ein Ordner; skies.js selbst nicht
const ASSETS = new URL('assets/', self.location).href; // vom Build, mit Hash im Namen
const KNOWN = new Set([...FILES, ...LAZY].map((f) => new URL(f, self.location).href));
const fixed = (key) => key.startsWith(VENDOR) || key.startsWith(ASSETS) || (key.startsWith(SKY_PARTS) && key.slice(SKY_PARTS.length).includes('/'));

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

// Alte Stände des Speichers aufräumen (andere Speicher, Dateien, die keine Liste mehr kennt) und die offenen Seiten
// sofort übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('prisma-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => caches.open(CACHE))
    .then((cache) => cache.keys().then((requests) => Promise.all(requests
      .filter((r) => !KNOWN.has(r.url) && !r.url.startsWith(VENDOR))
      .map((r) => cache.delete(r)))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const key = event.request.method === 'GET' ? cacheKey(event.request.url) : null;
  if (!key) return;
  event.respondWith(fixed(key) ? fromCache(event, key) : fromNetwork(event, key));
});

async function fromCache(event, key) {
  const hit = await caches.match(key);
  if (hit) return hit;
  const response = clean(await fetch(event.request));
  store(event, key, response);
  return response;
}

async function fromNetwork(event, key) {
  // Mit den Parametern der Anfrage holen, gespeichert wird ohne: Manche Server brauchen sie (der eingebaute Server
  // von IntelliJ antwortet ohne sein Zugangszeichen _ijt mit 404).
  // no-cache: beim Server nachfragen (günstig dank ETag), nicht blind dem HTTP-Cache des Browsers glauben
  const network = fetch(event.request.url, { cache: 'no-cache' }).then(clean).then((response) => { store(event, key, response); return response; });
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
