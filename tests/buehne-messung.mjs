// Messung und Bilder der Bühne von Prolog und Epilog (createStoryScene; Ticket 04 von .scratch/leistung/). Bis das
// Messwerkzeug aus Ticket 01 da ist, misst diese Probe selbst: Chrome mit GPU (mit --fenster sichtbar, sonst headless),
// Bildabstände über requestAnimationFrame (je Bild des Browsers, getrennt nach Kamerafahrt und Warten auf Tippen) und
// ein Performance-Trace über das DevTools-Protokoll, ausgewertet nach Script, Style, Layout, Paint, Raster, Composite
// und GPU (ms je Sekunde Prolog).
// Aufruf: LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/buehne-messung.mjs
//           [messen] [--handy] [--drossel 4] [--fenster] [--epilog] [--name x]
//         … node tests/buehne-messung.mjs bilder <ordner> [--fenster] [--nur handy,handy-275,…]
//   messen (Vorgabe): ein Prolog (bzw. mit --epilog ein Epilog) mit Tippen nach 1,5 s Warten je Einstellung, Ergebnis
//   nach tests/output/buehne/messung-<name>.json. Desktop 1920 × 953, --handy 393 × 873 mit Pixeldichte 2,75 und
//   Touch (wie das Poco F4 GT); --drossel: CPU-Drosselung (Emulation.setCPUThrottlingRate).
//   bilder: an jedem Ruhepunkt von Prolog und Epilog ein Bild, eingefroren auf dieselbe Zeit (Rauch, Glühwürmchen,
//   Funkeln), in Desktop, Handy hoch und quer und kleinem Handy, nach tests/output/buehne/<ordner>/; mit --nur nur
//   diese Ansichten, dazu handy-275 und quer-275 (Pixeldichte 2,75 wie das Poco, Massstab der Seite). Dazu in Prolog 4
//   die Andeutung der Linien des Kleinen Wagens mitten in der Fahrt (prolog-4-andeutung; Ticket 07 des Wagens).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'tests', 'output', 'buehne');
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const modus = ['bilder', 'vergleich'].includes(args[0]) ? args[0] : 'messen';
const fenster = args.includes('--fenster');
// --seite: eine andere Fassung der Seite im selben Ordner (etwa der Stand vor dem Umbau, für Vorher-Werte)
const PAGE = pathToFileURL(join(root, wert('--seite') ?? 'index.html')).href + '?noadapt&nointro';
const D = '__prismaDebug';
const storyMode = `(!document.getElementById('story').classList.contains('hidden') && document.getElementById('story')`
  + '.dataset.mode)';
if (modus !== 'vergleich') requireQuiet();

async function oeffne(view) {
  const chrome = await startChrome({ width: view.width, height: view.height, gpu: true, fenster });
  const send = chrome.send;
  await emulate(send, view);
  const ev = (expr) => evaluate(send, expr);
  const until = async (expr, what, seconds = 120) => {
    for (let i = 0; i < seconds * 10; i++) {
      if (await ev(expr).catch(() => false)) return;
      await sleep(100);
    }
    throw new Error(`Zeitüberschreitung: ${what}`);
  };
  const tippeBei = async (x, y) => {
    if (view.phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
    }
  };
  const tippe = async (selector) => {
    await until(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[inert]'); })()`, selector, 30);
    const { x, y } = await ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)})
      .getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await tippeBei(x, y);
  };
  await send('Page.navigate', { url: PAGE });
  await until(`window.__prisma?.frames > 2 && ${D}.menu.offen`, 'Menü');
  await ev('document.fonts.ready.then(() => true)');
  // erste Geste (Ton freischalten) ins Leere des Menüs, wie die Geschichte-Probe
  for (let n = 0; n < 3 && !(await ev(`!!${D}.audio.ctx`)); n++) {
    // Ecke des Layouts (mit dem Massstab der Seite grösser als der Bildschirm, Ticket 18)
    const L = await ev('({ w: innerWidth, h: innerHeight })');
    await tippeBei(L.w - 4, L.h - 4);
    await sleep(200);
  }
  // der Himmel ist geladen und alles vorgewärmt: gemessen wird die Bühne, nicht das Laden
  await until(`${D}.skyTheme.ready`, 'Himmel bereit', 60);
  await sleep(3000);
  return { ...chrome, ev, until, tippe, tippeBei };
}

/** Bühne starten: Prolog über die Karte «Leicht» im Menü, Epilog direkt über playScene. */
async function starte(c, epilog) {
  if (!epilog) await c.tippe(`#menue .menue-wahl[data-menue-fokus="wahl:leicht"]`);
  else {
    await c.ev(`(() => { const s = ${D}.story; ${D}.menu.hide(); s.choosing = false; s.running = true;
      s.playScene(STORY_EPILOG, { actions: [['Zum Menü', () => {}]] }); return true; })()`);
  }
  await c.until(`${storyMode} === 'scene'`, 'Bühne');
}
const wartetTippen = `${D}.story.waitTap !== null`;
const fertig = `(document.querySelectorAll('#story .scene .actions button').length > 0 || ${storyMode} !== 'scene')`;

const quantil = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const kurz = (xs) => ({ bilder: xs.length, p50: +quantil(xs, 0.5).toFixed(1), p95: +quantil(xs, 0.95).toFixed(1),
  max: +Math.max(0, ...xs).toFixed(1), ueber20: xs.filter((d) => d > 20).length, ueber33: xs.filter((d) => d > 33).length,
  ueber50: xs.filter((d) => d > 50).length });

/** Trace: Selbstzeit je Ereignis auf dem Hauptthread, dazu Raster-, Compositor- und GPU-Threads, in Gruppen. */
function werteTraceAus(events, sekunden) {
  const threads = new Map();
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') threads.set(`${e.pid}:${e.tid}`, e.args.name);
  const gruppe = (thread, name) => {
    if (/^CrRendererMain/.test(thread)) {
      if (/^(UpdateLayoutTree|RecalculateStyles|ScheduleStyleRecalculation|ParseAuthorStyleSheet)$/.test(name)) return 'Style';
      if (/^(Layout|UpdateLayerTree|IntersectionObserverController::computeIntersections)$/.test(name)) return 'Layout';
      if (/^(Paint|PrePaint|PaintImage|Layerize|UpdateLayer|PaintSetup|Decode Image|Draw LazyPixelRef)$/.test(name)) return 'Paint';
      if (/^(Commit|CompositeLayers)$/.test(name)) return 'Composite (Haupt)';
      if (/^(FunctionCall|EvaluateScript|FireAnimationFrame|TimerFire|EventDispatch|v8\..*|V8\..*|RunMicrotasks|MinorGC|MajorGC|BlinkGC.*|ScriptStreamerTask|FireIdleCallback)$/.test(name)) return 'Script';
      return null;
    }
    if (/^CompositorTileWorker/.test(thread)) return /^RasterTask$/.test(name) ? 'Raster' : null;
    if (/^Compositor$/.test(thread)) return /^(ProxyImpl::|Scheduler::|DrawFrame|Graphics|ThreadProxy|LayerTreeHostImpl::)/.test(name) || name === 'ActivateLayerTree' ? null : null;
    if (/^CrGpuMain$/.test(thread)) return name === 'GPUTask' ? 'GPU' : null;
    if (/^VizCompositorThread$/.test(thread)) return /^(Graphics\.Pipeline|DisplayScheduler::DrawAndSwap|Display::DrawAndSwap)$/.test(name) ? 'Viz (DrawAndSwap)' : null;
    return null;
  };
  // Selbstzeit: verschachtelte X-Ereignisse je Thread über einen Stapel
  const proThread = new Map();
  for (const e of events) {
    if (e.ph !== 'X' || e.dur == null) continue;
    const k = `${e.pid}:${e.tid}`;
    if (!proThread.has(k)) proThread.set(k, []);
    proThread.get(k).push(e);
  }
  const summe = {}, namen = {};
  for (const [k, list] of proThread) {
    const thread = threads.get(k) ?? '?';
    list.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    // Selbstzeit = Dauer minus direkte Kinder
    const kinder = new Map();
    const st2 = [];
    for (const e of list) {
      while (st2.length && st2.at(-1).ts + st2.at(-1).dur <= e.ts) st2.pop();
      if (st2.length) kinder.set(st2.at(-1), (kinder.get(st2.at(-1)) ?? 0) + e.dur);
      st2.push(e);
    }
    for (const e of list) {
      // nur die Ereignisse einer Gruppe; ein Kind ohne Gruppe zählt zur Gruppe des nächsten Vorfahren mit Gruppe
      const g = gruppe(thread, e.name);
      if (!g) continue;
      const self = g === 'GPU' || g === 'Raster' || g === 'Viz (DrawAndSwap)' ? e.dur : Math.max(0, e.dur - (kinder.get(e) ?? 0));
      summe[g] = (summe[g] ?? 0) + self / 1000;
      if (/^CrRendererMain/.test(thread)) namen[e.name] = (namen[e.name] ?? 0) + self / 1000;
    }
  }
  const jeSekunde = Object.fromEntries(Object.entries(summe).map(([g, ms]) => [g, +(ms / sekunden).toFixed(1)]));
  const top = Object.entries(namen).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([n, ms]) => [n, +(ms / sekunden).toFixed(1)]);
  return { jeSekunde, hauptthreadTop: top };
}

async function messen() {
  const handy = args.includes('--handy');
  const view = handy ? { width: 393, height: 873, dpr: 2.75, phone: true } : { width: 1920, height: 953, dpr: 1, phone: false };
  const drossel = +(wert('--drossel') ?? 1), epilog = args.includes('--epilog');
  const name = wert('--name') ?? `${epilog ? 'epilog' : 'prolog'}-${handy ? 'handy' : 'desktop'}-x${drossel}`;
  const c = await oeffne(view);
  try {
    const events = [];
    let fertigTrace;
    const traceFertig = new Promise((r) => { fertigTrace = r; });
    c.on('Tracing.dataCollected', ({ value }) => {
      for (const e of value) {
        if (e.ph === 'M' || (e.ph === 'X' && e.dur != null)) events.push({ ph: e.ph, name: e.name, pid: e.pid, tid: e.tid, ts: e.ts, dur: e.dur, args: e.ph === 'M' ? e.args : undefined });
      }
    });
    c.on('Tracing.tracingComplete', () => fertigTrace());
    if (drossel > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: drossel });
    await c.ev(`(() => { const b = window.__bz = { an: true, log: [] }; const loop = (ts) => { if (!b.an) return;
      const sc = ${D}.story.scene; b.log.push({ ts, buehne: ${storyMode} === 'scene', fahrt: !!sc?.moving, js: !!(sc?.raf || sc?.tweens?.length) });
      requestAnimationFrame(loop); }; requestAnimationFrame(loop); return true; })()`);
    await c.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { recordMode: 'recordContinuously',
      includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.frame', 'toplevel', 'viz'] } });
    // --ohne-webgl: die 3D-Szene hinter der deckenden Bühne zeichnet nicht (wie nach Ticket 02), gemessen wird die Bühne
    if (args.includes('--ohne-webgl')) {
      await c.ev(`(() => { const r = ${D}.renderer; r.__render ??= r.render;
        r.render = function (...a) { if (!${D}.story.covered) return r.__render.apply(this, a); }; return true; })()`);
    }
    const t0 = Date.now();
    await starte(c, epilog);
    for (let n = 0; n < 12; n++) {
      await c.until(`${wartetTippen} || ${fertig} || document.querySelectorAll('#story .scene .actions.angebot button').length > 0`, `Einstellung ${n + 1}`, 90);
      if (!(await c.ev(wartetTippen))) break;
      await sleep(1500); // Warten auf Tippen: auch diese Phase zählt
      await c.tippe('#story .scene .lines');
    }
    await sleep(1500);
    const sekunden = (Date.now() - t0) / 1000;
    await c.send('Tracing.end');
    await traceFertig;
    if (drossel > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const log = await c.ev('(() => { const b = window.__bz; b.an = false; return b.log; })()');
    const ab = log.findIndex((e) => e.buehne);
    const teil = log.slice(Math.max(1, ab));
    const luecken = teil.map((e, i) => [e.ts - log[Math.max(1, ab) + i - 1].ts, e.fahrt, e.js]);
    const gpu = await c.ev(`(() => { const gl = ${D}.renderer.getContext(), x = gl.getExtension('WEBGL_debug_renderer_info');
      return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : '?'; })()`);
    const ergebnis = { name, view, drossel, fenster, gpu, ohneWebgl: args.includes('--ohne-webgl'), sekunden: +sekunden.toFixed(1),
      bilder: { alle: kurz(luecken.map(([d]) => d)), fahrt: kurz(luecken.filter(([, f]) => f).map(([d]) => d)),
        mitJs: kurz(luecken.filter(([, , j]) => j).map(([d]) => d)), ohneJs: kurz(luecken.filter(([, , j]) => !j).map(([d]) => d)),
        warten: kurz(luecken.filter(([, f]) => !f).map(([d]) => d)) },
      trace: werteTraceAus(events, sekunden), konsole: c.logs.filter((l) => /error|exception/i.test(l)) };
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `messung-${name}.json`), JSON.stringify(ergebnis, null, 2));
    console.log(JSON.stringify(ergebnis, null, 1));
  } finally { await c.close(); }
}

/**
 * Bühne einfrieren: Zeit der Bühne und alle Animationen auf feste Werte, damit vorher und nachher gleich sind (CSS-
 * Animationen auf 1,5 s; die WebGL-Bühne zeichnet ihr Bild zur Zeit der Bühne, scene.einfrieren; fertige Fahrten bleiben).
 */
const einfrieren = `(() => { const sc = ${D}.story.scene; sc.einfrieren(12.5);
  for (const a of document.getAnimations()) {
    if (a.playState === 'finished') continue;
    a.pause();
    if (a instanceof CSSAnimation || a instanceof CSSTransition) a.currentTime = 1500;
  }
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`;
const auftauen = `(() => { const sc = ${D}.story.scene;
  for (const a of document.getAnimations()) if (a.playState === 'paused') a.play();
  sc.auftauen();
  return true; })()`;

async function bilder() {
  const ordner = args[1];
  if (!ordner || ordner.startsWith('--')) throw new Error('bilder <ordner>');
  const dir = join(OUT, ordner);
  mkdirSync(dir, { recursive: true });
  const VIEWS = [{ name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false },
    { name: 'handy', width: 390, height: 844, dpr: 2, phone: true },
    { name: 'quer', width: 844, height: 390, dpr: 2, phone: true },
    { name: 'handy-360x640', width: 360, height: 640, dpr: 2, phone: true },
    // nur mit --nur: Pixeldichte 2,75 wie das Poco F4 GT, mit dem Massstab der Seite (Ticket 18 von .scratch/leistung/)
    { name: 'handy-275', width: 393, height: 873, dpr: 2.75, phone: true, extra: true },
    { name: 'quer-275', width: 873, height: 393, dpr: 2.75, phone: true, mobile: true, extra: true }];
  for (const view of VIEWS.filter((v) => (wert('--nur') ? wert('--nur').split(',').includes(v.name) : !v.extra))) {
    for (const epilog of [false, true]) {
      const c = await oeffne(view);
      try {
        await starte(c, epilog);
        for (let n = 1; n <= 12; n++) {
          await c.until(`${wartetTippen} || ${fertig} || document.querySelectorAll('#story .scene .actions.angebot button').length > 0`, `Einstellung ${n}`, 90);
          await sleep(2000); // Untertitel und Einblenden fertig
          await c.ev(einfrieren);
          const file = join(dir, `${view.name}-${epilog ? 'epilog' : 'prolog'}-${n}.png`);
          writeFileSync(file, Buffer.from((await c.send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
          console.log(`  Bild ${file}`);
          await c.ev(auftauen);
          if (!(await c.ev(wartetTippen))) break;
          await c.tippe('#story .scene .lines');
          // Prolog 4: Die Linien des Kleinen Wagens zeichnen sich ab (Ticket 07 von .scratch/kleiner-wagen/), mitten in der
          // Fahrt, wenn sie am hellsten sind
          if (!epilog && n === 3) {
            await c.until(`(() => { const sc = ${D}.story.scene;
              return sc.wagenBei(sc.time).linie > 0.95 * BUEHNENWAGEN.andeutung.hell; })()`, 'Andeutung in Prolog 4', 20);
            await c.ev(einfrieren);
            const file = join(dir, `${view.name}-prolog-4-andeutung.png`);
            writeFileSync(file, Buffer.from((await c.send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
            console.log(`  Bild ${file}`);
            await c.ev(auftauen);
          }
        }
        const fehler = c.logs.filter((l) => /error|exception/i.test(l));
        if (fehler.length) console.log('  Konsole:', fehler.join('\n'));
      } finally { await c.close(); }
    }
  }
}

/* ---- PNG lesen und schreiben (ohne Pakete): Vergleich vorher/nachher ---- */
function lesePng(file) {
  const b = readFileSync(file);
  let p = 8, w = 0, h = 0, typ = 0;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), art = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (art === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); typ = d[9]; }
    else if (art === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = typ === 6 ? 4 : 3, stride = w * bpp, raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], z = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? z[i - bpp] : 0, o = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = z[i];
      if (f === 1) v += a; else if (f === 2) v += o; else if (f === 3) v += (a + o) >> 1;
      else if (f === 4) { const q = a + o - c, pa = Math.abs(q - a), pb = Math.abs(q - o), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? o : c; }
      z[i] = v & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) out[(y * w + x) * 4 + k] = k < 3 || bpp === 4 ? z[x * bpp + k] : 255;
    prev = z;
  }
  return { w, h, data: out };
}
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function schreibePng(file, { w, h, data }) {
  const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (art, d) => {
    const l = Buffer.alloc(4), c = Buffer.alloc(4), td = Buffer.concat([Buffer.from(art), d]);
    l.writeUInt32BE(d.length); c.writeUInt32BE(crc(td));
    return Buffer.concat([l, td, c]);
  };
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

/**
 * vergleich <vorher> <nachher>: je Bild der Anteil der Pixel, die um mehr als 24 (von 255, grösster Kanal) abweichen,
 * und die mittlere Abweichung; dazu nebeneinander (links vorher, rechts nachher) nach tests/output/buehne/vergleich/.
 */
async function vergleich() {
  const [a, b] = [args[1], args[2]].map((o) => join(OUT, o));
  const dir = join(OUT, 'vergleich');
  mkdirSync(dir, { recursive: true });
  const zeilen = [];
  for (const name of readdirSync(a).filter((f) => f.endsWith('.png')).sort()) {
    const x = lesePng(join(a, name)), y = lesePng(join(b, name));
    let ueber = 0, summe = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      const d = Math.max(...[0, 1, 2].map((k) => Math.abs(x.data[i + k] - y.data[i + k])));
      summe += d;
      if (d > 24) ueber++;
    }
    const nb = { w: x.w * 2 + 8, h: x.h, data: Buffer.alloc((x.w * 2 + 8) * x.h * 4, 255) };
    for (let r = 0; r < x.h; r++) {
      x.data.copy(nb.data, r * nb.w * 4, r * x.w * 4, (r + 1) * x.w * 4);
      y.data.copy(nb.data, (r * nb.w + x.w + 8) * 4, r * x.w * 4, (r + 1) * x.w * 4);
    }
    schreibePng(join(dir, name), nb);
    zeilen.push(`${name.padEnd(30)} ${(ueber / (x.w * x.h) * 100).toFixed(2).padStart(6)} %  mittel ${(summe / (x.w * x.h)).toFixed(2)}`);
  }
  console.log(zeilen.join('\n'));
}

await ({ bilder, vergleich, messen }[modus])();
