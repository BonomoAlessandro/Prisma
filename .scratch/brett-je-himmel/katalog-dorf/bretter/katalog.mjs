// Spielbilder für den Skizzenkatalog «Brett am Strand» (Ticket 03), im festen Stand katalog-basis (6f322ce).
// Aufruf: node katalog.mjs <variante>[,<variante>…] [ansichten]   ansichten: schraeg,flach,oben,welle (Vorgabe alle)
// Dorf (Ticket 08): SKY=village VARIANTEN=varianten-dorf node katalog.mjs laube,quilt,platz,hochbeet,glas,laterne,ofen,spielbrett,stein
//   (über tools/leise.sh, Stand katalog-basis = main 504adbb; Bilder in OUT/klein)
// Umgebung: LEVEL (Index), W/H (Fenster), OUT (Ordner)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const basis = join(here, '..', 'katalog-basis');
const { startChrome, emulate, sleep } = await import(pathToFileURL(join(basis, 'tools', 'chrome.mjs')).href);
const out = process.env.OUT || join(basis, 'tests', 'output', 'katalog');
mkdirSync(out, { recursive: true });

const varianten = (process.argv[2] || 'stein').split(',');
const ansichten = (process.argv[3] || 'schraeg,flach,oben,welle').split(',');
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const LEVEL = process.env.LEVEL ?? '40';
const { readdirSync } = await import('node:fs');
const bretter = [readFileSync(join(here, 'bretter.js'), 'utf8'), ...readdirSync(join(here, process.env.VARIANTEN || 'varianten')).filter((f) => f.endsWith('.js')).sort().map((f) => readFileSync(join(here, process.env.VARIANTEN || 'varianten', f), 'utf8'))].join('\n;\n');

for (const v of varianten) {
  const t0 = Date.now();
  const { send, logs, close } = await startChrome({ width: W, height: H, gpu: true });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  try {
    await emulate(send, { width: W, height: H, dpr: +(process.env.DPR || 1), phone: !!process.env.MOBILE });
    await send('Page.navigate', { url: pathToFileURL(join(basis, 'index.html')).href + `?noadapt&nointro&sky=${process.env.SKY || 'beach'}` });
    for (let i = 0; i < 150; i++) {
      const s = await ev('JSON.stringify(window.__prisma || null)').catch(() => 'null');
      if (JSON.parse(s ?? 'null')?.ticks > 2) break;
      await sleep(200);
    }
    for (let i = 0; i < 240; i++) { if (await ev('window.__prisma?.skyReady?.() ?? true')) break; await sleep(250); }
    await ev(`__prismaDebug.zeige(${LEVEL})`);
    await sleep(+(process.env.WARTE || 7000));
    await ev(bretter);
    const info = await ev(`__katalog.bau(${JSON.stringify(v)})`);
    if (info) console.log(v, 'bau:', info);
    await sleep(1500);
    const shot = async (name) => {
      const ecken = await ev('JSON.stringify(__katalog.ecken())');
      writeFileSync(join(out, `${v}-${name}.json`), ecken);
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
      writeFileSync(join(out, `${v}-${name}.jpg`), Buffer.from(r.result.data, 'base64'));
      // klein für den Katalog: 1080 breit; die Aufsicht auf das Brett zugeschnitten, 620 breit
      mkdirSync(join(out, 'klein'), { recursive: true });
      let clip = { x: 0, y: 0, width: W, height: H, scale: 1080 / W };
      if (name === 'oben') {
        const e = JSON.parse(ecken), xs = e.oben.map((p) => p[0]), ys = e.oben.map((p) => p[1]);
        const x0 = Math.max(0, Math.min(...xs) - 24), y0 = Math.max(0, Math.min(...ys) - 24);
        const x1 = Math.min(W, Math.max(...xs) + 24), y1 = Math.min(H, Math.max(...ys) + 24);
        clip = { x: x0, y: y0, width: x1 - x0, height: y1 - y0, scale: 620 / (x1 - x0) };
      }
      const k = await send('Page.captureScreenshot', { format: 'jpeg', quality: 76, clip });
      writeFileSync(join(out, 'klein', `${v}-${name}.jpg`), Buffer.from(k.result.data, 'base64'));
    };
    for (const a of ansichten) {
      if (a === 'welle') {
        await ev(`__katalog.kamera('schraeg')`);
        await sleep(2000);
        await ev(`__katalog.welle(${process.env.RADIUS || 2.9})`);
        await sleep(600);
        await shot('welle');
        continue;
      }
      await ev(`__katalog.kamera(${JSON.stringify(a)})`);
      await sleep(a === 'schraeg' ? 300 : 2200);
      await shot(a);
    }
  } catch (e) {
    console.error(v, 'FEHLER', e.message);
  }
  const relevant = logs.filter(l => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
  if (relevant.length) console.log(v, 'Konsole:\n  ' + relevant.slice(0, 12).join('\n  '));
  await close();
  console.log(v, 'fertig in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
