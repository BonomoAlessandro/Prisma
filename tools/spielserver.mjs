// Die Adresse des Spiels für Proben, Tests und Werkzeuge an einer Stelle (Ticket 02 von .scratch/umbau/). Seit dem
// Build mit Vite laufen sie über http gegen dist/, nicht mehr über file:// gegen index.html.
// - spielServer(): baut das Spiel (wie npm run build, seit Ticket 13 je Prozess in einen eigenen Ordner im
//   Temp-Verzeichnis statt nach dist/, damit gleichzeitige Läufe einander nicht stören; weg nach close() bzw. am Ende
//   des Prozesses) und liefert es über einen kleinen Server auf 127.0.0.1 (freier Port).
//   Rückgabe { base, seite(query), url(pfad), close() }: seite('noadapt&nointro') ist die Adresse der Seite mit diesen
//   Parametern, url('backgrounds/skies.js') die einer Datei daneben.
//   Optionen: ordner (einen anderen Ordner ungebaut liefern, etwa für --seite: eine Kopie einer früheren index.html im
//   Wurzelordner), datei (die Seite, Vorgabe index.html), bauen (Vorgabe true; mit PRISMA_OHNE_BAU=1 gilt das
//   vorhandene dist/, ohne zu bauen), sw (Vorgabe false: statt sw.js ein leerer Service Worker ohne Fetch-Handler, der nichts abfängt
//   und nichts speichert; die Seite läuft so wie früher über file://, und die Messungen bleiben frei vom
//   Vorab-Speichern. Eine 404 meldete Chrome als Fehler in der Konsole, an dem die Proben scheitern), seiten (weitere
//   Seiten nur im Speicher, { 'pfad.html': Text oder (ordner) => Text }; ordner ist der Ordner, aus dem der Server
//   liefert, seit Ticket 13 meist der eigene Bau im Temp-Verzeichnis), logik (Pfad einer anderen Spiellogik statt
//   src/logik.js: ein eigener Build damit in einem temporären Ordner, etwa das Spiel mit Kandidaten der KI-Tester).
// - seiteAus(pfad): Optionen für spielServer zu einer Datei (--seite, --vorher der Proben).
// - PRISMA_SPIEL=<url>: statt eines eigenen Servers diese Adresse, etwa der Dev-Server (npm run dev,
//   http://localhost:5173/) oder npm run preview; ordner und bauen gelten dann nicht.
// - baue(ausgabe, { logik }): Build in einen Ordner (Vorgabe dist/), still ausser bei einem Fehler.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = join(root, 'dist');

export const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.map': 'application/json' };

/**
 * Baut das Spiel nach ausgabe (Vorgabe dist/); wirft mit der Ausgabe von Vite, wenn es scheitert. logik: wahlweise der
 * Pfad einer anderen Spiellogik statt src/logik.js (vite.config.mjs, PRISMA_LOGIK; die KI-Tester mit Kandidaten).
 */
export function baue(ausgabe = DIST, { logik = null } = {}) {
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(vite)) throw new Error('Vite fehlt: zuerst npm install');
  const env = { ...process.env };
  if (logik) env.PRISMA_LOGIK = resolve(logik); else delete env.PRISMA_LOGIK;
  const r = spawnSync(process.execPath, [vite, 'build', '--outDir', ausgabe, '--emptyOutDir', '--logLevel', 'warn'],
    { cwd: root, encoding: 'utf8', env });
  if (r.status !== 0) throw new Error(`Build gescheitert:\n${r.stdout}\n${r.stderr}`);
  return ausgabe;
}

/** Optionen für spielServer, um eine andere Fassung der Seite zu liefern (ungebaut, aus ihrem Ordner). */
export const seiteAus = (pfad) => ({ ordner: dirname(resolve(pfad)), datei: basename(pfad), bauen: false });

/** Liefert das Spiel über http (siehe Kopf). */
export async function spielServer({ ordner = DIST, datei = 'index.html', bauen = ordner === DIST, sw = false,
  seiten = {}, logik = null } = {}) {
  let aufraeumen = () => {};
  if (logik) { // eigener Build mit dieser Spiellogik, in einem Ordner nur für diesen Server
    if (process.env.PRISMA_SPIEL) throw new Error('PRISMA_SPIEL: ohne andere Spiellogik');
    ordner = mkdtempSync(join(tmpdir(), 'prisma-logik-'));
    aufraeumen = () => rmSync(ordner, { recursive: true, force: true });
    baue(ordner, { logik });
    bauen = false;
  }
  ordner = resolve(ordner);
  const fertig = (base, close) => ({ base, close,
    url: (pfad) => new URL(pfad, base).href,
    seite: (query = '') => new URL(datei, base).href + (query ? `?${query}` : '') });
  if (process.env.PRISMA_SPIEL && Object.keys(seiten).length) throw new Error('PRISMA_SPIEL: ohne weitere Seiten');
  if (process.env.PRISMA_SPIEL) return fertig(new URL('./', process.env.PRISMA_SPIEL).href, async () => {});
  let eigen = null; // eigener Bau dieses Prozesses, beim Schliessen und am Ende des Prozesses weg
  if (bauen && !process.env.PRISMA_OHNE_BAU) {
    // statt nach dist/ in einen eigenen Ordner: Leichte Läufe laufen gleichzeitig (tools/leise.sh, Ticket 13), auch im
    // selben Worktree, und ein Bau leert seinen Ordner, während ein anderer Lauf daraus liefert
    if (ordner === DIST) {
      eigen = ordner = mkdtempSync(join(tmpdir(), 'prisma-spiel-'));
      process.once('exit', () => rmSync(eigen, { recursive: true, force: true }));
    }
    baue(ordner);
  }
  if (!existsSync(join(ordner, datei))) throw new Error(`${join(ordner, datei)} fehlt (npm run build?)`);
  const server = createServer((req, res) => {
    let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pfad.endsWith('/')) pfad += 'index.html';
    const file = join(ordner, pfad), mehr = seiten[pfad.slice(1)];
    if (Object.hasOwn(seiten, pfad.slice(1))) {
      res.writeHead(200, { 'Content-Type': TYPES[extname(pfad)] || 'application/octet-stream' });
      res.end(typeof mehr === 'function' ? mehr(ordner) : mehr);
      return;
    }
    if (!sw && pfad === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end('// leer (tools/spielserver.mjs): ohne Fetch-Handler fängt er nichts ab\n');
      return;
    }
    // Chrome fragt danach, wenn eine Datei ohne eigenes Icon als Seite offen ist (der Bildvergleich und die Proben
    // setzen den Spielstand auf favicon.svg); eine 404 erschiene als Fehler in der Konsole (Tickets 03 und 13)
    if (pfad === '/favicon.ico' && !existsSync(file)) { res.writeHead(204); res.end(); return; }
    if (!file.startsWith(ordner + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return fertig(`http://127.0.0.1:${server.address().port}/`, () => new Promise((r) => {
    server.closeAllConnections?.();
    server.close(() => { aufraeumen(); if (eigen) rmSync(eigen, { recursive: true, force: true }); r(); });
  }));
}
