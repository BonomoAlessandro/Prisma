// Echte Bildfolge der Lichtwelle je Variante: Brett bauen, schräg wie im Spiel, lösen und die ganze Welle in Echtzeit
// mitschneiden (Page.startScreencast), dann im Takt von FPS Bilder vom Start des Rings −0,3 s bis DAUER auswählen.
// Aufruf: node welle-film.mjs s-brandung w-rippel …   (s-… am Strand, w-… in der Wüste; heute-s / heute-w: heutiges
// Brett ohne neue Welle). Basis: ../katalog-basis (Stand 6f322ce). Bilder: out/<variante>/f00.jpg …, zeiten.json
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const basis = process.env.BASIS ?? join(here, '..', 'katalog-basis'); // fester Spielstand (Worktree 6f322ce)
const { startChrome, emulate, sleep } = await import(pathToFileURL(join(basis, 'tools', 'chrome.mjs')).href);
const W = 1440, H = 900, LEVEL = process.env.LEVEL ?? '40';
const FPS = +(process.env.FPS ?? 12), VOR = 0.3, DAUER = +(process.env.DAUER ?? 3.2);
const FIX = process.env.FIX; // Standbilder statt Film: Zeiten (s) mit Komma, zum schnellen Prüfen
const vdir = join(here, 'varianten');
const code = [readFileSync(join(here, 'bretter.js'), 'utf8'),
  ...readdirSync(vdir).filter((f) => f.endsWith('.js')).sort().map((f) => readFileSync(join(vdir, f), 'utf8'))].join('\n;\n');

const { send, on, logs, close } = await startChrome({ width: W, height: H, gpu: true });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
let frames = null;
on('Page.screencastFrame', (p) => {
  if (frames) frames.push({ t: p.metadata.timestamp * 1000, data: p.data });
  send('Page.screencastFrameAck', { sessionId: p.sessionId });
});
await emulate(send, { width: W, height: H, dpr: 1, phone: false });

for (const v of process.argv.slice(2)) {
  const sky = v.startsWith('w') || v === 'heute-w' ? 'desert' : 'beach';
  const out = join(here, 'out', v + (process.env.MESS ? '-mess' : FIX ? '-fix' : ''));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  try {
    await send('Page.navigate', { url: pathToFileURL(join(basis, 'index.html')).href + `?noadapt&nointro&sky=${sky}` });
    await sleep(1500);
    for (let i = 0; i < 150; i++) {
      const s = await ev('JSON.stringify(window.__prisma || null)').catch(() => 'null');
      if (JSON.parse(s ?? 'null')?.ticks > 2) break;
      await sleep(200);
    }
    for (let i = 0; i < 240; i++) { if (await ev('window.__prisma?.skyReady?.() ?? true')) break; await sleep(250); }
    await ev(`__prismaDebug.zeige(${LEVEL})`);
    await sleep(7000);
    await ev(code);
    const name = v === 'heute-s' ? 'wasserrand' : v === 'heute-w' ? 'lehm' : v;
    console.log(v, 'bau:', await ev(`__katalog.bau(${JSON.stringify(name)})`));
    await sleep(1500);
    await ev(`__katalog.kamera('schraeg')`);
    await sleep(2500);
    if (FIX) {
      for (const t of FIX.split(',').map(Number)) {
        await ev(`__katalog.welle.st.fix = ${t}; __prismaDebug.sceneLoop.wake(true)`);
        await sleep(600);
        const k = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
        writeFileSync(join(out, `fix-${t}.jpg`), Buffer.from(k.result.data, 'base64'));
      }
      console.log(v, 'Standbilder', FIX);
      continue;
    }
    if (process.env.MESS) {
      // GPU-Zeit je Bild (Messwerkzeug des Spiels, EXT_disjoint_timer_query) bei angehaltener Welle: Feld (0,5 s),
      // Rand (1,0 s), Ausklang (1,8 s), Ruhe
      const res = {};
      for (const t of [0.5, 1.0, 1.8, 99]) {
        await ev(`__katalog.welle.st.fix = ${t}; __prismaDebug.sceneLoop.wake(true)`);
        await sleep(600);
        const r = await ev(`(async () => {
          if (!leistung.aktiv) leistung.starte();
          const aus = leistung.markiere('m${t}');
          await new Promise((res) => setTimeout(res, 3000));
          aus();
          await new Promise((res) => setTimeout(res, 300));
          const z = leistung.teile.get('m${t}');
          return { timer: !!leistung.timer, n: z?.zeichnen.n ?? 0, gpu: z && z.zeichnen.n ? +(z.zeichnen.summe / z.zeichnen.n).toFixed(3) : null,
            cpu: z && z.cpu.n ? +(z.cpu.summe / z.cpu.n).toFixed(3) : null };
        })()`);
        res[t] = r;
      }
      console.log(v, 'MESS', JSON.stringify(res));
      writeFileSync(join(out, 'mess.json'), JSON.stringify(res, null, 1));
      continue;
    }
    frames = [];
    await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    await sleep(500);
    // Takt im Spiel während der Welle (rAF-Abstände), dann lösen
    await ev(`(() => { const a = window.__takt = []; let p = performance.now(); const t0 = p;
      const f = (t) => { a.push(t - p); p = t; if (t - t0 < 6000) requestAnimationFrame(f); }; requestAnimationFrame(f);
      __prismaDebug.loese(); })()`);
    let start = null;
    for (let i = 0; i < 100 && start === null; i++) { start = await ev('__katalog.welle.st.wallStart'); if (start === null) await sleep(50); }
    if (start === null) throw new Error('Ring startete nicht');
    while (Date.now() < start + DAUER * 1000 + 300) await sleep(50);
    await send('Page.stopScreencast');
    const got = frames; frames = null;
    const takt = await ev(`(() => { const a = window.__takt.slice(5); a.sort((x, y) => x - y);
      return { n: a.length, median: +a[a.length >> 1].toFixed(1), p95: +a[Math.floor(a.length * 0.95)].toFixed(1), max: +a.at(-1).toFixed(1) }; })()`);
    const zeiten = [];
    const n = Math.round((DAUER + VOR) * FPS);
    for (let k = 0; k < n; k++) {
      const ziel = start + (-VOR + k / FPS) * 1000;
      let best = got[0];
      for (const fr of got) if (Math.abs(fr.t - ziel) < Math.abs(best.t - ziel)) best = fr;
      writeFileSync(join(out, `f${String(k).padStart(2, '0')}.jpg`), Buffer.from(best.data, 'base64'));
      zeiten.push(+((best.t - start) / 1000).toFixed(3));
    }
    const gaps = got.slice(1).map((f, i) => f.t - got[i].t).sort((a, b) => a - b);
    writeFileSync(join(out, 'zeiten.json'), JSON.stringify({ start, zeiten, screencast: got.length, takt }, null, 1));
    console.log(v, `Film: ${got.length} Bilder im Mitschnitt (Abstand median ${gaps[gaps.length >> 1]?.toFixed(0)} ms, max ${gaps.at(-1)?.toFixed(0)} ms),`,
      `${n} gewählt; Takt im Spiel`, JSON.stringify(takt));
  } catch (e) {
    console.error(v, 'FEHLER', e.message);
  }
  const relevant = logs.splice(0).filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
  if (relevant.length) console.log(v, 'Konsole:\n  ' + relevant.slice(0, 12).map((l) => l.slice(0, 700)).join('\n  '));
}
await close();
