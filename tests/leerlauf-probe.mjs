// Probe für den Leerlauf (Spec .scratch/leistung/, Ticket 06): Wie viel zeichnet das Spiel, wenn niemand etwas tut, und
// reagiert es auf eine Eingabe im nächsten Bild? Seite mit ?perf&nointro&sky=<himmel> (Messwerkzeug aus Ticket 01).
// Abschnitte: «Menü» (offen nach dem Laden, Blick im Himmel), «Ruhe» (erstes Level der Geschichte, Strahlen stehen,
// keine Eingabe), «Eingabe» (Hover über die Elemente, Drehen per Klick bzw. Tippen, Kamera ziehen). Je Abschnitt
// gezeichnete Bilder je Sekunde, Zeichenzeit (GPU-Zeit, wo messbar) p95 und Mittel, GPU-Last je Sekunde (Mittel ×
// gez/s), CPU-Zeit von frame(); dazu je Eingabe, wie viele Bildschirmbilder nach dem Ereignis das erste gezeichnete
// Bild kam (0 = im nächsten), und die Bildabstände des sichtbaren Bilds (p95, max). Prüft: Reaktion immer im nächsten
// Bild, Konsole ohne Fehler; mit ?t= (--still) ruht die sichtbare Szene ganz (0 gezeichnete Bilder).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/leerlauf-probe.mjs [--fenster] [--handy]
//           [--drossel 4] [--sky forest] [--seite <index.html>] [--still]
//   --fenster: echtes Fenster (Messwerte; sonst headless, nur Regression); --handy: 393 × 873, Pixeldichte 2,75, Touch;
//   --seite: eine andere index.html (etwa der Stand vorher als Kopie); --still: mit ?t=12 (Zeit steht) nur prüfen,
//   dass Menü und Level nach kurzer Zeit nichts mehr zeichnen und Eingaben die Schleife wecken. Etwa 1 min.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wert = (name, vorgabe = null) => { const i = args.indexOf(name); return i < 0 ? vorgabe : args[i + 1]; };
const handy = args.includes('--handy'), fenster = args.includes('--fenster'), still = args.includes('--still');
const drossel = Number(wert('--drossel', 1)), sky = wert('--sky', 'forest');
const seite = resolve(wert('--seite', join(root, 'index.html')));
requireQuiet();

const view = handy ? { width: 393, height: 873, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const name = `leerlauf-${fenster ? 'fenster' : 'headless'}-${handy ? 'handy' : 'desktop'}${drossel > 1 ? `-drossel${drossel}` : ''}`
  + `${still ? '-still' : ''}-${sky}`;
const PAGE = pathToFileURL(seite).href + `?perf&nointro&sky=${sky}${still ? '&t=12' : ''}`;
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const chrome = await startChrome({ ...view, gpu: fenster || !!process.env.GPU, fenster, maximiert: fenster && !handy });
const { send, logs, close } = chrome;
setTimeout(async () => { console.error('Zeitrahmen von 6 min überschritten'); await close(); process.exit(3); }, 6 * 60000).unref();
const ev = (expr) => evaluate(send, expr);
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 5; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
async function tippe(x, y, wie = 'klick') {
  if (view.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await sleep(60);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  if (wie === 'hover') return;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
async function ziehe(x, y, dx) {
  if (view.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let k = 1; k <= 12; k++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * k / 12, y }] }); await sleep(16); }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  for (let k = 1; k <= 12; k++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + dx * k / 12, y, button: 'left', buttons: 1 }); await sleep(16); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + dx, y, button: 'left', clickCount: 1 });
}

// In der Seite: Abschnitte der Probe beim Messwerkzeug anmelden, Zählung neu beginnen, Reaktion auf Eingaben messen
const EINRICHTEN = `(() => {
  MESS_ABSCHNITTE.ruhe = ['Ruhe']; MESS_ABSCHNITTE.eingabe = ['Eingabe'];
  const p = window.__probe = { seen: [], pend: null, lat: [], ende: null };
  const zaehle = (ts) => { if (p.pend && ts > p.pend.t) p.pend.seen.push(ts); requestAnimationFrame(zaehle); };
  requestAnimationFrame(zaehle);
  for (const type of ['pointerdown', 'pointerup', 'pointermove']) {
    window.addEventListener(type, (e) => { if (!p.pend && (type !== 'pointermove' || !p.moveSeen)) {
      if (type === 'pointermove') p.moveSeen = true;
      p.pend = { type, t: e.timeStamp, seen: [] }; } }, { capture: true, passive: true });
  }
  const draw0 = draw;
  draw = function (...a) {
    if (p.pend && sceneLoop.last !== null) {
      const ts = sceneLoop.last;
      p.lat.push({ type: p.pend.type, frames: p.pend.seen.filter((x) => x < ts).length, ms: +(performance.now() - p.pend.t).toFixed(1) });
      p.pend = null;
    }
    return draw0.apply(this, a);
  };
  p.neu = (id) => {
    p.ende?.(); p.ende = id ? leistung.markiere(id) : null;
    leistung.teile.clear(); leistung.wechsel.length = 0; leistung.teil = null; leistung.prev = null;
  };
  return true;
})()`;
const LIES = `(() => {
  const out = {};
  for (const t of leistung.teile.values()) {
    const s = t.bild.summe / 1000, z = t.zeichnen;
    const mittel = z.n ? z.summe / z.n : null;
    out[t.id] = { sekunden: +s.toFixed(1), gezJeS: +(t.gezeichnet / s).toFixed(1),
      p95: leistung.quantil(t.bild, 0.95), max: +t.bild.max.toFixed(1), ueber33: t.ueber,
      zeichnenP95: leistung.quantil(z, 0.95), zeichnenMittel: mittel === null ? null : +mittel.toFixed(2),
      gpuMsJeS: mittel === null ? null : +(mittel * t.gezeichnet / s).toFixed(1),
      cpuP95: leistung.quantil(t.cpu, 0.95) };
  }
  out.reaktion = __probe.lat.splice(0);
  out.adaptiv = adaptiveResolution.scale;
  out.ruht = window.__prisma.ruht?.() ?? null;
  return JSON.stringify(out);
})()`;

const ergebnis = { name, seite, sky };
try {
  if (handy) {
    await emulate(send, view);
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
      + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  } else if (!fenster) await emulate(send, view);
  if (drossel > 1) await send('Emulation.setCPUThrottlingRate', { rate: drossel });
  if (fenster) await send('Page.bringToFront');
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(EINRICHTEN);
  await sleep(3000);

  // Menü offen, Blick im Himmel, keine Eingabe
  await ev('__probe.neu(null)');
  const f0 = await ev('window.__prisma.frames');
  await sleep(still ? 3000 : 8000);
  ergebnis.menue = JSON.parse(await ev(LIES)).menue;
  ergebnis.menue.bilderGesamt = await ev(`window.__prisma.frames - ${f0}`);
  console.log('Menü', JSON.stringify(ergebnis.menue));

  // erstes Level der Geschichte, warten, bis Strahlen und Ziele stehen
  await ev('__prismaDebug.zeige(story.firstIndex())');
  await until('window.__prisma.playing()', 'Level');
  await sleep(still ? 1000 : 7000);
  if (still) await ev('__prismaDebug.settle(6)');
  await sleep(1500);
  await ev("__probe.neu('ruhe')");
  const f1 = await ev('window.__prisma.frames');
  await sleep(still ? 3000 : 10000);
  ergebnis.ruhe = JSON.parse(await ev(LIES)).ruhe;
  ergebnis.ruhe.bilderGesamt = await ev(`window.__prisma.frames - ${f1}`);
  ergebnis.ruhe.ruht = await ev('window.__prisma.ruht?.() ?? null');
  console.log('Ruhe', JSON.stringify(ergebnis.ruhe));
  if (still) {
    pruefe(ergebnis.menue.bilderGesamt === 0, `Menü mit stehender Zeit: ${ergebnis.menue.bilderGesamt} Bilder statt 0`);
    pruefe(ergebnis.ruhe.bilderGesamt === 0 && ergebnis.ruhe.ruht, `Level mit stehender Zeit: ${ergebnis.ruhe.bilderGesamt} Bilder, ruht ${ergebnis.ruhe.ruht}`);
  }

  // Eingaben: über die Elemente fahren, die drehbaren antippen, Kamera ziehen
  await ev("__probe.neu('eingabe')");
  const punkte = JSON.parse(await ev(`JSON.stringify([...__prismaDebug.game.objects.values()].map((o) => {
    const p = o.getWorldPosition(new THREE.Vector3()).project(camera);
    return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, dreh: isRotatable(o.userData.element) };
  }))`));
  for (const p of punkte) {
    if (!view.phone) { await tippe(p.x, p.y, 'hover'); await sleep(400); }
    if (p.dreh) { await tippe(p.x, p.y); await sleep(900); }
  }
  await ziehe(view.width * 0.15, view.height * 0.8, view.width * 0.2);
  await sleep(1500);
  const e = JSON.parse(await ev(LIES));
  ergebnis.eingabe = e.eingabe;
  ergebnis.reaktion = e.reaktion;
  ergebnis.adaptiv = e.adaptiv;
  console.log('Eingabe', JSON.stringify(ergebnis.eingabe));
  const spaet = e.reaktion.filter((r) => r.frames > 0);
  console.log(`Reaktion: ${e.reaktion.length} Eingaben, erstes Bild nach ${JSON.stringify(e.reaktion.map((r) => r.frames))} `
    + `Bildschirmbildern (0 = im nächsten), ${JSON.stringify(e.reaktion.map((r) => r.ms))} ms`);
  pruefe(e.reaktion.length >= 3, `zu wenige Eingaben gemessen (${e.reaktion.length})`);
  pruefe(spaet.length === 0, `Reaktion nicht im nächsten Bild: ${JSON.stringify(spaet)}`);
} catch (err) {
  fehler.push(err.message);
  console.log(`  FEHLER ${err.message}`);
} finally {
  await close();
}
const bad = logs.filter((l) => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
pruefe(bad.length === 0, `Konsole: ${bad.join(' | ')}`);
// Sicherheitsnetz der Hauptschleife (sceneLoop.guard): Sie ruhte, obwohl etwas anstand – eine Weckstelle fehlt
const weckstellen = logs.filter((l) => /Weckstelle fehlt/.test(l));
if (weckstellen.length) console.log(`WARNUNG: ${weckstellen.length}× fehlende Weckstelle:\n  ${weckstellen.join('\n  ')}`);
const OUT = join(root, 'tests', 'output', 'leistung');
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${name}.json`), JSON.stringify(ergebnis, null, 1));
console.log(fehler.length ? `FEHLGESCHLAGEN (${fehler.length})` : 'OK');
process.exit(fehler.length ? 1 : 0);
