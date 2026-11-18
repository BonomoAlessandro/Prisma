// Prüft, dass PRISMA offline läuft: liefert das Spiel über einen lokalen Server aus, wartet, bis der Service Worker
// (sw.js) die Seite übernommen hat, stoppt den Server und lädt neu – mit Parametern, als index.html und als Ordner.
// Jedes Mal muss die Szene laufen, die Schrift Jost geladen sein und die Konsole fehlerfrei bleiben. Dazu einmal online
// jede Skybox aus Blender wählen (Teile im Speicher: vorab bzw. beim ersten Gebrauch) und sie offline zeigen; je
// Himmel ist er erst bereit (skyReady), wenn das Brett seiner Brett-Angabe bereit ist und ganz steht (__prisma.brett(),
// auch Milchstrasse und Sonnensystem online).
// Ausgeliefert wird der Build (frisch gebaut über tools/spielserver.mjs in einen eigenen Ordner im Temp-Verzeichnis;
// PRISMA_OHNE_BAU=1 nimmt das vorhandene dist/) samt dem dort erzeugten sw.js.
// Aufruf: node tests/offline.mjs [--redirect] [--unterpfad]   (--redirect: Server leitet index.html auf ./ weiter, wie
//   manche Hoster; --unterpfad: das Spiel unter /Prisma/ wie auf GitHub Pages, /Prisma ohne Schrägstrich leitet dorthin
//   weiter, ausserhalb gibt es nur 404; Ticket 09 von .scratch/umbau/)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { loadSkies } from '../tools/sky-schema.mjs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { baue, DIST, TYPES } from '../tools/spielserver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// in einen eigenen Ordner gebaut, nicht nach dist/ (gleichzeitige leichte Läufe, Ticket 13 von .scratch/umbau/)
const dist = process.env.PRISMA_OHNE_BAU ? DIST : baue(mkdtempSync(join(tmpdir(), 'prisma-spiel-')));
if (dist !== DIST) process.once('exit', () => rmSync(dist, { recursive: true, force: true }));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const redirect = process.argv.includes('--redirect');
const PRAEFIX = process.argv.includes('--unterpfad') ? '/Prisma' : '';

// Statischer Server für dist/ (unter PRAEFIX); merkt sich die Parameter der Seitenaufrufe
const pageQueries = [];
const server = createServer((req, res) => {
  const reqUrl = new URL(req.url, 'http://x');
  if (PRAEFIX && reqUrl.pathname === PRAEFIX) { res.writeHead(301, { Location: `${PRAEFIX}/${reqUrl.search}` }); res.end(); return; }
  if (!reqUrl.pathname.startsWith(`${PRAEFIX}/`)) { res.writeHead(404); res.end(); return; }
  const pfad = reqUrl.pathname.slice(PRAEFIX.length);
  if (pfad === '/' || pfad === '/index.html') pageQueries.push(reqUrl.search);
  if (redirect && pfad === '/index.html') { res.writeHead(301, { Location: `${PRAEFIX}/${reqUrl.search}` }); res.end(); return; }
  let path = decodeURIComponent(pfad);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(dist, path);
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
const sockets = new Set();
server.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
const stopServer = () => { server.close(); for (const s of sockets) s.destroy(); };
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}${PRAEFIX}/`;

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find(p => existsSync(p));
if (!chrome) { stopServer(); throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen).'); }

const profile = mkdtempSync(join(tmpdir(), 'prisma-offline-'));
// Port 0: Chrome wählt einen freien (DevToolsActivePort im Profil), wie tools/chrome.mjs (Ticket 13)
const proc = spawn(chrome, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--window-size=1000,700', 'about:blank',
], { stdio: 'ignore' });
const chromeExited = new Promise(r => proc.on('exit', r));

let ws;
async function cleanup() {
  ws?.close();
  proc.kill();
  stopServer();
  await Promise.race([chromeExited, sleep(5000)]);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome hält noch Dateien offen */ }
}
// Notbremse: Hängt Chrome, endet der Test trotzdem (jede Skybox zweimal, in SwiftShader brauchte das bis über 300 s;
// mit der sechsten aus Blender, der Eishöhle, und etwas Last auf dem Rechner reichten 600 s nicht mehr; seit Ticket 13
// des Umbaus läuft er als leichter Lauf neben anderen, darum 1800 s)
setTimeout(async () => { console.log('  FAIL  Zeitüberschreitung des ganzen Tests'); await cleanup(); process.exit(1); }, 1800000).unref();
// Versuche zu je 200 ms, bis ein Himmel bereit ist: Allein brauchte die Eishöhle bis 382 von früher 400 (Review Ticket 02
// des Umbaus), neben einem anderen leichten Lauf reichte das für die Wüste nicht (Ticket 13). Nur ein Sicherheitsnetz.
const WARTEN = 1200;

let ok = true;
const check = (cond, text) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${text}`); ok &&= cond; };
try {
  let wsUrl;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try {
      const port = +readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl;
    }
    catch { /* Chrome startet noch */ }
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error('Chrome DevTools nicht erreichbar');
  ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let msgId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
    else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(msg.params.entry.text);
  });
  const send = (method, params = {}) => new Promise((res) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  async function waitFor(expression, what, tries = 100) {
    for (let i = 0; i < tries; i++) { if (await evaluate(expression)) return; await sleep(200); }
    throw new Error('Zeitüberschreitung: ' + what);
  }
  const sceneRuns = '(window.__prisma?.ticks ?? 0) > 2'; // Hauptschleife läuft (verdeckt ohne Zeichnen)
  const fontReady = 'document.fonts.ready.then(() => document.fonts.check("300 16px Jost"))';
  const relevantErrors = () => errors.filter(e => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(e));

  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Page.navigate', { url: base + 'index.html?noadapt&nointro' });
  await waitFor(sceneRuns, 'Szene online');
  await waitFor('!!navigator.serviceWorker?.controller', 'Service Worker übernimmt die Seite');
  check(true, 'online: Szene läuft, Service Worker aktiv');
  // Bereich des Service Workers und des Manifests: genau der Ordner der Seite (unter /Prisma/ wie auf GitHub Pages)
  const bereich = await evaluate(`navigator.serviceWorker.getRegistration().then(async (r) => {
    const link = document.querySelector('link[rel="manifest"]'), m = await (await fetch(link.href)).json();
    return { sw: r?.scope, scope: new URL(m.scope, link.href).href, start: new URL(m.start_url, link.href).href };
  })`);
  const bereichOk = bereich?.sw === base && bereich?.scope === base && bereich?.start === base + 'index.html';
  check(bereichOk, `online: Service Worker und Manifest gelten für ${base}` + (bereichOk ? '' : ` (${JSON.stringify(bereich)})`));
  check(await evaluate(fontReady), 'online: Schrift Jost geladen');
  check(relevantErrors().length === 0, 'online: Konsole ohne Fehler' + (relevantErrors().length ? '\n        ' + relevantErrors().join('\n        ') : ''));

  // Die Parameter müssen auch durch den Service Worker beim Server ankommen: Der eingebaute Server von IntelliJ
  // antwortet ohne sein Zugangszeichen _ijt mit 404
  pageQueries.length = 0;
  await send('Page.navigate', { url: base + 'index.html?noadapt&nointro&_ijt=probe' });
  await waitFor(sceneRuns, 'Szene online mit Service Worker');
  check(pageQueries.some(q => q.includes('_ijt=probe')), 'online mit Service Worker: Parameter der Seite kommen beim Server an');

  // Jede Skybox aus Blender wählen: Danach liegen alle ihre Teile im Speicher (base vorab, die Streifen nach diesem
  // ersten Gebrauch; das Fenster ist breit genug für den Desktop). Alle, nicht nur die erste: Fehler in den Shadern
  // ihrer Ebenen (etwa paintedInstances, Pinsel) stehen sonst in keinem Test. Eine Ebene, die beim Aufbau scheitert,
  // lässt die Skybox still weg und meldet nur eine Warnung („… ausgelassen“): auch die zählen
  const skies = loadSkies(root);
  const warnings = [];
  const onWarn = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'warning') warnings.push(m.params.args.map((a) => a.value).join(' '));
  };
  const skyWarnings = () => warnings.filter((w) => /Streifen|Stand|Skybox|ausgelassen/.test(w));
  // Das Brett gehört zum Bereitsein des Himmels (Spec .scratch/brett-je-himmel/): Im selben Moment, in dem skyReady
  // zum ersten Mal wahr ist, meldet brett() den Himmel, die Art seiner Brett-Angabe (ohne sie das Steinbrett), bereit
  // (berechnet und hochgeladen), kein Überblenden mehr (anteil 1) und keinen Notfall
  const waitSky = async (id, art, where, tries) => {
    for (let i = 0; i < tries; i++) {
      const r = await evaluate('({ ready: window.__prisma?.skyReady?.() ?? false, b: window.__prisma?.brett?.() })');
      if (r?.ready) {
        const b = r.b, good = b?.himmel === id && b?.art === art && b?.bereit === true && b?.anteil === 1 && !b?.notfall;
        check(good, `${where}: ${id} erst bereit, wenn sein Brett (${art}) bereit ist`
          + (good ? '' : `, brett() meldet ${JSON.stringify(b)}`));
        return;
      }
      await sleep(200);
    }
    throw new Error(`Zeitüberschreitung: ${where} ${id} bereit`);
  };
  for (const sky of skies) {
    errors.length = warnings.length = 0;
    ws.addEventListener('message', onWarn);
    await send('Page.navigate', { url: base + `index.html?noadapt&nointro&sky=${sky.id}` });
    await waitSky(sky.id, sky.board?.type ?? 'stone', 'online', WARTEN);
    ws.removeEventListener('message', onWarn);
    const files = sky.parts.map((p) => new URL(`backgrounds/${p.file}`, base).href);
    await waitFor(`caches.open('prisma-v1').then((c) => c.keys()).then((k) => ${JSON.stringify(files)}.every((f) => k.some((r) => r.url === f)))`,
      `Teile von ${sky.id} im Speicher`, 50);
    const all = [...relevantErrors(), ...skyWarnings()];
    check(all.length === 0, `online: Skybox ${sky.id} geladen, alle Teile im Speicher, Konsole ohne Fehler`
      + (all.length ? '\n        ' + all.join('\n        ') : ''));
  }
  // Milchstrasse und Sonnensystem (aus dem Code, ohne Brett-Angabe): das Steinbrett
  for (const id of ['milky', 'solar']) {
    await send('Page.navigate', { url: base + `index.html?noadapt&nointro&sky=${id}` });
    await waitSky(id, 'stone', 'online', 100);
  }

  // Server weg: ab jetzt antwortet nur noch der Zwischenspeicher
  stopServer();
  for (const path of ['index.html?noadapt&nointro', 'index.html', '']) {
    errors.length = 0;
    await send('Page.navigate', { url: base + path });
    await waitFor(sceneRuns, `Szene offline (/${path})`);
    const fromWorker = await evaluate(`location.href === ${JSON.stringify(base + path)} && performance.getEntriesByType('navigation')[0].workerStart > 0`);
    const libs = await evaluate('typeof THREE?.UnrealBloomPass === "function" && typeof THREE?.Reflector === "function"');
    check(fromWorker && libs && await evaluate(fontReady), `offline /${path}: vom Service Worker, Szene, Three.js samt Zusatzmodulen und Schrift geladen`);
    await sleep(300);
    check(relevantErrors().length === 0, `offline /${path}: Konsole ohne Fehler` + (relevantErrors().length ? '\n        ' + relevantErrors().join('\n        ') : ''));
  }
  for (const sky of skies) {
    errors.length = warnings.length = 0;
    ws.addEventListener('message', onWarn);
    await send('Page.navigate', { url: base + `index.html?noadapt&nointro&sky=${sky.id}` });
    await waitSky(sky.id, sky.board?.type ?? 'stone', 'offline', WARTEN);
    ws.removeEventListener('message', onWarn);
    const all = [...relevantErrors(), ...skyWarnings()];
    check(all.length === 0, `offline: Skybox ${sky.id} ganz geladen (mit Streifen), Konsole ohne Fehler` + (all.length ? '\n        ' + all.join('\n        ') : ''));
  }
  // die Datenschutzerklärung (Ticket 09): auch offline lesbar, beide Sprachen
  await send('Page.navigate', { url: base + 'datenschutz.html' });
  await waitFor('document.readyState === "complete" && !!document.getElementById("en")', 'Datenschutzerklärung offline', 50);
  check(await evaluate('!!document.getElementById("de") && performance.getEntriesByType("navigation")[0].workerStart > 0'),
    'offline: Datenschutzerklärung vom Service Worker, Deutsch und Englisch');
} catch (e) {
  check(false, e.message);
} finally {
  await cleanup();
}
console.log(ok ? '\nOffline-Test bestanden.' : '\nOffline-Test FEHLGESCHLAGEN.');
process.exit(ok ? 0 : 1);
