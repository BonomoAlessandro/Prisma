// Die Adresse des Spiels für Proben, Tests und Werkzeuge an einer Stelle (Ticket 02 von .scratch/umbau/). Seit dem
// Build mit Vite laufen sie über http gegen dist/, nicht mehr über file:// gegen index.html.
// - spielServer(): baut dist/ (wie npm run build) und liefert es über einen kleinen Server auf 127.0.0.1 (freier Port).
//   Rückgabe { base, seite(query), url(pfad), close() }: seite('noadapt&nointro') ist die Adresse der Seite mit diesen
//   Parametern, url('backgrounds/skies.js') die einer Datei daneben.
//   Optionen: ordner (einen anderen Ordner ungebaut liefern, etwa für --seite: eine Kopie einer früheren index.html im
//   Wurzelordner), datei (die Seite, Vorgabe index.html), bauen (Vorgabe true; mit PRISMA_OHNE_BAU=1 gilt das
//   vorhandene dist/), sw (Vorgabe false: statt sw.js ein leerer Service Worker ohne Fetch-Handler, der nichts abfängt
//   und nichts speichert; die Seite läuft so wie früher über file://, und die Messungen bleiben frei vom
//   Vorab-Speichern. Eine 404 meldete Chrome als Fehler in der Konsole, an dem die Proben scheitern), seiten (weitere
//   Seiten nur im Speicher, { 'pfad.html': Text oder () => Text }, etwa das Spiel mit Kandidaten der KI-Tester).
// - seiteAus(pfad): Optionen für spielServer zu einer Datei (--seite, --vorher der Proben).
// - PRISMA_SPIEL=<url>: statt eines eigenen Servers diese Adresse, etwa der Dev-Server (npm run dev,
//   http://localhost:5173/) oder npm run preview; ordner und bauen gelten dann nicht.
// - baue(ausgabe): Build in einen Ordner (Vorgabe dist/), still ausser bei einem Fehler.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = join(root, 'dist');

export const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' };

/** Baut das Spiel nach ausgabe (Vorgabe dist/); wirft mit der Ausgabe von Vite, wenn es scheitert. */
export function baue(ausgabe = DIST) {
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(vite)) throw new Error('Vite fehlt: zuerst npm install');
  const r = spawnSync(process.execPath, [vite, 'build', '--outDir', ausgabe, '--emptyOutDir', '--logLevel', 'warn'],
    { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Build gescheitert:\n${r.stdout}\n${r.stderr}`);
  return ausgabe;
}

/** Optionen für spielServer, um eine andere Fassung der Seite zu liefern (ungebaut, aus ihrem Ordner). */
export const seiteAus = (pfad) => ({ ordner: dirname(resolve(pfad)), datei: basename(pfad), bauen: false });

/** Liefert das Spiel über http (siehe Kopf). */
export async function spielServer({ ordner = DIST, datei = 'index.html', bauen = ordner === DIST, sw = false,
  seiten = {} } = {}) {
  ordner = resolve(ordner);
  const fertig = (base, close) => ({ base, close,
    url: (pfad) => new URL(pfad, base).href,
    seite: (query = '') => new URL(datei, base).href + (query ? `?${query}` : '') });
  if (process.env.PRISMA_SPIEL && Object.keys(seiten).length) throw new Error('PRISMA_SPIEL: ohne weitere Seiten');
  if (process.env.PRISMA_SPIEL) return fertig(new URL('./', process.env.PRISMA_SPIEL).href, async () => {});
  if (bauen && !process.env.PRISMA_OHNE_BAU) baue(ordner);
  if (!existsSync(join(ordner, datei))) throw new Error(`${join(ordner, datei)} fehlt (npm run build?)`);
  const server = createServer((req, res) => {
    let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pfad.endsWith('/')) pfad += 'index.html';
    const file = join(ordner, pfad), mehr = seiten[pfad.slice(1)];
    if (Object.hasOwn(seiten, pfad.slice(1))) {
      res.writeHead(200, { 'Content-Type': TYPES[extname(pfad)] || 'application/octet-stream' });
      res.end(typeof mehr === 'function' ? mehr() : mehr);
      return;
    }
    if (!sw && pfad === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end('// leer (tools/spielserver.mjs): ohne Fetch-Handler fängt er nichts ab\n');
      return;
    }
    if (!file.startsWith(ordner + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return fertig(`http://127.0.0.1:${server.address().port}/`, () => new Promise((r) => {
    server.closeAllConnections?.();
    server.close(r);
  }));
}
