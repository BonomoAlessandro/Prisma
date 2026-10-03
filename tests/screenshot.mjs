// Rendert index.html in Headless-Chrome, sammelt Konsolenfehler und speichert Screenshots.
// Aufruf: node tests/screenshot.mjs [name] [breite] [höhe] [wartezeit-ms] [js-vor-screenshot]
// Umgebung: DPR=3 (Pixeldichte), MOBILE=1 (als Smartphone ausgeben), INTRO=1 (Startbildschirm zeigen)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(here, 'output');
mkdirSync(outDir, { recursive: true });

const [name = 'shot', width = '1440', height = '900', waitMs = '4000', script = ''] = process.argv.slice(2);

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = chromeCandidates.find(p => existsSync(p));
if (!chrome) throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen).');

const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), 'prisma-chrome-' + port)}`,
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--no-first-run',
  '--no-default-browser-check',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* Chrome startet noch */ }
    await sleep(200);
  }
  throw new Error('Chrome DevTools nicht erreichbar');
}

const ws = new WebSocket(await getTarget());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let msgId = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.consoleAPICalled') {
    logs.push(`[${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    logs.push(`[exception] ${d.exception?.description ?? d.text} (Zeile ${d.lineNumber})`);
  } else if (msg.method === 'Log.entryAdded') {
    logs.push(`[log:${msg.params.entry.level}] ${msg.params.entry.text}`);
  }
});
const send = (method, params = {}) => new Promise((res) => {
  const id = ++msgId;
  pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: +width, height: +height, deviceScaleFactor: +(process.env.DPR || 1), mobile: +width < 800,
});
// MOBILE=1: als Smartphone ausgeben (Mobil-Kennung und Touch), damit das Spiel IS_MOBILE erkennt
if (process.env.MOBILE) {
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
}
await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + (process.env.INTRO ? '?noadapt' : '?noadapt&nointro') });

// Warten bis die Szene läuft
let state = null;
for (let i = 0; i < 100; i++) {
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__prisma || null)', returnByValue: true });
  state = JSON.parse(r.result?.result?.value ?? 'null');
  if (state && state.frames > 2) break;
  await sleep(200);
}
if (script) {
  const r = await send('Runtime.evaluate', { expression: script, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) logs.push('[script-exception] ' + r.result.exceptionDetails.exception?.description);
  else if (r.result?.result?.value !== undefined) console.log('Skript:', r.result.result.value);
}
await sleep(+waitMs);
const r2 = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__prisma || null)', returnByValue: true });
state = JSON.parse(r2.result?.result?.value ?? 'null');

const shot = await send('Page.captureScreenshot', { format: 'png' });
const file = join(outDir, `${name}.png`);
writeFileSync(file, Buffer.from(shot.result.data, 'base64'));

console.log('Screenshot:', file);
console.log('Status:', JSON.stringify(state));
const relevant = logs.filter(l => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
console.log(relevant.length ? 'Konsole:\n  ' + relevant.join('\n  ') : 'Konsole: keine Meldungen');

ws.close();
proc.kill();
// Fehlschlag melden: Exceptions, Shader-Fehler oder keine laufende Render-Schleife
const failed = relevant.some(l => /\[exception\]|\[script-exception\]|\[error\]|THREE\.WebGLProgram/.test(l)) || !state || state.frames < 3;
if (failed) console.error('FEHLGESCHLAGEN');
process.exit(failed ? 1 : 0);
