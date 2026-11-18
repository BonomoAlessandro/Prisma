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
// Rendern in Software (SwiftShader, tools/chrome.mjs ohne gpu), in fester Sprache (Ticket 07: Chrome mit --lang=de, das
// Spiel wählt die Sprache des Geräts; der Lauf prüft navigator.language und lang des Dokuments). Seit Ticket 08 alles
// auch auf Englisch (--lang=en-US), Bilder en-<grösse>-<ansicht>.jpg mit eigenen Referenzen. Was bei stehender Zeit nie
// fertig oder nie still würde, hält die Prüfung nur in der Seite fest, ohne das Spiel zu ändern: Strahlen zählen ihre
// Geburt ab Zeit 0 (wie __prismaDebug.zeige es tut; sie stehen danach ganz da), Herauswachsen, Feier und Kamera spult __prismaDebug.settle
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
// Grösse «poco» (Ticket 13, Fund Review 01): wie das Poco F4 GT, 393 × 873 mit Pixeldichte 2,75, Android-Kennung und
// Touch, nur start, dorf und welt-1-2. So laufen der Massstab der Seite (SEITE, nur Chrome auf Android mit Pixeldichte
// über 2) und das Pixelverhältnis 2 des Renderers wie auf den echten Handys; die Bilder in Gerätepixeln.
//
// Aufruf: LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 3600 node
//           tests/bildvergleich.mjs [--write] [--groesse desktop,handy,quer,poco]
//           [--nur start,dorf,welt-1-2,welt-3-4,welt-5-6] [--sprache de,en] [--jobs n]
//   --write: die Referenzen neu schreiben, nur bei einer bewussten Änderung des Aussehens (im Umbau nie). Mit --nur,
//   --groesse oder --sprache nur diese. --sprache: nur diese Sprachen (Vorgabe beide, Deutsch zuerst; SPRACHEN). Ohne
//   --write: vergleichen; Rückgabe 1 bei einem roten Bild, einer fehlenden Referenz
//   oder einem Fehler im Ablauf bzw. in der Konsole. --diag: je Bild den Zustand ausgeben (Kamera, Uhren, Ziele,
//   Lichtkegel), um zu finden, was zwischen zwei Läufen abweicht. --jobs n: so viele Abläufe gleichzeitig, je in einem
//   eigenen Prozess mit eigenem Chrome (Vorgabe JOBS; --jobs 1 alles nacheinander in einem Chrome je Grösse wie bis
//   Ticket 13). Dasselbe Ergebnis wie nacheinander: Jeder Ablauf lädt die Seite ohnehin frisch mit seinem Stand.
// Aus der Seite gelesen nur window.__prisma und __prismaDebug (darin auch beamView, STORY_LEVELS, COLORS, mit --diag
// shockUniforms), keine globalen Namen: Wandert Code in Module (Tickets 03 und 04), muss nur __prismaDebug bleiben.
// Laufzeit siehe README (Abschnitt Tests).
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';
import { spielServer } from '../tools/spielserver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Die Adresse des Spiels kommt aus tools/spielserver.mjs (Ticket 02): dist/ frisch gebaut über http
 * (PRISMA_OHNE_BAU=1: das vorhandene dist/, PRISMA_SPIEL=<url>: eine laufende Adresse). query: die Parameter ohne «?».
 * Der Server startet nach dem Prüfen der Argumente (unten).
 */
let spiel = null;
const seite = (query) => spiel.seite(query);

/**
 * GPU-Weg (--gpu oder GPU=1; Entscheid des Nutzers 17.11.2026, Ticket 13): Chrome rendert auf der Grafikkarte statt in
 * SwiftShader, mit eigenen Referenzen (referenz-gpu/) und eigener Toleranz. Der schnelle Weg für Umsetzer; SwiftShader
 * (ohne --gpu) bleibt die genaue Prüfung für den Reviewer.
 */
const GPU = process.argv.includes('--gpu') || process.env.GPU === '1';
const REFERENZ = join(root, 'tests', 'bildvergleich', GPU ? 'referenz-gpu' : 'referenz');
const OUT = join(root, 'tests', 'output', GPU ? 'bildvergleich-gpu' : 'bildvergleich');
const JPEG_QUALITAET = 90;
/**
 * Toleranz: pixel ist die Abweichung eines Farbkanals (0–255), ab der ein Pixel als abweichend zählt, anteil der
 * erlaubte Anteil solcher Pixel je Bild. Begründung und Messung: Ticket 01, Notizen der Umsetzung. Auf der GPU:
 * TOLERANZ_GPU (Ticket 13).
 */
const TOLERANZ_SW = { pixel: 3, anteil: 0.0001 };
// GPU (NVIDIA Quadro T2000, Ticket 13): Drei Läufe, 75 von 77 Bildern bitgleich; quer-welt-5-nach 47 Pixel (0,014 %) um
// bis 6 an Sternpunkten neben dem Saturn, desktop-welt-5-nach höchstens 3. Darum 0,03 % (Faktor 2 über dem Rauschen);
// das Vulkan-Brett 2 % heller bleibt weit darüber rot (Comments im Ticket).
const TOLERANZ_GPU = { pixel: 3, anteil: 0.0003 };
const TOLERANZ = GPU ? TOLERANZ_GPU : TOLERANZ_SW;
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
  // wie das Poco F4 GT (Kopf); nur diese Abläufe
  { name: 'poco', width: 393, height: 873, dpr: 2.75, phone: true, android: true, nur: ['start', 'dorf', 'welt-1-2'] },
];
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; 22021211RG) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/130.0.0.0 Mobile Safari/537.36';
/**
 * Vorgabe für --jobs. Gemessen auf 12 Kernen (Ticket 13): nacheinander 27 min, mit 2 Prozessen 29 min, mit 4 29 min,
 * mit 6 rot (Zeitüberschreitungen). SwiftShader rechnet schon in einem Chrome auf allen Kernen (im Mittel 74 % der
 * Maschine, oft 100 %); mehr Prozesse teilen nur dieselben Kerne. Darum nacheinander.
 */
const JOBS = 1;
/**
 * Sprachen (Ticket 08): je Sprache dieselben Abläufe, Chrome meldet die Sprache des Geräts (startChrome, --lang). Bilder
 * auf Deutsch heissen <grösse>-<ansicht>.jpg, in einer anderen Sprache <kürzel>-<grösse>-<ansicht>.jpg (eigene
 * Referenzen, die deutschen bleiben, wie sie sind). geraet: was Chrome als Sprache meldet.
 */
const SPRACHEN = { de: { geraet: 'de', vorsilbe: '' }, en: { geraet: 'en-US', vorsilbe: 'en-' } };

const args = process.argv.slice(2);
const wert = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const liste = (k) => wert(k)?.split(',') ?? null;
const schreiben = args.includes('--write');
const diag = args.includes('--diag');
const nurGroessen = liste('--groesse');
const nurAnsichten = liste('--nur');
const jobs = +(wert('--jobs') ?? JOBS);
const teil = wert('--teil'); // Teilprozess von --jobs: hierhin das Ergebnis als JSON
const sprachen = liste('--sprache') ?? Object.keys(SPRACHEN);
if (sprachen.some((k) => !Object.hasOwn(SPRACHEN, k))) {
  console.error(`Unbekannte Sprache: ${sprachen.join(',')} (${Object.keys(SPRACHEN).join(', ')})`);
  process.exit(2);
}
if (nurGroessen?.some((g) => !GROESSEN.some((x) => x.name === g))) {
  console.error(`Unbekannte Grösse: ${nurGroessen.join(',')} (${GROESSEN.map((g) => g.name).join(', ')})`);
  process.exit(2);
}
if (!Number.isInteger(jobs) || jobs < 1) { console.error('--jobs braucht eine ganze Zahl ab 1'); process.exit(2); }
requireQuiet();
spiel = await spielServer();

const D = '__prismaDebug';
const T = 12; // ?t=: Zeit der Animationen
const BASIS = `noadapt&t=${T}`;
const GRAD = 'leicht';
const STATIONEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne']; // Kennung der Welten im Speicherstand

/* ---------- Sitzung je Grösse ---------- */

let s = null; // { view, sprache, send, ev, logs, bilder: [{ name, data }] }

async function sitzung(view, gpu = GPU, sprache = 'de') {
  const chrome = await startChrome({ ...view, gpu, hochleistung: gpu, sprache: SPRACHEN[sprache].geraet });
  const send = (m, p) => Promise.race([chrome.send(m, p),
    sleep(120000).then(() => { throw new Error(`keine Antwort auf ${m}`); })]);
  await emulate(send, view);
  if (view.android) await send('Emulation.setUserAgentOverride', { userAgent: ANDROID });
  return { view, sprache, chrome, send, ev: (e) => evaluate(send, e), logs: chrome.logs };
}
/** Name des Bilds einer Ansicht in der laufenden Sitzung (Sprache und Grösse, siehe SPRACHEN). */
const bildName = (name) => `${SPRACHEN[s.sprache].vorsilbe}${s.view.name}-${name}`;
/**
 * Warten, bis expr wahr ist. spulen: dabei je Abfrage die Logik um SPULEN s vorspulen (settle, ohne zu zeichnen): In
 * SwiftShader dauert ein Bild bis 0,6 s, ein Schritt der Logik aber höchstens MAX_DT (0,05 s), Flüge und Feier liefen
 * sonst zwölfmal langsamer als im Spiel. Was in Häppchen je Bild lädt (Himmel), wartet weiter auf Bilder.
 */
const SPULEN = 0.5;
async function until(expr, was, sekunden = 240, spulen = false) {
  for (let i = 0; i < sekunden * 5 * GEDULD; i++) {
    if (await s.ev(expr).catch(() => false)) return;
    if (spulen) await s.ev(`${D}.settle(${SPULEN})`);
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${was}`);
}
/**
 * Geduld: Neben anderen Chrome (leichte Läufe laufen gleichzeitig, tools/leise.sh) lädt ein Himmel in SwiftShader
 * mehrmals so lange (Ticket 13: mit 6 Prozessen über 240 s für Menü und Wüste). Die Grenzen sind nur Sicherheitsnetze.
 */
const GEDULD = 3;

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
    // was die Bühne in der Einstellung bewegt (Noas Arm, Lampe, Blinken: scene.tweens und die Spuren dazu), ist fertig;
    // sonst friert sie unter Last mitten darin ein (Ticket 13: quer-epilog mit sechs Prozessen rot an Noa)
    await until(`${D}.story.scene.tweens.length === 0`, 'Bühne steht');
    // … und ihre Texturen sind fertig gerastert: Im Ruhepunkt rastert sie Stück um Stück je Bild die feinere Textur der
    // nächsten Fahrt und tauscht sie danach ein (unter Last war handy-prolog noch gröber, Ticket 13). Fertig ist, wenn
    // die Liste ihrer Texturen 4 s lang gleich bleibt.
    let liste = null;
    for (let gleich = 0, k = 0; gleich < 4; k++) {
      if (k > 180 * GEDULD) throw new Error(`${bildName(name)}: Texturen der Bühne werden nicht fertig`);
      await sleep(1000);
      const jetzt = await s.ev(`JSON.stringify(${D}.story.scene.gl.liste())`);
      gleich = jetzt === liste ? gleich + 1 : 0;
      liste = jetzt;
    }
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
  let jpeg = await aufnahme(), vorher = null, ruhig = false;
  for (let k = 0; k < 6 && !ruhig; k++) {
    await sleep(300);
    await s.ev(ANHALTEN);
    await s.ev(`${D}.settle(1)`);
    await s.ev(BILDER(3));
    const nochmal = await aufnahme();
    ruhig = nochmal === jpeg;
    vorher = jpeg;
    jpeg = nochmal;
  }
  if (!ruhig) {
    // Ausweg (Ticket 13): Bei «poco» wechselt ein Fleck im Lichtstreifen des Startbildschirms von Bild zu Bild zwischen
    // zwei Zuständen (21 Gerätepixel, höchstens 5 von 255), so werden zwei Aufnahmen nie byte-gleich. Weichen die
    // letzten zwei höchstens innerhalb der Toleranz des Vergleichs voneinander ab, gilt die Ansicht als ruhig. Nur bei
    // den Grössen in FAST_RUHIG (Ticket 14: in allen bekannten Läufen kam es nur bei «poco» vor); die Fälle zählt die
    // Übersicht am Schluss.
    if (!FAST_RUHIG.includes(s.view.name)) throw new Error(`${bildName(name)}: Ansicht wird nicht ruhig`);
    const r = await vergleiche('', vorher, jpeg);
    if (istRot(r)) throw new Error(`${bildName(name)}: Ansicht wird nicht ruhig`);
    console.log(`    ${bildName(name)}: fast ruhig (zwei Aufnahmen: ${r.ab} Pixel über ${TOLERANZ.pixel}, `
      + `grösste Abweichung ${r.max})`);
    fastRuhig.push(`${bildName(name)} (${r.ab} Pixel, bis ${r.max})`);
  }
  if (diag) console.log(`    Zustand ${name}: ${await s.ev(ZUSTAND)}`);
  s.bilder.push({ name: bildName(name), jpeg });
  zeit(bildName(name));
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
    rechner = await sitzung({ width: 200, height: 200, dpr: 1, phone: false }, false); // rechnet, zeichnet nicht
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
const FAST_RUHIG = ['poco']; // Grössen, bei denen eine Ansicht auch «fast ruhig» gelten darf (aufnehmen)
const fastRuhig = []; // die Ansichten, die nur «fast ruhig» waren
if (!teil) rmSync(OUT, { recursive: true, force: true }); // ein Teilprozess (--teil) räumt die Ausgabe nicht
mkdirSync(OUT, { recursive: true });
mkdirSync(REFERENZ, { recursive: true });
// Zeitrahmen: allein rund 30 min, neben anderen leichten Läufen mehrmals so lang (Ticket 13)
setTimeout(() => { console.error('Zeitrahmen von 180 min überschritten: Abbruch'); process.exit(3); }, 180 * 60000).unref();

const groessen = GROESSEN.filter((g) => !nurGroessen || nurGroessen.includes(g.name));
/** die Abläufe einer Grösse (--nur, und eine Grösse mit nur nimmt nur diese) */
const ablaeufeVon = (view) => ABLAEUFE.filter((x) => (!nurAnsichten || nurAnsichten.includes(x.name))
  && (!view.nur || view.nur.includes(x.name)));

/** Eine Grösse in einer Sitzung: ihre Abläufe aufnehmen, dann vergleichen bzw. schreiben. */
async function groesseAufnehmen(view, sprache = 'de') {
  const ablaeufe = ablaeufeVon(view);
  if (!ablaeufe.length) return;
  console.log(`${SPRACHEN[sprache].vorsilbe}${view.name} (${view.width} × ${view.height}`
    + `${view.dpr !== 1 ? `, Pixeldichte ${view.dpr}` : ''})`);
  s = await sitzung(view, GPU, sprache);
  const wer = `${SPRACHEN[sprache].vorsilbe}${view.name}`; // für Meldungen
  s.bilder = [];
  try {
    // die Reise des Grads (Level je Welt) aus dem Spiel, für die Stände
    await s.send('Page.navigate', { url: seite(`${BASIS}&nointro`) });
    await until('window.__prisma?.ticks > 2', 'Spiel startet');
    s.reise = await s.ev(`${D}.STORY_LEVELS[${JSON.stringify(GRAD)}]`);
    // womit gezeichnet wird (WEBGL_debug_renderer_info): auf der GPU muss es die NVIDIA sein, nicht die Intel UHD
    const grafik = await s.ev(`(() => { const g = ${D}.renderer.getContext(), x = g.getExtension('WEBGL_debug_renderer_info');
      return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : '?'; })()`);
    console.log(`  Grafik: ${grafik}`);
    if (GPU && !new RegExp(process.env.PRISMA_GPU ?? 'NVIDIA').test(grafik)) {
      throw new Error(`${view.name}: nicht auf der erwarteten Grafikkarte (${grafik}; PRISMA_GPU=${process.env.PRISMA_GPU ?? 'NVIDIA'})`);
    }
    if (view.android) { // der Weg der echten Handys: Massstab der Seite (SEITE) und Pixelverhältnis 2
      const weg = await s.ev(`[document.documentElement.classList.contains('seite'), ${D}.renderer.getPixelRatio()]`);
      if (!weg[0] || weg[1] !== 2) throw new Error(`${view.name}: nicht der Weg der Handys (SEITE ${weg[0]}, Pixelverhältnis ${weg[1]})`);
    }
    // die Sprache (Ticket 07, 08): Chrome meldet sie als Sprache des Geräts (startChrome, --lang), das Spiel wählt sie,
    // kein gespeicherter Wechsel
    const gemeldet = await s.ev('[navigator.language, document.documentElement.lang]');
    if (!new RegExp(`^${sprache}\\b`).test(gemeldet[0]) || gemeldet[1] !== sprache) {
      throw new Error(`${wer}: nicht ${sprache} (${gemeldet.join(', ')})`);
    }
    for (const a of ablaeufe) {
      const vorher = s.logs.length;
      try {
        await a.ablauf();
      } catch (e) {
        fehler.push(`${wer}, ${a.name}: ${e.message}`);
        console.log(`  FEHLER ${wer}, ${a.name}: ${e.message}`);
        const jpeg = await aufnahme().catch(() => null);
        if (jpeg) writeFileSync(join(OUT, `${wer}-${a.name}-fehler.jpg`), Buffer.from(jpeg, 'base64'));
      }
      const schlimm = s.logs.slice(vorher).filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l))
        .filter((l) => /\[exception\]|\[error\]|\[log:error\]|THREE\.WebGLProgram/.test(l));
      if (schlimm.length) fehler.push(`${wer}, ${a.name}: Konsole\n      ${schlimm.join('\n      ')}`);
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

/**
 * --jobs n: je Grösse und Ablauf ein eigener Prozess (dieses Skript mit --groesse, --nur und --teil), bis zu n
 * gleichzeitig, die längsten zuerst. Alle nehmen das Spiel von diesem Server (PRISMA_SPIEL), jeder mit eigenem Chrome und
 * frischem Laden wie seriell (jeder Ablauf lädt die Seite ohnehin neu, mit eigenem Stand). Ihre Ausgabe erscheint am
 * Stück, wenn sie fertig sind.
 */
async function parallel() {
  const gewicht = (g, a) => ({ desktop: 3, poco: 2, quer: 1.2 }[g] ?? 1) * (a.startsWith('welt') ? 3 : a === 'dorf' ? 2 : 0.5);
  const aufgaben = sprachen.flatMap((k) => groessen.flatMap((v) => ablaeufeVon(v)
    .map((a) => ({ k, g: v.name, a: a.name })))).sort((x, y) => gewicht(y.g, y.a) - gewicht(x.g, x.a));
  const tmp = mkdtempSync(join(tmpdir(), 'prisma-bildvergleich-'));
  console.log(`${aufgaben.length} Abläufe in bis zu ${jobs} Prozessen`);
  let naechste = 0;
  const eine = async ({ k, g, a }) => {
    const datei = join(tmp, `${k}-${g}-${a}.json`);
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), '--sprache', k, '--groesse', g, '--nur', a,
      '--teil', datei, ...(schreiben ? ['--write'] : []), ...(diag ? ['--diag'] : []), ...(GPU ? ['--gpu'] : [])],
    { env: { ...process.env, PRISMA_SPIEL: spiel.base }, stdio: ['ignore', 'pipe', 'pipe'] });
    let text = '';
    p.stdout.on('data', (d) => { text += d; });
    p.stderr.on('data', (d) => { text += d; });
    const code = await new Promise((r) => p.on('exit', (c, sig) => r(c ?? sig)));
    zeit(`${SPRACHEN[k].vorsilbe}${g}, ${a} fertig (Rückgabe ${code})`);
    for (const z of text.split(/\r?\n/).filter(Boolean)) console.log(`        ${z}`);
    if (!existsSync(datei)) { fehler.push(`${SPRACHEN[k].vorsilbe}${g}, ${a}: Prozess ohne Ergebnis (Rückgabe ${code})`); return; }
    const r = JSON.parse(readFileSync(datei, 'utf8'));
    fehler.push(...r.fehler);
    ergebnisse.push(...r.ergebnisse);
    fastRuhig.push(...r.fastRuhig);
    for (const e of r.elemente) elementeImBild.add(e);
  };
  const arbeiter = async () => { while (naechste < aufgaben.length) await eine(aufgaben[naechste++]); };
  try {
    await Promise.all(Array.from({ length: Math.min(jobs, aufgaben.length) }, arbeiter));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

/**
 * Höchstens GPU_PLAETZE Prozesse zeichnen gleichzeitig auf der Grafikkarte (leise.sh lässt bis zu 4 leichte Läufe zu;
 * mehr Chrome auf derselben GPU bremsen einander nur). Ein Platz ist ein Ordner im Temp-Verzeichnis mit der pid; ist
 * sein Prozess tot, wird er frei.
 */
const GPU_PLAETZE = 2;
async function gpuPlatz() {
  for (let k = 0; ; k++) {
    for (let i = 1; i <= GPU_PLAETZE; i++) {
      const d = join(tmpdir(), `prisma-bildvergleich-gpu-${i}`);
      try {
        mkdirSync(d);
        writeFileSync(join(d, 'pid'), String(process.pid));
        process.once('exit', () => rmSync(d, { recursive: true, force: true }));
        return;
      } catch {
        let pid = 0, lebt = false;
        try { pid = +readFileSync(join(d, 'pid'), 'utf8'); } catch { /* gerade angelegt oder weg */ }
        if (pid) { try { process.kill(pid, 0); lebt = true; } catch { /* tot */ } } else {
          try { lebt = Date.now() - statSync(d).mtimeMs < 60000; } catch { /* weg */ }
        }
        if (!lebt) rmSync(d, { recursive: true, force: true });
      }
    }
    if (k === 0) console.log(`warte auf einen Platz auf der Grafikkarte (höchstens ${GPU_PLAETZE} gleichzeitig)`);
    await sleep(2000);
  }
}

if (jobs > 1 && !teil) await parallel();
else {
  if (GPU) await gpuPlatz();
  for (const k of sprachen) for (const view of groessen) await groesseAufnehmen(view, k);
}
if (rechner) await rechner.chrome.close();
await spiel.close();

if (teil) { // Teilprozess von --jobs: das Ergebnis für den Hauptprozess
  writeFileSync(teil, JSON.stringify({ fehler, ergebnisse, fastRuhig, elemente: [...elementeImBild] }));
  process.exit(fehler.length ? 1 : 0);
}

// jedes Element mindestens einmal im Bild (nur bei einem ganzen Lauf)
if (!nurAnsichten) {
  const soll = ['source:weiss', 'source:farbig', 'mirror', 'prism', 'filter', 'combiner', 'blocker', 'target'];
  const fehlt = soll.filter((t) => !elementeImBild.has(t));
  if (fehlt.length) fehler.push(`Elemente nie im Bild: ${fehlt.join(', ')}`);
  // keine Referenz ohne Ansicht (eine gestrichene Ansicht liesse sonst ein altes Bild liegen)
  const namen = new Set(ergebnisse.map((e) => `${e.name}.jpg`));
  const groessen = sprachen.flatMap((k) => GROESSEN.filter((g) => !nurGroessen || nurGroessen.includes(g.name))
    .map((g) => `${SPRACHEN[k].vorsilbe}${g.name}-`));
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
console.log(`nur «fast ruhig» (zwei Aufnahmen innerhalb der Toleranz statt gleich): ${fastRuhig.length}`
  + `${fastRuhig.length ? `, ${fastRuhig.join(', ')}` : ''}`);
for (const f of fehler) console.log(`FEHLER ${f}`);
console.log(fehler.length ? 'ROT' : schreiben ? 'Referenzen geschrieben' : 'GRÜN');
process.exit(fehler.length ? 1 : 0);
