// Headless-Chrome über das DevTools-Protokoll, ohne weitere Pakete: für tests/screenshot.mjs und tools/ki-tester.
// Jedes Mal mit frischem Profil (kein gespeicherter Fortschritt) und SwiftShader, mit gpu auf der Grafikkarte.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Startet Chrome mit einer leeren Seite. Rückgabe: { send(method, params), logs (Konsole), close() }. */
export async function startChrome({ width, height, gpu = false }) {
  const chrome = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean).find(p => existsSync(p));
  if (!chrome) throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen).');

  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'prisma-chrome-'));
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    ...(gpu ? ['--use-angle=d3d11', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    '--ignore-gpu-blocklist',
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${width},${height}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(t => t.type === 'page')?.webSocketDebuggerUrl;
    } catch { /* Chrome startet noch */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error('Chrome DevTools nicht erreichbar');

  const ws = new WebSocket(target);
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

  const close = async () => {
    ws.close();
    proc.kill();
    if (proc.exitCode === null && proc.signalCode === null) await new Promise((r) => proc.once('exit', r));
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome hält noch Dateien: bleibt im Temp-Ordner */ }
  };
  return { send, logs, close };
}

/** Bildschirm einstellen; phone: als Smartphone ausgeben (Mobil-Kennung und Touch), damit das Spiel IS_MOBILE erkennt. */
export async function emulate(send, { width, height, dpr = 1, phone = false }) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: width < 800 });
  if (phone) {
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
  }
}

/** Liest einen Wert aus der Seite (Ausdruck als Text, Promise wird abgewartet). Wirft bei einer Ausnahme. */
export async function evaluate(send, expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
}
