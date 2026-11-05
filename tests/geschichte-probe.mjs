// Probe im Browser für Noas Geschichte (Spec .scratch/noa-geschichte/, «Ablauf im Spiel»; Tickets 04 bis 06): spielt
// in Headless-Chrome (auf der Grafikkarte) über das Menü. Je Grad ein Durchgang durch die ersten Welten, auf Wunsch das
// Finale ab der letzten Welt bis «Zum Menü» und weiter in den nächsten Grad, und mit --menue das Menü selbst: «Weiter»,
// «Menü» im Spiel und zurück ins selbe Level, Wechsel in einen Grad in einer anderen Welt, «Von vorn» mit Rückfrage,
// ein neuer Grad aus dem Spiel heraus, Tastatur, dazu auf dem Desktop ein gehaltenes Enter am Startbildschirm (--start
// allein). Mit --uebersicht die Übersicht und das Wiederholen (Ticket 06, siehe uebersichtAblauf), mit --dorf das
// Angebot nach dem Prolog, das Kapitel «Im Dorf» und die überspringbaren Einstiege (Ticket 07, siehe dorfAblauf); nach
// dem Prolog wählen die übrigen Abläufe «Gleich los». Bedient wird wie ein Spieler: auf dem Desktop mit der Maus
// (Input.dispatchMouseEvent), auf dem Handy mit dem Finger (Input.dispatchTouchEvent; Mausereignisse kommen mit der
// Touch-Emulation nie zurück). Gelöst wird über die Testschnittstelle (__prismaDebug.loese, Drehung für Drehung), einen
// Stand setzt die Probe in localStorage. Sie prüft Kopfzeile, Speicherstand, Menü (Stand je Grad, «Weiter», Fokus,
// Hervorhebung), dass das Menü nach der Wahl sofort ausblendet, dass die Kamera im Himmel bleibt, bis die Welt bereit
// ist (kein leeres Brett), und misst die Bildzeiten der Übergänge (Lücken zwischen zwei requestAnimationFrame; Lücken
// über 100 ms sind Fehler, ausser während eines Bilds der Probe, siehe ende). Seit Ticket 03 von
// .scratch/kleiner-wagen/ dazu die Sätze, die der Spieler liest (Prolog, Einstiege, Reisen, Finale, Epilog, «Gelöst» am
// Ende jeder Welt), und dass jeder ganz im Bild steht, ohne mehr Zeilen als der längste Satz vor dem Kleinen Wagen (auf
// der Bühne nur ein HINWEIS, siehe pruefeSatz).
// Bilder der wichtigen Momente nach tests/output/geschichte/<bildschirm>-<name>.png. Sie scheitert bei einem falschen
// Wert oder einer Meldung in der Konsole ([error], Ausnahme, Shader).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs [--handy | --quer]
//           [--grad leicht,mittel] [--welten 2] [--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf]
//           [--dorf-raender] [--ganz] [--wagen] [--groesse 360x640] [--dpr 2.75] [--messwerte <datei.json>]
//           [--vorher <datei.json>]
//   --handy: 390 × 844, --quer: 844 × 390 (Pixeldichte 2, Touch) statt 1440 × 900; --groesse: ein anderes Handy (mit
//   --handy, Bilder unter handy-<b>x<h>-…); --dpr: eine andere Pixeldichte für --handy oder --quer (2,75 wie das Poco:
//   mit dem Massstab der Seite, Ticket 18 von .scratch/leistung/; Bilder unter <bildschirm>-dpr<n>-…); --grad: die
//   Grade des Durchgangs
//   («sehr schwer» als sehr-schwer); --welten: so viele Welten je Durchgang (Vorgabe 2, mit der Reise in die nächste);
//   --finale: dazu das Finale in diesem Grad; --menue: dazu der Ablauf im Menü; --start: nur das gehaltene Enter;
//   --uebersicht: dazu Übersicht und Wiederholen; --dorf: dazu «Im Dorf»; --dorf-raender: Randfälle des Dorfs (Review
//   Ticket 07, etwa 5 min); --ganz: statt der ersten Welten der ganze Durchgang je Grad in einer Sitzung, vom Menü bis
//   zum Epilog und zurück ins Menü, mit Neuladen mitten in der Wüste und den Bildzeiten jeder Zwischenszene (Abnahme
//   Ticket 08, siehe ganzerDurchgang; ohne --grad nur Leicht). Ohne --grad, --finale, --menue, --start, --uebersicht,
//   --dorf, --dorf-raender, --ganz und --wagen alle vier Grade. Etwa 3 min je Grad, das Finale gut 4 min, das Menü
//   etwa 3 min, die Übersicht etwa 4 min, das Dorf etwa 6 min, mit --ganz etwa 7 min je Grad. Zeitrahmen: jede Anfrage
//   an Chrome höchstens 30 s, der ganze Lauf höchstens 14 min (mit --ganz 14 min je Grad); dann schliesst die Probe
//   Chrome und bricht mit Fehler ab. --messwerte: Bildzeiten und Dauern aller gemessenen Übergänge als JSON in diese
//   Datei (Vorher-Lauf des Kleinen Wagens, .scratch/kleiner-wagen/vorher/). Mit --ganz und --finale misst die Probe
//   dazu die Dauer jedes Einstiegs, jeder Reise und des Finales (vom Klick auf «Gleich los» bzw. «Weiter» bis zum
//   spielbaren Level bzw. bis zum Epilog), ohne die Zeit, in der ein Satz auf Tippen wartet oder ein Bild der Probe die
//   Seite anhält (siehe ende). --wagen: dazu der Stand des Kleinen Wagens (Ticket 01 von .scratch/kleiner-wagen/), der
//   Wagen am Himmel (Ticket 04: Stand, Helligkeit bei Tag und Nacht, Bilder <bildschirm>-wagen-…) und seit Ticket 05
//   Erwachen, Vorbeiflug und Einstiege, seit Ticket 06 das Finale (Puls, Polarstern, Endbild), siehe wagenAblauf, etwa
//   4 min. --vorher: die Dauern (netto) mit einem früheren Lauf mit --messwerte vergleichen (Vorher-Lauf
//   .scratch/kleiner-wagen/vorher/<desktop|handy>.json, siehe vergleicheVorher): jede Reise höchstens etwa 1 s länger,
//   die Einstiege nicht länger, das Finale etwa 4 s.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'tests', 'output', 'geschichte');
const GRADE = ['leicht', 'mittel', 'schwer', 'sehr schwer'];
const GRAD_TEXT = { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer', 'sehr schwer': 'Sehr schwer' };
const WELTEN = ['Der Bergwald', 'Das Meer', 'Die Wüste', 'Der Vulkan', 'Die Planeten', 'Die Sterne'];
const WELT_MENUE = ['Bergwald', 'Meer', 'Wüste', 'Vulkan', 'Planeten', 'Sterne']; // so nennt sie das Menü
const STATIONEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne'];
// Texte der Geschichte vom Kleinen Wagen (Spec .scratch/kleiner-wagen/, «Texte»; Ticket 03): so sieht sie der Spieler
const PROLOG_SAETZE = [
  'Hoch oben in den Bergen, wo die Nächte klar und still sind, liegt ein kleines Dorf.',
  'Jeden Abend steigt Noa auf den Hügel über den Dächern und sucht den Polarstern, ganz vorn an der Deichsel des '
    + 'Kleinen Wagens.',
  'Heute Nacht will Noa ihm ein Zeichen schicken. Klick – die Taschenlampe leuchtet auf.',
  'Doch der Strahl verblasst im Dunkeln. Die Sterne, die ihm den Weg zeigen sollten, schlafen – der Kleine Wagen ist '
    + 'fast unsichtbar.',
  'Da blinkt es am Waldrand. Glühwürmchen umschwirren die Lampe und fangen das Licht ein.',
  'Jeder Stern des Wagens wacht über einen Ort der Welt und erwacht erst, wenn dort Licht leuchtet. Trag Noas Licht '
    + 'von Spiegel zu Spiegel, von Ort zu Ort – Stern für Stern bis zum Polarstern.'];
/** Untertitel bei der Ankunft in einer Welt (Einstieg und Reise), je Welt. */
const ANKUNFT = [
  'Die Glühwürmchen tragen Noas Licht tief in den Bergwald. Über den Wipfeln schläft der erste Stern des Wagens.',
  'Über dem Wald erwacht der erste Stern und weist zum Meer. Die Glühwürmchen tragen das Licht über die Hügel bis an '
    + 'den Strand.',
  'Der zweite Stern erwacht und weist weit übers Wasser. Der Wind über den Wellen trägt das Licht bis an den Rand der '
    + 'Wüste.',
  'Über den Dünen funkelt der dritte Stern. Ein Wirbel aus Sand trägt das Licht dorthin, wo die Erde rot glüht.',
  'Der vierte Stern erwacht, und die Schale des Wagens schliesst sich. Der Vulkan bricht aus und schleudert das Licht '
    + 'hinauf, höher als alle Wolken.',
  'Fünf Sterne leuchten, nur einer schläft noch. Ein Komet trägt das Licht hinaus, dorthin, wo nur noch Sterne sind.'];
/** «Gelöst» nach dem letzten Level jeder Welt: Meldung und Knopf. */
const WELT_GELOEST = [['Der Wald leuchtet', 'Weiter zum Meer'], ['Das Meer leuchtet', 'Weiter in die Wüste'],
  ['Die Wüste leuchtet', 'Weiter zum Vulkan'], ['Der Vulkan glüht', 'Hinauf in den Himmel'],
  ['Die Planeten leuchten', 'Weiter zu den Sternen'], ['Der Wagen ist wach', 'Hinaufschauen']];
const FINALE_SAETZE = ['Der letzte Stern erwacht. Der Kleine Wagen leuchtet, von einem Ende bis zum anderen.',
  'Über die Deichsel läuft das Licht bis zum Polarstern.', 'Er hat das Zeichen gesehen. Und er antwortet.'];
const EPILOG_SAETZE = ['In dieser Nacht bleibt Noa noch lange auf dem Hügel und schaut hinauf.',
  'Da blinkt der Polarstern: einmal, zweimal, dreimal.',
  'Noa lacht und blinkt mit der Taschenlampe zurück. Über dem Dorf leuchten jetzt sieben Sterne, und keiner schläft '
    + 'mehr.'];
// Massstab für die Zeilen: die längsten Sätze vor dem Kleinen Wagen, auf der Bühne (der alte Prolog 2) und im
// Untertitel über der Welt (Einstieg ins Dorf, unverändert). Kein neuer Satz braucht mehr Zeilen als sie.
const MASS_BUEHNE = 'Jeden Abend steigt Noa auf den Hügel über den Dächern und sucht am Himmel den Polarstern, den '
  + 'einen Stern, der sich nie vom Fleck rührt.';
const MASS_UNTERTITEL = 'Hinter dem Haus übt Noa mit der Taschenlampe. Ein alter Spiegel, ein Stück buntes Glas – und '
  + 'das Licht geht genau dorthin, wo Noa es haben will.';
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const grad = (x) => x.replace('-', ' ');
const finaleGrad = wert('--finale') && grad(wert('--finale'));
const menue = args.includes('--menue');
const uebersichtProbe = args.includes('--uebersicht');
const dorfProbe = args.includes('--dorf');
const dorfRaenderProbe = args.includes('--dorf-raender');
const ganz = args.includes('--ganz');
const wagenProbe = args.includes('--wagen');
const startTaste = args.includes('--start') || menue; // gehaltenes Enter am Startbildschirm (nur Desktop)
const grade = wert('--grad') ? wert('--grad').split(',').map(grad)
  : ganz ? ['leicht'] : finaleGrad || startTaste || uebersichtProbe || dorfProbe || dorfRaenderProbe || wagenProbe ? []
    : GRADE;
const welten = +(wert('--welten') ?? 2);
const groesse = wert('--groesse')?.match(/^(\d+)x(\d+)$/);
const dpr = wert('--dpr') === null ? null : +wert('--dpr');
const messwerte = wert('--messwerte') && resolve(wert('--messwerte'));
const vorherDatei = wert('--vorher') && resolve(wert('--vorher'));
if ([...grade, finaleGrad].some(g => g && !GRADE.includes(g)) || !(welten >= 1 && welten <= 5)
  || args.includes('--handy') && args.includes('--quer') || ganz && args.includes('--welten')
  || args.includes('--groesse') && !(groesse && args.includes('--handy'))
  || dpr !== null && !(dpr >= 1 && dpr <= 4 && (args.includes('--handy') || args.includes('--quer')))
  || args.includes('--messwerte') && !messwerte || args.includes('--vorher') && !vorherDatei) {
  console.error('Aufruf: node tests/geschichte-probe.mjs [--handy [--groesse 360x640] | --quer] [--grad leicht,…] '
    + '[--welten 1–5 | --ganz] [--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf] [--dorf-raender] '
    + '[--wagen] [--dpr n] [--messwerte <datei.json>] [--vorher <datei.json>]');
  process.exit(1);
}
requireQuiet();

const view = groesse ? { name: `handy-${groesse[1]}x${groesse[2]}`, width: +groesse[1], height: +groesse[2], dpr: 2,
  phone: true }
  : args.includes('--handy') ? { name: 'handy', width: 390, height: 844, dpr: 2, phone: true }
  : args.includes('--quer') ? { name: 'quer', width: 844, height: 390, dpr: 2, phone: true }
    : { name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false };
// andere Pixeldichte: ein Handy quer gilt dann ausdrücklich als mobil (Meta-Viewport, Massstab der Seite)
if (dpr !== null) Object.assign(view, { name: `${view.name}-dpr${String(dpr).replace('.', '')}`, dpr, mobile: true });
const PAGE = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro';
const PAGE_START = pathToFileURL(join(root, 'index.html')).href + '?noadapt'; // mit Startbildschirm
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };
const bildzeiten = []; // je Übergang: Name, längste Lücke, Lücken über 50 und 100 ms

// Zeitrahmen: eine Anfrage, auf die Chrome nicht antwortet, bricht nach FRIST_MS ab; der ganze Lauf nach GESAMT_MS
// (sonst hielte ein hängender Lauf die Sperre von leise.sh)
const FRIST_MS = 30000, GESAMT_MS = 14 * (ganz ? grade.length : 1) * 60000;
const chrome = await startChrome({ ...view, gpu: true });
const { logs, close } = chrome;
setTimeout(async () => {
  console.error(`\nZeitrahmen von ${GESAMT_MS / 60000} min überschritten: Abbruch`);
  await Promise.race([close(), sleep(5000)]);
  process.exit(3);
}, GESAMT_MS).unref();
const send = (method, params) => {
  let t;
  const frist = new Promise((_, nein) => {
    t = setTimeout(() => nein(new Error(`keine Antwort auf ${method} nach ${FRIST_MS / 1000} s`)), FRIST_MS);
  });
  return Promise.race([chrome.send(method, params), frist]).finally(() => clearTimeout(t));
};
const ev = (expr) => evaluate(send, expr);
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 10; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(100);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
let fotos = null; // während einer Messung (messe … ende): Zeitfenster der Bilder in der Zeit der Seite
async function bild(name) {
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `${view.name}-${name}.png`);
  const von = fotos ? await ev('performance.now()') : 0;
  writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
  if (fotos) fotos.push([von, await ev('performance.now()')]);
  console.log(`  Bild ${file}`);
}
const D = '__prismaDebug';
const storyMode = `(!document.getElementById('story').classList.contains('hidden') && document.getElementById('story')`
  + '.dataset.mode)';
const knoepfe = "document.querySelector('#story .scene .actions').children.length > 0";
const menueOffen = `${D}.menu.offen`;
const slug = (g) => g.replace(' ', '-');
const stand = (g) => ev(`JSON.parse(localStorage.getItem('prisma.noa.${slug(g)}') || 'null')`);
const karte = (g) => `#menue .menue-wahl[data-menue-fokus="wahl:${g}"]`;

/** Breite und Höhe des Layouts (Koordinaten der Eingabe): mit dem Massstab der Seite (SEITE) grösser als der Bildschirm. */
const layout = () => ev('({ w: innerWidth, h: innerHeight })');
/**
 * Klick (Desktop) bzw. Tippen mit dem Finger (Handy) auf die Mitte eines sichtbaren Elements. Liegt es ausserhalb des
 * Bildschirms (kleine Handys: «Schliessen» unter den Kacheln der Übersicht), scrollt die Probe erst dorthin wie ein
 * Spieler: mit dem Finger wischen bzw. dem Mausrad, nie über die Seite selbst.
 */
async function tippe(selector, was = selector) {
  await until(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[inert]')
      && getComputedStyle(el).visibility !== 'hidden'; })()`, `${was} bereit`, 30);
  const mitte = () => ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)})
    .getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  let { x, y } = await mitte();
  const L = await layout();
  for (let n = 0; n < 6 && (y < 8 || y > L.h - 8); n++) {
    const weg = Math.sign(y - L.h / 2) * Math.min(Math.abs(y - L.h / 2), L.h * 0.6);
    await scrolle(L.w / 2, L.h / 2, weg);
    ({ x, y } = await mitte());
  }
  pruefe(y >= 8 && y <= L.h - 8, `${was}: nicht auf den Bildschirm zu scrollen (y ${Math.round(y)})`);
  await tippeBei(x, y);
}
/** Inhalt unter (x, y) um dy Pixel nach oben schieben (dy > 0: weiter unten Liegendes kommt herauf). */
async function scrolle(x, y, dy) {
  if (view.phone) {
    const zug = (type, yy) => send('Input.dispatchTouchEvent', { type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y: yy }] });
    const y0 = y + dy / 2;
    await zug('touchStart', y0);
    for (let k = 1; k <= 10; k++) { await zug('touchMove', y0 - dy * k / 10); await sleep(16); }
    await zug('touchEnd');
  } else await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy });
  await sleep(700); // Ausrollen
}
async function tippeBei(x, y) {
  if (view.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
  }
}
const TASTEN = { Tab: 9, Enter: 13, Escape: 27, Space: 32, Home: 36, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39,
  ArrowDown: 40, KeyL: 76, KeyM: 77, KeyR: 82 };
/** Eine Taste drücken und loslassen (strg: mit Strg). */
async function taste(key, { strg = false } = {}) {
  const vk = TASTEN[key], k = key === 'Space' ? ' ' : key.startsWith('Key') ? key.slice(3).toLowerCase() : key;
  const mod = strg ? { modifiers: 2 } : {};
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: key, windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk, ...mod, ...(key === 'Enter' ? { text: '\r' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: key, windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk, ...mod });
  await sleep(80);
}

/**
 * Bildzeiten eines Übergangs messen: In der Seite zählt ein eigener requestAnimationFrame jedes Bild des Browsers
 * (das Spiel selbst rendert im Ruhezustand nur jedes zweite) und schreibt dazu Blick, Zustand des Ablaufs und Himmel
 * auf. ende(name) gibt diese Liste zurück und meldet die längste Lücke. Ein Bild der Probe mitten in der Messung hält
 * die Seite an (auf dem Handy bis 0,5 s): Lücken über seinem Zeitfenster zählen nicht.
 */
async function messe({ abKlick = false } = {}) {
  fotos = [];
  // abKlick: die Dauer zählt ab dem ersten Klick (bzw. Tippen) danach, etwa auf «Weiter» (sonst ab dem ersten Bild)
  await ev(`(() => { const b = window.__bz = { an: true, log: [], ab: null }; const loop = (ts) => { if (!b.an) return;
    const s = ${D}.story, k = ${D}.skyTheme; b.log.push({ ts, gaze: s.gaze, flow: ${D}.flow.state, sky: k.current,
      ready: k.ready, settled: k.byId.get(k.current).module?.settled ?? true, menu: ${D}.menu.offen,
      ueb: ${D}.uebersicht.offen, story: ${storyMode}, traeger: !!s.carrier?.kind, bild: window.__prisma.frames,
      tippen: s.waitTap !== null, knoepfe: (document.querySelector('#story .scene .actions')?.children.length ?? 0) > 0,
      blick: ((m) => [-m[8], -m[9], -m[10]])(${D}.camera.matrixWorld.elements) });
      requestAnimationFrame(loop); };
    ${abKlick ? "addEventListener('click', () => { b.ab ??= performance.now(); }, { capture: true, once: true });" : ''}
    requestAnimationFrame(loop); })()`);
}
/**
 * Ende einer Zwischenszene im Log einer Messung (Dauer, ende(name, { bis })): spielt: das nächste Level ist spielbar
 * (Zustand play nach einem anderen); buehne: die Bühne steht (Epilog); knoepfe: Knöpfe auf der Bühne (Angebot, «Zum
 * Menü»).
 */
const BIS = {
  spielt: (log) => {
    const a = log.findIndex((e) => e.flow !== 'play');
    return a < 0 ? -1 : log.findIndex((e, i) => i > a && e.flow === 'play');
  },
  buehne: (log) => log.findIndex((e) => e.story === 'scene'),
  knoepfe: (log) => log.findIndex((e) => e.knoepfe),
};
/**
 * Bildzeiten auswerten. Die frühere Ausnahme für das erste Zeichnen der Bühne (Prolog) ist weg: Seit die Bühne unter dem
 * Startbildschirm vorgewärmt wird (story.vorwaermen, Ticket 08), trat sie in der Abnahme nie mehr auf.
 * bis (siehe BIS): dazu die Dauer der Zwischenszene vom Klick (messe abKlick) bzw. vom ersten Bild bis zu diesem Ende,
 * in Sekunden: dauer (Uhr), tippen (davon wartete ein Satz auf Tippen), fotos (davon hielt ein Bild der Probe die Seite
 * an, über MAX_DT je Bild: Die Zeitachse der Geschichte rückt dann höchstens so weit vor) und netto (dauer ohne beides,
 * die Länge der Szene).
 */
async function ende(name, { bis = null } = {}) {
  // noch zwei Bilder: Sah die Probe den Zustand eben erst (etwa play), steht er sonst womöglich noch nicht im Log
  if (bis) await ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
  const { log, ab } = await ev('(() => { const b = window.__bz; b.an = false; return { log: b.log, ab: b.ab }; })()');
  const foto = (i) => fotos.some(([a, b]) => log[i].ts < b && log[i + 1].ts > a);
  const art = log.slice(1).map((_, i) => (foto(i) ? 'Bild der Probe' : ''));
  fotos = null;
  const luecken = log.slice(1).map((e, i) => (art[i] ? 0 : e.ts - log[i].ts));
  const max = Math.max(0, ...luecken), ueber = (ms) => luecken.filter((d) => d > ms).length;
  const gezaehlt = luecken.filter((d) => d > 0);
  const eintrag = { name, bilder: log.length, max: Math.round(max), ueber50: ueber(50), ueber100: ueber(100),
    mittel: +(gezaehlt.reduce((a, d) => a + d, 0) / Math.max(1, gezaehlt.length)).toFixed(1) };
  let dauerText = '';
  if (bis) {
    const z = BIS[bis](log), s = (ms) => +(ms / 1000).toFixed(2);
    pruefe(z > 0, `${name}: Ende der Zwischenszene (${bis}) nicht im Log`);
    if (z > 0) {
      const t0 = ab ?? log[0].ts;
      // ein Bild der Probe: Die Seite zeichnet währenddessen oft weiter, nur was über MAX_DT des Spiels (50 ms) liegt,
      // hat sie angehalten (so weit rückt die Zeitachse der Geschichte je Bild höchstens vor)
      let tippen = 0, angehalten = 0;
      for (let i = 0; i < z; i++) {
        const d = log[i + 1].ts - Math.max(t0, log[i].ts);
        if (d <= 0) continue;
        if (log[i].tippen) tippen += d; else if (art[i]) angehalten += Math.max(0, d - 50);
      }
      const dauer = log[z].ts - t0, netto = dauer - tippen - angehalten;
      Object.assign(eintrag, { bis, abKlick: ab !== null, dauer: s(dauer), tippen: s(tippen), fotos: s(angehalten),
        netto: s(netto) });
      dauerText = `; Dauer ${s(dauer)} s (bis ${bis}${ab === null ? ', ab dem ersten Bild' : ''}), davon Tippen `
        + `${s(tippen)} s, Bilder der Probe ${s(angehalten)} s, netto ${s(netto)} s`;
    }
  }
  bildzeiten.push(eintrag);
  console.log(`  Bildzeiten ${name}: ${log.length} Bilder, längste Lücke ${Math.round(max)} ms, über 50 ms ${ueber(50)}`
    + `, über 100 ms ${ueber(100)}${dauerText}`);
  log.slice(1).forEach((e, i) => { // wo die langen Lücken liegen: Zeit seit Beginn und Zustand davor und danach
    const d = e.ts - log[i].ts;
    if (d <= 50) return;
    const z = ({ ts, blick, ...x }) => JSON.stringify({ ...x, gaze: +x.gaze.toFixed(3) });
    const warum = art[i] ? ` (${art[i]}, zählt nicht)` : '';
    console.log(`    ${Math.round(d)} ms bei ${Math.round(log[i].ts - log[0].ts)} ms${warum}: ${z(log[i])} → ${z(e)}`);
  });
  pruefe(ueber(100) === 0, `${name}: ${ueber(100)} Lücken über 100 ms (längste ${Math.round(max)} ms)`);
  return log;
}
/** Nach einer Wahl im Menü: Es ist sofort weg (blendet aus), nicht erst, wenn die Welt bereit ist. */
async function sofortZu(was) {
  const zu = await ev(`!${menueOffen} && document.getElementById('menue').classList.contains('menue-aus')`);
  pruefe(zu, `${was}: das Menü blendet nach der Wahl nicht sofort aus`);
}
/**
 * Kein leeres Brett: Solange der Blick noch im Himmel ist, kommt der Himmel der Welt; erst wenn er ganz da ist, senkt
 * sich der Blick, und sieht man das Brett (Blick unter 0,6), wächst dort schon das Level.
 */
function ohneLeeresBrett(log, sky, was) {
  const ab = log.findIndex((e) => !e.menu && e.gaze < 0.98);
  pruefe(ab >= 0, `${was}: der Blick senkt sich nicht`);
  if (ab < 0) return;
  pruefe(log[ab].sky === sky && log[ab].ready, `${was}: der Blick senkt sich, bevor ${sky} bereit ist `
    + `(${log[ab].sky}, bereit ${log[ab].ready})`);
  const leer = log.slice(ab).find((e) => e.gaze < 0.6 && !['in', 'play'].includes(e.flow));
  pruefe(!leer, `${was}: leeres Brett im Blick (${JSON.stringify(leer)})`);
}

/** Seite neu laden (mit vorbereitetem localStorage) und warten, bis das Menü offen ist. */
const setzen = (storage) => Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, `
  + `${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join(' ');
async function laden(storage = {}) {
  await ev(`localStorage.clear(); ${setzen(storage)} window.__vorher = true`);
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü');
  await ev('document.fonts.ready.then(() => true)');
  await geste();
}
/**
 * Eine erste Geste wie der Klick auf «Klicken zum Starten», der mit ?nointro fehlt: ins Leere des Menüs (unten rechts).
 * Sie schaltet den Ton frei (audio.unlock); das hielt die Seite bis Ticket 05 von .scratch/leistung/ einmal 0,2–0,3 s an
 * (seither steht der Ton beim Laden bereit) und gehört im Spiel zum Start, nicht zu den Übergängen des Menüs. Der Tipp
 * ins Leere nimmt den Fokus weg; danach bekommt ihn der Knopf zurück, der ihn hatte (im Spiel setzt das Menü den Fokus
 * erst nach dem Start).
 */
async function geste() {
  const fokus = await ev('document.activeElement?.dataset?.menueFokus ?? null');
  // mit dem Finger gilt die Geste erst ab dem Loslassen, freigeschaltet wird beim Aufsetzen: dann ein zweites Mal
  for (let n = 0; n < 3 && !(await ev(`!!${D}.audio.ctx`)); n++) {
    const L = await layout();
    await tippeBei(L.w - 4, L.h - 4);
    await sleep(200);
  }
  await until(`!!${D}.audio.ctx`, 'Ton freigeschaltet', 5);
  if (fokus) await ev(`document.querySelector('#menue [data-menue-fokus="${fokus}"]').focus({ preventScroll: true })`);
  await sleep(300);
}
let reise = null; // STORY_LEVELS aus dem Spiel
/** Ein Stand wie nach dem Spielen bis platz (gelöst: alle davor; gesehen: Prolog und die Welten bis welt). */
const standBis = (g, platz, welt) => ({ platz, geloest: reise[g].flat().slice(0, platz),
  gesehen: ['prolog', ...STATIONEN.slice(0, welt + 1)], geschafft: false });

/**
 * Gehaltenes Enter am Startbildschirm (Tastenwiederholung, gut eine halbe Sekunde): Es startet, das Menü ist offen und
 * hat den Fokus, aber die Wiederholung löst keinen seiner Knöpfe aus (ohne Stand wäre es «Leicht» mit dem Prolog, mit
 * Stand «Weiter»). Danach wirkt ein neues Enter wieder. Geladen mit Startbildschirm, danach wieder ohne.
 */
async function gehaltenesEnter() {
  console.log(`${view.name}: gehaltenes Enter am Startbildschirm`);
  const enter = (type, autoRepeat = false) => send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter',
    windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, ...(type === 'keyDown' ? { text: '\r', autoRepeat } : {}) });
  for (const [name, storage, fokus] of [['ohne Stand', {}, 'wahl:leicht'],
    ['mit Stand', { 'prisma.noa.zuletzt': 'mittel', 'prisma.noa.mittel': standBis('mittel', 23, 2) }, 'weiter']]) {
    await ev(`localStorage.clear(); ${setzen(storage)} window.__vorher = true`);
    await send('Page.navigate', { url: PAGE_START });
    await until(`!window.__vorher && window.${D}?.ui.canStart === true`, `Startbildschirm (${name})`, 60);
    await sleep(600);
    await enter('keyDown');
    await sleep(500);
    for (let i = 0; i < 15; i++) { await enter('keyDown', true); await sleep(33); }
    await enter('keyUp');
    await sleep(1500);
    const r = await ev(`({ offen: ${menueOffen}, wahl: ${D}.story.choosing, buehne: ${storyMode},
      fokus: document.activeElement?.dataset.menueFokus ?? null, stand: localStorage.getItem('prisma.noa.leicht') })`);
    pruefe(r.offen && r.wahl && r.buehne === false && r.fokus === fokus && r.stand === null,
      `gehaltenes Enter am Startbildschirm, ${name}: ${JSON.stringify(r)}`);
    if (name === 'ohne Stand') { // losgelassen: ein neues Enter wählt wieder («Leicht», Prolog)
      await taste('Enter');
      await until(`${storyMode} === 'scene'`, 'Enter nach dem Loslassen', 10);
    }
  }
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.ticks > 2', 'Spiel startet');
}

const SATZ_BUEHNE = '#story .scene .line.on', SATZ_UNTERTITEL = '#story .caption .text';
/**
 * Der Satz, den der Spieler gerade liest (sel: SATZ_BUEHNE oder SATZ_UNTERTITEL), gegen soll; dazu, dass er ganz im
 * Bild steht (nichts abgeschnitten) und nicht mehr Zeilen braucht als der Massstab (MASS_BUEHNE bzw.
 * MASS_UNTERTITEL, in derselben Breite und Schrift gesetzt). Zeilen: verschiedene Oberkanten der Zeilen des Texts.
 */
async function pruefeSatz(sel, soll, was) {
  const mass = sel === SATZ_BUEHNE ? MASS_BUEHNE : MASS_UNTERTITEL;
  const s = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
    const zeilen = (e) => { const r = document.createRange(); r.selectNodeContents(e);
      return new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size; };
    const cs = getComputedStyle(el), m = document.createElement('p');
    m.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;margin:0;padding:0;width:'
      + Math.min(parseFloat(cs.maxWidth) || Infinity, el.parentElement.clientWidth) + 'px';
    for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing'])
      m.style[k] = cs[k];
    m.textContent = ${JSON.stringify(mass)};
    document.body.append(m);
    const masse = zeilen(m);
    m.remove();
    const b = el.getBoundingClientRect();
    return { text: el.textContent, zeilen: zeilen(el), masse,
      drin: b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight && b.right <= innerWidth
        && el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1 }; })()`);
  pruefe(s?.text === soll, `${was}: Satz «${s?.text}» statt «${soll}»`);
  if (!s) return;
  pruefe(s.drin, `${was}: Satz nicht ganz im Bild`);
  // auf der Bühne nur ein Hinweis: Prolog 6 steht wörtlich in der Spec (Entscheid 13) und braucht eine Zeile mehr als
  // der alte Prolog 2; die Zeilen der Bühne wachsen nach oben (.lines), abgeschnitten wird nichts (drin)
  const mehr = `${was}: ${s.zeilen} Zeilen, mehr als der längste Satz vor dem Wagen (${s.masse})`;
  if (sel === SATZ_BUEHNE && s.zeilen > s.masse) console.log(`  HINWEIS ${mehr}`);
  else pruefe(s.zeilen <= s.masse, mehr);
  console.log(`  Satz ${was}: ${s.zeilen} Zeilen (Massstab ${s.masse})`);
}

/**
 * Tippen, bis die Bühne fertig ist (Prolog: bis sie ausblendet; Epilog: bis die Knöpfe am Ende stehen). saetze: die
 * Sätze der Einstellungen der Reihe nach (PROLOG_SAETZE, EPILOG_SAETZE), geprüft mit pruefeSatz.
 */
async function buehneDurch(name, { bisKnoepfe = false, saetze = null } = {}) {
  for (let n = 1; ; n++) {
    await until(`${D}.story.waitTap !== null || ${storyMode} !== 'scene' || ${knoepfe}`, `${name}: Einstellung ${n}`,
      60);
    if (saetze && n <= saetze.length && await ev(`${storyMode} === 'scene'`)) {
      await pruefeSatz(SATZ_BUEHNE, saetze[n - 1], `${name}, Einstellung ${n}`);
    }
    // Knöpfe: am Ende des Epilogs mit dem letzten Satz, nach dem Prolog das Angebot (prüft angebot)
    if (await ev(knoepfe)) {
      pruefe(!saetze || n >= saetze.length, `${name}: Knöpfe nach ${n} statt ${saetze?.length} Einstellungen`);
      await bild(`${name}-ende`); return;
    }
    if (!(await ev(`${D}.story.waitTap !== null`))) {
      pruefe(!bisKnoepfe, `${name}: ohne Knöpfe am Ende`);
      pruefe(!saetze || n > saetze.length, `${name}: zu Ende nach ${n - 1} statt ${saetze?.length} Einstellungen`);
      return;
    }
    // dazu der letzte Satz mit Tippen (Prolog 6, der längste: Zeilen auf kleinen Handys, Review Ticket 03)
    if (n === 1 || (saetze && n === saetze.length)) { await sleep(800); await bild(`${name}-${n}`); }
    await tippe('#story .scene .lines', 'Bühne');
    await sleep(300);
  }
}

const ANGEBOT = '#story .scene .actions.angebot button';
/**
 * Das Angebot nach dem Prolog (Ticket 07): «Im Dorf» über dem Satz, die Knöpfe «Üben» und «Gleich los», der Fokus auf
 * «Üben»; dann wählen wie ein Spieler (mitTaste: Enter bzw. Tab und Enter statt Klick oder Finger).
 */
async function angebot(was, wahl, { mitTaste = false, name = null } = {}) {
  await until(`document.querySelectorAll('${ANGEBOT}').length === 2`, `${was}: Angebot`, 60);
  const a = await ev(`({ kicker: document.querySelector('#story .scene .sub .kicker.on')?.textContent ?? null,
    text: document.querySelector('#story .scene .line.on')?.textContent ?? '',
    knoepfe: [...document.querySelectorAll('${ANGEBOT}')].map((b) => b.textContent).join(),
    fokus: document.activeElement?.textContent ?? null })`);
  pruefe(a.kicker === 'Im Dorf' && a.text.startsWith('Bevor die Glühwürmchen') && a.knoepfe === 'Üben,Gleich los'
    && a.fokus === 'Üben', `${was}: Angebot ${JSON.stringify(a)}`);
  if (name) { await sleep(1800); await bild(name); }
  if (mitTaste) {
    if (wahl === 'Gleich los') await taste('Tab');
    pruefe(await ev('document.activeElement?.textContent') === wahl, `${was}: Fokus vor Enter nicht auf ${wahl}`);
    await taste('Enter');
  } else await tippe(`${ANGEBOT}:nth-child(${wahl === 'Üben' ? 1 : 2})`, wahl);
  await until(`document.querySelectorAll('${ANGEBOT}').length === 0`, `${was}: ${wahl} gewählt`, 5);
  // die Knöpfe sind weg: der Fokus geht auf die Geschichte, nicht auf body (Ticket 08)
  const fokus = await ev('document.activeElement?.id || document.activeElement?.tagName');
  pruefe(fokus === 'story', `${was}: Fokus nach «${wahl}» auf ${fokus}`);
}

/** Ein Level spielen: warten, bis es läuft, Kopfzeile prüfen, lösen, warten auf «gelöst», Weiter. */
async function level(g, platz, { bilder = false, messen = false } = {}) {
  const w = Math.floor(platz / 10), k = platz % 10;
  await until(`${D}.story.step === ${platz} && window.__prisma.playing()`, `${g}: Level ${platz + 1} läuft`);
  await kopfzeile(g, platz);
  if (bilder) { await sleep(2200); await bild(`${slug(g)}-${platz + 1}`); }
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', `${g}: Level ${platz + 1} gelöst`, 30);
  if (bilder || k === 9) { await sleep(600); await bild(`${slug(g)}-${platz + 1}-geloest`); }
  if (k === 9) { // «Gelöst» nach dem letzten Level der Welt: Meldung und Knopf (bei den Sternen «Der Wagen ist wach»)
    const f = await geloestFeld();
    pruefe(f.msg === WELT_GELOEST[w][0] && f.knopf === WELT_GELOEST[w][1],
      `${g} ${platz + 1}: Gelöst ${JSON.stringify(f)}`);
  }
  if (messen) await messe({ abKlick: true }); // die Zwischenszene danach messen, ab «Weiter»
  await tippe('#btn-next', 'Weiter');
}
async function kopfzeile(g, platz) {
  const w = Math.floor(platz / 10), k = platz % 10;
  const titel = await ev("document.getElementById('hud-title').textContent");
  const sub = await ev("document.getElementById('hud-sub').textContent");
  const name = await ev(`(() => { const l = LEVELS[${D}.game.levelIndex]; return l.titel ?? l.name; })()`);
  pruefe(titel === `${WELTEN[w]} – ${name}`, `${g} ${platz + 1}: Titel «${titel}»`);
  pruefe(sub.startsWith(`${GRAD_TEXT[g]} · Kapitel ${w + 1} / 6 · Level ${k + 1} / 10`),
    `${g} ${platz + 1}: Unterzeile «${sub}»`);
}

/** Durchgang: neuer Stand, Prolog, Einstieg, welten × 10 Level mit den Reisen, dann «Weiter» nach dem Neuladen. */
async function durchgang(g, erster) {
  console.log(`${view.name}, ${g}: Durchgang durch ${welten} Welten`);
  await laden();
  if (erster) { await sleep(2500); await bild('menue-neu'); }
  pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'wahl:leicht', `${g}: Fokus im neuen Menü`);
  await tippe(karte(g), `Karte ${g}`);
  await sofortZu(`${g}: Beginnen`);
  await until(`${storyMode} === 'scene'`, `${g}: Prolog`);
  if (erster) await buehneDurch(`${slug(g)}-prolog`, { saetze: PROLOG_SAETZE });
  else {
    await sleep(2500);
    await bild(`${slug(g)}-prolog`);
    await tippe('#story .scene .skip', 'Überspringen');
  }
  await angebot(g, 'Gleich los');
  await until(`${storyMode} === 'caption'`, `${g}: Einstieg`, 60);
  await sleep(1800);
  await bild(`${slug(g)}-einstieg`);
  pruefe((await ev("document.querySelector('#story .caption .kicker').textContent")) === 'Kapitel 1 · Der Bergwald',
    `${g}: Einstieg in den Bergwald`);
  await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[0], `${g}: Einstieg in den Bergwald`);
  for (let w = 0; w < welten; w++) {
    for (let k = 0; k < 10; k++) await level(g, w * 10 + k, { bilder: k === 0 });
    await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
      + `'Kapitel ${w + 2} · ${WELTEN[w + 1]}'`, `${g}: Reise in Welt ${w + 2}`, 60);
    await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[w + 1], `${g}: Reise in Welt ${w + 2}`);
    // «Menü» und «Neu starten» wirken auf der Reise nicht: Die Knöpfe sind weg (Ticket 08)
    pruefe(await ev("document.getElementById('controls').inert"), `${g}: Knöpfe auf der Reise in Welt ${w + 2}`);
    await sleep(2500);
    await bild(`${slug(g)}-reise-${w + 2}`);
  }
  await until(`${D}.story.step === ${welten * 10} && window.__prisma.playing()`, `${g}: angekommen`, 90);
  await sleep(1500);
  await bild(`${slug(g)}-${welten * 10 + 1}`);
  const s = await stand(g);
  pruefe(s?.platz === welten * 10 && s.geloest.length === welten * 10 && !s.geschafft
    && JSON.stringify(s.gesehen) === JSON.stringify(['prolog', 'angebot', ...STATIONEN.slice(0, welten + 1)])
    && s.dorf === undefined,
  `${g}: Stand ${JSON.stringify(s)}`);
  pruefe(await ev("localStorage.getItem('prisma.noa.zuletzt')") === g, `${g}: zuletzt gespielt`);
  // Neuladen: «Weiter» zu diesem Grad, dieselbe Welt ohne Einstieg, dasselbe Level
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  const fokus = await ev('document.activeElement?.dataset.menueFokus ?? null');
  pruefe(fokus === 'weiter', `${g}: Fokus nach dem Neuladen auf ${fokus}`);
  const wohin = await ev("document.querySelector('#menue .menue-wohin').textContent");
  pruefe(wohin === `${GRAD_TEXT[g]} · ${WELT_MENUE[welten]} ${welten * 10} / 60`, `${g}: Weiter «${wohin}»`);
  await tippe('#menue .menue-weiter', 'Weiter');
  await sofortZu(`${g}: Weiter`);
  let einstieg = false;
  for (let i = 0; i < 300 && !(await ev('window.__prisma.playing()')); i++) {
    if (await ev(`${storyMode} === 'caption' || ${storyMode} === 'scene'`)) einstieg = true;
    await sleep(100);
  }
  pruefe(!einstieg, `${g}: nach dem Neuladen ein Einstieg oder Prolog`);
  pruefe(await ev(`${D}.story.step`) === welten * 10, `${g}: nach dem Neuladen am Platz ${welten * 10}`);
}

/**
 * Finale: Stand am Anfang der letzten Welt, «Weiter», Einstieg, 10 Level, Finale, Epilog bis «Zum Menü»; dann ohne
 * Neuladen ins Menü (der Grad geschafft, der nächstschwerere hervorgehoben) und in den hervorgehobenen Grad. Ein
 * weiterer Grad ist im Vulkan begonnen: Zu ihm führt nach dem Epilog «Weiter» (Entscheid 25), mit den Zeichen der
 * Welten an seinem Weg.
 */
async function finale(g) {
  console.log(`${view.name}, ${g}: Finale ab der letzten Welt`);
  const naechster = GRADE[GRADE.indexOf(g) + 1] ?? null, anderer = GRADE.find((x) => x !== g && x !== naechster);
  await laden({ 'prisma.noa.zuletzt': g, [`prisma.noa.${slug(g)}`]: standBis(g, 50, 4),
    [`prisma.noa.${slug(anderer)}`]: standBis(anderer, 33, 3) });
  await messe({ abKlick: true });
  await tippe('#menue .menue-weiter', 'Weiter');
  await sofortZu(`${g}: Weiter`);
  await until(`${storyMode} === 'caption'`, `${g}: Einstieg in die Sterne`, 60);
  await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[5], `${g}: Einstieg in die Sterne`);
  await sleep(1800);
  await bild(`${slug(g)}-einstieg-sterne`);
  await until(`${D}.story.step === 50 && window.__prisma.playing()`, `${g}: Level 51 läuft`, 60);
  await ende(`${g}: Weiter → Einstieg in die Sterne (Fortsetzen)`, { bis: 'spielt' });
  for (let k = 0; k < 10; k++) await level(g, 50 + k, { bilder: k === 0 || k === 9, messen: k === 9 });
  // Finale: drei Sätze zum Tippen, dann die Antwort des Sterns und der Epilog
  for (let n = 1; n <= FINALE_SAETZE.length; n++) {
    await until(`${D}.story.waitTap !== null && ${storyMode} === 'caption'`, `${g}: Finale, Satz ${n}`, 60);
    await pruefeSatz(SATZ_UNTERTITEL, FINALE_SAETZE[n - 1], `${g}: Finale, Satz ${n}`);
    pruefe(await ev("document.getElementById('controls').inert"), `${g}: Knöpfe im Finale`);
    await sleep(900);
    await bild(`${slug(g)}-finale-${n}`);
    await tippe('#story .caption .text', 'Untertitel');
    await sleep(400);
  }
  await until(`${storyMode} === 'scene'`, `${g}: Epilog`, 60);
  await ende(`${g}: Finale (Level 60 → Epilog)`, { bis: 'buehne' });
  await sleep(2500);
  await bild(`${slug(g)}-epilog`);
  await buehneDurch(`${slug(g)}-epilog`, { bisKnoepfe: true, saetze: EPILOG_SAETZE });
  const s = await stand(g);
  pruefe(s?.geschafft === true && s.geloest.length === 60, `${g}: Stand nach dem Finale ${JSON.stringify(s)}`);
  const knopf = await ev("[...document.querySelectorAll('#story .scene .actions button')].map(b => b.textContent)"
    + '.join()');
  pruefe(knopf === 'Zum Menü', `${g}: Knöpfe am Ende «${knopf}»`);
  // «Zum Menü» ohne Neuladen
  await ev('window.__ohneNeuladen = true');
  await messe();
  await tippe('#story .scene .actions button', 'Zum Menü');
  await until(`${menueOffen} && ${storyMode} === false`, 'Menü nach dem Epilog', 10);
  await sleep(2200);
  await ende(`${g}: Epilog → Menü`);
  pruefe(await ev('window.__ohneNeuladen === true'), `${g}: «Zum Menü» hat neu geladen`);
  await bild(`${slug(g)}-zum-menue`);
  const menuStand = await ev(`(() => { const q = (s) => [...document.querySelectorAll(s)].map((e) => e.dataset.grad);
    return { geschafft: q('#menue .menue-grad.menue-geschafft'), hervor: q('#menue .menue-grad.menue-hervor'),
      weiter: document.querySelector('#menue .menue-weiter').hidden ? null
        : document.querySelector('#menue .menue-wohin').textContent,
      welten: document.querySelectorAll('#menue .menue-welt').length,
      fokus: document.activeElement?.dataset.menueFokus, kamera: ${D}.story.gaze, brett: ${D}.flow.state }; })()`);
  pruefe(JSON.stringify(menuStand.geschafft) === JSON.stringify([g]), `${g}: geschafft im Menü ${menuStand.geschafft}`);
  pruefe(JSON.stringify(menuStand.hervor) === JSON.stringify(naechster ? [naechster] : []),
    `${g}: hervorgehoben ${menuStand.hervor} statt ${naechster}`);
  pruefe(menuStand.weiter === `${GRAD_TEXT[anderer]} · Vulkan 33 / 60` && menuStand.welten === 6,
    `${g}: «Weiter» nach dem Epilog ${menuStand.weiter}, ${menuStand.welten} Zeichen der Welten`);
  pruefe(menuStand.fokus === 'weiter', `${g}: Fokus nach dem Epilog auf ${menuStand.fokus}`);
  pruefe(menuStand.kamera === 1, `${g}: Kamera hinter dem Menü nicht im Himmel (${menuStand.kamera})`);
  if (!view.phone) { // Esc führt nur zurück ins Spiel, wenn das Menü von dort kam
    await taste('Escape');
    pruefe(await ev(menueOffen), `${g}: Esc schloss das Menü nach dem Epilog`);
  }
  if (!naechster) return;
  // in den hervorgehobenen Grad: Prolog, das alte Brett versinkt darunter, Einstieg, erstes Level
  await tippe(karte(naechster), `Karte ${naechster}`);
  await sofortZu(`${naechster}: Beginnen nach dem Epilog`);
  await until(`${storyMode} === 'scene' && ${D}.story.scene.skip.hidden === false`, `${naechster}: Prolog`, 30);
  await until(`${D}.flow.state === 'story' && !${D}.story.holdEnter`, `${naechster}: altes Brett versunken`, 30);
  await sleep(1500);
  await tippe('#story .scene .skip', 'Überspringen');
  await angebot(naechster, 'Gleich los');
  await until(`${storyMode} === 'caption'`, `${naechster}: Einstieg`, 60);
  await level(naechster, 0, { bilder: true });
  pruefe((await stand(naechster))?.gesehen?.join() === 'prolog,angebot,wald',
    `${naechster}: Stand nach dem ersten Level`);
}

/**
 * Der ganze Durchgang eines Grads in einer Sitzung (--ganz, Abnahme Ticket 08): neuer Stand, Menü → Prolog bis zum
 * Angebot, «Gleich los» → Einstieg in den Bergwald, alle 60 Level mit den fünf
 * Reisen, mitten in der Wüste (vor Level 26) Neuladen und «Weiter» an denselben Platz ohne Einstieg, Finale, Epilog bis
 * «Zum Menü» und ohne Neuladen ins Menü (der Grad geschafft, der nächstschwerere hervorgehoben). Gemessen wird jede
 * Zwischenszene ab dem Klick, der sie auslöst, bis das nächste Level läuft (bzw. bis Angebot, Epilog, Knöpfe am Ende).
 */
async function ganzerDurchgang(g, erster) {
  console.log(`${view.name}, ${g}: ganzer Durchgang`);
  const naechster = GRADE[GRADE.indexOf(g) + 1] ?? null;
  await laden();
  if (erster) { await sleep(2500); await bild('menue-neu'); }
  pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'wahl:leicht', `${g}: Fokus im neuen Menü`);
  await messe({ abKlick: true });
  await tippe(karte(g), `Karte ${g}`);
  await sofortZu(`${g}: Beginnen`);
  await until(`${storyMode} === 'scene'`, `${g}: Prolog`);
  await buehneDurch(`${slug(g)}-prolog`, { saetze: PROLOG_SAETZE });
  await ende(`${g}: Menü → Prolog bis zum Angebot`, { bis: 'knoepfe' });
  await messe({ abKlick: true });
  await angebot(g, 'Gleich los');
  await until(`${storyMode} === 'caption'`, `${g}: Einstieg`, 60);
  pruefe((await ev("document.querySelector('#story .caption .kicker').textContent")) === 'Kapitel 1 · Der Bergwald',
    `${g}: Einstieg in den Bergwald`);
  await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[0], `${g}: Einstieg in den Bergwald`);
  await sleep(1800);
  await bild(`${slug(g)}-einstieg`);
  await until(`${D}.story.step === 0 && window.__prisma.playing()`, `${g}: Level 1 läuft`);
  await ende(`${g}: Gleich los → Einstieg Bergwald`, { bis: 'spielt' });
  for (let w = 0; w < 6; w++) {
    for (let k = 0; k < 10; k++) {
      if (w * 10 + k === 25) await neuladenMitten(g);
      await level(g, w * 10 + k, { bilder: k === 0, messen: k === 9 });
    }
    if (w === 5) break;
    await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
      + `'Kapitel ${w + 2} · ${WELTEN[w + 1]}'`, `${g}: Reise in Welt ${w + 2}`, 60);
    await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[w + 1], `${g}: Reise in Welt ${w + 2}`);
    pruefe(await ev("document.getElementById('controls').inert"), `${g}: Knöpfe auf der Reise in Welt ${w + 2}`);
    await sleep(2500);
    await bild(`${slug(g)}-reise-${w + 2}`);
    await until(`${D}.story.step === ${(w + 1) * 10} && window.__prisma.playing()`, `${g}: in Welt ${w + 2}`, 90);
    await ende(`${g}: Reise in Welt ${w + 2} (${WELT_MENUE[w + 1]})`, { bis: 'spielt' });
  }
  // Finale: drei Sätze zum Tippen, dann die Antwort des Sterns und der Epilog
  for (let n = 1; n <= FINALE_SAETZE.length; n++) {
    await until(`${D}.story.waitTap !== null && ${storyMode} === 'caption'`, `${g}: Finale, Satz ${n}`, 60);
    await pruefeSatz(SATZ_UNTERTITEL, FINALE_SAETZE[n - 1], `${g}: Finale, Satz ${n}`);
    pruefe(await ev("document.getElementById('controls').inert"), `${g}: Knöpfe im Finale`);
    await sleep(900);
    await bild(`${slug(g)}-finale-${n}`);
    await tippe('#story .caption .text', 'Untertitel');
    await sleep(400);
  }
  await until(`${storyMode} === 'scene'`, `${g}: Epilog`, 60);
  await ende(`${g}: Finale (Level 60 → Epilog)`, { bis: 'buehne' });
  await messe();
  await sleep(2500);
  await bild(`${slug(g)}-epilog`);
  await buehneDurch(`${slug(g)}-epilog`, { bisKnoepfe: true, saetze: EPILOG_SAETZE });
  await ende(`${g}: Epilog bis «Zum Menü»`, { bis: 'knoepfe' }); // ab dem ersten Bild nach dem Finale
  const s = await stand(g);
  pruefe(s?.geschafft === true && s.geloest.length === 60, `${g}: Stand nach dem Finale ${JSON.stringify(s)}`);
  const knopf = await ev("[...document.querySelectorAll('#story .scene .actions button')].map(b => b.textContent)"
    + '.join()');
  pruefe(knopf === 'Zum Menü', `${g}: Knöpfe am Ende «${knopf}»`);
  await ev('window.__ohneNeuladen = true');
  await messe({ abKlick: true });
  await tippe('#story .scene .actions button', 'Zum Menü');
  await until(`${menueOffen} && ${storyMode} === false`, 'Menü nach dem Epilog', 10);
  await sleep(2200);
  await ende(`${g}: Epilog → Menü`);
  pruefe(await ev('window.__ohneNeuladen === true'), `${g}: «Zum Menü» hat neu geladen`);
  await bild(`${slug(g)}-zum-menue`);
  const m = await ev(`(() => { const q = (s) => [...document.querySelectorAll(s)].map((e) => e.dataset.grad);
    return { geschafft: q('#menue .menue-grad.menue-geschafft'), hervor: q('#menue .menue-grad.menue-hervor'),
      fokus: document.activeElement?.dataset.menueFokus, kamera: ${D}.story.gaze }; })()`);
  pruefe(JSON.stringify(m.geschafft) === JSON.stringify([g])
    && JSON.stringify(m.hervor) === JSON.stringify(naechster ? [naechster] : []) && m.kamera === 1,
  `${g}: Menü nach dem Epilog ${JSON.stringify(m)}`);
}
/** Mitten in der Wüste neu laden (25 Level gelöst): «Weiter» führt an denselben Platz, ohne Einstieg. */
async function neuladenMitten(g) {
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  await ev('document.fonts.ready.then(() => true)');
  await geste(); // die erste Geste schaltet den Ton frei (gehört zum Start, nicht zum «Weiter»)
  const fokus = await ev('document.activeElement?.dataset.menueFokus ?? null');
  pruefe(fokus === 'weiter', `${g}: Fokus nach dem Neuladen auf ${fokus}`);
  const wohin = await ev("document.querySelector('#menue .menue-wohin').textContent");
  pruefe(wohin === `${GRAD_TEXT[g]} · Wüste 25 / 60`, `${g}: Weiter nach dem Neuladen «${wohin}»`);
  await sleep(1500);
  await bild(`${slug(g)}-neuladen-menue`);
  await messe({ abKlick: true });
  await tippe('#menue .menue-weiter', 'Weiter');
  await sofortZu(`${g}: Weiter nach dem Neuladen`);
  let einstieg = false;
  for (let i = 0; i < 300 && !(await ev('window.__prisma.playing()')); i++) {
    if (await ev(`${storyMode} === 'caption' || ${storyMode} === 'scene'`)) einstieg = true;
    await sleep(100);
  }
  await ende(`${g}: Neuladen → Weiter (Wüste 26)`, { bis: 'spielt' });
  pruefe(!einstieg, `${g}: nach dem Neuladen ein Einstieg oder Prolog`);
  const s = await stand(g);
  pruefe(s?.platz === 25 && s.geloest.length === 25 && !s.geschafft, `${g}: Stand nach dem Neuladen ${JSON.stringify(s)}`);
}

/**
 * Das Menü im Ablauf: «Weiter» in derselben Welt, «Menü» im Spiel und zurück ins selbe Level (es steht noch da, die
 * Drehung bleibt), Wechsel in einen begonnenen Grad in einer anderen Welt (kein leeres Brett), «Von vorn» mit
 * Rückfrage (Abbrechen und Bestätigen), ein neuer Grad aus dem Spiel heraus, Tastatur (Desktop). Dazu die Bildzeiten.
 */
async function menueAblauf() {
  console.log(`${view.name}: Menü`);
  // Leicht begonnen und lange nicht gespielt (gespielt: 1970), Sehr schwer geschafft
  await laden({ 'prisma.noa.zuletzt': 'mittel', 'prisma.noa.leicht': { ...standBis('leicht', 12, 1), gespielt: 1000 },
    'prisma.noa.mittel': standBis('mittel', 23, 2), 'prisma.noa.schwer': standBis('schwer', 4, 0),
    'prisma.noa.sehr-schwer': { ...standBis('sehr schwer', 59, 5), geschafft: true } });
  await sleep(3000);
  await bild('menue-start');
  const start = await ev(`(() => { const t = (g) => document.querySelector('#menue .menue-grad[data-grad="' + g + '"]'
    + ' .menue-stand').textContent; return { leicht: t('leicht'), mittel: t('mittel'), schwer: t('schwer'),
    sehr: t('sehr schwer'), weiter: document.querySelector('#menue .menue-wohin').textContent,
    fokus: document.activeElement?.dataset.menueFokus, kamera: ${D}.story.gaze,
    hud: document.getElementById('hud').classList.contains('hidden'),
    knoepfe: document.getElementById('controls').inert,
    vonvorn: [...document.querySelectorAll('#menue .menue-vonvorn')].map((b) => b.dataset.menueFokus).join() }; })()`);
  pruefe(start.leicht === 'Meer·12 / 60' && start.mittel === 'Wüste·23 / 60' && start.schwer === 'Bergwald·4 / 60'
    && start.sehr === 'Geschafft', `Stand im Menü ${JSON.stringify(start)}`);
  pruefe(start.weiter === 'Mittel · Wüste 23 / 60' && start.fokus === 'weiter',
    `Weiter im Menü ${JSON.stringify(start)}`);
  pruefe(start.kamera === 1 && start.hud && start.knoepfe, `hinter dem Menü ${JSON.stringify(start)}`);
  pruefe(start.vonvorn === 'vonvorn:leicht,vonvorn:mittel,vonvorn:schwer,vonvorn:sehr schwer',
    `«Von vorn» bei ${start.vonvorn}`); // seit Ticket 06 auch beim geschafften (die Karte öffnet die Übersicht)

  // «Weiter»: dieselbe Welt (ihr Himmel ist schon da), ohne Einstieg
  await messe();
  await tippe('#menue .menue-weiter', 'Weiter');
  await sofortZu('Weiter');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0`, 'Mittel 24 läuft', 30);
  ohneLeeresBrett(await ende('Menü → Spiel (Weiter, gleiche Welt)'), 'desert', 'Weiter');
  pruefe(await ev(`${D}.story.step`) === 23 && await ev(`${D}.story.grade`) === 'mittel', 'Weiter: Platz');
  await kopfzeile('mittel', 23);
  await sleep(800);
  await bild('menue-weiter-level');

  // eine Drehung, dann «Menü» im Spiel: der Blick hebt sich, das Level bleibt
  const vorher = await ev(`(() => { const el = ${D}.game.board.elements.find(isRotatable); ${D}.rotateElement(el, 1);
    return { id: el.id, rot: el.type === 'combiner' ? el.dir : el.rot, index: ${D}.game.levelIndex }; })()`);
  await sleep(700);
  await messe();
  await tippe('#btn-menu', 'Menü');
  pruefe(await ev(menueOffen), 'Menü im Spiel: nicht sofort offen');
  await until(`${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Blick in den Himmel', 10);
  await sleep(1500);
  await ende('Spiel → Menü');
  await bild('menue-aus-dem-spiel');
  const imMenue = await ev(`({ hud: document.getElementById('hud').classList.contains('hidden'),
    knoepfe: document.getElementById('controls').inert, geloest: window.__prisma.solvedPanel(),
    fokus: document.activeElement?.dataset.menueFokus, flow: ${D}.flow.state })`);
  pruefe(imMenue.hud && imMenue.knoepfe && !imMenue.geloest && imMenue.fokus === 'weiter' && imMenue.flow === 'play',
    `Menü im Spiel ${JSON.stringify(imMenue)}`);
  // Tasten gehören dem Menü: R startet das Level darunter nicht neu
  if (!view.phone) {
    await taste('ArrowDown');
    pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'wahl:leicht', 'Pfeil ab im Menü');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'r', code: 'KeyR', windowsVirtualKeyCode: 82 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'r', code: 'KeyR', windowsVirtualKeyCode: 82 });
    await sleep(300);
    pruefe(await ev(`${D}.flow.state`) === 'play', 'R im Menü startete das Level darunter neu');
    await taste('ArrowUp');
  }

  // zurück ins selbe Level: es steht noch da, die Drehung bleibt
  await messe();
  if (view.phone) await tippe('#menue .menue-weiter', 'Weiter');
  else {
    pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'weiter', 'Fokus vor Enter auf Weiter');
    await taste('Enter');
  }
  await sofortZu('Weiter ins selbe Level');
  await until(`${D}.story.gaze === 0 && !${D}.story.running`, 'zurück im Level', 10);
  await ende('Menü → Spiel (dasselbe Level)');
  const nachher = await ev(`(() => { const el = ${D}.game.board.elements[${vorher.id}];
    return { rot: el.type === 'combiner' ? el.dir : el.rot, index: ${D}.game.levelIndex, flow: ${D}.flow.state,
      knoepfe: !document.getElementById('controls').inert, hud: !document.getElementById('hud').classList
        .contains('hidden') }; })()`);
  pruefe(nachher.rot === vorher.rot && nachher.index === vorher.index && nachher.flow === 'play' && nachher.knoepfe
    && nachher.hud, `zurück im selben Level ${JSON.stringify({ vorher, nachher })}`);

  // «Menü» (Esc auf dem Desktop), dann «Schwer»: begonnen im Bergwald, eine andere Welt
  if (view.phone) await tippe('#btn-menu', 'Menü');
  else await taste('Escape');
  await until(`${menueOffen} && ${D}.story.gaze === 1`, 'Menü (Esc)', 10);
  if (!view.phone) {
    // Esc im Menü, das aus dem Spiel kam: zurück ins selbe Level; Esc noch einmal: wieder das Menü
    await sleep(600);
    await taste('Escape');
    await sofortZu('Esc im Menü');
    await until(`${D}.story.gaze === 0 && !${D}.story.running`, 'Esc: zurück im Level', 10);
    pruefe(await ev(`${D}.game.levelIndex`) === vorher.index && await ev(`${D}.flow.state`) === 'play',
      'Esc im Menü: nicht zurück im selben Level');
    await taste('Escape');
    await until(`${menueOffen} && ${D}.story.gaze === 1`, 'Menü (Esc, noch einmal)', 10);
  }
  await sleep(1200);
  await messe();
  await tippe(karte('schwer'), 'Karte Schwer');
  await sofortZu('Schwer');
  await sleep(1600);
  await bild('menue-wechsel-warten');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0`, 'Schwer 5 läuft', 30);
  ohneLeeresBrett(await ende('Menü → Spiel (anderer Grad, andere Welt)'), 'forest', 'Wechsel zu Schwer');
  pruefe(await ev(`${D}.story.grade`) === 'schwer' && await ev(`${D}.story.step`) === 4, 'Wechsel: Grad und Platz');
  await kopfzeile('schwer', 4);
  await sleep(800);
  await bild('menue-wechsel-level');

  // «Von vorn» für Schwer (zuletzt gespielt, sein Level steht auf dem Brett): erst abbrechen (Stand bleibt), dann
  // bestätigen: nur Schwer weg; «Weiter» führt jetzt zum zuletzt gespielten der begonnenen (Mittel, nicht Leicht)
  await tippe('#btn-menu', 'Menü');
  await until(`${menueOffen} && ${D}.story.gaze === 1`, 'Menü', 10);
  await sleep(1200);
  await tippe('#menue [data-menue-fokus="vonvorn:schwer"]', 'Von vorn Schwer');
  await until("!document.querySelector('#menue .menue-frage').hidden", 'Rückfrage', 5);
  await sleep(500);
  pruefe(await ev('document.activeElement?.dataset.menueFrage') === 'nein', 'Rückfrage: Fokus auf Abbrechen');
  await tippe('#menue [data-menue-frage="nein"]', 'Abbrechen');
  await sleep(500);
  pruefe((await stand('schwer'))?.platz === 4, 'Abbrechen: Stand von Schwer geändert');
  await tippe('#menue [data-menue-fokus="vonvorn:schwer"]', 'Von vorn Schwer');
  await until("!document.querySelector('#menue .menue-frage').hidden", 'Rückfrage', 5);
  await sleep(500);
  await bild('menue-rueckfrage');
  await tippe('#menue [data-menue-frage="ja"]', 'Von vorn bestätigen');
  await sleep(600);
  const vonvorn = await ev(`({ schwer: localStorage.getItem('prisma.noa.schwer'),
    mittel: !!localStorage.getItem('prisma.noa.mittel'), leicht: !!localStorage.getItem('prisma.noa.leicht'),
    karte: document.querySelector('#menue .menue-grad[data-grad="schwer"] .menue-stand').textContent,
    offen: ${menueOffen}, fokus: document.activeElement?.dataset.menueFokus,
    weiter: document.querySelector('#menue .menue-weiter').hidden ? null
      : document.querySelector('#menue .menue-wohin').textContent,
    welten: document.querySelectorAll('#menue .menue-welt').length })`);
  pruefe(vonvorn.schwer === null && vonvorn.mittel && vonvorn.leicht && vonvorn.karte === 'noch nicht begonnen'
    && vonvorn.offen && vonvorn.fokus === 'wahl:schwer' && vonvorn.weiter === 'Mittel · Wüste 23 / 60'
    && vonvorn.welten === 6, `Von vorn ${JSON.stringify(vonvorn)}`);
  await bild('menue-von-vorn');
  if (!view.phone) { // das Level von Schwer gilt nicht mehr: Esc führt nicht dorthin zurück
    await taste('Escape');
    pruefe(await ev(menueOffen), 'Esc nach «Von vorn» des laufenden Grads schloss das Menü');
  }

  // ein neuer Grad aus dem Spiel heraus: Prolog, das alte Brett von Schwer versinkt darunter, Einstieg, erstes Level
  await messe();
  await tippe(karte('schwer'), 'Karte Schwer');
  await sofortZu('Schwer beginnen');
  await until(`${storyMode} === 'scene'`, 'Schwer: Prolog', 30);
  await until(`${D}.flow.state === 'story' && !${D}.story.holdEnter`, 'Schwer: altes Brett versunken', 30);
  await sleep(1500);
  await ende('Menü → Prolog (neuer Grad, das Brett versinkt)');
  await tippe('#story .scene .skip', 'Überspringen');
  await angebot('schwer', 'Gleich los');
  await until(`${storyMode} === 'caption'`, 'Schwer: Einstieg', 60);
  await level('schwer', 0);
  const s = await stand('schwer');
  pruefe(s?.gesehen?.join() === 'prolog,angebot,wald' && s.geloest.length === 1 && s.gespielt > 1000,
    `Schwer neu: Stand ${JSON.stringify(s)}`);
}

/* ---------- Übersicht und Wiederholen (Ticket 06) ---------- */

const UEB = '#uebersicht';
const uebOffen = `${D}.uebersicht.offen`;
/** Kachel der Übersicht: Welt w (0–5; ohne «Im Dorf» ist das die Reihe), Level l (0–9). */
const kachel = (w, l) => `${UEB} .ueb-welt[data-reihe="${w}"] li:nth-child(${l + 1}) .ueb-kachel`;
/** Zustand der Übersicht: Kacheln je Zustand, laufendes und fokussiertes Level als [Welt, Level], Kopf, Seite. */
const uebStand = () => ev(`(() => { const u = document.getElementById('uebersicht'), q = (s) => u.querySelectorAll(s);
  const wo = (k) => { if (!k?.classList?.contains('ueb-kachel')) return null; const li = k.closest('li');
    return [+k.closest('.ueb-welt').dataset.reihe, [...li.parentNode.children].indexOf(li)]; };
  return { geloest: q('.ueb-kachel.ueb-geloest').length, offen: q('.ueb-kachel.ueb-offen').length,
    gesperrt: q('.ueb-kachel.ueb-gesperrt').length, aktuell: wo(u.querySelector('.ueb-kachel[aria-current="true"]')),
    fokus: wo(document.activeElement), geschafft: u.classList.contains('ueb-geschafft'), modus: u.dataset.modus,
    kopf: u.querySelector('.ueb-fortschritt').textContent, seite: u.querySelector('.ueb-seitentitel .ueb-sr')
      ?.textContent ?? '' }; })()`);
/** Bestwerte, die eine Kachel zeigt («16:39 99»). */
const kachelWerte = (w, l) => ev(`[...document.querySelectorAll(${JSON.stringify(`${kachel(w, l)} .ueb-wert`)})]`
  + '.map((e) => e.textContent).join(" ")');
const besteWerte = (g) => ev(`JSON.parse(localStorage.getItem('prisma.noa.${slug(g)}.bestwerte') || 'null')`);
/** Feld «Gelöst»: Meldung, Bestmarke, hervorgehobene Zahlen, Knopf; sichtbar: die Bestmarke steht im Bild. */
const geloestFeld = () => ev(`(() => { const b = document.getElementById('solved-best'), r = b.getBoundingClientRect();
  return { msg: document.getElementById('solved-msg').textContent, best: b.textContent,
    zahlen: document.querySelectorAll('#solved .num.best').length,
    knopf: document.getElementById('btn-next').textContent,
    sichtbar: r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(b).display !== 'none' }; })()`);
/** Übersicht schliessen wie ein Spieler: Esc (Desktop) bzw. «Schliessen» (Handy). */
async function uebersichtZu() {
  if (view.phone) await tippe(`${UEB} .ueb-schliessen`, 'Schliessen');
  else await taste('Escape');
}
/** Mit dem Finger über die Kacheln der gezeigten Welt wischen (dx > 0: nach rechts, zur vorigen Welt). */
async function wische(dx) {
  const p = await ev(`(() => { const el = [...document.querySelectorAll('${UEB} .ueb-kacheln')]
    .find((e) => !e.closest('[inert]')); const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const zug = (type, x) => send('Input.dispatchTouchEvent', { type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y: p.y }] });
  const x0 = p.x - dx / 2;
  await zug('touchStart', x0);
  for (let k = 1; k <= 10; k++) { await zug('touchMove', x0 + dx * k / 10); await sleep(16); }
  await zug('touchEnd');
  await sleep(600);
}
/** Im Log einer Messung: kein Untertitel, keine Bühne, kein Träger (Wiederholen, Entscheid 16). */
function ohneZwischenszene(log, was) {
  const z = log.find((e) => e.story || e.traeger);
  pruefe(!z, `${was}: Zwischenszene beim Wiederholen (${JSON.stringify(z)})`);
}

/**
 * Übersicht und Wiederholen (Ticket 06, Entscheide 9, 16, 24, 27). Stand: Mittel bis Meer 4 (Bergwald fertig, Meer 1–3
 * gelöst) mit einigen Bestwerten, Leicht geschafft mit allen Bestwerten. Geprüft: Übersicht aus dem Spiel mit dem Knopf
 * und mit L (Kacheln gelöst, offen, gesperrt, Werte, laufendes Level), zurück ins selbe Level (Drehung bleibt, die Zeit
 * in der Übersicht zählt nicht), Tasten unter der Übersicht; Wiederholen eines Levels im Bergwald aus dem Meer (ohne
 * Untertitel und Träger, Himmel wechselt erst im Himmel, der Platz bleibt), «Neue Bestzeit · Weniger Drehungen» und
 * keine Meldung bei gleichen Werten; «Weiter» über die Grenze Wald → Meer (nur der Himmel blendet, der Blick bleibt auf
 * dem Brett, kein Wechsel, bevor der neue Himmel geladen ist); beim ersten ungelösten Level der normale Ablauf (der
 * Platz wächst, neue Bestwerte ohne Meldung); aus dem Menü die Übersicht des geschafften Grads (Kopf, Summe, Blättern
 * auf dem Handy), Esc zurück ins Menü (Fokus beim Grad), Kachel → Wiederholen (der zuletzt gespielte Grad bleibt) bis
 * zum letzten Level → «Zur Übersicht» → zurück ins Level; «Von vorn» lässt die Bestwerte stehen. Auf dem Desktop dazu:
 * nach dem Wiederholen ein ungelöstes Level in der nächsten Welt (mit Reise). Dazu die Bildzeiten der Übergänge.
 */
async function uebersichtAblauf() {
  console.log(`${view.name}: Übersicht`);
  const m = reise.mittel, l = reise.leicht;
  const bestM = { [m[0][0]]: { zeit: 999, drehungen: 99 }, [m[0][9]]: { zeit: 0, drehungen: 1 },
    [m[1][0]]: { zeit: 75, drehungen: 12 }, [m[1][2]]: { zeit: 0, drehungen: 1 } };
  const bestL = Object.fromEntries(l.flat().map((n, i) => [n, { zeit: 20 + i, drehungen: 3 + (i % 7) }]));
  await laden({ 'prisma.noa.zuletzt': 'mittel', 'prisma.noa.mittel': standBis('mittel', 13, 1),
    'prisma.noa.mittel.bestwerte': bestM, 'prisma.noa.leicht.bestwerte': bestL,
    'prisma.noa.leicht': { ...standBis('leicht', 59, 5), geloest: l.flat(), geschafft: true } });
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 13`, 'Mittel 14 läuft', 30);
  pruefe(await ev("!document.getElementById('btn-overview').hidden"), 'Knopf «Übersicht» fehlt im Level');
  await sleep(800);

  // eine Drehung, dann die Übersicht mit dem Knopf: der Blick hebt sich, das Level bleibt
  const vorher = await ev(`(() => { const el = ${D}.game.board.elements.find(isRotatable); ${D}.rotateElement(el, 1);
    return { id: el.id, rot: el.type === 'combiner' ? el.dir : el.rot, index: ${D}.game.levelIndex,
      start: ${D}.game.stats.startedAt }; })()`);
  await sleep(700);
  await messe();
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht aus dem Spiel', 10);
  await sleep(1200);
  await ende('Spiel → Übersicht');
  await bild('uebersicht-aus-dem-spiel');
  let u = await uebStand();
  const unter = await ev(`({ hud: document.getElementById('hud').classList.contains('hidden'),
    knoepfe: document.getElementById('controls').inert, geloest: window.__prisma.solvedPanel(), flow: ${D}.flow.state,
    menue: ${menueOffen} })`);
  pruefe(u.geloest === 13 && u.offen === 1 && u.gesperrt === 46 && JSON.stringify(u.aktuell) === '[1,3]'
    && JSON.stringify(u.fokus) === '[1,3]' && u.kopf.includes('13 / 60') && !u.geschafft,
  `Übersicht aus dem Spiel ${JSON.stringify(u)}`);
  pruefe(u.modus === (view.phone ? 'seiten' : 'alle') && (!view.phone || u.seite.startsWith('Meer: 3 von 10')),
    `Übersicht: Darstellung ${JSON.stringify(u)}`);
  pruefe(unter.hud && unter.knoepfe && !unter.geloest && unter.flow === 'play' && !unter.menue,
    `unter der Übersicht ${JSON.stringify(unter)}`);
  const werteW1 = await kachelWerte(0, 0), werteM1 = await kachelWerte(1, 0), werteW2 = await kachelWerte(0, 1);
  pruefe(werteW1 === '16:39 99' && werteM1 === '1:15 12' && werteW2 === '',
    `Werte der Kacheln «${werteW1}», «${werteM1}», «${werteW2}»`);
  // Esc bzw. Schliessen: zurück ins selbe Level, die Drehung bleibt, die Zeit in der Übersicht zählt nicht
  await sleep(1500);
  await messe();
  await uebersichtZu();
  await until(`!${uebOffen} && ${D}.story.gaze === 0 && !${D}.story.running`, 'zurück im Level', 10);
  await ende('Übersicht → Spiel (Schliessen)');
  const nachher = await ev(`(() => { const el = ${D}.game.board.elements[${vorher.id}];
    return { rot: el.type === 'combiner' ? el.dir : el.rot, index: ${D}.game.levelIndex, flow: ${D}.flow.state,
      start: ${D}.game.stats.startedAt, knoepfe: !document.getElementById('controls').inert,
      fokus: document.activeElement?.id ?? null }; })()`);
  pruefe(nachher.rot === vorher.rot && nachher.index === vorher.index && nachher.flow === 'play' && nachher.knoepfe
    && nachher.start - vorher.start > 2500 && (view.phone || nachher.fokus === 'btn-overview'),
  `zurück aus der Übersicht ${JSON.stringify({ vorher, nachher })}`);

  // wieder öffnen (Desktop mit L: Tasten unter der Übersicht), dann das erste Level im Bergwald wiederholen
  if (view.phone) await tippe('#btn-overview', 'Übersicht');
  else await taste('KeyL');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht wieder offen', 10);
  await sleep(600);
  if (view.phone) { // Wischen auf den Kacheln: zur vorigen Welt (Bergwald)
    await wische(170);
    u = await uebStand();
    pruefe(u.seite.startsWith('Bergwald: 10 von 10'), `Wischen nach rechts: Seite «${u.seite}»`);
  } else {
    await taste('ArrowLeft');
    pruefe(JSON.stringify((await uebStand()).fokus) === '[1,2]', 'Pfeil links in der Übersicht');
    const muted = await ev(`${D}.audio.muted`);
    await taste('KeyR');
    await taste('KeyM');
    const r = await ev(`({ flow: ${D}.flow.state, index: ${D}.game.levelIndex, offen: ${uebOffen},
      muted: ${D}.audio.muted })`);
    pruefe(r.flow === 'play' && r.index === vorher.index && r.offen && r.muted !== muted,
      `R und M unter der Übersicht ${JSON.stringify(r)}`);
    await taste('KeyM');
    // Fokus auf «Schliessen» (Ticket 08): Pfeile holen ihn auf die Kacheln zurück, Pos1/Ende wirken wie von dort
    const schliessen = `document.querySelector('${UEB} .ueb-schliessen')`;
    await ev(`${schliessen}.focus()`);
    await taste('ArrowDown');
    pruefe(JSON.stringify((await uebStand()).fokus) === '[1,2]', 'Pfeil mit dem Fokus auf «Schliessen»');
    await ev(`${schliessen}.focus()`);
    await taste('End');
    pruefe(JSON.stringify((await uebStand()).fokus) === '[1,9]', 'Ende mit dem Fokus auf «Schliessen»');
    // Hinweis zu einer gesperrten Kachel an der Kachel, nicht unten in der Mitte (Ticket 08)
    await tippe(kachel(3, 4), 'gesperrte Kachel Vulkan 5');
    await sleep(400);
    const h = await ev(`(() => { const h = document.querySelector('${UEB} .ueb-hinweis').getBoundingClientRect(),
      k = document.querySelector(${JSON.stringify(kachel(3, 4))}).getBoundingClientRect();
      return { abstand: Math.round(Math.max(k.top - h.bottom, h.top - k.bottom)),
        mitte: Math.round(Math.abs((h.left + h.right) / 2 - (k.left + k.right) / 2)) }; })()`);
    pruefe(h.abstand >= 0 && h.abstand <= 20 && h.mitte < 2, `Hinweis an der Kachel ${JSON.stringify(h)}`);
    await taste('Home', { strg: true });
    pruefe(JSON.stringify((await uebStand()).fokus) === '[0,0]', 'Strg+Pos1 in der Übersicht');
  }
  const hoehe = await ev(`Math.round(document.querySelector('${UEB} .ueb-schliessen').getBoundingClientRect().height)`);
  pruefe(hoehe >= 44, `«Schliessen» ${hoehe} px hoch (mindestens 44)`);
  await messe();
  if (view.phone) await tippe(kachel(0, 0), 'Kachel Bergwald 1');
  else await taste('Enter');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 0 && !${D}.story.running`,
    'Bergwald 1 wiederholen', 30);
  let log = await ende('Übersicht → Wiederholen (andere Welt)');
  ohneZwischenszene(log, 'Wiederholen Bergwald 1');
  ohneLeeresBrett(log, 'forest', 'Wiederholen Bergwald 1');
  pruefe(await ev(`${D}.story.replay`) === true && (await stand('mittel'))?.platz === 13,
    'Wiederholen: nicht im Wiederholen oder der Platz hat sich geändert');
  await kopfzeile('mittel', 0);
  // Bestwerte: neue Bestzeit und weniger Drehungen (gespeichert 999 s und 99), gemeldet im Feld «Gelöst»
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Bergwald 1 gelöst', 30);
  await sleep(700);
  let f = await geloestFeld();
  let b = (await besteWerte('mittel'))?.[m[0][0]];
  pruefe(f.msg === 'Gelöst' && f.best === 'Neue Bestzeit · Weniger Drehungen' && f.zahlen === 2 && f.sichtbar
    && f.knopf === 'Weiter' && b.zeit < 999 && b.drehungen < 99, `neue Bestmarke ${JSON.stringify({ f, b })}`);
  await bild('uebersicht-neue-bestzeit');

  // das letzte Level des Bergwalds wiederholen (gespeichert 0 s und 1 Drehung: keine Meldung), «Weiter» ins Meer
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Übersicht', 10);
  await sleep(500);
  await tippe(kachel(0, 9), 'Kachel Bergwald 10');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 9 && !${D}.story.running`,
    'Bergwald 10 wiederholen', 30);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Bergwald 10 gelöst', 30);
  await sleep(700);
  f = await geloestFeld();
  pruefe(f.msg === 'Der Wald leuchtet' && f.knopf === 'Weiter zum Meer' && f.best === '' && f.zahlen === 0,
    `Bergwald 10 wiederholt ${JSON.stringify(f)}`);
  await messe();
  await tippe('#btn-next', 'Weiter zum Meer');
  await until(`window.__prisma.playing() && ${D}.story.step === 10 && !${D}.story.running`, 'Meer 1 (Wiederholen)', 30);
  await sleep(1500);
  log = await ende('Wiederholen: Weiter über die Weltgrenze');
  ohneZwischenszene(log, 'Weiter ins Meer');
  const blick = Math.max(...log.map((e) => e.gaze)), sinkt = log.find((e) => e.flow === 'out');
  pruefe(blick < 0.01, `Weiter ins Meer: der Blick hob sich (${blick})`);
  pruefe(sinkt?.sky === 'beach' && sinkt.settled, `Weiter ins Meer: das Level versinkt, bevor der Himmel geladen ist `
    + `(${JSON.stringify(sinkt)})`);
  const danach = await ev(`({ replay: ${D}.story.replay, blend: ${D}.story.blend, sky: ${D}.skyTheme.current,
    quiet: ${D}.skyTheme.quiet, fade: ${D}.skyTheme.fadeTime })`);
  pruefe(danach.replay && danach.blend === null && danach.sky === 'beach' && !danach.quiet && danach.fade === 0.9
    && (await stand('mittel'))?.platz === 13, `nach dem Wechsel ins Meer ${JSON.stringify(danach)}`);
  await kopfzeile('mittel', 10);
  await bild('uebersicht-wiederholen-meer');

  // Meer 3 wiederholen, «Weiter» zum ersten ungelösten (Meer 4): wieder der normale Ablauf, der Platz wächst
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Übersicht', 10);
  await sleep(500);
  await tippe(kachel(1, 2), 'Kachel Meer 3');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 12 && !${D}.story.running`,
    'Meer 3 wiederholen', 30);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Meer 3 gelöst', 30);
  await tippe('#btn-next', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.step === 13`, 'Meer 4 (normal)', 30);
  pruefe(await ev(`${D}.story.replay`) === false, 'Meer 4: noch im Wiederholen');
  await kopfzeile('mittel', 13);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Meer 4 gelöst', 30);
  await sleep(700);
  f = await geloestFeld();
  b = (await besteWerte('mittel'))?.[m[1][3]];
  pruefe(f.best === '' && b && Number.isInteger(b.zeit) && b.drehungen > 0,
    `Meer 4 zum ersten Mal gelöst: Meldung «${f.best}», Bestwerte ${JSON.stringify(b)}`);
  await tippe('#btn-next', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.step === 14`, 'Meer 5', 30);
  const sm = await stand('mittel');
  pruefe(sm?.platz === 14 && sm.geloest.length === 14, `Stand nach Meer 4 ${JSON.stringify(sm)}`);

  // Menü: der geschaffte Grad zeigt «Übersicht» (auch auf dem Handy quer) und öffnet sie
  await tippe('#btn-menu', 'Menü');
  await until(`${menueOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Menü', 10);
  await sleep(1200);
  const aktion = await ev(`(() => { const a = document.querySelector('${karte('leicht')} .menue-aktion'),
    r = a.getBoundingClientRect(); return { text: a.textContent, sichtbar: r.width > 0 && r.right <= innerWidth
      && r.bottom <= innerHeight && getComputedStyle(a).display !== 'none' }; })()`);
  pruefe(aktion.text === 'Übersicht' && aktion.sichtbar, `Aktion der Karte Leicht ${JSON.stringify(aktion)}`);
  await bild('uebersicht-menue');
  await messe();
  await tippe(karte('leicht'), 'Karte Leicht');
  await until(`${uebOffen} && !${menueOffen}`, 'Übersicht aus dem Menü', 10);
  await sleep(1200);
  await ende('Menü → Übersicht');
  await bild('uebersicht-aus-dem-menue');
  u = await uebStand();
  pruefe(u.geloest === 60 && u.offen === 0 && u.gesperrt === 0 && u.geschafft && u.aktuell === null
    && u.kopf.includes('Geschafft') && u.kopf.includes('49:30'), `Übersicht Leicht ${JSON.stringify(u)}`);
  if (view.phone) { // Blättern: Station, Pfeil, Wischen
    await tippe(`${UEB} .ueb-tab[data-reihe="5"]`, 'Station Sterne');
    await sleep(500);
    const s1 = (await uebStand()).seite;
    await tippe(`${UEB} .ueb-schritt[data-schritt="-1"]`, 'Pfeil links');
    await sleep(500);
    const s2 = (await uebStand()).seite;
    await wische(-170);
    const s3 = (await uebStand()).seite;
    pruefe(s1.startsWith('Sterne') && s2.startsWith('Planeten') && s3.startsWith('Sterne'),
      `Blättern: ${s1} → ${s2} → ${s3}`);
    await bild('uebersicht-sterne');
  }
  await messe();
  await uebersichtZu();
  await until(`!${uebOffen} && ${menueOffen}`, 'zurück im Menü', 10);
  await sleep(1200);
  await ende('Übersicht → Menü');
  pruefe(await ev('document.activeElement?.dataset?.menueFokus') === 'wahl:leicht', 'Fokus nach der Übersicht');

  // Kachel im geschafften Grad: Wiederholen aus dem Menü (das Brett von Mittel versinkt), bis zum letzten Level
  await tippe(karte('leicht'), 'Karte Leicht');
  await until(`${uebOffen}`, 'Übersicht aus dem Menü', 10);
  await sleep(600);
  if (view.phone) await tippe(`${UEB} .ueb-tab[data-reihe="5"]`, 'Station Sterne');
  await messe();
  await tippe(kachel(5, 8), 'Kachel Sterne 9');
  await until(`window.__prisma.playing() && ${D}.story.grade === 'leicht' && ${D}.story.step === 58 && `
    + `${D}.story.gaze === 0 && !${D}.story.running`, 'Leicht, Sterne 9', 30);
  log = await ende('Übersicht (Menü) → Wiederholen im geschafften Grad');
  ohneZwischenszene(log, 'Wiederholen Sterne 9');
  ohneLeeresBrett(log, 'milky', 'Wiederholen Sterne 9');
  pruefe(await ev("localStorage.getItem('prisma.noa.zuletzt')") === 'mittel' && await ev(`${D}.story.replay`),
    'Wiederholen im geschafften Grad: zuletzt gespielt geändert oder nicht im Wiederholen');
  await kopfzeile('leicht', 58);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Sterne 9 gelöst', 30);
  await tippe('#btn-next', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.step === 59`, 'Sterne 10', 30);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Sterne 10 gelöst', 30);
  await sleep(700);
  f = await geloestFeld();
  pruefe(f.msg === 'Der Wagen ist wach' && f.knopf === 'Zur Übersicht',
    `letztes Level im Wiederholen ${JSON.stringify(f)}`);
  await bild('uebersicht-zur-uebersicht');
  await messe();
  await tippe('#btn-next', 'Zur Übersicht');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht nach dem letzten Level',
    10);
  await sleep(800);
  await ende('letztes Level → Übersicht');
  u = await uebStand();
  pruefe(JSON.stringify(u.aktuell) === '[5,9]' && u.geschafft && (!view.phone || u.seite.startsWith('Sterne')),
    `Übersicht nach dem letzten Level ${JSON.stringify(u)}`);
  await bild('uebersicht-nach-dem-letzten');
  await uebersichtZu();
  await until(`!${uebOffen} && ${D}.story.gaze === 0 && !${D}.story.running`, 'zurück im letzten Level', 10);
  await sleep(500);
  f = await geloestFeld();
  const sl = await stand('leicht'), fokus = await ev('document.activeElement?.id ?? null');
  // gelöst: der Fokus auf «Weiter» (hier «Zur Übersicht»), damit Enter weiterführt
  pruefe(await ev('window.__prisma.solvedPanel()') && f.knopf === 'Zur Übersicht' && sl?.geschafft
    && await ev("localStorage.getItem('prisma.noa.zuletzt')") === 'mittel' && (view.phone || fokus === 'btn-next'),
  `zurück im letzten Level ${JSON.stringify({ f, sl, fokus })}`);

  // «Von vorn» für Leicht: der Stand geht, die Bestwerte bleiben (Entscheid 27); gesperrte Kacheln ohne Werte
  const bestVorher = await besteWerte('leicht');
  await tippe('#btn-menu', 'Menü');
  await until(`${menueOffen} && ${D}.story.gaze === 1`, 'Menü', 10);
  await sleep(1000);
  await tippe('#menue [data-menue-fokus="vonvorn:leicht"]', 'Von vorn Leicht');
  await until("!document.querySelector('#menue .menue-frage').hidden", 'Rückfrage', 5);
  await sleep(500);
  await tippe('#menue [data-menue-frage="ja"]', 'Von vorn bestätigen');
  await sleep(600);
  const vv = await ev(`(() => { const d = ${D}.story.overviewData('leicht'), lv = d.welten.flatMap((w) => w.level);
    return { stand: localStorage.getItem('prisma.noa.leicht'), karte: document.querySelector('${karte('leicht')}'
      + ' .menue-stand').textContent, werte: lv.filter((x) => x.bestzeit !== null || x.drehungen !== null).length,
      geloest: lv.filter((x) => x.geloest).length }; })()`);
  pruefe(vv.stand === null && vv.karte === 'noch nicht begonnen' && vv.werte === 0 && vv.geloest === 0
    && JSON.stringify(await besteWerte('leicht')) === JSON.stringify(bestVorher),
  `«Von vorn» Leicht ${JSON.stringify(vv)}`);

  if (view.phone) return;
  // Desktop: nach dem Wiederholen ein ungelöstes Level in der nächsten Welt: mit Reise, danach wächst der Platz
  await laden({ 'prisma.noa.zuletzt': 'schwer', 'prisma.noa.schwer': standBis('schwer', 10, 1) });
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 10`, 'Schwer, Meer 1', 30);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Übersicht', 10);
  await tippe(kachel(0, 9), 'Kachel Bergwald 10');
  await until(`window.__prisma.playing() && ${D}.story.step === 9 && ${D}.story.gaze === 0 && !${D}.story.running`,
    'Schwer, Bergwald 10 wiederholen', 30);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Bergwald 10 gelöst', 30);
  await tippe('#btn-next', 'Weiter zum Meer');
  await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
    + "'Kapitel 2 · Das Meer'", 'Reise ins Meer nach dem Wiederholen', 60);
  await until(`window.__prisma.playing() && ${D}.story.step === 10 && !${D}.story.running`, 'Schwer, Meer 1', 60);
  pruefe(await ev(`${D}.story.replay`) === false && (await stand('schwer'))?.platz === 10, 'nach der Reise: Stand');
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Meer 1 gelöst', 30);
  await tippe('#btn-next', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.step === 11`, 'Schwer, Meer 2', 30);
  const ss = await stand('schwer');
  pruefe(ss?.platz === 11 && ss.geloest.length === 11, `Schwer nach der Reise ${JSON.stringify(ss)}`);
}

/* ---------- Kapitel «Im Dorf» und überspringbare Einstiege (Ticket 07) ---------- */

let uebungen = null; // Namen der Übungen (LEVELS[0 … TUTORIAL_COUNT − 1])
const SKIP = '#btn-skip';
const skipSichtbar = () => ev(`!document.getElementById('btn-skip').classList.contains('hidden')`);
const kicker = () => ev("document.querySelector('#story .caption .kicker').textContent");
/** Wie oft im Log einer Messung ein Level zu wachsen begann (Zustand wechselt zu «in»). */
const wachsen = (log) => log.filter((e, i) => i > 0 && e.flow === 'in' && log[i - 1].flow !== 'in').length;
/**
 * Überdeckt «Überspringen» etwas: Text der Kopfzeile (je Zeile, nicht die ganze Breite des Blocks), «Gelöst» mit Knopf,
 * die Knöpfe unten? Zurück die Namen der überdeckten Teile.
 */
const skipUeberdeckt = () => ev(`(() => { const s = document.getElementById('btn-skip').getBoundingClientRect();
  const schnitt = (r) => r.width > 0 && r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top;
  const text = (e) => { const g = document.createRange(); g.selectNodeContents(e); return [...g.getClientRects()]; };
  const teile = [['Titel', '#hud .title', text], ['Ziele', '#hud .goal', text], ['Unterzeile', '#hud .sub', text],
    ['Gelöst', '#solved .msg', text], ['Bestmarke', '#solved > .best', text], ['Weiter', '#btn-next', (e) => [e.getBoundingClientRect()]],
    ['Knöpfe', '#controls', (e) => [e.getBoundingClientRect()]]];
  return teile.filter(([, sel, rects]) => { const e = document.querySelector(sel);
    return e && !e.closest('.hidden') && rects(e).some(schnitt); }).map(([n]) => n); })()`);

/** Eine Übung im Dorf: warten, bis sie läuft, Kopfzeile prüfen, lösen, «Gelöst» prüfen, Weiter. */
async function uebung(g, n, { bilder = false, weiter = true, replay = false } = {}) {
  await until(`${D}.story.inDorf && ${D}.story.uebung === ${n} && window.__prisma.playing()`,
    `${g}: Übung ${n + 1} läuft`, 60);
  const k = await ev(`({ titel: document.getElementById('hud-title').textContent,
    sub: document.getElementById('hud-sub').textContent,
    hinweis: document.querySelector('#hud-sub .hinweis')?.textContent ?? null, index: ${D}.game.levelIndex,
    uebersicht: !document.getElementById('btn-overview').hidden,
    skip: !document.getElementById('btn-skip').classList.contains('hidden') })`);
  pruefe(k.titel === `Im Dorf – ${uebungen[n]}` && k.index === n, `${g}, Übung ${n + 1}: Titel «${k.titel}»`);
  pruefe(k.sub.startsWith(`${GRAD_TEXT[g]} · Übung ${n + 1} / 9`) && k.hinweis?.length > 10
    && !/[{}]/.test(k.hinweis), `${g}, Übung ${n + 1}: Unterzeile «${k.sub}»`);
  // «Dorf überspringen»: nicht beim Wiederholen nach dem Kapitel, nach einem Einstieg erst nach einer Pause
  const skipText = !replay ? await warteSkip(true) : null;
  pruefe(k.uebersicht && (replay ? !k.skip : skipText === 'Dorf überspringen'),
    `${g}, Übung ${n + 1}: Knöpfe Übersicht ${k.uebersicht}, Überspringen ${k.skip} «${skipText}»`);
  if (bilder) { await sleep(2200); await bild(`dorf-${slug(g)}-uebung-${n + 1}`); }
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', `${g}: Übung ${n + 1} gelöst`, 30);
  const f = await geloestFeld();
  const erwartet = n < 8 ? 'Gelöst/Weiter' : `Das Dorf leuchtet/${replay ? 'Zur Übersicht' : 'In den Bergwald'}`;
  pruefe(`${f.msg}/${f.knopf}` === erwartet, `${g}, Übung ${n + 1}: «Gelöst» ${f.msg}/${f.knopf}`);
  if (!replay) {
    const ueber = await skipUeberdeckt();
    pruefe(!ueber.length, `${g}, Übung ${n + 1}: «Überspringen» überdeckt ${ueber.join(', ')}`);
  }
  if (bilder) { await sleep(600); await bild(`dorf-${slug(g)}-uebung-${n + 1}-geloest`); }
  if (weiter) await tippe('#btn-next', 'Weiter');
}
/** Prolog überspringen (Desktop: Esc, sonst der Knopf der Bühne). */
async function prologWeg(g, { esc = false } = {}) {
  await until(`${storyMode} === 'scene' && ${D}.story.scene.skip.hidden === false`, `${g}: Prolog`, 30);
  await sleep(1200);
  if (esc) await taste('Escape');
  else await tippe('#story .scene .skip', 'Überspringen');
}
/** Grösste Drehung der Kamera zwischen zwei Bildern im Log einer Messung (Grad). */
const drehung = (log) => Math.max(0, ...log.slice(1).map((e, i) => {
  const a = log[i].blick, b = e.blick, p = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.min(1, p / Math.hypot(...a) / Math.hypot(...b))) * 180 / Math.PI;
}));
/** Warten, bis «Überspringen» zu sehen ist (bzw. nicht), höchstens 4 s; zurück seine Beschriftung oder null. */
async function warteSkip(sichtbar) {
  for (let i = 0; i < 40 && (await skipSichtbar()) !== sichtbar; i++) await sleep(100);
  return (await skipSichtbar()) ? ev("document.getElementById('btn-skip').textContent") : null;
}
/** Einstieg überspringen (esc: mit der Taste, sonst der Knopf) und prüfen: Level steht, Untertitel zu, Moment gesehen. */
async function einstiegWeg(g, was, moment, { esc = false, sky } = {}) {
  await messe();
  const vorher = await ev(`({ skyBereit: ${D}.skyTheme.ready, fall: ${D}.story.flare.scale.x < 4.9 })`);
  if (esc) await taste('Escape');
  else await tippe(SKIP, 'Überspringen');
  // während der Landung, bis das Level wächst, kein «Überspringen» (es meinte im Dorf schon das Kapitel)
  await sleep(100);
  await ev(`window.__skipLandung = false; (function schau() { if (['in', 'play'].includes(${D}.flow.state)) return;
    if (!document.getElementById('btn-skip').classList.contains('hidden')) window.__skipLandung = true;
    requestAnimationFrame(schau); })(); true`);
  await until(`window.__prisma.playing() && !${D}.story.running`, `${g}: ${was}: Level steht`, 40);
  pruefe(!(await ev('window.__skipLandung')), `${g}: ${was}: «Überspringen» während der Landung zu sehen`);
  // der Knopf ist weg, der Untertitel zu: der Fokus liegt auf dem Spielfeld, nicht auf body (Ticket 08)
  const fokus = await ev('document.activeElement?.tagName');
  pruefe(esc || fokus === 'CANVAS', `${g}: ${was}: Fokus nach «Überspringen» auf ${fokus}`);
  await sleep(1200);
  const log = await ende(`${g}: ${was} übersprungen`);
  const n = wachsen(log);
  pruefe(n === 1, `${g}: ${was} übersprungen: ${n}× enterLevel`);
  const s = await stand(g), skip = await warteSkip(moment === 'dorf');
  // danach: im Dorf «Dorf überspringen» (nach der Pause), in einer Welt keines
  pruefe((await ev(storyMode)) === false && s.gesehen.includes(moment)
    && skip === (moment === 'dorf' ? 'Dorf überspringen' : null),
    `${g}: ${was} übersprungen: Untertitel ${await ev(storyMode)}, gesehen ${s.gesehen}, Überspringen ${skip}`);
  const grad = drehung(log);
  pruefe(grad <= 5, `${g}: ${was} übersprungen: Kamera dreht ${grad.toFixed(1)}° in einem Bild`);
  console.log(`  ${was} übersprungen: grösste Drehung je Bild ${grad.toFixed(1)}°`);
  if (sky) ohneLeeresBrett(log, sky, `${g}: ${was} übersprungen`);
  console.log(`  ${was} übersprungen: Himmel bereit ${vorher.skyBereit}, im Fall ${vorher.fall}`);
}

/**
 * Kapitel «Im Dorf» (Ticket 07, Entscheide 3, 10, 18, 28; Plan Punkt 7), je auf einem neuen Grad:
 * Leicht: Prolog mit dem Knopf übersprungen → Angebot (Kicker, Text, Fokus auf «Üben») → «Üben» → Einstieg ins Dorf
 * (Milchstrasse, gesehen prolog, angebot, dorf, ohne wald) → drei Übungen (Kopfzeile, Hinweis, «Gelöst», dorf.platz) →
 * Neuladen: Menü «Dorf · 0 / 60», «Weiter» → Übung 4 ohne Prolog, Angebot und Einstieg → Menü und zurück in dieselbe
 * Übung → Übersicht im Dorf (Reihe «Im Dorf», laufende Übung) → «Überspringen» mitten in der Übung → Satz zum Ende →
 * Glühwürmchen in den Bergwald (dorf.ende uebersprungen) → Übersicht: übrige Übungen frei.
 * Mittel: Einstieg ins Dorf während des Flugs übersprungen, «Überspringen» während die nächste Übung wächst, dann den
 * Einstieg in den Bergwald während des Falls.
 * Schwer: «Gleich los» (Desktop: Tab und Enter), den Einstieg in den Bergwald gleich zu Beginn übersprungen (Himmel lädt
 * evtl. noch: kein leeres Brett); kein dorf im Stand, Übersicht ohne Dorf.
 * Sehr schwer: alle 9 Übungen bis zum Ende → Bergwald (dorf.ende gespielt), dann aus der Übersicht Übung 8 wiederholen
 * → 9 → «Zur Übersicht». Dazu die Bildzeiten; auf dem Handy quer, ob «Überspringen» etwas überdeckt.
 * Dazu (Review): ein Stand mitten im Dorf, «Überspringen» gleich nach dem Lösen (kein «Gelöst» über dem Satz zum Ende),
 * und ein Neuladen, während das Angebot steht (danach nur noch das Angebot).
 */
async function dorfAblauf() {
  console.log(`${view.name}: Im Dorf`);
  uebungen = await ev('LEVELS.slice(0, TUTORIAL_COUNT).map((l) => l.name)');
  pruefe(uebungen.length === 9, `Übungen: ${uebungen.length}`);

  // Leicht: Üben, drei Übungen, Neuladen, Menü, Übersicht, Überspringen mitten in der Übung
  await laden();
  await messe();
  await tippe(karte('leicht'), 'Karte Leicht');
  await prologWeg('leicht');
  await sleep(400);
  await ende('Leicht: Menü → Prolog → Überspringen');
  // solange das Angebot steht, lädt der Wald fertig (quiet aus): keine Lücke über 100 ms, er ist danach bereit
  await messe();
  await until(`document.querySelectorAll('${ANGEBOT}').length === 2`, 'Leicht: Angebot', 60);
  await sleep(4000);
  await ende('Leicht: Angebot steht, der Wald lädt fertig');
  console.log(`  Wald nach 4 s Angebot bereit: ${await ev(`${D}.skyTheme.ready`)}`);
  await angebot('leicht', 'Üben', { name: 'dorf-angebot', mitTaste: !view.phone });
  await messe();
  await until(`${storyMode} === 'caption'`, 'Leicht: Einstieg ins Dorf', 30);
  pruefe(await kicker() === 'Im Dorf · Erstes Licht' && await ev(`${D}.skyTheme.current`) === 'village',
    `Leicht: Einstieg ins Dorf «${await kicker()}», Himmel ${await ev(`${D}.skyTheme.current`)}`);
  await sleep(1500);
  await bild('dorf-einstieg');
  pruefe(await skipSichtbar(), 'Leicht: «Überspringen» fehlt im Einstieg ins Dorf');
  await until(`window.__prisma.playing() && ${D}.story.inDorf`, 'Leicht: Übung 1', 40);
  await sleep(800);
  const log = await ende('Leicht: Üben → Einstieg ins Dorf → Übung 1');
  // Tempo (Review G1): nach übersprungenem Prolog läuft der Einstieg nicht im Zeitraffer, der Satz steht gut 5 s
  const satz = log.filter((e) => e.story === 'caption'), dauer = satz.length ? satz.at(-1).ts - satz[0].ts : 0;
  pruefe(dauer > 4000, `Leicht: Satz zum Einstieg ins Dorf nur ${Math.round(dauer)} ms zu sehen`);
  console.log(`  Satz zum Einstieg ins Dorf ${Math.round(dauer)} ms`);
  pruefe(!log.some((e) => e.traeger), 'Leicht: Einstieg ins Dorf mit Träger');
  let s = await stand('leicht');
  pruefe(s.gesehen.join() === 'prolog,angebot,dorf' && JSON.stringify(s.dorf) === '{"platz":0,"ende":null}',
    `Leicht nach dem Einstieg ins Dorf ${JSON.stringify(s)}`);
  for (let n = 0; n < 3; n++) await uebung('leicht', n, { bilder: n === 1 });
  await until(`${D}.story.uebung === 3 && window.__prisma.playing()`, 'Leicht: Übung 4', 30);
  s = await stand('leicht');
  pruefe(s.dorf?.platz === 3 && s.platz === 0 && s.geloest.join() === uebungen.slice(0, 3).join(),
    `Leicht nach drei Übungen ${JSON.stringify(s)}`);

  // Neuladen: «Weiter» führt in Übung 4, ohne Prolog, Angebot und Einstieg
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  await geste();
  const wohin = await ev("document.querySelector('#menue .menue-wohin').textContent");
  const karteStand = await ev(`document.querySelector('${karte('leicht')} .menue-stand').textContent`);
  pruefe(wohin === 'Leicht · Dorf 0 / 60', `Leicht nach dem Neuladen: Weiter «${wohin}», Karte «${karteStand}»`);
  pruefe(await ev(`${D}.skyTheme.current`) === 'village', 'Leicht: Himmel hinter dem Menü nicht der des Dorfs');
  await messe();
  await tippe('#menue .menue-weiter', 'Weiter');
  let zwischen = false;
  for (let i = 0; i < 300 && !(await ev('window.__prisma.playing()')); i++) {
    if (await ev(`${storyMode} === 'caption' || ${storyMode} === 'scene'`)) zwischen = true;
    await sleep(100);
  }
  await sleep(600);
  await ende('Leicht: Weiter → Übung 4');
  pruefe(!zwischen, 'Leicht: nach dem Neuladen Prolog, Angebot oder Einstieg');
  // Menü mitten in der Übung und zurück: dieselbe Übung
  await uebungLaeuft(3);
  if (view.phone) await tippe('#btn-menu', 'Menü');
  else await taste('Escape');
  await until(`${menueOffen} && !${D}.story.tweens.length`, 'Leicht: Menü aus der Übung', 10);
  pruefe(!(await skipSichtbar()), 'Leicht: «Überspringen» unter dem Menü');
  if (view.phone) await tippe('#menue .menue-weiter', 'Weiter');
  else await taste('Escape');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && !${D}.story.running`, 'Leicht: zurück', 15);
  await uebungLaeuft(3);
  // Übersicht im Dorf: Reihe «Im Dorf» mit der laufenden Übung
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Leicht: Übersicht im Dorf', 10);
  const u = await uebStand();
  const dorfReihe = await ev(`(() => { const r = document.querySelector('${UEB} .ueb-welt[data-reihe="0"]');
    return { kacheln: r?.querySelectorAll('.ueb-kachel').length ?? 0, frei: r?.querySelectorAll('.ueb-frei').length,
      name: r?.textContent.includes('Im Dorf') }; })()`);
  pruefe(dorfReihe.kacheln === 9 && dorfReihe.name && u.geloest === 3 && u.offen === 2
    && JSON.stringify(u.aktuell) === '[0,3]', `Leicht: Übersicht im Dorf ${JSON.stringify({ ...u, dorfReihe })}`);
  await sleep(700);
  await bild('dorf-uebersicht');
  await uebersichtZu();
  await until(`!${uebOffen} && window.__prisma.playing() && !${D}.story.running`, 'Leicht: Übersicht zu', 15);
  await uebungLaeuft(3);
  // Überspringen mitten in der Übung: Satz zum Ende, dann die Glühwürmchen in den Bergwald
  await messe();
  await tippe(SKIP, 'Überspringen');
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'Leicht: Ende des Dorfs', 20);
  const ende1 = await ev("document.querySelector('#story .caption .text').textContent");
  s = await stand('leicht');
  pruefe(await kicker() === 'Im Dorf' && ende1.startsWith('Jetzt weiss Noa') && s.dorf?.ende === 'uebersprungen'
    && !(await skipSichtbar()), `Leicht: Ende des Dorfs «${ende1}», ${JSON.stringify(s.dorf)}`);
  await sleep(900);
  await bild('dorf-ende');
  await ende('Leicht: Überspringen → Satz zum Ende');
  await messe();
  await tippe('#story .caption .text', 'Untertitel');
  await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
    + "'Kapitel 1 · Der Bergwald'", 'Leicht: Einstieg in den Bergwald', 30);
  pruefe(await skipSichtbar(), 'Leicht: «Überspringen» fehlt im Einstieg in den Bergwald');
  await sleep(1200);
  await bild('dorf-wald');
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'Leicht: Bergwald 1', 40);
  await ende('Leicht: Satz zum Ende → Bergwald 1');
  await kopfzeile('leicht', 0);
  s = await stand('leicht');
  pruefe(s.gesehen.join() === 'prolog,angebot,dorf,wald' && !(await skipSichtbar()) && !(await ev(`${D}.story.inDorf`)),
    `Leicht im Bergwald ${JSON.stringify(s)}`);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Leicht: Übersicht im Bergwald', 10);
  const frei = await ev(`document.querySelectorAll('${UEB} .ueb-welt[data-reihe="0"] .ueb-frei').length`);
  pruefe(frei === 6, `Leicht: nach «Überspringen» ${frei} freie Übungen statt 6`);
  await sleep(700);
  await bild('dorf-uebersicht-frei');
  await uebersichtZu();
  await until(`!${uebOffen} && window.__prisma.playing() && !${D}.story.running`, 'Leicht: Übersicht zu', 15);

  // Mittel: Einstieg ins Dorf im Flug überspringen, das Dorf während des Herauswachsens, den Bergwald im Fall
  await laden();
  await tippe(karte('mittel'), 'Karte Mittel');
  await prologWeg('mittel', { esc: !view.phone });
  await angebot('mittel', 'Üben');
  await until(`${D}.story.entering && ${D}.story.flare.visible && ${storyMode} === 'caption'`, 'Mittel: Flug', 30);
  await sleep(700);
  await einstiegWeg('mittel', 'Einstieg ins Dorf (Flug)', 'dorf', { esc: !view.phone });
  await uebungLaeuft(0);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', 'Mittel: Übung 1 gelöst', 30);
  await tippe('#btn-next', 'Weiter');
  await until(`${D}.flow.state === 'in'`, 'Mittel: Übung 2 wächst', 10);
  await messe();
  await tippe(SKIP, 'Überspringen');
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'Mittel: Ende des Dorfs', 20);
  await ende('Mittel: Überspringen beim Herauswachsen → Satz zum Ende');
  pruefe((await stand('mittel')).dorf?.ende === 'uebersprungen', 'Mittel: dorf.ende');
  await tippe('#story .caption .text', 'Untertitel');
  await until(`${D}.story.entering && ${D}.story.flare.scale.x < 4.9`, 'Mittel: Fall in den Bergwald', 30);
  await einstiegWeg('mittel', 'Einstieg in den Bergwald (Fall)', 'wald', { esc: !view.phone });
  await kopfzeile('mittel', 0);

  // Schwer: «Gleich los», Einstieg gleich zu Beginn überspringen
  await laden();
  await tippe(karte('schwer'), 'Karte Schwer');
  await prologWeg('schwer');
  await angebot('schwer', 'Gleich los', { mitTaste: !view.phone });
  await until(`${D}.story.entering`, 'Schwer: Einstieg beginnt', 30);
  await until("!document.getElementById('btn-skip').classList.contains('hidden')", 'Schwer: «Überspringen»', 5);
  await einstiegWeg('schwer', 'Einstieg in den Bergwald (Beginn)', 'wald', { esc: !view.phone, sky: 'forest' });
  await kopfzeile('schwer', 0);
  s = await stand('schwer');
  const ohneDorf = await ev(`${D}.story.overviewData('schwer').dorf === undefined`);
  pruefe(s.dorf === undefined && s.gesehen.join() === 'prolog,angebot,wald' && ohneDorf,
    `Schwer nach «Gleich los» ${JSON.stringify(s)}`);

  // Sehr schwer: alle Übungen bis zum Ende, dann Übung 8 und 9 wiederholen
  const g = 'sehr schwer';
  await laden();
  await tippe(karte(g), 'Karte Sehr schwer');
  await prologWeg(g);
  await angebot(g, 'Üben');
  for (let n = 0; n < 9; n++) await uebung(g, n, { bilder: n === 8 });
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'Sehr schwer: Ende des Dorfs', 30);
  s = await stand(g);
  pruefe(s.dorf?.ende === 'gespielt' && s.geloest.length === 9, `Sehr schwer nach dem Dorf ${JSON.stringify(s)}`);
  await tippe('#story .caption .text', 'Untertitel');
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'Sehr schwer: Bergwald 1',
    60);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Sehr schwer: Übersicht', 10);
  if (view.phone) { // eine Welt je Seite, offen ist der Bergwald: zur Station des Dorfs blättern
    await tippe(`${UEB} .ueb-tab[data-reihe="0"]`, 'Station Dorf');
    await sleep(700);
  }
  await messe();
  await tippe(kachel(0, 7), 'Kachel Übung 8');
  await uebung(g, 7, { replay: true });
  await ende('Sehr schwer: Übersicht → Übung 8 wiederholen → Übung 9');
  await uebung(g, 8, { replay: true, weiter: false });
  await tippe('#btn-next', 'Zur Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Sehr schwer: Übersicht nach Übung 9', 10);
  pruefe(JSON.stringify((await uebStand()).aktuell) === '[0,8]' && (await stand(g)).platz === 0,
    'Sehr schwer: Übersicht nach dem Wiederholen');
  await uebersichtZu();

  // Review: ein Stand mitten im Dorf (Übung 3) aus der Karte, «Überspringen» gleich nach dem Lösen (die Feier läuft
  // noch): «Gelöst» kommt nicht mehr über den Satz zum Ende. Ein älterer Stand mit Prolog ohne Angebot: nur das Angebot
  await laden({ 'prisma.noa.leicht': { platz: 0, geloest: uebungen.slice(0, 2), gesehen: ['prolog', 'angebot', 'dorf'],
    geschafft: false, dorf: { platz: 2, ende: null } } });
  await tippe(karte('leicht'), 'Karte Leicht');
  await uebungLaeuft(2);
  await ev(`${D}.loese()`);
  await until(`window.__prisma.celebrating() && !window.__prisma.solvedPanel()`, 'Leicht: Übung 3 feiert', 10);
  // je Bild: erscheint «Gelöst» nach dem Überspringen? (nur kurz, beim Versinken nimmt changeLevel es weg)
  await ev(`window.__geloestDanach = false; window.__schau = performance.now() + 4000; (function schau() {
    if (window.__prisma.solvedPanel() && !window.__prismaDebug.story.inDorf) window.__geloestDanach = true;
    if (performance.now() < window.__schau) requestAnimationFrame(schau); })(); true`);
  const feier = await ev(`${D}.celebration.active && !${D}.celebration.panelShown`);
  await tippe(SKIP, 'Überspringen');
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'Leicht: Ende des Dorfs (Feier)', 20);
  await sleep(2500);
  pruefe(feier && !(await ev('window.__geloestDanach')) && (await stand('leicht')).dorf?.ende === 'uebersprungen',
    `Leicht: «Gelöst» nach «Überspringen» in der Feier (Feier ohne «Gelöst» beim Tippen: ${feier})`);
  // Neuladen, während das Angebot steht: danach ohne Prolog nur das Angebot
  await laden();
  await tippe(karte('mittel'), 'Karte Mittel');
  await prologWeg('mittel');
  await until(`document.querySelectorAll('${ANGEBOT}').length === 2`, 'Mittel: Angebot', 60);
  pruefe((await stand('mittel'))?.gesehen.join() === 'prolog', 'Mittel: Prolog gesehen, sobald das Angebot steht');
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  await geste();
  await tippe(karte('mittel'), 'Karte Mittel');
  await until(`${storyMode} === 'scene'`, 'Mittel nach dem Neuladen: Bühne', 30);
  pruefe(await ev(`${D}.story.scene.skip.hidden`), 'Mittel nach dem Neuladen: Prolog statt nur des Angebots');
  await angebot('mittel nach dem Neuladen', 'Gleich los');
  await until(`${D}.story.entering`, 'Mittel nach dem Neuladen: Einstieg in den Bergwald', 30);
  pruefe((await stand('mittel')).gesehen.join() === 'prolog,angebot', 'Mittel nach dem Neuladen: gesehen');
}
/**
 * Randfälle des Kapitels «Im Dorf» (Review Ticket 07, je mit vorbereitetem Stand):
 * a) eine frühere Übung wiederholen, während das Kapitel läuft: bis zur ersten ungelösten, dann normal (dorf.platz
 *    wächst wieder); b) Bergwald 1 aus der Übersicht mitten im Dorf: ohne Satz zum Ende in den Bergwald,
 *    dorf.ende uebersprungen; c) Neuladen während des Einstiegs ins Dorf: «Weiter» bringt den Einstieg wieder, ohne
 *    Prolog und Angebot; e) «Überspringen», während die Übung nach «Weiter» versinkt: die nächste wächst nicht, Satz zum
 *    Ende, Bergwald; d) einen Einstieg überspringen, während er auf das Versinken des alten Bretts wartet (sunk
 *    künstlich verzögert): Er landet erst danach, genau ein Level wächst; d2) ebenso im Flug ins Dorf: «Dorf
 *    überspringen» erst 2 s nach dem Herauswachsen, nicht während des Wartens.
 */
async function dorfRaender() {
  console.log(`${view.name}: Im Dorf, Randfälle`);
  uebungen = await ev('LEVELS.slice(0, TUTORIAL_COUNT).map((l) => l.name)');
  const imDorf = (platz, geloest) => ({ platz: 0, geloest: uebungen.slice(0, geloest),
    gesehen: ['prolog', 'angebot', 'dorf'], geschafft: false, dorf: { platz, ende: null } });
  const zurDorfReihe = async (r) => { // Handy: eine Welt je Seite
    if (!view.phone) return;
    await tippe(`${UEB} .ueb-tab[data-reihe="${r}"]`, `Station ${r}`);
    await sleep(700);
  };

  // a) Übung 2 wiederholen, während das Kapitel bei Übung 4 steht
  await laden({ 'prisma.noa.leicht': imDorf(3, 3) });
  await tippe(karte('leicht'), 'Karte Leicht');
  await uebungLaeuft(3);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'a: Übersicht', 10);
  await zurDorfReihe(0);
  await tippe(kachel(0, 1), 'Kachel Übung 2');
  await uebung('leicht', 1);
  await uebung('leicht', 2);
  await uebungLaeuft(3);
  let s = await stand('leicht');
  pruefe(await ev(`${D}.story.replay`) === false && s.dorf?.platz === 3, `a: zurück im Ablauf ${JSON.stringify(s)}`);
  await uebung('leicht', 3);
  await uebungLaeuft(4);
  s = await stand('leicht');
  pruefe(s.dorf?.platz === 4 && s.dorf.ende === null, `a: nach Übung 4 ${JSON.stringify(s.dorf)}`);

  // b) Bergwald 1 aus der Übersicht mitten im Dorf
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'b: Übersicht', 10);
  await zurDorfReihe(1);
  await ev(`window.__dorfSatz = false; (function schau() { if (document.querySelector('#story .caption .kicker')
    .textContent === 'Im Dorf' && ${storyMode} === 'caption') window.__dorfSatz = true;
    if (!window.__prisma.playing() || ${D}.story.inDorf) requestAnimationFrame(schau); })(); true`);
  await tippe(kachel(1, 0), 'Kachel Bergwald 1');
  await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
    + "'Kapitel 1 · Der Bergwald'", 'b: Einstieg in den Bergwald', 30);
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'b: Bergwald 1', 40);
  s = await stand('leicht');
  pruefe(s.dorf?.ende === 'uebersprungen' && s.gesehen.includes('wald') && !(await ev('window.__dorfSatz')),
    `b: Bergwald 1 aus der Übersicht ${JSON.stringify(s)}, Satz zum Ende ${await ev('window.__dorfSatz')}`);
  await kopfzeile('leicht', 0);

  // c) Neuladen während des Einstiegs ins Dorf
  await laden();
  await tippe(karte('schwer'), 'Karte Schwer');
  await prologWeg('schwer');
  await angebot('schwer', 'Üben');
  await until(`${storyMode} === 'caption' && ${D}.story.entering`, 'c: Einstieg ins Dorf', 30);
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'c: Menü nach dem Neuladen');
  await geste();
  s = await stand('schwer');
  pruefe(JSON.stringify(s.dorf) === '{"platz":0,"ende":null}' && s.gesehen.join() === 'prolog,angebot',
    `c: Stand im Einstieg ${JSON.stringify(s)}`);
  await tippe('#menue .menue-weiter', 'Weiter');
  let buehne = false;
  for (let i = 0; i < 300 && !(await ev(`${storyMode} === 'caption'`)); i++) {
    if (await ev(`${storyMode} === 'scene'`)) buehne = true;
    await sleep(100);
  }
  pruefe(!buehne && await kicker() === 'Im Dorf · Erstes Licht', `c: nach dem Neuladen «${await kicker()}», Bühne ${buehne}`);
  await uebung('schwer', 0, { weiter: false });

  // e) «Überspringen», während die Übung nach «Weiter» versinkt
  await messe();
  await tippe('#btn-next', 'Weiter');
  await until(`${D}.flow.state === 'out'`, 'e: Übung 1 versinkt', 10);
  await tippe(SKIP, 'Dorf überspringen');
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'e: Satz zum Ende', 20);
  await tippe('#story .caption .text', 'Untertitel');
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'e: Bergwald 1', 60);
  const logE = await ende('e: Überspringen beim Versinken → Bergwald 1');
  pruefe(wachsen(logE) === 1 && (await stand('schwer')).dorf?.ende === 'uebersprungen',
    `e: ${wachsen(logE)}× Herauswachsen, ${JSON.stringify((await stand('schwer')).dorf)}`);
  await kopfzeile('schwer', 0);

  // d) Einstieg überspringen, während er auf das Versinken wartet: Das alte Brett meldet «versunken» erst 12 s später
  if (view.phone) await tippe('#btn-menu', 'Menü');
  else await taste('Escape');
  await until(`${menueOffen} && !${D}.story.tweens.length`, 'd: Menü', 10);
  await ev(`(() => { const s = ${D}.story, alt = s.sunk; let einmal = false;
    s.sunk = function () { if (einmal) return; einmal = true;
      setTimeout(() => { s.sunk = alt; alt.call(s); }, 12000); }; })()`);
  await tippe(karte('mittel'), 'Karte Mittel');
  await prologWeg('mittel');
  await angebot('mittel', 'Gleich los');
  await until(`${D}.story.entering && ${D}.story.holdEnter && ${D}.story.flare.visible && !${D}.story.tweens.some(
    (t) => t.mark)`, 'd: Einstieg wartet aufs Versinken', 30);
  await einstiegWeg('mittel', 'Einstieg in den Bergwald (wartet aufs Versinken)', 'wald', { esc: !view.phone });
  await kopfzeile('mittel', 0);

  // d2) Einstieg ins Dorf im Flug überspringen, während das alte Brett noch nicht versunken ist: Die Landung wartet
  // darauf; «Dorf überspringen» kommt erst 2 s nach dem Herauswachsen, nicht schon während des Wartens (einstiegWeg)
  if (view.phone) await tippe('#btn-menu', 'Menü');
  else await taste('Escape');
  await until(`${menueOffen} && !${D}.story.tweens.length`, 'd2: Menü', 10);
  await ev(`(() => { const s = ${D}.story, alt = s.sunk; let einmal = false;
    s.sunk = function () { if (einmal) return; einmal = true;
      setTimeout(() => { s.sunk = alt; alt.call(s); }, 12000); }; })()`);
  await tippe(karte('sehr schwer'), 'Karte Sehr schwer');
  await prologWeg('sehr schwer');
  await angebot('sehr schwer', 'Üben');
  await until(`${D}.story.entering && ${D}.story.holdEnter && ${D}.story.tweens.some((t) => t.mark)`,
    'd2: Flug ins Dorf, das alte Brett wartet', 30);
  await einstiegWeg('sehr schwer', 'Einstieg ins Dorf (Flug, Landung wartet aufs Versinken)', 'dorf',
    { esc: !view.phone });
  await uebungLaeuft(0);
}
/** Die Übung n steht auf dem Brett und läuft. */
async function uebungLaeuft(n) {
  await until(`window.__prisma.playing() && !${D}.story.running`, `Übung ${n + 1} läuft`, 30);
  const r = await ev(`({ dorf: ${D}.story.inDorf, uebung: ${D}.story.uebung, index: ${D}.game.levelIndex })`);
  pruefe(r.dorf && r.uebung === n && r.index === n, `Übung ${n + 1} erwartet: ${JSON.stringify(r)}`);
}

/* ---------- Der Kleine Wagen (Spec .scratch/kleiner-wagen/, Ticket 01) ---------- */

/** Linien des Wagens nach der Spec («Der Wagen»), in der Reihenfolge, in der sie sich ziehen: [von, nach]. */
const WAGEN_LINIEN = [[1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 6], [6, 7]];
/**
 * Erwarteter Stand des Wagens mit n wachen Sternen (Stern 1 der Bergwald … 6 die Sterne; 7: ein geschaffter Grad, dazu
 * der Polarstern): wach 1 … n, je erwachtem Stern k ≥ 2 die Linie von k − 1, mit Stern 4 die Schale (4 → 1), 6 → 7
 * erst nach dem Finale; der nächste ist der erste schlafende.
 */
const wagenErwartet = (n) => ({ wach: Array.from({ length: n }, (_, i) => i + 1),
  linien: WAGEN_LINIEN.slice(0, [0, 0, 1, 2, 4, 5, 6, 7][n]), naechster: n < 7 ? n + 1 : null });
/** Stand des Wagens im Grad g, gelesen über das Objekt der Geschichte (keine eigene Schnittstelle), gegen n wache. */
async function pruefeWagen(g, n, was) {
  const ist = await ev(`${D}.story.wagenStand(${JSON.stringify(g)})`), soll = wagenErwartet(n);
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
    `Wagen ${was} (${g}): ${JSON.stringify(ist)} statt ${JSON.stringify(soll)}`);
}
/**
 * Was der Wagen am Himmel zeigt (Ticket 04 von .scratch/kleiner-wagen/), gelesen über das Objekt der Geschichte
 * (story.himmel.stand): n wache Sterne mit ihren Linien wie wagenErwartet, welt der Stern dieser Welt (1 … 6, null über
 * dem Dorf). Bis zum Erwachen beim Aufstieg (Ticket 05) zeigt er einen Stern erst nach der Reise wach.
 */
async function pruefeHimmel(n, welt, was) {
  const ist = await ev(`${D}.story.himmel.stand`), soll = wagenErwartet(n);
  pruefe(JSON.stringify(ist) === JSON.stringify({ wach: soll.wach, linien: soll.linien, welt }),
    `Wagen am Himmel ${was}: ${JSON.stringify(ist)} statt ${n} wach, Stern der Welt ${welt}`);
}
/**
 * Helligkeit des Wagens am Himmel nach der Tabelle der Spec («Der Wagen»; Review Ticket 04), gelesen aus den Uniforms,
 * sobald der Himmel steht: tag (Meer, Wüste) heisst keine Hintergrundsterne (stars.uFade 0), Nacht etwa 0,3 oder mehr.
 * Geweckte Sterne heller als der Polarstern, solange er nicht geantwortet hat (geschafft: alle gleich); der Stern
 * dieser Welt bei Tag heller als er (Funke), bei Nacht dunkler (blass); übrige schlafende bei Tag aus, bei Nacht
 * blasser als der Polarstern; nur gezogene Linien; nichts über der Bloom-Schwelle (uMax).
 */
async function pruefeHelligkeit(tag, was) {
  await until('!skyTheme.fading', `Himmel steht (${was})`, 15);
  const { hell, max, fade, s } = await ev(`(() => { const h = ${D}.story.himmel, u = h.mesh.material.uniforms;
    return { hell: [...u.uHell.value], max: u.uMax.value, fade: stars.material.uniforms.uFade.value, s: h.stand };
  })()`);
  const zeile = `Helligkeit am Himmel ${was}: ${JSON.stringify(hell.map((h) => +h.toFixed(3)))}`;
  pruefe(tag ? fade === 0 : fade > 0.29, `${zeile}, Hintergrundsterne ${fade} statt ${tag ? 'Tag' : 'Nacht'}`);
  const polar = hell[6];
  pruefe(hell.every((h) => h <= max), `${zeile}: über der Bloom-Schwelle ${max}`);
  pruefe(s.wach.includes(7) || polar > 0 && s.wach.every((k) => hell[k - 1] > polar),
    `${zeile}: Polarstern nicht dunkler als die wachen`);
  for (let k = 1; k <= 6; k++) {
    if (s.wach.includes(k)) continue;
    const h = hell[k - 1];
    if (k === s.welt) pruefe(h > 0 && (tag ? h > polar : h < polar), `${zeile}: Stern dieser Welt (${k})`);
    else pruefe(tag ? h === 0 : h > 0 && h < polar, `${zeile}: schlafender Stern ${k}`);
  }
  (await ev('wagen.linien')).forEach(([a, b], i) => pruefe(
    s.linien.some(([x, y]) => x === a && y === b) === hell[7 + i] > 0, `${zeile}: Linie ${a}–${b}`));
}
/**
 * Bild des Wagens am Himmel: Im Spiel sieht die Kamera nie so hoch hinauf (er steht über der Kraterwand des Vulkans);
 * für das Bild schaut sie kurz zur Mitte des Wagens (story.gazeDir, gaze) und danach zurück aufs Brett. Nur für Bilder,
 * nicht während einer Messung der Bildzeiten. tag: Himmel von Meer oder Wüste (pruefeHelligkeit).
 */
async function himmelBild(name, tag) {
  await ev(`(() => { const s = ${D}.story, m = new THREE.Vector3();
    for (let k = 1; k <= 7; k++) m.add(s.himmel.richtung(k));
    s.gazeRun++; s.gazeDir.copy(m.normalize()); s.gaze = 1; })()`);
  await sleep(700);
  await pruefeHelligkeit(tag, name);
  await bild(name);
  await ev(`(() => { ${D}.story.gazeRun++; ${D}.story.gaze = 0; })()`);
  await sleep(300);
}
/**
 * Erwachen und Vorbeiflug aufzeichnen (Ticket 05 von .scratch/kleiner-wagen/): In der Seite schreibt ein eigener
 * requestAnimationFrame je Bild auf, was der Wagen am Himmel zeigt (wache Sterne, Stern dieser Welt), wie hell jeder
 * Stern gerade aufleuchtet (glanz) und wie weit jede Linie gezogen ist (anteil), dazu den Winkel (Grad) vom Blick der
 * Kamera und vom Lichtpunkt zu jedem Stern; dazu jeden Glockenton eines Sterns (audio.stern). Seit Ticket 06 auch, wo
 * jeder Stern im Bild steht (bild: x, y von −1 bis 1, y nach oben), der Modus der Geschichte, ob ein Satz auf Tippen
 * wartet, und die Oberkante des Untertitels (unten: Anteil der Bildhöhe). Gelesen über das Objekt der Geschichte
 * (story.himmel) wie pruefeHimmel, keine eigene Schnittstelle; himmelAuswerten beendet die Aufzeichnung.
 */
async function himmelAufzeichnen() {
  await ev(`(() => { const s = ${D}.story, H = s.himmel, cam = ${D}.camera, a = window.__himmel = { an: true, log: [],
      toene: [] };
    if (!audio.__stern) {
      audio.__stern = audio.stern;
      audio.stern = function (k, ...rest) { window.__himmel?.toene.push(k); return audio.__stern.call(this, k, ...rest); };
    }
    const sterne = [1, 2, 3, 4, 5, 6, 7].map((k) => H.richtung(k)), grad = (v, d) => +(v.angleTo(d) * 180 / Math.PI)
      .toFixed(1);
    const loop = () => {
      if (!a.an) return;
      const e = cam.matrixWorld.elements, blick = cam.position.clone().set(-e[8], -e[9], -e[10]);
      const licht = s.flare.position.clone().sub(cam.position);
      const cap = document.querySelector('#story .caption').getBoundingClientRect();
      a.log.push({ wach: H.stand.wach.length, welt: H.stand.welt, linien: H.stand.linien.length,
        glanz: [...H.glanz].map((x) => +x.toFixed(2)), anteil: [...H.anteil].map((x) => +x.toFixed(2)),
        blick: sterne.map((d) => grad(blick, d)), licht: s.flare.visible ? sterne.map((d) => grad(licht, d)) : null,
        bild: sterne.map((d) => ((p) => [+p.x.toFixed(3), +p.y.toFixed(3)])(d.clone().multiplyScalar(70)
          .add(cam.position).project(cam))), modus: ${storyMode}, tippen: s.waitTap !== null,
        unten: cap.height > 0 ? +(cap.top / innerHeight).toFixed(3) : null });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop); })()`);
}
const himmelAuswerten = () => ev('(() => { const a = window.__himmel; a.an = false; return a; })()');
/** Linien (Platz in wagen.linien), die sich ziehen, wenn Stern k erwacht: von k − 1 zu ihm, mit Stern 4 dazu 4 → 1. */
const neueLinien = (k) => WAGEN_LINIEN.map((l, i) => i).filter((i) => WAGEN_LINIEN[i][1] === k
  && WAGEN_LINIEN[i][0] === k - 1 || k === 4 && WAGEN_LINIEN[i].join() === '4,1');
/**
 * Ende der Welt k (Aufzeichnung a vom Klick auf «Weiter» bis zum nächsten Level): Vor dem Erwachen schläft Stern k noch
 * (k − 1 wach); beim Erwachen schaut die Kamera zu ihm und das Licht steht dort, er blitzt auf, seine Linien ziehen sich
 * von 0 bis ganz, sein Glockenton klingt, einmal; Stern dieser Welt bleibt er, bis das Licht am nächsten (k + 1)
 * vorbeizieht: Dann steht es nah bei ihm, er zuckt auf und wird wieder blass. Am Ende ruht alles.
 */
function pruefeErwachen(a, k, was) {
  const { log } = a, i0 = log.findIndex((e) => e.wach === k), i1 = log.findIndex((e) => e.welt === k + 1);
  pruefe(i0 > 0 && log.slice(0, i0).every((e) => e.wach === k - 1 && e.welt === k),
    `${was}: vor dem Erwachen nicht ${k - 1} wach mit Stern ${k} dieser Welt (Bild ${i0})`);
  if (i0 <= 0) return;
  const e0 = log[i0];
  pruefe(e0.welt === k && e0.blick[k - 1] < 3 && e0.licht && e0.licht[k - 1] < 1,
    `${was}: beim Erwachen Blick ${e0.blick[k - 1]}°, Licht ${e0.licht?.[k - 1]}° vom Stern ${k}, Stern der Welt ${e0.welt}`);
  const nach = log.slice(i0, i1 < 0 ? undefined : i1);
  pruefe(Math.max(...nach.map((e) => e.glanz[k - 1])) > 0.8, `${was}: Stern ${k} blitzt beim Erwachen nicht auf`);
  for (const i of neueLinien(k)) {
    const anteile = nach.map((e) => e.anteil[i]);
    pruefe(Math.min(...anteile) < 0.2 && anteile.at(-1) === 1,
      `${was}: Linie ${WAGEN_LINIEN[i].join(' → ')} zieht sich nicht (${Math.min(...anteile)} … ${anteile.at(-1)})`);
  }
  pruefe(JSON.stringify(a.toene) === JSON.stringify([k]), `${was}: Glockentöne ${JSON.stringify(a.toene)} statt [${k}]`);
  pruefe(i1 > i0, `${was}: Stern ${k + 1} wird nicht Stern dieser Welt (Vorbeiflug)`);
  if (i1 <= i0) return;
  const naechst = Math.min(...log.slice(i1 - 30, i1 + 30).map((e) => e.licht?.[k] ?? 99));
  pruefe(naechst < 2.5, `${was}: Das Licht zieht nicht am Stern ${k + 1} vorbei (am nächsten ${naechst}°)`);
  pruefe(Math.max(...log.slice(i1).map((e) => e.glanz[k])) >= 0.5, `${was}: Stern ${k + 1} zuckt nicht auf`);
  const letzt = log.at(-1);
  pruefe(letzt.glanz.every((x) => x === 0) && letzt.anteil.every((x) => x === 1) && letzt.wach === k
    && letzt.welt === k + 1, `${was}: am Ende ${JSON.stringify(letzt)}`);
}
/**
 * Einstieg in die Welt k (Aufzeichnung a bis zum ersten Level): Der Wagen bleibt im Stand (wach Sterne wach, Stern k
 * dieser Welt), kein Glockenton; das Licht zieht nah an Stern k vorbei, und er zuckt auf; am Ende ruht er wieder.
 */
function pruefeEinstieg(a, k, wach, was) {
  const { log } = a;
  pruefe(log.every((e) => e.wach === wach && e.welt === k), `${was}: der Wagen ändert sich `
    + JSON.stringify(log.find((e) => e.wach !== wach || e.welt !== k)));
  pruefe(a.toene.length === 0, `${was}: Glockentöne ${JSON.stringify(a.toene)}`);
  const naechst = Math.min(...log.map((e) => e.licht?.[k - 1] ?? 99));
  pruefe(naechst < 2.5, `${was}: Das Licht zieht nicht am Stern ${k} vorbei (am nächsten ${naechst}°)`);
  pruefe(Math.max(...log.map((e) => e.glanz[k - 1])) >= 0.5, `${was}: Stern ${k} zuckt nicht auf`);
  pruefe(log.at(-1).glanz.every((x) => x === 0), `${was}: am Ende ${JSON.stringify(log.at(-1).glanz)}`);
}
/** Ohne Erwachen (Wiederholen): kein Glockenton, kein Stern leuchtet auf, keine Linie zieht sich, der Stand bleibt. */
function pruefeOhneErwachen(a, wach, was) {
  pruefe(a.toene.length === 0 && a.log.every((e) => e.wach === wach && e.glanz.every((x) => x === 0)
    && e.anteil.every((x) => x === 1)), `${was}: ein Erwachen (${JSON.stringify(a.toene)}, `
    + `${JSON.stringify(a.log.find((e) => e.wach !== wach || e.glanz.some((x) => x) || e.anteil.some((x) => x < 1)))})`);
}
/**
 * Finale (Ticket 06 von .scratch/kleiner-wagen/; Aufzeichnung a vom Klick auf «Hinaufschauen» bis zur Bühne des
 * Epilogs; buehne: wo die Bühne die sieben Sterne ihres Wagens im ersten Bild des Epilogs zeigt, scene.wagenImBild,
 * Anteile von oben links, dazu Breite b und Höhe h des Bilds): Die Strahlen steigen zum sechsten Stern, er
 * erwacht wie die übrigen (Blick und Licht bei ihm, Aufblitzen, Linie 5 → 6). Zu Satz 1 steht der ganze Wagen über
 * dem Untertitel im Bild, und ein Puls läuft Stern für Stern von 1 bis 6, mit den sechs Tönen; erst wenn er verklungen
 * ist, wartet der Satz auf Tippen. Zu Satz 2 zieht sich die Linie 6 → 7, erst dann ist der Polarstern wach, das Licht
 * steht auf ihm, er flammt auf und setzt den Schlusston (7); dann wartet der Satz. Töne genau 6, 1 … 6, 7. Am Ende
 * (letztes Bild vor der Bühne) steht der ganze Wagen im Bild, der Polarstern oben links, die Schale unten rechts,
 * und jeder Stern genau dort, wo ihn die Bühne gleich zeigt (Wagen in Wagen, Ticket 07: höchstens WAGEN_IN_WAGEN px
 * daneben).
 */
function pruefeFinale(a, buehne, was) {
  const { log } = a, i0 = log.findIndex((e) => e.wach === 6);
  pruefe(i0 > 0 && log.slice(0, i0).every((e) => e.wach === 5 && e.welt === 6),
    `${was}: vor dem Erwachen nicht 5 wach mit Stern 6 dieser Welt (Bild ${i0})`);
  if (i0 <= 0) return;
  const e0 = log[i0];
  pruefe(e0.blick[5] < 3 && e0.licht && e0.licht[5] < 1,
    `${was}: beim Erwachen Blick ${e0.blick[5]}°, Licht ${e0.licht?.[5]}° vom Stern 6`);
  const iP = log.findIndex((e, i) => i > i0 && e.glanz[0] > 0.5); // der Puls bei Stern 1
  pruefe(Math.max(...log.slice(i0, iP < 0 ? undefined : iP).map((e) => e.glanz[5])) > 0.8,
    `${was}: Stern 6 blitzt beim Erwachen nicht auf`);
  const zug = log.slice(i0, iP < 0 ? undefined : iP).map((e) => e.anteil[5]);
  pruefe(Math.min(...zug) < 0.2 && zug.at(-1) === 1, `${was}: Linie 5 → 6 zieht sich nicht vor dem Puls`);
  pruefe(JSON.stringify(a.toene) === '[6,1,2,3,4,5,6,7]', `${was}: Glockentöne ${JSON.stringify(a.toene)} statt `
    + '[6, 1 … 6, 7]');
  pruefe(iP > 0, `${was}: kein Puls durch den Wagen`);
  if (iP <= 0) return;
  // Puls: Stern für Stern, der Wagen ganz im Bild und über dem Untertitel
  const an = [1, 2, 3, 4, 5, 6].map((k) => log.findIndex((e, i) => i >= iP && e.glanz[k - 1] > 0.5));
  pruefe(an.every((i, k) => i > 0 && (k === 0 || i > an[k - 1])), `${was}: Puls nicht Stern für Stern (Bilder `
    + `${JSON.stringify(an)})`);
  for (const i of an.slice(1).filter((x) => x > 0)) {
    const e = log[i], unten = Math.max(...e.bild.map(([, y]) => (1 - y) / 2));
    pruefe(e.modus === 'caption' && e.bild.every(([x, y]) => Math.abs(x) < 1 && Math.abs(y) < 1)
      && e.unten !== null && unten < e.unten, `${was}: im Puls (Bild ${i}) nicht der ganze Wagen über dem Untertitel `
      + `(unterster Stern ${unten.toFixed(3)}, Untertitel ${e.unten}, ${JSON.stringify(e.bild)})`);
  }
  const t1 = log.findIndex((e, i) => i > iP && e.tippen);
  pruefe(t1 > an[5] && log[t1].glanz.every((x) => x === 0) && log[t1].linien === 6,
    `${was}: Satz 1 wartet auf Tippen, bevor der Puls verklungen ist (Bild ${t1})`);
  // über die Deichsel: Die Linie 6 → 7 zieht sich, dann flammt der Polarstern auf
  const i7 = log.findIndex((e) => e.wach === 7), l7 = log.findIndex((e) => e.linien === 7);
  pruefe(l7 > t1 && i7 > l7, `${was}: Linie 6 → 7 (Bild ${l7}) nicht nach Satz 1 und vor dem Polarstern (${i7})`);
  if (i7 <= l7 || l7 < 0) return;
  const deichsel = log.slice(l7, i7).map((e) => e.anteil[6]);
  pruefe(Math.min(...deichsel) < 0.2 && log[i7].anteil[6] === 1,
    `${was}: Linie 6 → 7 zieht sich nicht (${Math.min(...deichsel)} … ${log[i7].anteil[6]})`);
  const t2 = log.findIndex((e, i) => i > i7 && e.tippen);
  pruefe(Math.max(...log.slice(i7, t2 < 0 ? undefined : t2).map((e) => e.glanz[6])) > 0.8,
    `${was}: Der Polarstern flammt nicht auf`);
  pruefe(log.slice(i7 + 1, t2 < 0 ? undefined : t2).every((e) => e.licht && e.licht[6] < 1),
    `${was}: Das Licht steht nicht auf dem Polarstern`);
  pruefe(t2 > i7 && log[t2].glanz.every((x) => x === 0), `${was}: Satz 2 wartet auf Tippen, bevor der Polarstern ruht`);
  // Endbild: der ganze Wagen im Bild, der Polarstern oben links, die Schale unten rechts
  const iB = log.findIndex((e) => e.modus === 'scene') - 1, e = log[iB];
  pruefe(iB > i7, `${was}: keine Bühne nach dem Finale`);
  if (iB <= i7) return;
  const p = e.bild[6], rest = e.bild.slice(0, 6);
  pruefe(e.bild.every(([x, y]) => Math.abs(x) < 0.97 && Math.abs(y) < 0.97), `${was}: am Ende nicht der ganze Wagen `
    + `im Bild ${JSON.stringify(e.bild)}`);
  const xs = e.bild.map(([x]) => x), ys = e.bild.map(([, y]) => y), schale = (i) => i >= 0 && i < 4; // Sterne 1–4
  pruefe(rest.every(([x, y]) => x > p[0] && y < p[1]) && schale(xs.indexOf(Math.max(...xs)))
    && schale(ys.indexOf(Math.min(...ys))),
    `${was}: am Ende nicht Polarstern oben links, Schale unten rechts ${JSON.stringify(e.bild)}`);
  const da = [(p[0] + 1) / 2, (1 - p[1]) / 2], polar = buehne.sterne[6];
  console.log(`  ${was}: Polarstern am Ende bei ${da.map((x) => x.toFixed(3)).join(' / ')} (Anteil von Breite / Höhe), `
    + `auf der Bühne bei ${polar.map((x) => x.toFixed(3)).join(' / ')}`);
  // Wagen in Wagen: jeder Stern am Ende des Finales dort, wo ihn die Bühne im ersten Bild des Epilogs zeigt (Bildpixel)
  const ab = e.bild.map(([x, y], i) => Math.hypot(((x + 1) / 2 - buehne.sterne[i][0]) * buehne.b,
    ((1 - y) / 2 - buehne.sterne[i][1]) * buehne.h));
  const k = ab.indexOf(Math.max(...ab));
  console.log(`  ${was}: Wagen in Wagen, grösste Abweichung ${ab[k].toFixed(1)} px (Stern ${k + 1}), Wagen `
    + `${(Math.max(...xs) - Math.min(...xs)) / 2 * 100 | 0} % der Breite`);
  pruefe(ab[k] <= WAGEN_IN_WAGEN, `${was}: Wagen in Wagen nicht ohne Sprung: Stern ${k + 1} ${ab[k].toFixed(1)} px daneben `
    + `(am Ende ${JSON.stringify(e.bild)}, Bühne ${JSON.stringify(buehne.sterne)})`);
}
/** So weit (CSS-Pixel) darf ein Stern des Wagens am Ende des Finales neben dem der Bühne stehen (Pruefung Wagen in Wagen). */
const WAGEN_IN_WAGEN = 4;
/** Ein Level spielen, das gleich läuft (Platz platz im Grad g): lösen über die Testschnittstelle, «Gelöst» abwarten. */
async function loeseLevel(g, platz) {
  await until(`${D}.story.step === ${platz} && ${D}.story.grade === ${JSON.stringify(g)} && window.__prisma.playing()`
    + ` && !${D}.story.running`, `${g}: Level ${platz + 1} läuft`, 90);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', `${g}: Level ${platz + 1} gelöst`, 30);
}

/**
 * Der Kleine Wagen (--wagen, Ticket 01 von .scratch/kleiner-wagen/): sein Stand, gelesen über das Objekt der Geschichte
 * (story.wagenStand), gespielt über das Menü und gelöst über die Testschnittstelle; einen Stand setzt die Probe wie
 * sonst in localStorage. Geprüft: neu in jedem Grad alle Sterne schlafend; in Leicht nach jeder Welt (ab ihrem letzten
 * Level über die Reise bis in die nächste bzw. über das Finale bis zum Epilog) die richtigen Sterne wach und Linien
 * gezogen, mit der Schale nach dem Vulkan und dem ganzen Wagen nach dem Finale; derselbe Stand nach Neuladen mitten in
 * einer Welt (im Menü und im Level), beim Fortsetzen mit Einstieg und nach einem Wechsel über das Menü; beim
 * Wiederholen einer früheren Welt (auch «Weiter» über ihre Grenze) unverändert, ohne Reise; je Grad ein eigener Stand
 * (Mittel daneben im Planeten); «Von vorn» lässt alle schlafen, die Bestwerte bleiben; ein geschaffter Grad zeigt den
 * ganzen Wagen. Seit Ticket 04 dazu, was der Wagen am Himmel zeigt (pruefeHimmel: wache Sterne, Linien, Stern dieser
 * Welt; über dem Dorf alle schlafend), und Bilder von ihm (himmelBild: je Welt, Tag und Nacht, verschiedene Stände,
 * geschafft, über dem Dorf). Seit Ticket 05 dazu Erwachen und Flug (himmelAufzeichnen): am Ende jeder Welt 1–5 der
 * Aufstieg zum Stern dieser Welt, sein Erwachen (Blick und Licht bei ihm, Aufblitzen, Linien, ein Glockenton) und der
 * Vorbeiflug am nächsten (pruefeErwachen), die Einstiege in den Bergwald nach dem Prolog und in den Vulkan beim
 * Fortsetzen am Stern ihrer Welt vorbei (pruefeEinstieg), beim Wiederholen über eine Weltgrenze kein Erwachen
 * (pruefeOhneErwachen); Bilder wagen-welt<n>-aufstieg, -erwachen, -vorbeiflug und wagen-einstieg-<wald|vulkan>-vorbeiflug.
 * Seit Ticket 06 das Finale (pruefeFinale): Erwachen des sechsten Sterns, Puls Stern für Stern mit dem ganzen Wagen
 * über dem Untertitel, Linie 6 → 7 und Polarstern mit Schlusston, jeder Satz wartet erst danach auf Tippen, am Ende der
 * ganze Wagen im Bild; Bilder wagen-finale-puls, -polarstern, -endbild. Seit Ticket 07 Wagen in Wagen: Am Ende
 * steht jeder Stern dort, wo ihn die Bühne im ersten Bild des Epilogs zeigt; Bilder wagen-finale-ueberblendung und
 * wagen-epilog-anfang.
 * Etwa 4 min (mit Ticket 07 gemessen: 245–252 s in Desktop, Handy hoch und quer).
 */
async function wagenAblauf() {
  console.log(`${view.name}: Kleiner Wagen`);
  await laden();
  for (const g of GRADE) await pruefeWagen(g, 0, 'neu');
  const mittel = standBis('mittel', 43, 4); // Planeten 44: Bergwald bis Vulkan geschafft, vier Sterne wach

  // Einstieg in den Bergwald nach dem Prolog («Gleich los»): am schlafenden ersten Stern vorbei, ohne Erwachen
  await tippe(karte('leicht'), 'Karte leicht');
  await until(`${storyMode} === 'scene'`, 'Leicht: Prolog');
  await sleep(1500);
  await tippe('#story .scene .skip', 'Überspringen');
  await angebot('leicht', 'Gleich los');
  await himmelAufzeichnen();
  await until(`${D}.story.himmel.glanz[0] > 0.3`, 'Leicht: Einstieg am Stern 1 vorbei', 60);
  await bild('wagen-einstieg-wald-vorbeiflug');
  await until(`${D}.story.step === 0 && window.__prisma.playing() && !${D}.story.running`, 'Leicht 1 läuft', 60);
  pruefeEinstieg(await himmelAuswerten(), 1, 0, 'Einstieg in den Bergwald');
  await pruefeHimmel(0, 1, 'im ersten Level des Bergwalds');

  // nach jeder Welt: ab ihrem letzten Level (Stand gesetzt, «Weiter» im Menü), gelöst, dann Reise bzw. Finale
  for (let w = 0; w < 6; w++) {
    const platz = w * 10 + 9;
    await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', platz, w),
      'prisma.noa.mittel': mittel });
    await pruefeWagen('leicht', w, `vor dem letzten Level der Welt ${w + 1}`);
    await tippe('#menue .menue-weiter', 'Weiter');
    await until(`${D}.story.step === ${platz} && window.__prisma.playing() && !${D}.story.running`,
      `Leicht: Level ${platz + 1} läuft`, 90);
    await pruefeHimmel(w, w + 1, `im letzten Level der Welt ${w + 1}`);
    await himmelBild(`wagen-welt${w + 1}-wach${w}`, w === 1 || w === 2);
    await loeseLevel('leicht', platz);
    // der Stern ist wach, sobald das letzte Level seiner Welt gelöst ist (wer jetzt neu lädt, sieht ihn schon wach)
    await pruefeWagen('leicht', w + 1, `nach dem letzten Level der Welt ${w + 1}`);
    await pruefeHimmel(w, w + 1, `nach dem letzten Level der Welt ${w + 1} (noch ohne Erwachen)`);
    await himmelAufzeichnen();
    await tippe('#btn-next', 'Weiter');
    if (w < 5) {
      // Bilder: Aufstieg (die Strahlen auf halbem Weg zum Stern), Erwachen (die Linie zieht sich), Vorbeiflug
      await until(`${D}.story.beams[0].visible && ${D}.story.beams[0].material.uniforms.uHead.value > 0.6`,
        `Leicht: Aufstieg in Welt ${w + 1}`, 30);
      await bild(`wagen-welt${w + 1}-aufstieg`);
      await until(`${D}.story.himmel.stand.wach.length === ${w + 1}`, `Leicht: Stern ${w + 1} erwacht`, 30);
      await pruefeHimmel(w + 1, w + 1, `beim Erwachen von Stern ${w + 1}`);
      await sleep(450);
      await bild(`wagen-welt${w + 1}-erwachen`);
      await until(`${D}.story.himmel.stand.welt === ${w + 2}`, `Leicht: Vorbeiflug an Stern ${w + 2}`, 30);
      await pruefeHimmel(w + 1, w + 2, `im Vorbeiflug an Stern ${w + 2}`);
      await bild(`wagen-welt${w + 1}-vorbeiflug`);
      await until(`${D}.story.step === ${platz + 1} && window.__prisma.playing() && !${D}.story.running`,
        `Leicht: Reise in Welt ${w + 2}`, 90);
      await sleep(300); // das Aufzucken klingt aus
      pruefeErwachen(await himmelAuswerten(), w + 1, `Ende der Welt ${w + 1}`);
      await pruefeWagen('leicht', w + 1, `nach der Reise in Welt ${w + 2}`);
      await pruefeHimmel(w + 1, w + 2, `nach der Reise in Welt ${w + 2}`);
      await himmelBild(`wagen-welt${w + 2}-nach-reise`, w === 0 || w === 1);
    } else {
      // Finale (Ticket 06): Bilder vom Puls (er hat Stern 2 erreicht), vom Polarstern, wenn er aufflammt, und vom
      // Endbild vor der Bühne
      const momente = [[`${D}.story.himmel.glanz[1] > 0.05`, 'puls'], [`${D}.story.himmel.glanz[6] > 0.1`, 'polarstern'],
        [null, null]];
      for (let n = 1; n <= FINALE_SAETZE.length; n++) {
        const [wann, name] = momente[n - 1];
        if (wann) {
          await until(wann, `Leicht: Finale, ${name}`, 60);
          await bild(`wagen-finale-${name}`);
        }
        await until(`${D}.story.waitTap !== null && ${storyMode} === 'caption'`, `Leicht: Finale, Satz ${n}`, 60);
        await pruefeWagen('leicht', 6, `im Finale, Satz ${n}`);
        await tippe('#story .caption .text', 'Untertitel');
        await sleep(400);
      }
      // Endbild: Der Blick ist fast wieder oben (nach dem Aufprall unten, dann hinauf zum Wagen; das Sichtfeld wird dabei
      // seit Ticket 07 auch weiter, der Lichtpunkt schrumpft auf die Grösse des gezeichneten Sterns)
      await until(`${D}.story.gaze < 0.2`, 'Leicht: Blick auf das Brett', 60);
      await until(`${D}.story.gaze > 0.995`, 'Leicht: Blick hinauf zum Wagen', 60);
      await bild('wagen-finale-endbild');
      await until(`${storyMode} === 'scene'`, 'Leicht: Epilog', 60);
      // Wagen in Wagen (Ticket 07): wo die Bühne ihren Wagen zeigt; Bilder mitten in der Überblendung und an ihrem
      // Ende, bevor die erste Fahrt des Epilogs beginnt
      const buehne = await ev(`(() => { const sc = ${D}.story.scene;
        return { sterne: sc.wagenImBild(sc.epilogStart()), b: innerWidth, h: innerHeight }; })()`);
      await sleep(700);
      await bild('wagen-finale-ueberblendung');
      await until(`${D}.story.covered`, 'Leicht: Epilog überblendet', 30);
      await bild('wagen-epilog-anfang');
      pruefeFinale(await himmelAuswerten(), buehne, 'Finale');
      await pruefeWagen('leicht', 7, 'nach dem Finale');
      await pruefeHimmel(7, 6, 'nach dem Finale');
    }
    await pruefeWagen('mittel', 4, `daneben, nach Welt ${w + 1} in Leicht`);
  }

  // Neuladen mitten in der Wüste: im Menü und im Level derselbe Stand (zwei Sterne)
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', 25, 2),
    'prisma.noa.mittel': mittel });
  await pruefeWagen('leicht', 2, 'im Menü nach Neuladen mitten in der Wüste');
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`${D}.story.step === 25 && window.__prisma.playing() && !${D}.story.running`, 'Leicht 26 läuft', 60);
  await pruefeWagen('leicht', 2, 'im Level nach Neuladen mitten in der Wüste');
  await pruefeHimmel(2, 3, 'im Level nach Neuladen mitten in der Wüste');

  // Fortsetzen: Leicht steht am Anfang des Vulkans, den es noch nicht gesehen hat (mit Einstieg); Mittel mit Bestwerten
  const bestM = { [reise.mittel[0][0]]: { zeit: 50, drehungen: 9 }, [reise.mittel[1][2]]: { zeit: 70, drehungen: 11 } };
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', 30, 2),
    'prisma.noa.mittel': mittel, 'prisma.noa.mittel.bestwerte': bestM });
  await pruefeWagen('leicht', 3, 'im Menü vor dem Fortsetzen im Vulkan');
  await himmelAufzeichnen();
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`${storyMode} === 'caption'`, 'Leicht: Einstieg in den Vulkan', 60);
  await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[3], 'Leicht: Einstieg in den Vulkan');
  await pruefeWagen('leicht', 3, 'beim Einstieg in den Vulkan');
  await until(`${D}.story.himmel.glanz[3] > 0.3`, 'Leicht: Einstieg am Stern 4 vorbei', 30);
  await bild('wagen-einstieg-vulkan-vorbeiflug');
  // bis der Fall des Lichts zu Ende ist (vorher wirkt «Menü» nicht)
  await until(`${D}.story.step === 30 && window.__prisma.playing() && !${D}.story.running`, 'Leicht 31 läuft', 60);
  pruefeEinstieg(await himmelAuswerten(), 4, 3, 'Einstieg in den Vulkan (Fortsetzen)');
  await pruefeWagen('leicht', 3, 'nach dem Einstieg in den Vulkan');
  await pruefeHimmel(3, 4, 'nach dem Einstieg in den Vulkan');
  await sleep(700);

  // Wechsel über das Menü zu Mittel (Planeten 44): vier Sterne; Leicht bleibt bei drei
  await tippe('#btn-menu', 'Menü');
  await until(`${menueOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Menü', 10);
  await sleep(800);
  await tippe(karte('mittel'), 'Karte Mittel');
  await until(`${D}.story.grade === 'mittel' && ${D}.story.step === 43 && window.__prisma.playing()`
    + ` && !${D}.story.running`, 'Mittel 44 läuft', 60);
  await pruefeWagen('mittel', 4, 'nach dem Wechsel über das Menü');
  await pruefeHimmel(4, 5, 'nach dem Wechsel zu Mittel über das Menü');
  await pruefeWagen('leicht', 3, 'nach dem Wechsel zu Mittel');

  // Wiederholen einer früheren Welt: Bergwald 10 aus der Übersicht, dann «Weiter» über die Grenze ins Meer
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht', 10);
  await sleep(600);
  if (view.phone) { // eine Welt je Seite: zum Bergwald über seine Station
    await tippe(`${UEB} .ueb-tab[data-reihe="0"]`, 'Station Bergwald');
    await sleep(900);
  }
  await tippe(kachel(0, 9), 'Kachel Bergwald 10');
  await loeseLevel('mittel', 9);
  pruefe(await ev(`${D}.story.replay`) === true, 'Mittel: Bergwald 10 nicht als Wiederholen');
  await pruefeWagen('mittel', 4, 'beim Wiederholen im Bergwald');
  await pruefeHimmel(4, 1, 'beim Wiederholen im Bergwald');
  await messe();
  await himmelAufzeichnen();
  await tippe('#btn-next', 'Weiter zum Meer');
  await until(`${D}.story.step === 10 && window.__prisma.playing() && !${D}.story.running`, 'Mittel: Meer 1', 60);
  ohneZwischenszene(await ende('Wagen: Wiederholen über die Grenze ins Meer'), 'Wiederholen über die Grenze ins Meer');
  pruefeOhneErwachen(await himmelAuswerten(), 4, 'Wiederholen über die Grenze ins Meer');
  await pruefeWagen('mittel', 4, 'nach dem Wiederholen über die Grenze ins Meer');
  await pruefeHimmel(4, 2, 'nach dem Wiederholen über die Grenze ins Meer');
  pruefe((await stand('mittel'))?.platz === 43, 'Mittel: der Platz hat sich beim Wiederholen geändert');

  // «Von vorn» für Mittel: alle Sterne schlafen, die Bestwerte bleiben; Leicht unverändert
  const bestVorher = await besteWerte('mittel');
  await tippe('#btn-menu', 'Menü');
  await until(`${menueOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Menü', 10);
  await sleep(1200);
  await tippe('#menue [data-menue-fokus="vonvorn:mittel"]', 'Von vorn Mittel');
  await until("!document.querySelector('#menue .menue-frage').hidden", 'Rückfrage', 5);
  await sleep(500);
  await tippe('#menue [data-menue-frage="ja"]', 'Von vorn bestätigen');
  await sleep(600);
  await pruefeWagen('mittel', 0, 'nach «Von vorn»');
  await pruefeHimmel(0, 1, 'nach «Von vorn» des Grads auf dem Brett');
  await pruefeWagen('leicht', 3, 'nach «Von vorn» von Mittel');
  const bestNachher = await besteWerte('mittel');
  pruefe(Object.keys(bestVorher ?? {}).length >= 3 && JSON.stringify(bestNachher) === JSON.stringify(bestVorher),
    `Mittel: Bestwerte nach «Von vorn» ${JSON.stringify(bestNachher)} statt ${JSON.stringify(bestVorher)}`);

  // ein geschaffter Grad: der ganze Wagen wach, mit allen Linien
  await laden({ 'prisma.noa.zuletzt': 'mittel', 'prisma.noa.mittel': standBis('mittel', 12, 1),
    'prisma.noa.leicht': { ...standBis('leicht', 59, 5), geloest: reise.leicht.flat(), geschafft: true } });
  await pruefeWagen('leicht', 7, 'geschafft');
  await pruefeWagen('mittel', 1, 'neben dem geschafften Grad');
  await pruefeHimmel(1, 2, 'im Menü, Mittel im Meer');
  // geschafft: der ganze Wagen am Himmel (Wiederholen aus der Übersicht, die die Karte im Menü öffnet: Sterne 9)
  await tippe(karte('leicht'), 'Karte Leicht (geschafft)');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht Leicht', 10);
  await sleep(600);
  if (view.phone) { // eine Welt je Seite: zu den Sternen über ihre Station
    await tippe(`${UEB} .ueb-tab[data-reihe="5"]`, 'Station Sterne');
    await sleep(900);
  }
  await tippe(kachel(5, 8), 'Kachel Sterne 9');
  await until(`${D}.story.grade === 'leicht' && ${D}.story.replay && window.__prisma.playing() && !${D}.story.running`,
    'Leicht: Sterne 9 (Wiederholen)', 60);
  await pruefeHimmel(7, 6, 'geschafft, beim Wiederholen in den Sternen');
  await himmelBild('wagen-geschafft', false);

  // über dem Dorf (das Kapitel «Im Dorf» läuft, Übung 3): alle sechs Sterne schlafend, ohne Stern einer Welt
  const dorf = await ev('LEVELS.slice(0, TUTORIAL_COUNT).map((l) => l.name)');
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': { platz: 0, geloest: dorf.slice(0, 2),
    gesehen: ['prolog', 'angebot', 'dorf'], geschafft: false, dorf: { platz: 2, ende: null } } });
  await pruefeHimmel(0, null, 'im Menü über dem Dorf');
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`${D}.story.inDorf && ${D}.story.uebung === 2 && window.__prisma.playing() && !${D}.story.running`,
    'Leicht: Übung 3 im Dorf', 60);
  await pruefeHimmel(0, null, 'über dem Dorf');
  await himmelBild('wagen-dorf', false);
}

/**
 * Dauern gegen den Vorher-Lauf (--vorher; Spec .scratch/kleiner-wagen/, Entscheid 19, Ticket 05): je Abschnitt mit
 * demselben Namen netto (ohne Tippen und Bilder der Probe). Reisen höchstens 1,2 s länger («etwa 1 s»), Einstiege
 * höchstens 0,5 s (nicht länger; die Dauern streuen zwischen zwei Läufen um wenige Zehntel, ein langes Bild auf dem
 * Handy bis 0,5 s), das Finale höchstens 4,5 s («etwa 4 s»); die übrigen nur zum Ablesen.
 */
function vergleicheVorher() {
  const vorher = JSON.parse(readFileSync(vorherDatei, 'utf8')).abschnitte;
  const grenze = (name) => (/Reise in Welt/.test(name) ? 1.2 : /Einstieg/.test(name) ? 0.5
    : /Finale/.test(name) ? 4.5 : null);
  console.log(`\nDauer gegen ${vorherDatei} (netto, s):`);
  for (const b of bildzeiten) {
    const v = vorher.find((x) => x.name === b.name), g = grenze(b.name);
    if (b.netto === undefined || v?.netto === undefined) continue;
    const mehr = +(b.netto - v.netto).toFixed(2);
    console.log(`  ${b.name}: ${b.netto} statt ${v.netto} (${mehr >= 0 ? '+' : ''}${mehr})`
      + (g === null ? '' : `, Grenze +${g}`));
    if (g !== null) pruefe(mehr <= g, `${b.name}: ${mehr} s länger als im Vorher-Lauf (höchstens ${g} s)`);
  }
}

try {
  await emulate(send, view);
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.ticks > 2', 'Spiel startet');
  reise = await ev('STORY_LEVELS');
  if (startTaste && !view.phone) await gehaltenesEnter();
  if (menue) await menueAblauf();
  if (uebersichtProbe) await uebersichtAblauf();
  if (dorfProbe) await dorfAblauf();
  if (dorfRaenderProbe) await dorfRaender();
  if (wagenProbe) await wagenAblauf();
  for (const [i, g] of grade.entries()) await (ganz ? ganzerDurchgang : durchgang)(g, i === 0);
  if (finaleGrad) await finale(finaleGrad);
} catch (e) {
  pruefe(false, e.message);
  await bild('abbruch').catch(() => {});
} finally {
  await close();
}
const konsole = logs.filter(l => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
const warnungen = logs.filter(l => /\[warn/.test(l));
for (const l of konsole) pruefe(false, `Konsole: ${l}`);
if (warnungen.length) console.log(`Warnungen:\n  ${warnungen.join('\n  ')}`);
// Sicherheitsnetz der Hauptschleife (sceneLoop.guard): Sie ruhte, obwohl etwas anstand – eine Weckstelle fehlt
const weckstellen = warnungen.filter(l => /Weckstelle fehlt/.test(l));
if (weckstellen.length) console.log(`\nWARNUNG: ${weckstellen.length}× fehlende Weckstelle (siehe oben, sceneLoop.guard)`);
if (bildzeiten.length) {
  console.log('\nBildzeiten (Lücken zwischen zwei Bildern des Browsers):');
  for (const b of bildzeiten) {
    console.log(`  ${b.name}: ${b.bilder} Bilder, längste Lücke ${b.max} ms, über 50 ms ${b.ueber50}, `
      + `über 100 ms ${b.ueber100}${b.dauer === undefined ? '' : `; Dauer ${b.dauer} s, netto ${b.netto} s`}`);
  }
}
if (vorherDatei) vergleicheVorher();
if (messwerte) {
  mkdirSync(dirname(messwerte), { recursive: true });
  writeFileSync(messwerte, `${JSON.stringify({ zeit: new Date().toISOString(), aufruf: args.join(' '),
    bildschirm: view, abschnitte: bildzeiten, fehler }, null, 1)}\n`);
  console.log(`\nMesswerte nach ${messwerte}`);
}
console.log(fehler.length ? `\nProbe FEHLGESCHLAGEN (${fehler.length})` : '\nProbe bestanden, Konsole ohne Fehler.');
process.exit(fehler.length ? 1 : 0);
