// Probe der Ruhe-Bildrate (Spec .scratch/energie/, Tickets 01 und 02; ADR 0009): Ohne Parameter (Standard seit Ticket
// 02) zeichnet das ruhende Level 30 Bilder/s, nach einer Eingabe sofort wieder 60; Drehung und Feier bleiben bei 60;
// auch mit Bewegung im Himmel (Glühwürmchen im Wald) ruht es; mit ?ruhetakt=60 (aus) stetig 60 wie unter ADR 0008.
// Gemessen in der Seite: rAF-Zeitstempel (Bildschirmbilder) und gezeichnete Bilder (draw, mit frameRate.ruht). Daraus
// gezeichnete Bilder/s, übersprungene Bildschirmbilder zwischen zwei gezeichneten, wie viele Bildschirmbilder nach einer
// Eingabe das erste Bild kam (0 = im nächsten) und wann die Ruhe wieder beginnt.
// Durchgänge: «ruhe» (Wüste ohne Parameter: Ruhe, Tippen aufs leere Brett, Drehen, Lösen mit Feier), «aus» (Wüste,
// ?ruhetakt=60: stetig 60, Tippen), «wald» (Wald ohne Parameter: Ruhe mit Glühwürmchen).
// Aufruf: GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/ruhetakt-probe.mjs
//           [--handy] [--fenster] [--seite <index.html>] [--nur ruhe,aus,wald]
//   --handy: 393 × 873, Pixeldichte 2,75, Touch; --fenster: echtes Fenster (Takt des Bildschirms; sonst headless).
//   Etwa 2 min. Ergebnis nach tests/output/energie/ruhetakt-<bildschirm>.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wert = (name, vorgabe = null) => { const i = args.indexOf(name); return i < 0 ? vorgabe : args[i + 1]; };
const handy = args.includes('--handy'), fenster = args.includes('--fenster');
const seite = resolve(wert('--seite', join(root, 'index.html')));
const nur = (wert('--nur', 'ruhe,aus,wald')).split(',');
requireQuiet();

const view = handy ? { width: 393, height: 873, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const name = `ruhetakt-${fenster ? 'fenster' : 'headless'}-${handy ? 'handy' : 'desktop'}`;
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const chrome = await startChrome({ ...view, gpu: fenster || !!process.env.GPU, fenster, maximiert: fenster && !handy });
const { send, logs, close } = chrome;
setTimeout(async () => { console.error('Zeitrahmen von 8 min überschritten'); await close(); process.exit(3); }, 8 * 60000).unref();
const ev = (expr) => evaluate(send, expr);
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 5; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
async function tippe(x, y) {
  if (view.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await sleep(60);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

// In der Seite: Bildschirmbilder (rAF) und gezeichnete Bilder (draw) mitschreiben, dazu die erste Eingabe nach arm():
// ihre Zeit und das erste Bildschirmbild nach ihr in der Reihenfolge der Aufrufe (seq), nicht nach Zeitstempeln (Touch
// kommt mit einem früheren Zeitstempel an, als es ausgeliefert wird; ein rAF dazwischen kam vor der Eingabe)
const EINRICHTEN = `(() => {
  const p = window.__rt = { raf: [], bilder: [], eingabe: null, seq: null, scharf: false, an: false };
  const zaehle = (ts) => { if (p.an) p.raf.push(ts); requestAnimationFrame(zaehle); };
  requestAnimationFrame(zaehle);
  for (const type of ['pointerdown', 'pointermove']) {
    window.addEventListener(type, () => { if (p.scharf) { p.scharf = false; p.eingabe = performance.now(); p.seq = p.raf.length; } },
      { capture: true, passive: true });
  }
  const draw0 = draw;
  draw = function (...a) {
    if (p.an) p.bilder.push({ t: sceneLoop.last, ruht: frameRate.ruht,
      fest: celebration.active || celebration.rain.alive > 0, dreh: [...game.objects.values()].some((o) => o.userData.rotation) });
    return draw0.apply(this, a);
  };
  p.start = () => { p.raf = []; p.bilder = []; p.eingabe = p.seq = null; p.an = true; };
  p.arm = () => { p.scharf = true; };
  p.lies = () => { p.an = false; return JSON.stringify({ raf: p.raf, bilder: p.bilder, eingabe: p.eingabe, seq: p.seq }); };
  return true;
})()`;

/** Auswertung eines Mitschnitts: Bilder/s, übersprungene Bildschirmbilder je Abstand (zwischen zwei gezeichneten). */
function auswerten({ raf, bilder }, von = -Infinity, bis = Infinity) {
  const b = bilder.filter((x) => x.t >= von && x.t <= bis);
  const r = raf.filter((t) => t >= von && t <= bis);
  const sek = r.length > 1 ? (r.at(-1) - r[0]) / 1000 : 0;
  const luecken = b.slice(1).map((x, i) => raf.filter((t) => t > b[i].t && t < x.t).length);
  return { sekunden: +sek.toFixed(2), bilderJeS: sek ? +(b.length / sek).toFixed(1) : 0,
    bildschirmJeS: sek ? +(r.length / sek).toFixed(1) : 0, luecken, ruhend: b.filter((x) => x.ruht).length, bilder: b.length };
}
const haeufig = (a) => {
  const n = new Map();
  for (const x of a) n.set(x, (n.get(x) ?? 0) + 1);
  return Object.fromEntries([...n].sort((x, y) => x[0] - y[0]));
};

/** Bildschirmpunkte: drehbare Elemente und die Mitte einer leeren Zelle (in Pixeln des Layouts). */
const PUNKTE = `JSON.stringify((() => {
  const zuPx = (v) => { const p = v.project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; };
  const dreh = [...game.objects.values()].filter((o) => isRotatable(o.userData.element))
    .map((o) => zuPx(o.getWorldPosition(new THREE.Vector3())));
  const belegt = new Set(game.board.elements.map((e) => e.x + ',' + e.z));
  let leer = null, best = Infinity;
  for (let x = 0; x < GRID; x++) for (let z = 0; z < GRID; z++) {
    if (belegt.has(x + ',' + z)) continue;
    // weit weg von allen Elementen (kein Treffer am Rand eines Elements), nicht am Rand des Bretts
    const d = Math.min(...game.board.elements.map((e) => Math.hypot(e.x - x, e.z - z)));
    const rand = Math.min(x, z, GRID - 1 - x, GRID - 1 - z);
    const wert = -d - (rand > 0 ? 0.5 : 0);
    if (wert < best) { best = wert; leer = zuPx(gridToWorld(x, z)); }
  }
  return { dreh, leer };
})())`;

async function oeffne(query) {
  await send('Page.navigate', { url: pathToFileURL(seite).href + `?perf&nointro${query ? '&' + query : ''}` });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(EINRICHTEN);
  await ev('__prismaDebug.zeige(story.firstIndex())');
  await until('window.__prisma.playing()', 'Level');
  await sleep(7000); // Strahlen wachsen, Ziele leuchten auf, die Kamera kommt an
}
async function messe(ms) {
  await ev('__rt.start()');
  await sleep(ms);
  return JSON.parse(await ev('__rt.lies()'));
}
/** Eingabe bei (x, y), dann ms mitschreiben: erstes Bild nach der Eingabe, Abstände danach, Rückkehr der Ruhe. */
async function eingabe(punkt, ms) {
  await ev('__rt.start(); __rt.arm()');
  await sleep(300);
  await tippe(punkt.x, punkt.y);
  await sleep(ms);
  const m = JSON.parse(await ev('__rt.lies()'));
  if (m.eingabe === null || m.seq >= m.raf.length) return { m, fehlt: true };
  // T: das erste Bildschirmbild nach der Eingabe; zeichnet es, ist warten 0
  const T = m.raf[m.seq], erstes = m.bilder.find((b) => b.t >= T);
  const warten = erstes ? m.raf.filter((t) => t >= T && t < erstes.t).length : null;
  const ruheWieder = m.bilder.find((b) => b.t >= T && b.ruht);
  return { m, T, warten, msBisBild: erstes ? +Math.max(0, erstes.t - m.eingabe).toFixed(1) : null,
    msBisRuhe: ruheWieder ? Math.round(ruheWieder.t - m.eingabe) : null };
}

const ergebnis = { name, seite };
try {
  if (handy) {
    await emulate(send, view);
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
      + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  } else if (!fenster) await emulate(send, view);
  if (fenster) await send('Page.bringToFront');

  if (nur.includes('ruhe')) {
    console.log('Durchgang «ruhe»: Wüste ohne Parameter (Standard)');
    await oeffne('sky=desert');
    const hz = 1000 / await ev('frameRate.vsync');
    const k30 = await ev('frameRate.teiler(30)'), k60 = await ev('frameRate.teiler(60)');
    const r = auswerten(await messe(5000));
    const ziel = await ev('JSON.stringify(perfHud.ziel(1000 / frameRate.vsync))');
    const soll = +(hz / k30).toFixed(1);
    ergebnis.ruhe = { hz: +hz.toFixed(1), k30, k60, soll, ...r, luecken: haeufig(r.luecken), ziel: JSON.parse(ziel),
      ruheFps: await ev('frameRate.ruheFps') };
    console.log('  Ruhe', JSON.stringify(ergebnis.ruhe));
    pruefe(Math.abs(r.bilderJeS - soll) <= 3, `Ruhe: ${r.bilderJeS} Bilder/s statt ${soll} (Takt ${hz.toFixed(1)} Hz)`);
    pruefe(r.ruhend >= r.bilder - 1, `Ruhe: nur ${r.ruhend} von ${r.bilder} Bildern in Ruhe gezeichnet`);
    pruefe(JSON.parse(ziel)[1] === 'Ruhe', `Leistungsanzeige: Grund ${ziel} statt «Ruhe»`);
    pruefe(ergebnis.ruhe.ruheFps === 30, `Standard: ruheFps ${ergebnis.ruhe.ruheFps} statt 30`);
    const skala = await ev('adaptiveResolution.scale');

    const P = JSON.parse(await ev(PUNKTE));
    // Tippen aufs leere Brett: das nächste Bildschirmbild zeichnet, danach im vollen Takt, nach RUHE_NACH_MS wieder Ruhe
    const RUHE_NACH = await ev('RUHE_NACH_MS');
    const t = await eingabe(P.leer, RUHE_NACH + 1500);
    if (t.fehlt) pruefe(false, 'Tippen aufs Brett: keine Eingabe gesehen');
    else {
      const danach = auswerten(t.m, t.T, t.T + RUHE_NACH - 100);
      ergebnis.tippen = { warten: t.warten, msBisBild: t.msBisBild, msBisRuhe: t.msBisRuhe, danach: { ...danach,
        luecken: haeufig(danach.luecken) } };
      console.log('  Tippen', JSON.stringify(ergebnis.tippen));
      pruefe(t.warten === 0, `Tippen: erstes Bild nach ${t.warten} Bildschirmbildern statt im nächsten`);
      pruefe(danach.luecken.every((n) => n <= k60 - 1), `Tippen: danach nicht im vollen Takt (${JSON.stringify(haeufig(danach.luecken))})`);
      pruefe(t.msBisRuhe !== null && t.msBisRuhe >= RUHE_NACH - 50 && t.msBisRuhe <= RUHE_NACH + 1200,
        `Tippen: Ruhe wieder nach ${t.msBisRuhe} ms statt etwa ${RUHE_NACH}`);
    }
    // Drehen: tippen auf ein drehbares Element, solange es dreht im vollen Takt
    await sleep(1000);
    const d = await eingabe(P.dreh[0], 2500);
    if (d.fehlt || !P.dreh.length) pruefe(false, 'Drehen: keine Eingabe gesehen');
    else {
      const dreh = d.m.bilder.filter((b) => b.t >= d.T && b.dreh);
      const v = auswerten(d.m, dreh[0]?.t ?? d.T, dreh.at(-1)?.t ?? d.T);
      ergebnis.drehen = { warten: d.warten, msBisBild: d.msBisBild, msBisRuhe: d.msBisRuhe, bilderDrehung: dreh.length,
        bilderJeS: v.bilderJeS, luecken: haeufig(v.luecken), ruhend: dreh.filter((b) => b.ruht).length };
      console.log('  Drehen', JSON.stringify(ergebnis.drehen));
      pruefe(dreh.length >= 5, `Drehen: nur ${dreh.length} Bilder mit Drehung`);
      pruefe(d.warten === 0, `Drehen: erstes Bild nach ${d.warten} Bildschirmbildern statt im nächsten`);
      pruefe(v.luecken.every((n) => n <= k60 - 1) && !ergebnis.drehen.ruhend,
        `Drehen: nicht im vollen Takt (${JSON.stringify(ergebnis.drehen.luecken)}, in Ruhe ${ergebnis.drehen.ruhend})`);
    }
    // Lösen ohne Eingabe (Testschnittstelle): Drehen und Feier im vollen Takt
    await sleep(RUHE_NACH + 1000);
    await ev('__rt.start()');
    await ev('__prismaDebug.loese()');
    await sleep(6000);
    const f = JSON.parse(await ev('__rt.lies()'));
    const fest = f.bilder.filter((b) => b.fest || b.dreh);
    const v = auswerten(f, fest[0]?.t ?? 0, fest.at(-1)?.t ?? 0);
    ergebnis.feier = { geloest: await ev('window.__prisma.solved()'), bilder: fest.length, bilderJeS: v.bilderJeS,
      luecken: haeufig(v.luecken), ruhend: fest.filter((b) => b.ruht).length };
    console.log('  Feier', JSON.stringify(ergebnis.feier));
    pruefe(ergebnis.feier.geloest && fest.length >= 30, `Feier: gelöst ${ergebnis.feier.geloest}, ${fest.length} Bilder`);
    pruefe(v.luecken.every((n) => n <= k60 - 1) && !ergebnis.feier.ruhend,
      `Feier: nicht im vollen Takt (${JSON.stringify(ergebnis.feier.luecken)}, in Ruhe ${ergebnis.feier.ruhend})`);
    // Die Wechsel 30 ↔ 60 senken die Auflösung nicht (adaptiveResolution wertet den Ruhe-Takt nicht als langsam)
    ergebnis.skala = { vorher: skala, nachher: await ev('adaptiveResolution.scale') };
    pruefe(ergebnis.skala.nachher >= skala, `Auflösung beim Wechsel 30 ↔ 60 gesenkt: ${skala} → ${ergebnis.skala.nachher}`);
  }

  if (nur.includes('aus')) {
    console.log('Durchgang «aus»: Wüste, ?ruhetakt=60');
    await oeffne('sky=desert&ruhetakt=60');
    const k60 = await ev('frameRate.teiler(60)');
    const r = auswerten(await messe(4000));
    const ziel = JSON.parse(await ev('JSON.stringify(perfHud.ziel(1000 / frameRate.vsync))'));
    ergebnis.aus = { ...r, luecken: haeufig(r.luecken), ziel, ruheFps: await ev('frameRate.ruheFps') };
    console.log('  Ruhe', JSON.stringify(ergebnis.aus));
    pruefe(ergebnis.aus.ruheFps === null && !r.ruhend && ziel[1] === 'Spiel (Ruhe aus)', `?ruhetakt=60: ruheFps ${ergebnis.aus.ruheFps}, `
      + `${r.ruhend} Bilder in Ruhe, Grund ${ziel[1]}`);
    pruefe(r.luecken.every((n) => n <= k60 - 1), `?ruhetakt=60: nicht stetig im vollen Takt (${JSON.stringify(haeufig(r.luecken))})`);
    const P = JSON.parse(await ev(PUNKTE));
    const t = await eingabe(P.leer, 1500);
    ergebnis.aus.tippen = { warten: t.warten, msBisBild: t.msBisBild };
    console.log('  Tippen', JSON.stringify(ergebnis.aus.tippen));
    pruefe(t.warten === 0, `?ruhetakt=60: erstes Bild nach dem Tippen nach ${t.warten} Bildschirmbildern`);
  }

  if (nur.includes('wald')) {
    console.log('Durchgang «wald»: Wald mit Glühwürmchen, ohne Parameter');
    await oeffne('sky=forest');
    const hz = 1000 / await ev('frameRate.vsync'), soll = +(hz / await ev('frameRate.teiler(30)')).toFixed(1);
    const r = auswerten(await messe(4000));
    ergebnis.wald = { soll, ...r, luecken: haeufig(r.luecken), bewegt: await ev('frameRate.bewegt()'),
      ziel: JSON.parse(await ev('JSON.stringify(perfHud.ziel(1000 / frameRate.vsync))')) };
    console.log('  Ruhe', JSON.stringify(ergebnis.wald));
    pruefe(Math.abs(r.bilderJeS - soll) <= 3 && r.ruhend >= r.bilder - 1 && ergebnis.wald.ziel[1] === 'Ruhe',
      `Wald: ${r.bilderJeS} Bilder/s statt ${soll}, ${r.ruhend} von ${r.bilder} in Ruhe, Grund ${ergebnis.wald.ziel[1]}, `
      + `bewegt ${ergebnis.wald.bewegt}`);
  }
} catch (err) {
  fehler.push(err.message);
  console.log(`  FEHLER ${err.message}`);
} finally {
  await close();
}
const bad = logs.filter((l) => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
pruefe(bad.length === 0, `Konsole: ${bad.join(' | ')}`);
const weckstellen = logs.filter((l) => /Weckstelle fehlt/.test(l));
if (weckstellen.length) console.log(`WARNUNG: ${weckstellen.length}× fehlende Weckstelle:\n  ${weckstellen.join('\n  ')}`);
const OUT = join(root, 'tests', 'output', 'energie');
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${name}.json`), JSON.stringify(ergebnis, null, 1));
console.log(fehler.length ? `FEHLGESCHLAGEN (${fehler.length})` : 'OK');
process.exit(fehler.length ? 1 : 0);
