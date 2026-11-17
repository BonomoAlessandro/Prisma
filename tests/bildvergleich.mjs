// Bildvergleich (Spec .scratch/umbau/, Ticket 01): Nimmt eine feste Liste von Ansichten des Spiels in Headless-Chrome
// auf und vergleicht sie mit den Referenzbildern in tests/bildvergleich/referenz/. Ab Ticket 02 muss er nach jedem
// Schritt des Umbaus grün sein: Das Spiel sieht dann genau gleich aus wie vorher.
//
// Ansichten je Grösse (Bilder <grösse>-<ansicht>.jpg), in fünf Abläufen (ABLAEUFE, je ein frisches Laden):
//   start:    start (Startbildschirm)
//   dorf:     prolog (erste Einstellung), dorf-uebung-1 … -4 (je erster Schritt mit Band, Lichtkegel und Hand)
//   welt-1-2: welt-1-vor, welt-1-nach (letztes Level im Bergwald), reise (Bergwald → Meer, das Licht hält über dem
//             Untertitel), welt-2-vor, welt-2-nach (erstes Level am Meer)
//   welt-3-4: menue (Menü mit den vier Graden), uebersicht, welt-3-…, welt-4-… (Wüste, Vulkan, ebenso)
//   welt-5-6: welt-5-…, welt-6-… (Planeten, Sterne; vor dem Lösen Ton aus), epilog (erste Einstellung)
// Gespielt wird im Grad «leicht» über Menü und «Weiter» mit einem Stand im localStorage. Die Level sind so gewählt,
// dass jedes Element mindestens einmal im Bild steht (der Lauf prüft das). Einstellungen hat das Spiel keine; die
// Knöpfe unten rechts (Neustart, Ton, Übersicht, Menü) stehen in jedem Level, «Ton aus» in welt-6-nach.
// Grössen: Desktop 1280 × 800, Handy hochkant 390 × 844 und Handy quer 844 × 390 (Pixeldichte 1, Handy mit Touch).
//
// Gleiche Bilder bei jedem Lauf: ?t=12 (Zeit der Animationen steht, Math.random fest), ?noadapt (feste Auflösung),
// Rendern in Software (SwiftShader, tools/chrome.mjs ohne gpu). Was bei stehender Zeit nie fertig oder nie still würde,
// hält die Prüfung nur in der Seite fest, ohne das Spiel zu ändern: Strahlen zählen ihre Geburt ab Zeit 0 (wie
// __prismaDebug.zeige es tut; sie stehen danach ganz da), Herauswachsen, Feier und Kamera spult __prismaDebug.settle
// vor, CSS- und Web-Animationen werden angehalten (endliche am Ende, endlose am Anfang), die Bühne von Prolog und Epilog
// friert ihre Uhr ein (scene.einfrieren, wie tests/buehne-messung.mjs), die Hand im Dorf bleibt (ihre Uhr angehalten),
// die Glühwürmchen der Reise kreisen zu einer festen Zeit. Gültig ist ein Bild erst, wenn eine zweite Aufnahme nach
// weiterem Vorspulen byte-gleich ist (wie tools/ki-tester/shots.mjs).
//
// Vergleich (vergleiche): Bilder und Referenzen sind JPEG (Qualität JPEG_QUALITAET, von Chrome selbst kodiert), damit
// das Repo klein bleibt; als PNG wären es rund sechsmal so viele Bytes. Dasselbe Bild ergibt dasselbe JPEG, eine
// Änderung ändert das JPEG an ihrer Stelle. Je Pixel zählt die grösste Abweichung eines Farbkanals (0–255); rot ist ein
// Bild, wenn mehr als TOLERANZ.anteil seiner Pixel um mehr als TOLERANZ.pixel abweichen; Rechtecke in AUSNAHMEN zählen
// nicht. Dekodiert und gerechnet wird in einem zweiten Chrome (keine Pakete in Node). Bei Rot liegen Bild, Referenz und
// Differenzbild (abweichende Pixel rot über dem grau gedämpften Bild, Ausnahmen blau) unter tests/output/bildvergleich/.
//
// Aufruf: LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 3600 node tests/bildvergleich.mjs
//           [--write] [--groesse desktop,handy,quer] [--nur start,dorf,welt-1-2,welt-3-4,welt-5-6]
//   --write: die Referenzen neu schreiben, nur bei einer bewussten Änderung des Aussehens (im Umbau nie). Mit --nur
//   oder --groesse nur diese. Ohne --write: vergleichen; Rückgabe 1 bei einem roten Bild, einer fehlenden Referenz
//   oder einem Fehler im Ablauf bzw. in der Konsole. --diag: je Bild den Zustand ausgeben (Kamera, Uhren, Ziele,
//   Lichtkegel), um zu finden, was zwischen zwei Läufen abweicht.
// Aus der Seite gelesen nur window.__prisma und __prismaDebug (darin auch beamView, STORY_LEVELS, COLORS, mit --diag
// shockUniforms), keine globalen Namen: Wandert Code in Module (Tickets 03 und 04), muss nur __prismaDebug bleiben.
// Laufzeit siehe README (Abschnitt Tests).
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';
import { spielServer } from '../tools/spielserver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Die Adresse des Spiels, an dieser einen Stelle: dist/ über http (tools/spielserver.mjs, seit Ticket 02 des Umbaus;
 * baut dist/ frisch). query: die Parameter ohne «?».
 */
const spiel = await spielServer();
const seite = (query) => spiel.seite(query);

const REFERENZ = join(root, 'tests', 'bildvergleich', 'referenz');
const OUT = join(root, 'tests', 'output', 'bildvergleich');
const JPEG_QUALITAET = 90;
/**
 * Toleranz: pixel ist die Abweichung eines Farbkanals (0–255), ab der ein Pixel als abweichend zählt, anteil der
 * erlaubte Anteil solcher Pixel je Bild. Begründung und Messung: Ticket 01, Notizen der Umsetzung.
 */
const TOLERANZ = { pixel: 3, anteil: 0.0001 };
/**
 * Ausnahmen: Rechtecke [x, y, Breite, Höhe] je Bild, die nicht verglichen werden. Nur für Stellen, die das Spiel selbst
 * nicht in jedem Lauf gleich zeichnet (gemessen in sieben Läufen, Ticket 01). Handy quer, Meer 1: Im Wasser links des
 * Bretts liegt in etwa der Hälfte der Läufe eine dünne dunkle Linie (x 5–129, y 144–159, bis 113 Pixel um bis 16);
 * das Rechteck darum auf ganzen Blöcken des JPEG (16 Pixel).
 */
const AUSNAHMEN = {
  'quer-welt-2-vor': [[0, 128, 144, 48]],
  'quer-welt-2-nach': [[0, 128, 144, 48]],
};

const GROESSEN = [
  { name: 'desktop', width: 1280, height: 800, dpr: 1, phone: false },
  { name: 'handy', width: 390, height: 844, dpr: 1, phone: true },
  { name: 'quer', width: 844, height: 390, dpr: 1, phone: true, mobile: true },
];

const args = process.argv.slice(2);
const liste = (k) => (args.includes(k) ? args[args.indexOf(k) + 1].split(',') : null);
const schreiben = args.includes('--write');
const diag = args.includes('--diag');
const nurGroessen = liste('--groesse');
const nurAnsichten = liste('--nur');
if (nurGroessen?.some((g) => !GROESSEN.some((x) => x.name === g))) {
  console.error(`Unbekannte Grösse: ${nurGroessen.join(',')} (desktop, handy, quer)`);
  process.exit(2);
}
requireQuiet();

const D = '__prismaDebug';
const T = 12; // ?t=: Zeit der Animationen
const BASIS = `noadapt&t=${T}`;
const GRAD = 'leicht';
const STATIONEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne']; // Kennung der Welten im Speicherstand

/* ---------- Sitzung je Grösse ---------- */

let s = null; // { view, send, ev, logs, bilder: [{ name, data }] }

async function sitzung(view) {
  const chrome = await startChrome({ ...view, gpu: false });
  const send = (m, p) => Promise.race([chrome.send(m, p),
    sleep(120000).then(() => { throw new Error(`keine Antwort auf ${m}`); })]);
  await emulate(send, view);
  return { view, chrome, send, ev: (e) => evaluate(send, e), logs: chrome.logs };
}
/**
 * Warten, bis expr wahr ist. spulen: dabei je Abfrage die Logik um SPULEN s vorspulen (settle, ohne zu zeichnen): In
 * SwiftShader dauert ein Bild bis 0,6 s, ein Schritt der Logik aber höchstens MAX_DT (0,05 s), Flüge und Feier liefen
 * sonst zwölfmal langsamer als im Spiel. Was in Häppchen je Bild lädt (Himmel), wartet weiter auf Bilder.
 */
const SPULEN = 0.5;
async function until(expr, was, sekunden = 240, spulen = false) {
  for (let i = 0; i < sekunden * 5; i++) {
    if (await s.ev(expr).catch(() => false)) return;
    if (spulen) await s.ev(`${D}.settle(${SPULEN})`);
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${was}`);
}

/**
 * Die Seite frisch laden (query ohne BASIS), mit diesem Stand im localStorage (Schlüssel → Wert; Objekte als JSON).
 * Danach zählen neue Strahlen ihre Geburt ab Zeit 0 (siehe Kopf).
 */
async function laden(query, stand = {}) {
  const url = seite([BASIS, query].filter(Boolean).join('&'));
  // den Stand auf einer kleinen Seite desselben Ursprungs setzen (das Spiel liest ihn beim Laden)
  await s.send('Page.navigate', { url: new URL('favicon.svg', url).href });
  await until('document.readyState === "complete"', 'Seite für den Stand');
  const setzen = Object.entries(stand).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, `
    + `${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join(' ');
  await s.ev(`localStorage.clear(); ${setzen} window.__vorher = true`);
  await s.send('Page.navigate', { url });
  await until('!window.__vorher && window.__prisma?.ticks > 2', 'Seite geladen');
  await s.ev(`(() => { const b = ${D}.beamView, u = b.update; b.update = function (r, i, d) {
    const t = this.time; this.time = 0; try { return u.call(this, r, i, d); } finally { this.time = t; } };
    return true; })()`);
  await s.ev('document.fonts.ready.then(() => true)');
}

/** Ein Stand im Grad GRAD wie nach dem Spielen bis platz (gelöst: alle davor; gesehen: Prolog bis zur Welt welt). */
function standBis(platz, welt, mehr = {}) {
  const namen = s.reise.flat();
  return { 'prisma.noa.zuletzt': GRAD, [`prisma.noa.${GRAD}`]: { platz, geloest: namen.slice(0, platz),
    gesehen: ['prolog', 'angebot', ...STATIONEN.slice(0, welt + 1)], geschafft: false, ...mehr } };
}
/** Erster Platz der Welt w (0 … 5) im Durchgang von GRAD */
const ersterPlatz = (w) => s.reise.slice(0, w).flat().length;

const klick = (sel) => s.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) throw new Error('fehlt: ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);

/* ---------- Aufnehmen ---------- */

/** CSS- und Web-Animationen anhalten: endliche an ihrem Ende, endlose an ihrem Anfang. */
const ANHALTEN = `(() => { for (const a of document.getAnimations()) { const t = a.effect?.getComputedTiming();
  if (t && Number.isFinite(t.endTime)) a.finish(); else { a.pause(); a.currentTime = 0; } } return true; })()`;
/** n Bilder der Seite abwarten (die Szene geweckt: Mit ?t= ruht ihre Schleife sonst bald) */
const BILDER = (n) => `new Promise((r) => { ${D}.sceneLoop.wake(true); let k = ${n};
  const f = () => (--k ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`;
/** --diag: der Zustand beim Bild (Kamera, Uhren, Ziele, Lichtkegel), um zu finden, was zwischen zwei Läufen abweicht */
const ZUSTAND = `(() => { const D = ${D}, c = D.camera, r = (v) => +(+v || 0).toFixed(6);
  return JSON.stringify({ kamera: [...c.position.toArray(), ...c.quaternion.toArray(), c.fov, c.zoom].map(r),
    welle: r(D.shockUniforms.uShockT.value), himmel: D.skyTheme.current, aufl: [D.adaptiveResolution.scale,
      D.renderer.getPixelRatio()], ruhe: D.sceneLoop.pending(), regen: D.celebration.rain?.alive ?? null,
    objekte: [...D.game.objects.values()].map((o) => { const u = o.userData;
      return [u.hit, u.wrong, u.flash, u.pulseT, u.hover, o.scale.x, o.position.y].map(r); }),
    kegel: D.fuehrung.kegel.map((k) => [k.x, k.y, k.r].map(r)), story: [D.story.gaze, D.story.fast].map(r) }); })()`;
const aufnahme = async () => (await s.send('Page.captureScreenshot',
  { format: 'jpeg', quality: JPEG_QUALITAET })).result.data;

/**
 * Die Ansicht aufnehmen: anhalten, vorspulen, zeichnen, aufnehmen, bis zwei Aufnahmen nacheinander byte-gleich sind.
 * vorspulen: Sekunden für settle. Reichlich: Kamera, Ziele und Feier nähern sich ihrem Ziel in jedem Schritt um einen
 * Anteil (dt-abhängig); erst nach langem Vorspulen stehen sie in jedem Lauf gleich (mit 3 s wichen im Dorf noch Pixel
 * ab).
 */
async function bild(name, { vorspulen = 20, buehne = false } = {}) {
  // die Bühne (Prolog, Epilog) zeichnet nach ihrer eigenen Uhr (Zeit der Bühne) und funkelt nach der echten Zeit des
  // Bilds: beide fest (scene.einfrieren wie tests/buehne-messung.mjs, das Bild zur festen Zeit T s statt jetzt)
  if (buehne) {
    await s.ev(`(() => { const sc = ${D}.story.scene; sc.einfrieren(${T});
      sc.uhr = { t0: ${T * 1000}, s0: ${T}, tempo: sc.uhr.tempo }; sc.gl.einfrieren(${T * 1000}); sc.gl.zeichnen();
      return true; })()`);
  }
  try { await aufnehmen(name, vorspulen); } finally {
    if (buehne) await s.ev(`${D}.story.scene.auftauen(); true`);
  }
}
async function aufnehmen(name, vorspulen) {
  await sleep(1000); // kurze Uhren des Spiels (setTimeout, etwa das Ausblenden des Lichtkegels nach 0,7 s) laufen ab
  await s.ev(ANHALTEN);
  await s.ev(`${D}.settle(${vorspulen})`);
  await s.ev(BILDER(3));
  let jpeg = await aufnahme(), ruhig = false;
  for (let k = 0; k < 6 && !ruhig; k++) {
    await sleep(300);
    await s.ev(ANHALTEN);
    await s.ev(`${D}.settle(1)`);
    await s.ev(BILDER(3));
    const nochmal = await aufnahme();
    ruhig = nochmal === jpeg;
    jpeg = nochmal;
  }
  if (!ruhig) throw new Error(`${s.view.name}-${name}: Ansicht wird nicht ruhig`);
  if (diag) console.log(`    Zustand ${name}: ${await s.ev(ZUSTAND)}`);
  s.bilder.push({ name: `${s.view.name}-${name}`, jpeg });
  zeit(`${s.view.name}-${name}`);
}

/* ---------- Ansichten ---------- */

const elementeImBild = new Set();
const merkeElemente = async () => {
  for (const t of await s.ev(`[...new Set(${D}.game.board.elements.map((e) => e.type === 'source'
    ? 'source:' + (e.color === ${D}.COLORS.white ? 'weiss' : 'farbig') : e.type))]`)) elementeImBild.add(t);
};

/** Warten wie until; hält das Licht dabei über dem Untertitel an (Ankunft in einer Welt), tippen wie ein Spieler. */
async function untilTippen(expr, was, sekunden = 240) {
  await until(`(${expr}) || ${D}.story.halt === true && ${D}.story.waitTap !== null`, was, sekunden, true);
  if (await s.ev(expr)) return;
  await s.ev(`${D}.story.tap(); true`);
  await sleep(300);
  await untilTippen(expr, was, sekunden);
}
/** Das Level der Geschichte auf dem Platz platz (bzw. die Übung) spielt, Himmel und Brett sind da, Kamera unten */
const levelSteht = (platz) => `window.__prisma.playing() && window.__prisma.skyReady() && ${D}.story.gaze === 0
  && !${D}.story.running && ${D}.story.tweens.length === 0 && ${D}.story.step === ${platz}`;
const buehneWartet = `${D}.story.waitTap !== null && document.getElementById('story').dataset.mode === 'scene'`;

/** Level vor und nach dem Lösen (Welt w, 0 … 5); vorher: was vor dem Lösen noch geschieht */
async function weltLevel(w, platz, vorher = null) {
  await untilTippen(levelSteht(platz), `Welt ${w + 1}: Level ${platz + 1}`);
  await merkeElemente();
  await bild(`welt-${w + 1}-vor`);
  if (vorher) await vorher();
  await s.ev(`${D}.loese(); true`);
  await until('window.__prisma.solvedPanel()', `Welt ${w + 1}: gelöst`, 240, true);
  await bild(`welt-${w + 1}-nach`);
}
/** Je zwei Welten in einer Sitzung: das letzte Level der Welt w, die Reise, das erste der Welt w + 1 */
async function zweiWelten(w, { reise = false, menue = false, epilog = false } = {}) {
  const platz = ersterPlatz(w + 1) - 1;
  const stand = standBis(platz, w);
  // im Menü dazu ein angefangener zweiter Grad
  if (menue) {
    stand['prisma.noa.mittel'] = { platz: 2, geloest: [], gesehen: ['prolog', 'angebot', 'wald'], geschafft: false };
  }
  await laden('nointro', stand);
  await until(`window.__prisma.skyReady() && ${D}.menu.offen`, 'Menü');
  if (menue) {
    await bild('menue');
    await s.ev(`${D}.story.pick({ aktion: 'uebersicht', grad: ${JSON.stringify(GRAD)} }); true`);
    await until(`${D}.uebersicht.offen && window.__prisma.skyReady()`, 'Übersicht');
    await sleep(1500);
    await bild('uebersicht');
    await s.ev(`${D}.story.closeOverview(); true`);
    await until(`${D}.menu.offen && !${D}.uebersicht.offen`, 'zurück im Menü');
    await sleep(1000);
  }
  await klick('#menue .menue-weiter');
  await weltLevel(w, platz);
  await klick('#btn-next');
  if (reise) {
    // und der Himmel des Meers ist geladen und ganz eingeblendet (er lädt und blendet während des Halts weiter, je nach
    // Rechner verschieden weit; so steht er in jedem Lauf gleich). Scharfes Bild und Streifen kommen auf der Reise nie
    // (skyTheme.quiet), darum nicht skyTheme.ready
    await until(`${D}.story.halt === true && ${D}.story.waitTap !== null && !${D}.story.tweens.length
      && ${D}.skyTheme.settled && !${D}.skyTheme.fading`, 'Reise: das Licht hält über dem Untertitel', 240, true);
    // Die Glühwürmchen kreisen nach ihrer eigenen Uhr (carrier.t zählt dt): Erst stehen sie 3 s still (ihre Spur liegt
    // dann ganz am Lichtpunkt), dann gilt für sie eine feste Zeit
    await s.ev(`${D}.story.carrier.t = 100; ${D}.settle(4); true`);
    await s.ev(`(() => { const c = ${D}.story.carrier, u = c.update; c.festUpdate = u;
      c.update = function () { this.t = 200; return u.call(this, 0); }; return true; })()`);
    await bild('reise');
    await s.ev(`(() => { const c = ${D}.story.carrier; c.update = c.festUpdate; return true; })()`);
  }
  // Ton aus im letzten Level: das andere Zeichen auf dem Knopf (Einstellungen hat das Spiel keine)
  await weltLevel(w + 1, platz + 1, epilog ? () => klick('#btn-sound') : null);
  if (epilog) {
    await s.ev(`${D}.story.ending(); true`); // der Epilog ohne das Finale davor
    await until(buehneWartet, 'Epilog');
    await sleep(1500);
    await bild('epilog', { buehne: true });
  }
}

/**
 * Abläufe, je mit einem frischen Laden; jeder nimmt seine Ansichten auf (Bild <grösse>-<ansicht>.jpg). --nur wählt
 * Abläufe.
 */
const ABLAEUFE = [
  { name: 'start', async ablauf() { // Startbildschirm
    await laden('');
    await until(`${D}.ui.canStart && document.getElementById('intro').classList.contains('ready')`, 'Startbildschirm');
    await bild('start');
  } },
  { name: 'dorf', async ablauf() { // neuer Spieler: Prolog, «Üben», die vier Übungen im Dorf
    await laden('nointro');
    await until(`${D}.menu.offen`, 'Menü');
    await klick('#menue .menue-weiter'); // «Leicht» mit dem Prolog
    await until(buehneWartet, 'Prolog');
    await sleep(1500);
    await bild('prolog', { buehne: true });
    await klick('#story .scene .skip');
    await until(`document.querySelectorAll('#story .scene .actions.angebot button').length === 2`, 'Angebot');
    await klick('#story .scene .actions.angebot button:nth-child(1)'); // «Üben»
    for (let n = 0; n < 4; n++) {
      await untilTippen(`${levelSteht(0)} && ${D}.story.inDorf && ${D}.story.uebung === ${n} && ${D}.fuehrung.los`,
        `Übung ${n + 1}`);
      // die erklärenden Schritte mit «Weiter» im Band, bis ein Schritt die Hand zeigt (der erste mit einer Geste)
      const weiterDa = `!document.querySelector('#band .fuehrung-weiter').hidden && !${D}.fuehrung.wechselt`;
      for (let k = 0; ; k++) {
        await until(`${D}.fuehrung.hand || ${weiterDa}`, `Übung ${n + 1}: Hand oder «Weiter»`);
        if (await s.ev(`${D}.fuehrung.hand`)) break;
        if (k === 5) throw new Error(`Übung ${n + 1}: keine Hand nach ${k} Schritten`);
        await klick('#band .fuehrung-weiter');
        await sleep(300);
      }
      await s.ev(`clearTimeout(${D}.fuehrung.handUhr); true`); // die Hand bleibt, ihre Uhr hält an
      await merkeElemente();
      await bild(`dorf-uebung-${n + 1}`);
      if (n === 3) break;
      await s.ev(`${D}.loese(); true`);
      await until('window.__prisma.solvedPanel()', `Übung ${n + 1}: gelöst`, 240, true);
      await klick('#btn-next');
    }
  } },
  { name: 'welt-1-2', ablauf: () => zweiWelten(0, { reise: true }) }, // Bergwald, Reise, Meer
  { name: 'welt-3-4', ablauf: () => zweiWelten(2, { menue: true }) }, // Menü, Übersicht, Wüste, Vulkan
  { name: 'welt-5-6', ablauf: () => zweiWelten(4, { epilog: true }) }, // Planeten, Sterne, Epilog
];

/* ---------- Vergleich in einem zweiten Chrome ---------- */

/**
 * In der Seite des Rechners: beide JPEG dekodieren, je Pixel die grösste Abweichung eines Farbkanals; zurück die Zahl
 * der Pixel über der Schwelle, die grösste Abweichung, auf Wunsch das Differenzbild (PNG, base64). aus: Rechtecke
 * [x, y, Breite, Höhe], die nicht zählen (AUSNAHMEN; im Differenzbild blau).
 */
const RECHNER = `window.vergleiche = async (ref, bild, schwelle, diff, aus) => {
  const lese = async (b64) => { const bmp = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob(),
    { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, 0, 0); return { w: bmp.width, h: bmp.height, d: g.getImageData(0, 0, bmp.width, bmp.height).data }; };
  const a = await lese(ref), b = await lese(bild);
  if (a.w !== b.w || a.h !== b.h) return { groesse: [a.w, a.h, b.w, b.h] };
  const n = a.w * a.h, dev = new Uint8Array(n), frei = new Uint8Array(n);
  for (const [x0, y0, bw, bh] of aus) {
    for (let y = y0; y < Math.min(a.h, y0 + bh); y++) for (let x = x0; x < Math.min(a.w, x0 + bw); x++) frei[y * a.w + x] = 1;
  }
  let max = 0, ab = 0;
  for (let i = 0; i < n; i++) {
    if (frei[i]) continue;
    const p = i * 4, m = Math.max(Math.abs(a.d[p] - b.d[p]), Math.abs(a.d[p + 1] - b.d[p + 1]), Math.abs(a.d[p + 2] - b.d[p + 2]));
    dev[i] = m; if (m > max) max = m; if (m > schwelle) ab++;
  }
  const out = { pixel: n, ab, max };
  if (diff) {
    const c = new OffscreenCanvas(a.w, a.h), g = c.getContext('2d'), img = g.createImageData(a.w, a.h);
    for (let i = 0; i < n; i++) {
      const p = i * 4, grau = (b.d[p] + b.d[p + 1] + b.d[p + 2]) / 3 * 0.3, m = dev[i];
      const rot = m > schwelle ? Math.min(255, 140 + m * 4) : 0;
      img.data[p] = rot || grau; img.data[p + 1] = rot ? 0 : grau; img.data[p + 2] = rot ? 0 : frei[i] ? 140 : grau;
      img.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const blob = await c.convertToBlob({ type: 'image/png' }), buf = new Uint8Array(await blob.arrayBuffer());
    let bin = ''; for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode(...buf.subarray(k, k + 0x8000));
    out.diff = btoa(bin);
  }
  return out;
}; true`;

let rechner = null;
async function vergleiche(name, refB64, bildB64, diff = false) {
  if (!rechner) {
    rechner = await sitzung({ width: 200, height: 200, dpr: 1, phone: false });
    await rechner.ev(RECHNER);
  }
  return rechner.ev(`vergleiche(${JSON.stringify(refB64)}, ${JSON.stringify(bildB64)}, ${TOLERANZ.pixel}, ${diff}, `
    + `${JSON.stringify(AUSNAHMEN[name] ?? [])})`);
}
const istRot = (r) => !!r.groesse || r.ab > TOLERANZ.anteil * r.pixel;

/* ---------- Ablauf ---------- */

const t0 = Date.now();
const zeit = (was) => console.log(`  ${((Date.now() - t0) / 1000).toFixed(0).padStart(5)} s  ${was}`);
const fehler = [];
const ergebnisse = [];
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(REFERENZ, { recursive: true });
setTimeout(() => { console.error('Zeitrahmen von 90 min überschritten: Abbruch'); process.exit(3); }, 90 * 60000).unref();

for (const view of GROESSEN.filter((g) => !nurGroessen || nurGroessen.includes(g.name))) {
  console.log(`${view.name} (${view.width} × ${view.height})`);
  s = await sitzung(view);
  s.bilder = [];
  try {
    // die Reise des Grads (Level je Welt) aus dem Spiel, für die Stände
    await s.send('Page.navigate', { url: seite(`${BASIS}&nointro`) });
    await until('window.__prisma?.ticks > 2', 'Spiel startet');
    s.reise = await s.ev(`${D}.STORY_LEVELS[${JSON.stringify(GRAD)}]`);
    for (const a of ABLAEUFE.filter((x) => !nurAnsichten || nurAnsichten.includes(x.name))) {
      const vorher = s.logs.length;
      try {
        await a.ablauf();
      } catch (e) {
        fehler.push(`${view.name}, ${a.name}: ${e.message}`);
        console.log(`  FEHLER ${view.name}, ${a.name}: ${e.message}`);
        const jpeg = await aufnahme().catch(() => null);
        if (jpeg) writeFileSync(join(OUT, `${view.name}-${a.name}-fehler.jpg`), Buffer.from(jpeg, 'base64'));
      }
      const schlimm = s.logs.slice(vorher).filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l))
        .filter((l) => /\[exception\]|\[error\]|\[log:error\]|THREE\.WebGLProgram/.test(l));
      if (schlimm.length) fehler.push(`${view.name}, ${a.name}: Konsole\n      ${schlimm.join('\n      ')}`);
    }
  } finally { await s.chrome.close(); }

  for (const b of s.bilder) {
    const ref = join(REFERENZ, `${b.name}.jpg`);
    if (schreiben) {
      writeFileSync(ref, Buffer.from(b.jpeg, 'base64'));
      ergebnisse.push({ name: b.name });
      console.log(`  geschrieben ${b.name}.jpg (${Math.round(statSync(ref).size / 1024)} KB)`);
      continue;
    }
    if (!existsSync(ref)) {
      fehler.push(`${b.name}: keine Referenz`);
      writeFileSync(join(OUT, `${b.name}.jpg`), Buffer.from(b.jpeg, 'base64'));
      continue;
    }
    const refB64 = readFileSync(ref).toString('base64');
    let r = await vergleiche(b.name, refB64, b.jpeg);
    ergebnisse.push({ name: b.name, ...r });
    const text = r.groesse ? `Grösse ${r.groesse.join(' × ')}` : `grösste Abweichung ${r.max}, ${r.ab} Pixel über `
      + `${TOLERANZ.pixel} (${(r.ab / r.pixel * 100).toFixed(3)} %)`;
    if (istRot(r)) {
      fehler.push(`${b.name}: ROT (${text})`);
      if (!r.groesse) r = await vergleiche(b.name, refB64, b.jpeg, true);
      writeFileSync(join(OUT, `${b.name}.jpg`), Buffer.from(b.jpeg, 'base64'));
      writeFileSync(join(OUT, `${b.name}-referenz.jpg`), readFileSync(ref));
      if (r.diff) writeFileSync(join(OUT, `${b.name}-differenz.png`), Buffer.from(r.diff, 'base64'));
      console.log(`  ROT  ${b.name}: ${text}`);
    } else console.log(`  grün ${b.name}: ${text}`);
  }
}
if (rechner) await rechner.chrome.close();
await spiel.close();

// jedes Element mindestens einmal im Bild (nur bei einem ganzen Lauf)
if (!nurAnsichten) {
  const soll = ['source:weiss', 'source:farbig', 'mirror', 'prism', 'filter', 'combiner', 'blocker', 'target'];
  const fehlt = soll.filter((t) => !elementeImBild.has(t));
  if (fehlt.length) fehler.push(`Elemente nie im Bild: ${fehlt.join(', ')}`);
  // keine Referenz ohne Ansicht (eine gestrichene Ansicht liesse sonst ein altes Bild liegen)
  const namen = new Set(ergebnisse.map((e) => `${e.name}.jpg`));
  const groessen = GROESSEN.filter((g) => !nurGroessen || nurGroessen.includes(g.name)).map((g) => `${g.name}-`);
  const uebrig = readdirSync(REFERENZ).filter((f) => groessen.some((g) => f.startsWith(g)) && !namen.has(f));
  if (uebrig.length && !fehler.length) fehler.push(`Referenzen ohne Ansicht: ${uebrig.join(', ')}`);
}

const dauer = Math.round((Date.now() - t0) / 1000);
const groesse = readdirSync(REFERENZ).reduce((n, f) => n + statSync(join(REFERENZ, f)).size, 0);
console.log(`\n${ergebnisse.length} Bilder in ${Math.floor(dauer / 60)} min ${dauer % 60} s; `
  + `Referenzen ${readdirSync(REFERENZ).length} Dateien, ${(groesse / 1e6).toFixed(1)} MB`);
if (ergebnisse.length) {
  console.log(`grösste Abweichung eines Pixels über alle Bilder: ${Math.max(...ergebnisse.map((e) => e.max ?? 0))}, `
    + `höchster Anteil abweichender Pixel: ${(Math.max(...ergebnisse.map((e) => (e.ab ?? 0) / (e.pixel ?? 1))) * 100)
      .toFixed(3)} %`);
}
for (const f of fehler) console.log(`FEHLER ${f}`);
console.log(fehler.length ? 'ROT' : schreiben ? 'Referenzen geschrieben' : 'GRÜN');
process.exit(fehler.length ? 1 : 0);
