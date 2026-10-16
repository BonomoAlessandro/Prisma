// Rendert index.html in Headless-Chrome, sammelt Konsolenfehler und speichert Screenshots.
// Aufruf: node tests/screenshot.mjs [name] [breite] [höhe] [wartezeit-ms] [js-vor-screenshot]
// Umgebung: DPR=3 (Pixeldichte), MOBILE=1 (als Smartphone ausgeben), INTRO=1 (Startbildschirm zeigen),
// QUERY='sky=forest&t=12' (weitere Parameter der Seite), GPU=1 (auf der Grafikkarte statt SwiftShader: wie im echten
// Browser, Fehler nur der Grafikkarte zeigen sich so). Gewartet wird, bis der Hintergrund ganz eingeblendet ist.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, sleep } from '../tools/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(here, 'output');
mkdirSync(outDir, { recursive: true });

const [name = 'shot', width = '1440', height = '900', waitMs = '4000', script = ''] = process.argv.slice(2);

const { send, logs, close } = await startChrome({ width, height, gpu: !!process.env.GPU });
await emulate(send, { width: +width, height: +height, dpr: +(process.env.DPR || 1), phone: !!process.env.MOBILE });
const query = ['noadapt', process.env.INTRO ? '' : 'nointro', process.env.QUERY ?? ''].filter(Boolean).join('&');
await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + '?' + query });

// Warten bis die Szene läuft
let state = null;
for (let i = 0; i < 100; i++) {
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__prisma || null)', returnByValue: true });
  state = JSON.parse(r.result?.result?.value ?? 'null');
  if (state && state.frames > 2) break;
  await sleep(200);
}
// Hintergrund fertig geladen und eingeblendet (der Wald lädt seine Bilder erst bei der Wahl)
for (let i = 0; i < 240; i++) {
  const r = await send('Runtime.evaluate', { expression: 'window.__prisma?.skyReady?.() ?? true', returnByValue: true });
  if (r.result?.result?.value) break;
  await sleep(250);
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

await close();
// Fehlschlag melden: Exceptions, Shader-Fehler oder keine laufende Render-Schleife
const failed = relevant.some(l => /\[exception\]|\[script-exception\]|\[error\]|THREE\.WebGLProgram/.test(l)) || !state || state.frames < 3;
if (failed) console.error('FEHLGESCHLAGEN');
process.exit(failed ? 1 : 0);
