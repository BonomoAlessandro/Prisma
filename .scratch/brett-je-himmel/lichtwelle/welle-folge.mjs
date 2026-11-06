// Bildfolge der Lichtwelle einer Katalog-Variante: einmal lösen, die echten Werte des Rings je Bild aufzeichnen, dann
// den Ring an mehreren Radien anhalten und je ein Bild aufnehmen, zuletzt «Ruhe» (Ring vorbei).
// Aufruf: SKY=beach VARIANTEN=v-strand node welle-folge.mjs wasserrand   (Basis: ../katalog-basis, Stand 6f322ce)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const basis = join(here, '..', 'katalog-basis');
const { startChrome, emulate, sleep } = await import(pathToFileURL(join(basis, 'tools', 'chrome.mjs')).href);
const v = process.argv[2];
const out = join(here, 'out', v);
mkdirSync(out, { recursive: true });
const W = 1440, H = 900, LEVEL = process.env.LEVEL ?? '40';
const RADIEN = (process.env.RADIEN || '0.6,1.8,3,4.2,5.4,6.6').split(',').map(Number);
const vdir = join(here, process.env.VARIANTEN);
const bretter = [readFileSync(join(here, 'bretter.js'), 'utf8'),
  ...readdirSync(vdir).filter((f) => f.endsWith('.js')).sort().map((f) => readFileSync(join(vdir, f), 'utf8'))].join('\n;\n');

const { send, logs, close } = await startChrome({ width: W, height: H, gpu: true });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
const shot = async (name) => {
  const k = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78, clip: { x: 0, y: 0, width: W, height: H, scale: 1080 / W } });
  writeFileSync(join(out, `${name}.jpg`), Buffer.from(k.result.data, 'base64'));
};
try {
  await emulate(send, { width: W, height: H, dpr: 1, phone: false });
  await send('Page.navigate', { url: pathToFileURL(join(basis, 'index.html')).href + `?noadapt&nointro&sky=${process.env.SKY}` });
  for (let i = 0; i < 150; i++) {
    const s = await ev('JSON.stringify(window.__prisma || null)').catch(() => 'null');
    if (JSON.parse(s ?? 'null')?.ticks > 2) break;
    await sleep(200);
  }
  for (let i = 0; i < 240; i++) { if (await ev('window.__prisma?.skyReady?.() ?? true')) break; await sleep(250); }
  await ev(`__prismaDebug.zeige(${LEVEL})`);
  await sleep(7000);
  await ev(bretter);
  console.log(v, 'bau:', await ev(`__katalog.bau(${JSON.stringify(v)})`));
  await sleep(1500);
  await ev(`__katalog.kamera('schraeg')`);
  await sleep(2000);
  await shot('0-vorher');
  // Lösen und die echten Werte des Rings (Radius, Stärke, Breite) je Bild aufzeichnen
  const n = await ev(`(async () => {
    const s = __katalog.lib.shock, D = __prismaDebug, rec = [];
    D.loese();
    const t0 = performance.now();
    await new Promise((res) => { const f = () => { rec.push(s.uShock.value.toArray()); (performance.now() - t0 > 9000) ? res() : requestAnimationFrame(f); }; f(); });
    window.__rec = rec.filter((a) => a[1] > 0);
    return JSON.stringify({ n: rec.length, aktiv: window.__rec.length, maxR: Math.max(...window.__rec.map((a) => a[0])) });
  })()`);
  console.log(v, 'aufgezeichnet', n);
  let i = 1;
  for (const r of RADIEN) {
    const val = await ev(`(() => {
      const rec = window.__rec, s = __katalog.lib.shock, D = __prismaDebug;
      const v = (rec.find((a) => a[0] >= ${r}) || rec.at(-1)).slice();
      D.scene.onBeforeRender = () => { s.uShock.value.fromArray(v); };
      D.sceneLoop.wake(true);
      return v.map((x) => +x.toFixed(2));
    })()`);
    await sleep(700);
    await shot(`${i}-r${r}`);
    console.log(v, 'Radius', r, '->', val);
    i++;
  }
  await ev(`(() => { const s = __katalog.lib.shock, D = __prismaDebug; D.scene.onBeforeRender = () => { s.uShock.value.y = 0; }; D.sceneLoop.wake(true); })()`);
  await sleep(1500);
  await shot(`${i}-ruhe`);
} catch (e) {
  console.error(v, 'FEHLER', e.message);
}
const relevant = logs.filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
if (relevant.length) console.log(v, 'Konsole:\n  ' + relevant.slice(0, 12).join('\n  '));
await close();
