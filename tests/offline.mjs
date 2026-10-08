// Prüft, dass PRISMA offline läuft: liefert das Spiel über einen lokalen Server aus, wartet, bis der Service Worker
// (sw.js) die Seite übernommen hat, stoppt den Server und lädt neu – mit Parametern, als index.html und als Ordner.
// Jedes Mal muss die Szene laufen, die Schrift Jost geladen sein und die Konsole fehlerfrei bleiben.
// Aufruf: node tests/offline.mjs [--redirect]   (--redirect: Server leitet index.html auf ./ weiter, wie manche Hoster)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const redirect = process.argv.includes('--redirect');

// Statischer Server für das Projektverzeichnis
const server = createServer((req, res) => {
  const reqUrl = new URL(req.url, 'http://x');
  if (redirect && reqUrl.pathname === '/index.html') { res.writeHead(301, { Location: '/' + reqUrl.search }); res.end(); return; }
  let path = decodeURIComponent(reqUrl.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
const sockets = new Set();
server.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
const stopServer = () => { server.close(); for (const s of sockets) s.destroy(); };
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find(p => existsSync(p));
if (!chrome) { stopServer(); throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen).'); }

const profile = mkdtempSync(join(tmpdir(), 'prisma-offline-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--no-first-run', '--no-default-browser-check', '--window-size=1000,700', 'about:blank',
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
// Notbremse: Hängt Chrome, endet der Test trotzdem
setTimeout(async () => { console.log('  FAIL  Zeitüberschreitung des ganzen Tests'); await cleanup(); process.exit(1); }, 120000).unref();

let ok = true;
const check = (cond, text) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${text}`); ok &&= cond; };
try {
  let wsUrl;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; }
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
  async function waitFor(expression, what) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(200); }
    throw new Error('Zeitüberschreitung: ' + what);
  }
  const sceneRuns = '(window.__prisma?.frames ?? 0) > 2';
  const fontReady = 'document.fonts.ready.then(() => document.fonts.check("300 16px Jost"))';
  const relevantErrors = () => errors.filter(e => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(e));

  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Page.navigate', { url: base + 'index.html?noadapt&nointro' });
  await waitFor(sceneRuns, 'Szene online');
  await waitFor('!!navigator.serviceWorker?.controller', 'Service Worker übernimmt die Seite');
  check(true, 'online: Szene läuft, Service Worker aktiv');
  check(await evaluate(fontReady), 'online: Schrift Jost geladen');
  check(relevantErrors().length === 0, 'online: Konsole ohne Fehler' + (relevantErrors().length ? '\n        ' + relevantErrors().join('\n        ') : ''));

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
} catch (e) {
  check(false, e.message);
} finally {
  await cleanup();
}
console.log(ok ? '\nOffline-Test bestanden.' : '\nOffline-Test FEHLGESCHLAGEN.');
process.exit(ok ? 0 : 1);
