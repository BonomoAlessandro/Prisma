// Build mit Vite (Ticket 02 von .scratch/umbau/): npm run dev (Dev-Server auf localhost), npm run build (fertiges Spiel
// in dist/), npm run preview (dist/ über http). base './': relative Pfade, damit dieselbe Ausgabe auf GitHub Pages unter
// /Prisma/, in Capacitor und in Electron läuft.
//
// Das Spiel sind ES-Module unter src/ (seit Ticket 04), Einstieg src/main.ts: Im Build bündelt Vite sie zu einer
// verkleinerten Datei unter assets/ (mit Source-Map daneben, so zeigen Fehlerorte und Haltepunkte in den DevTools auf
// die Module), im Dev-Server liefert es sie einzeln. Der Stil (src/stil/index.css) wird eine Datei unter assets/, die
// Schrift daraus ebenso (unverkleinert, cssMinify: false). Was index.html direkt lädt (three.js r147 in vendor/, das
// Register der Skyboxen, die Icons), trägt das Attribut vite-ignore: Vite lässt es stehen, wie es ist (und entfernt nur
// das Attribut). Die Worker sind eigene Module (src/*-worker.ts: Hall, Skyboxen, Bretter): new Worker(new URL(…)) in
// src/seite/ton.js, himmel/skybox.js und texturen.js, Vite macht daraus im Build assets/<name>-worker-<hash>.js.
//
// Beim Build kommen dazu (Plugin prisma):
// - die statischen Dateien unverändert nach dist/: vendor/, icons/, favicon.svg, manifest.webmanifest und aus
//   backgrounds/ das Register skies.js mit den Teilen, die es nennt (alte Stände bleiben weg). Was Vite schon selbst
//   aus der Quelle übernommen hat (die Schrift), wird nicht noch einmal kopiert;
// - der <link> des Stils an seine Stelle in der Quelle (stilZurueck);
// - sw.js mit den Listen FILES und LAZY aus dem, was in dist/ liegt (Regeln im Kopf von sw.js);
// - APP_VERSION aus package.json (appVersion, die einzige Quelle) in src/seite/konfiguration.ts und sw.js; im
//   Dev-Server ebenso in src/seite/konfiguration.ts.
// Im Dev-Server registriert die Seite keinen Service Worker (PRISMA_DEV); fragt ein alter, noch registrierter nach
// sw.js, bekommt er einen, der sich selbst abmeldet und den Speicher leert. vendor/ und backgrounds/ liefert er roh
// (sonst hängte Vite an die klassischen Skripte eine Source-Map an). tests/logic.test.mjs prüft Build und Dev-Server.
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { TYPES } from './tools/spielserver.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const VERSION = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).appVersion;
if (typeof VERSION !== 'string' || !VERSION) throw new Error('package.json: appVersion fehlt');
const PLATZHALTER = '__APP_VERSION__';
const MIT_VERSION = 'src/seite/konfiguration.ts'; // das Modul mit APP_VERSION
const STATISCH = ['vendor', 'icons', 'favicon.svg', 'manifest.webmanifest'];
/**
 * Nicht in den Speicher des Service Workers: er selbst, die Lizenztexte (liegen bei, braucht das Spiel nicht) und die
 * Source-Maps (lädt nur ein offenes DevTools).
 */
const NICHT_SPEICHERN = /^sw\.js$|(^|\/)(LICENSE|[^/]*\.txt)$|\.map$/;

/** Ersetzt den Platzhalter der Version genau einmal (sonst Fehler: Format geändert?). */
function mitVersion(text, datei) {
  const n = text.split(PLATZHALTER).length - 1;
  if (n !== 1) throw new Error(`${datei}: ${PLATZHALTER} ${n}-mal statt einmal`);
  return text.replace(PLATZHALTER, VERSION);
}

/** Alle Dateien unter dem Pfad (relativ zu ordner, mit „/“); eine Datei allein, wenn er eine ist. */
function dateien(ordner, pfad = '') {
  if (pfad && !statSync(join(ordner, pfad)).isDirectory()) return [pfad];
  return readdirSync(join(ordner, pfad), { withFileTypes: true })
    .flatMap((e) => dateien(ordner, pfad ? `${pfad}/${e.name}` : e.name)).sort();
}

/** Die Skyboxen aus dem Register backgrounds/skies.js (so ausgeführt wie im Browser). */
function skyboxen() {
  const ctx = vm.createContext({});
  ctx.globalThis = ctx;
  vm.runInContext(readFileSync(join(root, 'backgrounds', 'skies.js'), 'utf8'), ctx);
  return ctx.PRISMA_SKIES ?? [];
}

/** Eine Liste als Quelltext für sw.js, eine Datei je Zeile. */
const alsListe = (l, nl) => `[${nl}${l.map((d) => `  ${JSON.stringify(d)},`).join(nl)}${nl}]`;

/**
 * Der Stil (src/stil/index.css, Ticket 04): Vite fügt ihn als eine Datei unter assets/ ein, mit dem <link> am Ende des
 * Kopfs. Das Skript des Massstabs im Kopf rechnet aber die Medienabfragen der Blätter um und muss sie darum schon
 * sehen: den <link> an die Stelle zurück, an der er in der Quelle steht (nach der Zeile mit STIL_MARKE).
 */
const STIL_MARKE = '<!-- Stil des Spiels: src/stil/';
function stilZurueck(html) {
  const links = html.match(/^[ \t]*<link rel="stylesheet" crossorigin href="\.\/assets\/[\w-]+\.css">\r?\n/gm) ?? [];
  if (links.length !== 1) throw new Error(`index.html: ${links.length} Stile von Vite statt einem`);
  const marke = html.indexOf(STIL_MARKE);
  if (marke < 0 || html.indexOf(STIL_MARKE, marke + 1) >= 0) throw new Error('index.html: Marke des Stils nicht genau einmal');
  html = html.replace(links[0], '');
  const ende = html.indexOf('\n', marke) + 1;
  html = html.slice(0, ende) + links[0].trimStart() + html.slice(ende);
  // Zeilenenden wie die Quelle: Vite fügt seine Zeilen mit \n ein und lässt beim Entfernen des <script> aus der Quelle
  // ein \r stehen
  return html.includes('\r\n') ? html.replace(/\r*\n/g, '\r\n') : html;
}

function prisma() {
  let aus = null; // Ausgabeordner
  const vonVite = new Set(); // Quelldateien, die Vite selbst (mit Hash) nach assets/ übernommen hat
  return {
    name: 'prisma',
    configResolved(config) { aus = resolve(config.root, config.build.outDir); },
    load(id) {
      // PRISMA_LEVELDATEN=<pfad>: andere Leveldaten statt src/daten/level.js (tools/spielserver.mjs, baue mit daten: die
      // KI-Tester mit Kandidaten am Ende der Level; bis Ticket 06 von .scratch/umbau/ PRISMA_LOGIK)
      const daten = process.env.PRISMA_LEVELDATEN;
      if (daten && resolve(id) === resolve(root, 'src', 'daten', 'level.js')) return readFileSync(daten, 'utf8');
      return null;
    },
    transform(code, id) {
      // die Version in das Modul, das sie nennt (Build und Dev-Server)
      if (id.replaceAll('\\', '/') === `${root.replaceAll('\\', '/')}/${MIT_VERSION}`) return { code: mitVersion(code, MIT_VERSION), map: null };
      return null;
    },
    transformIndexHtml: {
      order: 'pre',
      // im Dev-Server kein Service Worker (index.html fragt PRISMA_DEV ab, bevor sie ihn registriert)
      handler: (html, ctx) => ({
        html,
        tags: ctx.server ? [{ tag: 'script', children: 'window.PRISMA_DEV = true;', injectTo: 'head-prepend' }] : [],
      }),
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        // vendor/ und backgrounds/ roh wie im Build (Vite hängte an klassische Skripte eine Source-Map an, bei den
        // Skyboxen mehrere MB)
        if (/^\/(vendor|backgrounds)\//.test(pfad)) {
          const datei = resolve(root, `.${pfad}`);
          if (!datei.startsWith(root) || !existsSync(datei) || !statSync(datei).isFile()) return next();
          res.setHeader('Content-Type', TYPES[extname(datei)] || 'application/octet-stream');
          res.end(readFileSync(datei));
          return;
        }
        if (pfad !== '/sw.js') return next();
        res.setHeader('Content-Type', 'text/javascript');
        res.end(`// Dev-Server: meldet einen alten Service Worker dieser Adresse ab und leert seinen Speicher
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys()
  .then((keys) => Promise.all(keys.filter((k) => k.startsWith('prisma-')).map((k) => caches.delete(k))))
  .then(() => self.registration.unregister())));
`);
      });
    },
    generateBundle(_, bundle) {
      for (const f of Object.values(bundle)) for (const o of f.originalFileNames ?? []) vonVite.add(o.replaceAll('\\', '/'));
    },
    writeBundle() {
      const seite = join(aus, 'index.html');
      writeFileSync(seite, stilZurueck(readFileSync(seite, 'utf8')));
      const kopiere = (pfad) => {
        if (!existsSync(join(root, pfad))) throw new Error(`${pfad} fehlt`);
        if (!vonVite.has(pfad)) cpSync(join(root, pfad), join(aus, pfad));
      };
      for (const p of STATISCH) for (const d of dateien(root, p)) kopiere(d);
      kopiere('backgrounds/skies.js');
      const lazy = new Set();
      for (const sky of skyboxen()) for (const part of sky.parts ?? []) {
        kopiere(`backgrounds/${part.file}`);
        if (!part.precache) lazy.add(`backgrounds/${part.file}`);
      }
      // sw.js mit den Listen aus der Ausgabe
      const alle = dateien(aus).filter((d) => !NICHT_SPEICHERN.test(d));
      let sw = mitVersion(readFileSync(join(root, 'sw.js'), 'utf8'), 'sw.js');
      const nl = sw.includes('\r\n') ? '\r\n' : '\n';
      for (const [name, l] of [['FILES', alle.filter((d) => !lazy.has(d))], ['LAZY', alle.filter((d) => lazy.has(d))]]) {
        const zeile = `const ${name} = []; // beim Build gefüllt`;
        if (!sw.includes(zeile)) throw new Error(`sw.js: Zeile «${zeile}» fehlt`);
        sw = sw.replace(zeile, `const ${name} = ${alsListe(l, nl)};`);
      }
      writeFileSync(join(aus, 'sw.js'), sw);
      console.log(`sw.js: ${alle.length - lazy.size} Dateien vorab, ${lazy.size} beim ersten Gebrauch (${relative(root, aus) || '.'})`);
    },
  };
}

export default {
  base: './',
  publicDir: false,
  plugins: [prisma()],
  // verkleinert, mit Source-Maps (nicht im Speicher des Service Workers); ohne den Nachlader für modulepreload (das
  // Spiel ist ein einziges Modul). Die Bitgleichheit des Halls prüft tests/logic.test.mjs an der Prüfsumme des
  // gebauten Workers (verkleinert wird etwa Math.pow zu **, nach ECMAScript dieselbe Operation).
  // Namen werden verkürzt (mangle, seit Ticket 05 wieder an): Kein Worker bekommt mehr seinen Code als Text von
  // Funktionen des Spiels (bis dahin skyBitmaps und boardTextures; umbenannt scheiterten sie und rechneten im
  // Hauptthread). Alle Worker sind eigene Module (src/*-worker.ts).
  build: {
    outDir: 'dist', emptyOutDir: true, cssMinify: false, minify: true, sourcemap: true, modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1500,
  },
  worker: { format: 'es' },
  // Proben, Werkzeuge und Notizen schreiben viel; der Dev-Server muss davon nichts wissen
  server: { watch: { ignored: ['**/tests/output/**', '**/.scratch/**', '**/tools/**', '**/dist/**'] } },
};
