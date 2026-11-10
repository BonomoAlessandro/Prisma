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
// Hervorhebung), dass das Menü nach der Wahl sofort ausblendet, dass die Kamera im Himmel bleibt, bis die Welt samt
// ihrem Brett bereit ist (kein leeres Brett), dass das Brett in jeder Welt und im Dorf zum Himmel passt (auch in der Art
// seiner Brett-Angabe im Register), unter einem Himmel aus Blender nie ein fremdes Brett oder das Steinbrett als Notfall
// steht und es beim Wiederholen über eine Weltgrenze mit dem Himmel wechselt (Spec .scratch/brett-je-himmel/), und misst
// die Bildzeiten der Übergänge (Lücken zwischen zwei requestAnimationFrame; Lücken über 100 ms sind Fehler, ausser
// während eines Bilds der Probe, siehe ende).
// Das Protokoll je Bild enthält das Brett (__prisma.brett: Himmel, Art, bereit, von, Anteil, Notfall; soll: Art der
// Brett-Angabe seines Himmels). Seit Ticket 03 von
// .scratch/kleiner-wagen/ dazu die Sätze, die der Spieler liest (Prolog, Einstiege, Reisen, Finale, Epilog, «Gelöst» am
// Ende jeder Welt), und dass jeder ganz im Bild steht, ohne mehr Zeilen als der längste Satz vor dem Kleinen Wagen (auf
// der Bühne nur ein HINWEIS, siehe pruefeSatz). Seit Ticket 08 gewählt wird im Menü über Reiter und Knopf (waehle), die
// Übersicht zeigt eine Welt je Seite unter dem Himmel mit den Sternhaufen (tippeKachel); geprüft dazu der Wagen auf der
// Sternkarte je Grad (menueWagen), der Himmel der Übersicht (uebHimmel), die Leiste der Ankunft mit dem Licht darüber
// (pruefeLeiste) und dass Menü und Übersicht ganz im Bild stehen (pruefeImBild). Seit der Abnahme (Ticket 11) hält das
// Licht bei jeder Ankunft in einer Welt über dem Untertitel an und wartet auf Tippen: Die Probe prüft den Halt bei den
// Einstiegen und Reisen ihrer Abläufe (halt) und tippt sonst beim Warten darauf wie ein Spieler (until); dazu der
// gleichmässige Fall danach (pruefeFall), der Stand des Sterns nach dem Erwachen (pruefeErwachen), die Antwort des
// Polarsterns ohne Schwenk, der Wagen rechts der Mitte (pruefeFinale) und Noas Arm zum Polarstern (pruefeArm; seit
// Ticket 13 in Epilog 3 im selben Winkel wie in Prolog 4). Seit
// Ticket 12: der Fall gleichmässig im Bild und die Kamera ruhig (pruefeFallImBild, Schnelltest --fall), die Strahlen
// im Finale laufen aus und der Aufprall der Antwort ist weich (pruefeFinale), kein Text der Bühne rückt, solange er zu
// sehen ist (pruefeTexteRuhig), und am Ende einer Welt beginnt nichts vor «Weiter» (pruefeWartetAufWeiter).
// Bilder der wichtigen Momente nach tests/output/geschichte/<bildschirm>-<name>.png. Sie scheitert bei einem falschen
// Wert oder einer Meldung in der Konsole ([error], Ausnahme, Shader).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs [--handy | --quer]
//           [--grad leicht,mittel] [--welten 2] [--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf]
//           [--dorf-raender] [--ganz] [--wagen] [--fall] [--grenzen] [--groesse 360x640] [--dpr 2.75]
//           [--messwerte <datei.json>] [--vorher <datei.json>]
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
//   --dorf, --dorf-raender, --ganz, --wagen und --fall alle vier Grade. Etwa 3 min je Grad, das Finale gut 4 min, das
//   Menü etwa 3 min, die Übersicht etwa 4 min, das Dorf etwa 6 min, mit --ganz etwa 7 min je Grad. Zeitrahmen: jede
//   Anfrage an Chrome höchstens 30 s, der ganze Lauf höchstens 14 min (mit --ganz 14 min je Grad); dann schliesst die
//   Probe Chrome und bricht mit Fehler ab. --messwerte: Bildzeiten und Dauern aller gemessenen Übergänge als JSON in
//   diese Datei (Vorher-Lauf des Kleinen Wagens, .scratch/kleiner-wagen/vorher/). Mit --ganz und --finale misst die
//   Probe dazu die Dauer jedes Einstiegs, jeder Reise und des Finales (vom Klick auf «Gleich los» bzw. «Weiter» bis zum
//   spielbaren Level bzw. bis zum Epilog), ohne die Zeit, in der ein Satz auf Tippen wartet oder ein Bild der Probe die
//   Seite anhält (siehe ende). --wagen: dazu der Stand des Kleinen Wagens (Ticket 01 von .scratch/kleiner-wagen/), der
//   Wagen am Himmel (Ticket 04: Stand, Helligkeit bei Tag und Nacht, Bilder <bildschirm>-wagen-…) und seit Ticket 05
//   Erwachen, Vorbeiflug und Einstiege, seit Ticket 06 das Finale (Puls, Polarstern, Endbild), siehe wagenAblauf, etwa
//   4 min. --fall: nur Einstieg in den Vulkan und Reise ins Meer, je mit dem Fall aufs Brett im Bild (Abnahme Ticket
//   12, siehe fallAblauf), gut 1 min. --vorher: die Dauern (netto) mit einem früheren Lauf mit --messwerte vergleichen
//   (Vorher-Lauf .scratch/kleiner-wagen/vorher/<desktop|handy>.json, siehe vergleicheVorher): jede Reise höchstens etwa
//   1 s länger, die Einstiege nicht länger, das Finale etwa 4 s.
// --grenzen: Wiederholen über die Weltgrenzen Wüste → Vulkan und Vulkan → Planeten aus der Übersicht, mit dem Wechsel
// des Bretts (Ticket 09 von .scratch/brett-je-himmel/, siehe grenzenAblauf, gut 2 min).
// Seit Ticket 11 von .scratch/brett-je-himmel/ dazu das Protokoll der Arbeit (ARBEIT): bei jeder Lücke über 50 ms die
// Arbeit in ihrem Bild (Vorladen, Aufbauen, Shader, Hochladen, Vorzeichnen, Freigeben), am Ende je Schritt das längste
// Bild und jede Lücke über 100 ms der ganzen Sitzung mit dem Zustand im Bild davor (bewegt sich etwas?).
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
const fallProbe = args.includes('--fall');
const grenzenProbe = args.includes('--grenzen');
const startTaste = args.includes('--start') || menue; // gehaltenes Enter am Startbildschirm (nur Desktop)
const grade = wert('--grad') ? wert('--grad').split(',').map(grad)
  : ganz ? ['leicht'] : finaleGrad || startTaste || uebersichtProbe || dorfProbe || dorfRaenderProbe || wagenProbe
    || fallProbe || grenzenProbe ? []
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
    + '[--wagen] [--fall] [--dpr n] [--messwerte <datei.json>] [--vorher <datei.json>]');
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
/**
 * Warten, bis expr gilt. Hält dabei das Licht über dem Untertitel einer Ankunft an (story.halt; Abnahme Ticket 11 von
 * .scratch/kleiner-wagen/: es wartet ohne Zeitablauf auf Tippen), tippt die Probe wie ein Spieler auf den Untertitel
 * (haltTippen); wo der Halt selbst geprüft wird, vorher mit halt().
 */
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 10; i++) {
    if (await ev(expr).catch(() => false)) return;
    if (!tippeHalt && await ev(`${D}.story.halt === true`).catch(() => false)) await haltTippen();
    await sleep(100);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
let tippeHalt = false, haltGetippt = 0;
/** Das Licht wartet über dem Untertitel (story.halt): auf ihn tippen, bis es weitergeht (nach STORY_FLUG.halt). */
async function haltTippen() {
  tippeHalt = true;
  try {
    await sleep(400); // ein Tippen gleich beim Anhalten gälte noch dem Flug
    for (let n = 0; n < 5 && await ev(`${D}.story.halt === true`); n++) {
      await tippe('#story .caption .text', 'Untertitel (Halt)');
      await sleep(300);
    }
    haltGetippt++;
  } finally { tippeHalt = false; }
}
/**
 * Ankunft in einer Welt (Einstieg, Reise; Abnahme Ticket 11): Das Licht hält über dem Untertitel an und wartet auf
 * Tippen, ohne Zeitablauf. Geprüft: es hält an, die Aufforderung ist zu sehen, das Licht steht still und in der Mitte des
 * freien Raums über dem Text (pruefeLeiste der Station station); nach warten s wartet es noch immer (kein Zeitablauf).
 * Dann tippt die Probe, und es geht weiter (das Licht fällt). name: dazu ein Bild beim Halt.
 */
async function halt(was, { station = null, warten = 0, name = null } = {}) {
  tippeHalt = true;
  try {
    await until(`${D}.story.halt === true`, `${was}: Licht hält an`, 90);
    await sleep(500);
    const ort = () => ev(`(() => { const v = ${D}.story.flare.position.clone().project(${D}.camera);
      return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; })()`);
    const a = await ort();
    const tap = await ev(`(() => { const t = document.querySelector('#story .caption .tap');
      return { text: t.textContent,
        sichtbar: getComputedStyle(t).visibility === 'visible' && t.getClientRects().length > 0 }; })()`);
    pruefe(tap.text === (view.phone ? 'Tippen' : 'Klicken') && tap.sichtbar, `${was}: beim Halt keine Aufforderung `
      + JSON.stringify(tap));
    if (station !== null) await pruefeLeiste(station, `${was} (Halt)`);
    if (name) await bild(name);
    await sleep(warten * 1000);
    const b = await ort(), weiter = await ev(`${D}.story.halt === true && ${D}.story.waitTap !== null`);
    const weg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    pruefe(weiter && weg < 2, `${was}: Das Licht wartet nicht ruhig auf Tippen (nach ${warten + 0.5} s: wartet `
      + `${weiter}, bewegt ${weg.toFixed(1)} px)`);
    console.log(`  ${was}: Licht hält an, nach ${warten + 0.5} s noch ${weiter ? 'wartend' : 'nicht wartend'}, `
      + `${weg.toFixed(1)} px bewegt`);
    await tippe('#story .caption .text', `${was}: Untertitel`);
    await until(`${D}.story.halt === false`, `${was}: weiter nach dem Tippen`, 5);
  } finally { tippeHalt = false; }
}
let fotos = null; // während einer Messung (messe … ende): Zeitfenster der Bilder in der Zeit der Seite
// Ende des letzten Bilds der Probe (Date.now): Eine Messung beginnt frühestens BILD_NACHLAUF_MS danach (messe). Ein Bild
// der Probe hielt die Seite auf dem Handy noch nach seinem Ende an (Lücken bis 280 ms im ersten Bild einer Messung, die
// gleich danach begann, Ticket 11 von .scratch/brett-je-himmel/); das gehört zur Probe, nicht zum Spiel.
let letztesBild = 0;
const BILD_NACHLAUF_MS = 800;
async function bild(name) {
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `${view.name}-${name}.png`);
  const von = await ev('performance.now()');
  writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
  const bis = await ev('performance.now()');
  if (fotos) fotos.push([von, bis]);
  letztesBild = Date.now();
  await ev(`window.__fotos?.push([${von}, ${bis}])`); // fürs Protokoll der Arbeit (ARBEIT)
  console.log(`  Bild ${file}`);
}
const D = '__prismaDebug';
/**
 * Protokoll der Arbeit (Ticket 11 von .scratch/brett-je-himmel/): Vor jedem Laden der Seite schaltet es das Spiel ein
 * (window.__arbeitAn, arbeit in index.html: Himmel, Brett, Shader, Hochladen, Vorzeichnen, erstes Bild, Lichtwelle), und
 * ein eigener requestAnimationFrame zählt jedes Bild der ganzen Sitzung. auswerten ordnet jedem Stück Arbeit das Bild
 * zu, in dem es lief (Lücke bis zum nächsten Bild), ohne die Zeitfenster der Bilder der Probe; je Sitzung (bis zum
 * nächsten Laden, pagehide) in sessionStorage. Am Ende: je Arbeit das längste Bild und die Bilder über 50 und 100 ms,
 * dazu jede Lücke über 100 ms mit ihrer Arbeit (arbeitBericht). Es prüft nichts, es zeigt, wo Vorladen und Aufbauen
 * ein Bild kosten.
 */
const ARBEIT = `window.__arbeitAn = true;
(() => {
  const ts = [], fotos = window.__fotos = [], zustand = new Map();
  // was im Bild vor einer langen Lücke zu sehen war und sich bewegte (Spiel wach, Himmel, Blick, Menü, Übersicht, Bühne)
  const sieht = () => { const d = window.__prismaDebug; if (!d) return null; const s = d.story;
    return { wach: d.sceneLoop.awake, flow: d.flow.state, blick: +s.gaze.toFixed(2), fahrt: s.tweens.length > 0,
      himmel: d.skyTheme.fading || d.skyTheme.moving, menue: d.menu.offen, ueb: d.uebersicht.offen,
      buehne: s.el.dataset.mode === 'scene', verdeckt: d.sceneLoop.covered, feier: d.celebration.active }; };
  let vorher = null;
  const loop = (t) => { const n = ts.push(t); if (n > 1 && t - ts[n - 2] > 100 && vorher) zustand.set(n - 2, vorher);
    vorher = sieht(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__arbeitAuswerten = () => {
    const log = window.__prismaDebug?.arbeit?.log ?? [], je = {}, lang = [];
    const foto = (a, b) => fotos.some(([x, y]) => a < y && b > x);
    let j = 0;
    const bildVon = (t) => { while (j + 1 < ts.length && ts[j + 1] <= t) j++; return ts[j] <= t && j + 1 < ts.length ? j : -1; };
    const imBild = new Map();
    for (const [t, ms, was] of [...log].sort((a, b) => a[0] - b[0])) {
      const i = bildVon(t);
      if (i < 0 || foto(ts[i], ts[i + 1])) continue;
      const d = ts[i + 1] - ts[i], e = je[was] ??= { max: 0, ms: 0, bilder: 0, ueber50: 0, ueber100: 0 };
      if (!imBild.has(i)) imBild.set(i, new Map());
      const m = imBild.get(i);
      if (!m.has(was)) { m.set(was, 0); e.bilder++; if (d > 50) e.ueber50++; if (d > 100) e.ueber100++; }
      m.set(was, m.get(was) + ms);
      e.max = Math.max(e.max, Math.round(d)); e.ms = Math.max(e.ms, +m.get(was).toFixed(1));
    }
    for (const [i, m] of imBild) {
      const d = ts[i + 1] - ts[i];
      if (d > 100) lang.push({ ms: Math.round(d), bei: Math.round(ts[i]), arbeit: [...m].map(([w, x]) => w + ' ' + x.toFixed(1)),
        zustand: zustand.get(i) ?? null });
    }
    return { seite: location.search, je, lang };
  };
  addEventListener('pagehide', () => {
    try {
      const a = JSON.parse(sessionStorage.getItem('__arbeit') ?? '[]');
      a.push(window.__arbeitAuswerten());
      sessionStorage.setItem('__arbeit', JSON.stringify(a));
    } catch (e) { /* ohne Protokoll */ }
  });
})();`;
/** Am Ende des Laufs: alle Sitzungen des Protokolls der Arbeit (ARBEIT) zusammen ausgeben */
async function arbeitBericht() {
  const sitzungen = await ev(`[...JSON.parse(sessionStorage.getItem('__arbeit') ?? '[]'), window.__arbeitAuswerten()]`);
  const je = {};
  for (const s of sitzungen) for (const [was, e] of Object.entries(s.je)) {
    const g = je[was] ??= { max: 0, ms: 0, bilder: 0, ueber50: 0, ueber100: 0 };
    g.max = Math.max(g.max, e.max); g.ms = Math.max(g.ms, e.ms);
    for (const k of ['bilder', 'ueber50', 'ueber100']) g[k] += e[k];
  }
  console.log('\nArbeit beim Vorladen und Aufbauen (je Stück: längstes Bild, in dem es lief; längste Zeit darin im '
    + 'Hauptthread; Bilder, über 50, über 100 ms):');
  for (const [was, e] of Object.entries(je).sort((a, b) => b[1].max - a[1].max)) {
    console.log(`  ${was}: ${e.max} ms (selbst ${e.ms} ms), ${e.bilder} Bilder, über 50 ms ${e.ueber50}, über 100 ms ${e.ueber100}`);
  }
  for (const s of sitzungen) for (const l of s.lang) {
    console.log(`  Lücke ${l.ms} ms bei ${l.bei} ms (${s.seite}): ${l.arbeit.join(', ')}; im Bild davor ${JSON.stringify(l.zustand)}`);
  }
  return je;
}
const storyMode = `(!document.getElementById('story').classList.contains('hidden') && document.getElementById('story')`
  + '.dataset.mode)';
const knoepfe = "document.querySelector('#story .scene .actions').children.length > 0";
const menueOffen = `${D}.menu.offen`;
const slug = (g) => g.replace(' ', '-');
const stand = (g) => ev(`JSON.parse(localStorage.getItem('prisma.noa.${slug(g)}') || 'null')`);
/** Reiter eines Grads im Menü (Sternkarte mit Reitern, Ticket 08 von .scratch/kleiner-wagen/): wählt ihn nur. */
const karte = (g) => `#menue .menue-wahl[data-menue-fokus="wahl:${g}"]`;
/** Einen Grad im Menü wählen wie ein Spieler: seinen Reiter antippen, dann den Knopf darunter (Beginnen, Fortsetzen …). */
async function waehle(g, was = `Grad ${g}`) {
  await tippe(karte(g), `${was}: Reiter`);
  await tippe('#menue .menue-weiter', `${was}: Knopf`);
}
/**
 * Der Wagen auf der Sternkarte des Menüs (gewählter Reiter): wache Sterne (mit dem Polarstern), gezogene Linien, Ring
 * am Stern der Welt, in der das Licht ist, und deren Name; Namen der Welten an ihren Sternen.
 */
const menueWagen = () => ev(`(() => { const q = (s) => document.querySelectorAll('#menue ' + s).length;
  return { gewaehlt: document.querySelector('#menue .menue-grad.menue-an')?.dataset.grad ?? null,
    wach: q('.menue-ks.menue-an'), linien: q('.menue-linie'), ring: q('.menue-ring'),
    jetzt: document.querySelector('#menue .menue-etikett.menue-jetzt tspan')?.textContent ?? null,
    welten: q('.menue-welt') }; })()`);
/**
 * Nichts abgeschnitten (Ticket 08): Knöpfe und Namen am Himmel von root ganz im Bild, auf dem Handy jedes Ziel
 * mindestens 44 px (sichtbare, nicht träge Knöpfe).
 */
async function pruefeImBild(root, was) {
  const r = await ev(`(() => { const aus = [], klein = [];
    for (const el of document.querySelectorAll('${root} button, ${root} text')) {
      const b = el.getBoundingClientRect();
      if (!b.width || el.closest('[inert]') || el.closest('[hidden]')) continue;
      const name = (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 24);
      if (b.left < -0.5 || b.top < -0.5 || b.right > innerWidth + 0.5 || b.bottom > innerHeight + 0.5) aus.push(name);
      if (el.tagName === 'BUTTON' && Math.min(b.width, b.height) < 43.5) klein.push(name + ' ' + Math.round(b.width) + '×' + Math.round(b.height));
    } return { aus, klein }; })()`);
  pruefe(!r.aus.length, `${was}: nicht ganz im Bild: ${r.aus.join(', ')}`);
  pruefe(!view.phone || !r.klein.length, `${was}: Ziele unter 44 px: ${r.klein.join(', ')}`);
}
/** Der Himmel der Übersicht: wache Sterne, gezogene Linien, Level (gelöst, offen), Haufen als Ziele im Himmel. */
const uebHimmel = () => ev(`(() => { const u = document.getElementById('uebersicht'), q = (s) => u.querySelectorAll(s).length;
  const h = u.querySelector('.ueb-stationen').getBoundingClientRect();
  const tabs = [...u.querySelectorAll('.ueb-tab')].map((t) => t.getBoundingClientRect());
  return { wach: q('.ueb-h-stern.ueb-an'), linien: q('.ueb-h-linie'), level: q('.ueb-l'), geloest: q('.ueb-l-schein'),
    offen: q('.ueb-l-ring'), haufen: tabs.length, imHimmel: tabs.every((r) => r.left >= h.left - 1 && r.right <= h.right + 1
      && r.top >= h.top - 1 && r.bottom <= h.bottom + 1), ziel: Math.round(Math.min(...tabs.map((r) => Math.min(r.width, r.height)))) }; })()`);
/**
 * Leiste der Ankunft in Station station (Leiste C, Ticket 08 von .scratch/kleiner-wagen/): die Sterne der Welten davor
 * wach, der Stern dieser Welt mit Ring, spätere blass; Kicker und Text senkrecht in der Mitte, die Leiste unten am Rand,
 * beides ganz im Bild und frei voneinander; das Licht in der Mitte des freien Raums über dem Kicker (lichtHoch, und
 * dort im Bild, wenn der Blick ihm folgt).
 */
async function pruefeLeiste(station, was, { licht = true } = {}) {
  const l = await ev(`(() => { const c = document.querySelector('#story .caption'), s = ${D}.story, cam = ${D}.camera;
    const k = c.querySelector('.kicker').getBoundingClientRect(), t = c.querySelector('.text').getBoundingClientRect();
    const p = c.querySelector('.path svg')?.getBoundingClientRect(), v = s.flare.position.clone().project(cam);
    return { mitte: c.classList.contains('mitte'), st: [...c.querySelectorAll('.path [data-k]')]
      .map((g) => (g.getAttribute('class') || '').replace(' neu', '')), oben: k.top, unten: t.bottom,
      leiste: p ? [p.top, p.bottom, p.left, p.right] : null, H: innerHeight, W: innerWidth, hoch: s.lichtHoch(),
      lichtY: (1 - v.y) / 2 * innerHeight, sichtbar: s.flare.visible && v.z < 1 }; })()`);
  const soll = [1, 2, 3, 4, 5, 6].map((k) => (k < station ? 'wach' : k === station ? 'jetzt' : ''));
  pruefe(l.mitte && JSON.stringify(l.st) === JSON.stringify(soll), `${was}: Leiste ${JSON.stringify(l.st)}`);
  pruefe(Math.abs((l.oben + l.unten) / 2 - l.H / 2) < 6, `${was}: Text nicht in der Mitte ${JSON.stringify(l)}`);
  pruefe(l.leiste && l.leiste[0] - l.unten >= 8 && l.leiste[1] <= l.H && l.leiste[2] >= 0 && l.leiste[3] <= l.W,
    `${was}: Leiste nicht frei unter dem Text ${JSON.stringify(l)}`);
  pruefe(Math.abs(l.hoch - (1 - l.oben / l.H)) < 0.01 && (!licht || !l.sichtbar || Math.abs(l.lichtY - l.oben / 2) < l.H * 0.04),
    `${was}: Licht nicht in der Mitte des freien Raums ${JSON.stringify(l)}`);
}
/** Kachel der Übersicht antippen; zeigt die Übersicht eine andere Welt, erst deren Haufen am Himmel (Station). */
async function tippeKachel(w, l, was) {
  if (await ev(`!!document.querySelector(${JSON.stringify(kachel(w, l))})?.closest('[inert]')`)) {
    await tippe(`#uebersicht .ueb-tab[data-reihe="${w}"]`, `${was}: Station`);
    await until(`!document.querySelector(${JSON.stringify(kachel(w, l))}).closest('[inert]')
      && !document.querySelector('#uebersicht .ueb-spur').getAnimations().length`, `${was}: Seite gezeigt`, 5);
    await sleep(300);
  }
  await tippe(kachel(w, l), was);
}

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
 * (das Spiel selbst rendert im Ruhezustand nur jedes zweite) und schreibt dazu Blick, Zustand des Ablaufs, Himmel
 * (gewählt, gezeigt mit Anteil, überblendet er, bereit, geladen samt Brett) und Brett (__prisma.brett: Himmel, Art,
 * bereit, von, Anteil, Notfall; soll: Art der Brett-Angabe seines Himmels) auf. ende(name) gibt diese Liste zurück und
 * meldet die längste Lücke. Ein Bild der Probe mitten in der Messung hält die Seite an (auf dem Handy bis 0,5 s): Lücken
 * über seinem Zeitfenster zählen nicht.
 */
async function messe({ abKlick = false } = {}) {
  const nachlauf = BILD_NACHLAUF_MS - (Date.now() - letztesBild);
  if (nachlauf > 0) await sleep(nachlauf);
  fotos = [];
  // abKlick: die Dauer zählt ab dem ersten Klick (bzw. Tippen) danach, etwa auf «Weiter» (sonst ab dem ersten Bild)
  await ev(`(() => { const b = window.__bz = { an: true, log: [], ab: null }; const loop = (ts) => { if (!b.an) return;
    const s = ${D}.story, k = ${D}.skyTheme, a = k.entries.find((e) => k.weight[e.id] > 0);
    b.log.push({ ts, gaze: s.gaze, flow: ${D}.flow.state, sky: k.current, ready: k.ready, settled: k.settled,
      shown: a?.id ?? null, w: a ? k.weight[a.id] : 0, blender: !!a?.module?.panorama, fading: k.fading,
      brett: ((br) => ({ ...br, soll: br.himmel && (k.byId.get(br.himmel)?.board?.type ?? 'stone') }))(
        window.__prisma.brett()),
      menu: ${D}.menu.offen,
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
  // Protokoll der Arbeit (ARBEIT) in der Zeit der Messung: was in welchem Bild lief
  const arb = log.length ? await ev(`(${D}.arbeit?.log ?? []).filter(([t]) => t >= ${log[0].ts} && t <= ${log.at(-1).ts})`) : [];
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
    const darin = arb.filter(([t]) => t >= log[i].ts && t < e.ts).map(([, ms, w]) => `${w} ${ms.toFixed(1)}`);
    console.log(`    ${Math.round(d)} ms bei ${Math.round(log[i].ts - log[0].ts)} ms${warum}: ${z(log[i])} → ${z(e)}`
      + (darin.length ? `
      Arbeit darin (ms im Hauptthread): ${darin.join(', ')}` : ''));
  });
  pruefe(ueber(100) === 0, `${name}: ${ueber(100)} Lücken über 100 ms (längste ${Math.round(max)} ms)`);
  brettPasst(log, name);
  return log;
}
/**
 * Unter einem Himmel aus Blender steht nie das Brett eines anderen Himmels oder das Steinbrett als Notfall (Spec
 * .scratch/brett-je-himmel/), wo man das Brett sieht (Blick unter 0,6, weder Menü, Übersicht noch Bühne): ohne
 * Überblenden das Brett des gezeigten Himmels, beim Überblenden (nur während der Himmel überblendet) das neue des
 * gewählten, und zwar in der Art seiner Brett-Angabe im Register (soll; ohne Angabe das Steinbrett).
 */
function brettPasst(log, was) {
  const falsch = log.find((e) => e.blender && e.gaze < 0.6 && !e.menu && !e.ueb && e.story !== 'scene'
    && (e.brett.notfall || e.brett.art !== e.brett.soll
      || (e.brett.anteil === 1 ? e.brett.himmel !== e.shown : !e.fading || e.brett.himmel !== e.sky)));
  pruefe(!falsch, `${was}: unter einem Himmel aus Blender ein fremdes Brett oder das Steinbrett`
    + (falsch ? ` (${JSON.stringify({ ...falsch, blick: undefined })})` : ''));
}
/** Nach einer Wahl im Menü: Es ist sofort weg (blendet aus), nicht erst, wenn die Welt bereit ist. */
async function sofortZu(was) {
  const zu = await ev(`!${menueOffen} && document.getElementById('menue').classList.contains('menue-aus')`);
  pruefe(zu, `${was}: das Menü blendet nach der Wahl nicht sofort aus`);
}
/**
 * Kein leeres Brett: Solange der Blick noch im Himmel ist, kommt der Himmel der Welt; erst wenn er samt seinem Brett ganz
 * da ist, senkt sich der Blick, und sieht man das Brett (Blick unter 0,6), wächst dort schon das Level. Unter einem
 * Himmel aus Blender steht dabei nie ein fremdes Brett oder das Steinbrett als Notfall (das prüft jede Messung, ende).
 */
function ohneLeeresBrett(log, sky, was) {
  const ab = log.findIndex((e) => !e.menu && e.gaze < 0.98);
  pruefe(ab >= 0, `${was}: der Blick senkt sich nicht`);
  if (ab < 0) return;
  pruefe(log[ab].sky === sky && log[ab].ready, `${was}: der Blick senkt sich, bevor ${sky} bereit ist `
    + `(${log[ab].sky}, bereit ${log[ab].ready})`);
  const b = log[ab].brett;
  pruefe(b.himmel === sky && b.bereit && b.anteil === 1 && !b.notfall,
    `${was}: der Blick senkt sich, bevor das Brett von ${sky} bereit ist (${JSON.stringify(b)})`);
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
/**
 * Noas Arm mit der Lampe zeigt zum Polarstern der Bühne (Abnahme Ticket 11), so wie man beide in der Einstellung mit
 * act sieht (Prolog 4 reach, Epilog 3 answer): der Winkel des Arms (scene.arm, Grad) gegen die Richtung im Bild vom
 * Drehpunkt des Arms (440, 592 in der Ebene von Noa, p = 1) zum Polarstern (scene.starAt); dazu, wie steil Noa
 * hinauf leuchtet (Grad über der Waagrechten). Seit Ticket 13 (Abnahme): In Epilog 3 im selben Winkel wie in Prolog 4,
 * mit derselben Rechnung für die Kamera von Prolog 4 (STORY_PROLOG) gegen den Wagen, wie er jetzt liegt; Toleranz wie
 * für den Arm 0,5° (begründet bei WINKEL_TOLERANZ in tests/buehne-messung.mjs). Nach der Einstellung zu prüfen (die
 * Bühne steht noch).
 */
async function pruefeArm(act, was) {
  const r = await ev(`(() => { const sc = ${D}.story.scene, W = innerWidth, H = innerHeight;
    const richtung = (shot) => { const c = sc.ziel(shot)[0];
      const k = (1 + (c.z - 1)) * Math.min(1, 900 * W / H / 820) * Math.max(W / 1600, H / 900); // skala bei p = 1
      const [fx, fy] = sc.starAt(c), dx = fx * W - (W / 2 + (440 - c.x) * k), dy = fy * H - (H / 2 + (592 - c.y) * k);
      return Math.atan2(dy, dx) * 180 / Math.PI; };
    return { arm: sc.arm, soll: richtung(sc.folge.find((s) => s.act === '${act}')),
      prolog: richtung(STORY_PROLOG.find((s) => s.act === 'reach')) }; })()`);
  console.log(`  ${was}: Noa leuchtet ${(-r.soll).toFixed(1)}° über der Waagrechten, Arm ${(-r.arm).toFixed(1)}°`
    + (act === 'reach' ? '' : `, in Prolog 4 ${(-r.prolog).toFixed(1)}°`));
  pruefe(Math.abs(r.arm - r.soll) < 0.5, `${was}: Noas Arm zeigt nicht zum Polarstern (${r.arm.toFixed(1)}° statt `
    + `${r.soll.toFixed(1)}°)`);
  if (act !== 'reach') {
    pruefe(Math.abs(r.soll - r.prolog) < 0.5, `${was}: Noa leuchtet nicht im selben Winkel wie in Prolog 4 `
      + `(${(-r.soll).toFixed(1)}° statt ${(-r.prolog).toFixed(1)}°)`);
  }
}
/**
 * Texte der Bühne in jedem Bild aufzeichnen (Abnahme Ticket 12): je Zeile (.line), «Im Dorf» (.kicker) und Knöpfe
 * (.actions) Text, Deckkraft und Oberkante im Fluss (ohne das eigene Ein- und Ausgleiten über transform).
 */
async function texteAufzeichnen() {
  // gleich in der Seite ausgewertet (je Element das laufende Stück mit demselben Text): Eine lange Aufzeichnung am Ende
  // zu holen, hielte die Seite an
  await ev(`(() => { const a = window.__texte = { an: true, n: 0, laeufe: {}, schlimmst: { weg: 0 } };
    const oben = (el) => { const m = new DOMMatrix(getComputedStyle(el).transform);
      return el.getBoundingClientRect().top - m.m42; };
    const loop = (ts) => {
      if (!a.an) return;
      const sc = document.querySelector('#story .scene');
      if (sc) {
        a.n++;
        const els = [...sc.querySelectorAll('.sub .line'), sc.querySelector('.sub .kicker'),
          sc.querySelector('.actions')];
        els.forEach((el, i) => {
          const k = el.className.split(' ')[0] + i, text = el.textContent, cs = getComputedStyle(el);
          const o = el.childElementCount && el.classList.contains('actions')
            ? Math.min(+cs.opacity, +getComputedStyle(el.firstElementChild).opacity) : +cs.opacity;
          const sichtbar = text && o > 0.02 && cs.visibility === 'visible' && el.getClientRects().length > 0;
          if (!sichtbar || a.laeufe[k]?.text !== text) delete a.laeufe[k];
          if (!sichtbar) return;
          const top = oben(el), m = a.laeufe[k] ??= { text, lo: top, hi: top, ts };
          m.lo = Math.min(m.lo, top);
          m.hi = Math.max(m.hi, top);
          if (m.hi - m.lo > a.schlimmst.weg) {
            a.schlimmst = { weg: +(m.hi - m.lo).toFixed(2), k, text: text.slice(0, 40), ms: Math.round(ts - m.ts) };
          }
        });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop); })()`);
}
/**
 * Kein Text der Bühne verschiebt sich, solange er zu sehen ist (Abnahme Ticket 12: im Epilog rückte der letzte Satz für
 * «Zum Menü» hinauf, im Prolog sprang der vorletzte Satz, als das Angebot mit seinen Knöpfen kam): je Element (Zeilen,
 * «Im Dorf», Knöpfe) und Text höchstens 0,5 px Unterschied der Oberkante im Fluss (ohne das eigene Ein- und Ausgleiten
 * über transform) über alle Bilder mit Deckkraft über 0,02 (texteAufzeichnen).
 */
async function pruefeTexteRuhig(was) {
  const { n, schlimmst } = await ev('(() => { const a = window.__texte; a.an = false; return a; })()');
  console.log(`  ${was}: ${n} Bilder, Texte verschieben sich, solange sie zu sehen sind, höchstens `
    + `${schlimmst.weg.toFixed(1)} px${schlimmst.k ? ` (${schlimmst.k} «${schlimmst.text}…»)` : ''}`);
  pruefe(n > 50 && schlimmst.weg <= 0.5, `${was}: Text verschiebt sich nach dem Erscheinen `
    + JSON.stringify(schlimmst));
}
async function buehneDurch(name, { bisKnoepfe = false, saetze = null } = {}) {
  if (saetze) await texteAufzeichnen();
  for (let n = 1; ; n++) {
    await until(`${D}.story.waitTap !== null || ${storyMode} !== 'scene' || ${knoepfe}`, `${name}: Einstellung ${n}`,
      60);
    if (saetze && n <= saetze.length && await ev(`${storyMode} === 'scene'`)) {
      await pruefeSatz(SATZ_BUEHNE, saetze[n - 1], `${name}, Einstellung ${n}`);
    }
    // Knöpfe: am Ende des Epilogs mit dem letzten Satz, nach dem Prolog das Angebot (prüft angebot)
    if (await ev(knoepfe)) {
      pruefe(!saetze || n >= saetze.length, `${name}: Knöpfe nach ${n} statt ${saetze?.length} Einstellungen`);
      await bild(`${name}-ende`);
      if (saetze) { await sleep(2500); await pruefeTexteRuhig(name); } // bis Knöpfe und Satz ganz eingeblendet sind
      return;
    }
    if (!(await ev(`${D}.story.waitTap !== null`))) {
      if (saetze) await pruefeTexteRuhig(name);
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
  await brettDerWelt(`${g} ${platz + 1}`);
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
/**
 * Das Brett passt zum Himmel der Welt (bzw. des Dorfs): sein Himmel, in der Art seiner Brett-Angabe im Register (soll),
 * bereit, kein Notfall.
 */
async function brettDerWelt(was) {
  const r = await ev(`(() => { const s = ${D}.story;
    const welt = s.inDorf ? STORY_DORF.sky : STORY_CHAPTERS[s.steps[s.step].c].sky;
    return { welt, sky: ${D}.skyTheme.current, brett: window.__prisma.brett(),
      soll: ${D}.skyTheme.byId.get(welt)?.board?.type ?? 'stone' }; })()`);
  pruefe(r.sky === r.welt && r.brett.himmel === r.welt && r.brett.art === r.soll && r.brett.bereit && !r.brett.notfall,
    `${was}: Himmel und Brett passen nicht zur Welt ${JSON.stringify(r)}`);
}
async function kopfzeile(g, platz) {
  const w = Math.floor(platz / 10), k = platz % 10;
  const titel = await ev("document.getElementById('hud-title').textContent");
  const z = await ev(`(() => { const grad = document.getElementById('hud-grad');
    return { ziele: document.getElementById('hud-ziele').textContent, grad: grad.hidden ? null : grad.textContent,
      sub: document.getElementById('hud-sub').textContent }; })()`);
  const name = await ev(`(() => { const l = LEVELS[${D}.game.levelIndex]; return l.titel ?? l.name; })()`);
  pruefe(titel === `${WELTEN[w]} – ${name}`, `${g} ${platz + 1}: Titel «${titel}»`);
  // der Grad hinter den Zielen, keine Unterzeile (Kapitel, Level und Bedienung seit dem 09.11.2026 nicht mehr); den
  // Platz prüft der Stand der Geschichte
  pruefe(/^Ziele \d+ \/ \d+$/.test(z.ziele) && z.grad === GRAD_TEXT[g] && z.sub === '',
    `${g} ${platz + 1}: Ziele und Grad ${JSON.stringify(z)}`);
  const stand = await ev(`(() => { const s = ${D}.story; return { step: s.step, c: s.steps[s.step].c,
    k: s.steps.filter(x => x.c === s.steps[s.step].c).indexOf(s.steps[s.step]) }; })()`);
  pruefe(stand.step === platz && stand.c === w && stand.k === k, `${g} ${platz + 1}: Stand ${JSON.stringify(stand)}`);
}

/** Durchgang: neuer Stand, Prolog, Einstieg, welten × 10 Level mit den Reisen, dann «Weiter» nach dem Neuladen. */
async function durchgang(g, erster) {
  console.log(`${view.name}, ${g}: Durchgang durch ${welten} Welten`);
  await laden();
  if (erster) { await sleep(2500); await bild('menue-neu'); }
  pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'wahl:leicht', `${g}: Fokus im neuen Menü`);
  await waehle(g, `Karte ${g}`);
  await sofortZu(`${g}: Beginnen`);
  await until(`${storyMode} === 'scene'`, `${g}: Prolog`);
  if (erster) {
    await buehneDurch(`${slug(g)}-prolog`, { saetze: PROLOG_SAETZE });
    await pruefeArm('reach', `${g}: Prolog 4`);
  } else {
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
  await pruefeLeiste(1, `${g}: Einstieg in den Bergwald`, { licht: false });
  await halt(`${g}: Einstieg in den Bergwald`, { station: 1, warten: erster ? 3 : 0,
    name: erster ? `${slug(g)}-einstieg-halt` : null });
  for (let w = 0; w < welten; w++) {
    for (let k = 0; k < 10; k++) await level(g, w * 10 + k, { bilder: k === 0 });
    await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
      + `'Kapitel ${w + 2} · ${WELTEN[w + 1]}'`, `${g}: Reise in Welt ${w + 2}`, 60);
    await pruefeSatz(SATZ_UNTERTITEL, ANKUNFT[w + 1], `${g}: Reise in Welt ${w + 2}`);
    // «Menü» und «Neu starten» wirken auf der Reise nicht: Die Knöpfe sind weg (Ticket 08)
    pruefe(await ev("document.getElementById('controls').inert"), `${g}: Knöpfe auf der Reise in Welt ${w + 2}`);
    await sleep(2500);
    await bild(`${slug(g)}-reise-${w + 2}`);
    await pruefeLeiste(w + 2, `${g}: Reise in Welt ${w + 2}`);
    await halt(`${g}: Reise in Welt ${w + 2}`, { station: w + 2, warten: erster && w === 0 ? 3 : 0,
      name: erster ? `${slug(g)}-reise-${w + 2}-halt` : null });
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
  await pruefeLeiste(6, `${g}: Einstieg in die Sterne`, { licht: false });
  await sleep(1800);
  await bild(`${slug(g)}-einstieg-sterne`);
  await halt(`${g}: Einstieg in die Sterne`, { station: 6 });
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
  await pruefeArm('answer', `${g}: Epilog 3`);
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
  await pruefeWagenEinmal(`${g}: Menü nach dem Epilog`);
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
  await waehle(naechster, `Karte ${naechster}`);
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
  await waehle(g, `Karte ${g}`);
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
  await pruefeLeiste(1, `${g}: Einstieg in den Bergwald`, { licht: false });
  await sleep(1800);
  await bild(`${slug(g)}-einstieg`);
  await halt(`${g}: Einstieg in den Bergwald`, { station: 1 });
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
    await pruefeLeiste(w + 2, `${g}: Reise in Welt ${w + 2}`);
    await halt(`${g}: Reise in Welt ${w + 2}`, { station: w + 2 });
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
  await pruefeImBild('#menue', 'Menü');
  // der Wagen je Grad auf der Sternkarte (Ticket 08 von .scratch/kleiner-wagen/): mitten im Durchgang (Leicht im Meer,
  // Mittel in der Wüste, Schwer im Bergwald) und geschafft; nicht begonnen nach «Von vorn» (unten)
  const wagenSoll = { leicht: [1, 0, 'Meer'], schwer: [0, 0, 'Bergwald'], 'sehr schwer': [7, 7, null], mittel: [2, 1, 'Wüste'] };
  for (const [g, [wach, linien, jetzt]] of Object.entries(wagenSoll)) {
    await tippe(karte(g), `Reiter ${g}`);
    await sleep(300);
    const w = await menueWagen();
    pruefe(w.gewaehlt === g && w.wach === wach && w.linien === linien && w.jetzt === jetzt && w.ring === (jetzt ? 1 : 0)
      && w.welten === 6, `Wagen im Menü, ${g}: ${JSON.stringify(w)}`);
    if (g !== 'mittel') await bild(`menue-wagen-${slug(g)}`);
  }
  pruefe(await ev("document.querySelector('#menue .menue-was').textContent") === 'Weiter', 'Knopf bei Mittel: nicht «Weiter»');

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
  // Tasten gehören dem Menü: R startet das Level darunter nicht neu. Pfeil ab: vom Knopf auf den ersten Reiter, er
  // ist gewählt (Karte und Knopf zeigen Leicht); noch einmal: Mittel (Ticket 08 von .scratch/kleiner-wagen/)
  if (!view.phone) {
    await taste('ArrowDown');
    const pfeil = await ev(`({ fokus: document.activeElement?.dataset.menueFokus,
      gewaehlt: document.querySelector('#menue .menue-grad.menue-an')?.dataset.grad,
      knopf: document.querySelector('#menue .menue-wohin').textContent })`);
    pruefe(pfeil.fokus === 'wahl:leicht' && pfeil.gewaehlt === 'leicht' && pfeil.knopf === 'Leicht · Meer 12 / 60',
      `Pfeil ab im Menü ${JSON.stringify(pfeil)}`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'r', code: 'KeyR', windowsVirtualKeyCode: 82 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'r', code: 'KeyR', windowsVirtualKeyCode: 82 });
    await sleep(300);
    pruefe(await ev(`${D}.flow.state`) === 'play', 'R im Menü startete das Level darunter neu');
    await taste('ArrowDown');
  }

  // zurück ins selbe Level: es steht noch da, die Drehung bleibt (Desktop: Enter auf dem Reiter Mittel)
  await messe();
  if (view.phone) await tippe('#menue .menue-weiter', 'Weiter');
  else {
    pruefe(await ev('document.activeElement?.dataset.menueFokus') === 'wahl:mittel', 'Fokus vor Enter auf Mittel');
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
  await waehle('schwer', 'Karte Schwer');
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
    knopf: document.querySelector('#menue .menue-wohin').textContent,
    weiter: document.querySelector('#menue .menue-grad.menue-zuletzt')?.dataset.grad ?? null,
    welten: document.querySelectorAll('#menue .menue-welt').length })`);
  // der Reiter Schwer bleibt gewählt; «Weiter» gehört jetzt Mittel (zuletzt gespielt unter den begonnenen)
  pruefe(vonvorn.schwer === null && vonvorn.mittel && vonvorn.leicht && vonvorn.karte === 'noch nicht begonnen'
    && vonvorn.offen && vonvorn.fokus === 'wahl:schwer' && vonvorn.knopf === 'Schwer · noch nicht begonnen'
    && vonvorn.weiter === 'mittel' && vonvorn.welten === 6, `Von vorn ${JSON.stringify(vonvorn)}`);
  const neuW = await menueWagen();
  pruefe(neuW.gewaehlt === 'schwer' && neuW.wach === 0 && neuW.linien === 0 && neuW.ring === 0 && neuW.jetzt === null,
    `Wagen im Menü, Schwer nicht begonnen: ${JSON.stringify(neuW)}`);
  await bild('menue-von-vorn');
  if (!view.phone) { // das Level von Schwer gilt nicht mehr: Esc führt nicht dorthin zurück
    await taste('Escape');
    pruefe(await ev(menueOffen), 'Esc nach «Von vorn» des laufenden Grads schloss das Menü');
  }

  // ein neuer Grad aus dem Spiel heraus: Prolog, das alte Brett von Schwer versinkt darunter, Einstieg, erstes Level
  await messe();
  await waehle('schwer', 'Karte Schwer');
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
  pruefe(u.modus === 'seiten' && u.seite.startsWith('Meer: 3 von 10'),
    `Übersicht: Darstellung ${JSON.stringify(u)}`);
  // Himmel (Ticket 08): Stern des Bergwalds wach, noch keine Linie, 13 Level gelöst, eines offen, sechs Haufen
  const himmel = await uebHimmel();
  pruefe(himmel.wach === 1 && himmel.linien === 0 && himmel.level === 60 && himmel.geloest === 13 && himmel.offen === 1
    && himmel.haufen === 6 && himmel.imHimmel && himmel.ziel >= 44, `Himmel der Übersicht ${JSON.stringify(himmel)}`);
  await pruefeImBild('#uebersicht', 'Übersicht aus dem Spiel');
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
    await tippeKachel(3, 4, 'gesperrte Kachel Vulkan 5');
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
  if (view.phone) await tippeKachel(0, 0, 'Kachel Bergwald 1');
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
  await tippeKachel(0, 9, 'Kachel Bergwald 10');
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
  pruefe(sinkt?.sky === 'beach' && sinkt.settled, `Weiter ins Meer: das Level versinkt, bevor Himmel und Brett geladen `
    + `sind (${JSON.stringify(sinkt)})`);
  // das Brett wechselt mit: vom Wald direkt ins Meer, gleichzeitig mit dem Himmel (Beginn und Ende je höchstens ein Bild
  // auseinander), steigend, am Ende das Brett des Meers
  const bf = log.filter((e) => e.brett.von === 'forest' && e.brett.himmel === 'beach');
  const a0 = log.indexOf(bf[0]), a1 = log.indexOf(bf.at(-1)) + 1;
  const h0 = log.findIndex((e) => !(e.shown === 'forest' && e.w === 1)), h1 = log.findIndex((e) => e.shown === 'beach' && e.w === 1);
  const steigt = bf.every((e, i) => i === 0 || e.brett.anteil >= bf[i - 1].brett.anteil);
  pruefe(bf.length > 10 && steigt && bf.every((e) => e.fading) && Math.abs(a0 - h0) <= 1 && Math.abs(a1 - h1) <= 1
    && log.at(-1).brett.himmel === 'beach' && log.at(-1).brett.anteil === 1,
  `Weiter ins Meer: das Brett wechselt nicht mit dem Himmel (Brett Bild ${a0}–${a1}, Himmel ${h0}–${h1}, `
    + `${bf.length} Bilder, steigend ${steigt}, am Ende ${JSON.stringify(log.at(-1).brett)})`);
  console.log(`  Weiter ins Meer: Brett und Himmel blenden über ${((log[h1]?.ts - log[h0]?.ts) / 1000).toFixed(2)} s`);
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
  await tippeKachel(1, 2, 'Kachel Meer 3');
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
  await tippe(karte('leicht'), 'Reiter Leicht');
  await sleep(400);
  const aktion = await ev(`(() => { const a = document.querySelector('#menue .menue-weiter .menue-was'),
    r = a.getBoundingClientRect(); return { text: a.textContent, sichtbar: r.width > 0 && r.right <= innerWidth
      && r.bottom <= innerHeight && getComputedStyle(a).display !== 'none' }; })()`);
  pruefe(aktion.text === 'Übersicht' && aktion.sichtbar, `Knopf beim Reiter Leicht ${JSON.stringify(aktion)}`);
  await bild('uebersicht-menue');
  await messe();
  await waehle('leicht', 'Karte Leicht');
  await until(`${uebOffen} && !${menueOffen}`, 'Übersicht aus dem Menü', 10);
  await sleep(1200);
  await ende('Menü → Übersicht');
  await bild('uebersicht-aus-dem-menue');
  u = await uebStand();
  pruefe(u.geloest === 60 && u.offen === 0 && u.gesperrt === 0 && u.geschafft && u.aktuell === null
    && u.kopf.includes('Geschafft') && u.kopf.includes('49:30'), `Übersicht Leicht ${JSON.stringify(u)}`);
  const himmelL = await uebHimmel();
  pruefe(himmelL.wach === 7 && himmelL.linien === 7 && himmelL.level === 60 && himmelL.geloest === 60 && himmelL.offen === 0
    && himmelL.imHimmel, `Himmel der Übersicht, Leicht geschafft ${JSON.stringify(himmelL)}`);
  await pruefeImBild('#uebersicht', 'Übersicht aus dem Menü');
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
  await waehle('leicht', 'Karte Leicht');
  await until(`${uebOffen}`, 'Übersicht aus dem Menü', 10);
  await sleep(600);
  if (view.phone) await tippe(`${UEB} .ueb-tab[data-reihe="5"]`, 'Station Sterne');
  await messe();
  await tippeKachel(5, 8, 'Kachel Sterne 9');
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
  await tippe(karte('leicht'), 'Reiter Leicht');
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
  await tippeKachel(0, 9, 'Kachel Bergwald 10');
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

/**
 * Stand der Führung (Ticket 02 von .scratch/tutorial-fuehrung/): Schritt, Satz, «Weiter», Umrisse (Mitte im Bild) und
 * Hand (Geste, Lage), dazu wo die Elemente bei x, z im Bild liegen (Mitte bzw. Kuppe der Hand), in Pixeln des Layouts.
 */
const fuehrungStand = () => ev(`(() => { const f = ${D}.fuehrung, b = document.getElementById('fuehrung');
  const satz = document.querySelector('#hud-sub .hinweis.schritt'), knopf = document.querySelector('#hud-sub .fuehrung-weiter');
  const zu = (e) => !e || e.hidden || e.closest('[hidden]') || e.closest('.hidden') || !e.getClientRects().length;
  const sichtbar = b && b.style.display !== 'none';
  const umrisse = sichtbar ? [...b.querySelectorAll('.fz-umriss')].filter((p) => p.style.display !== 'none')
    .map((p) => { const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      stark: p.classList.contains('stark') }; }) : [];
  const h = b?.querySelector('.fz-hand'), hand = sichtbar && h.style.display !== 'none'
    ? { art: h.dataset.art, x: h.getScreenCTM().e, y: h.getScreenCTM().f } : null;
  const c = ${D}.renderer.domElement.getBoundingClientRect();
  const ort = (z, hoehe) => { const el = ${D}.game.board.elements.find((e) => e.x + ',' + e.z === z);
    const v = ${D}.game.objects.get(el.id).getWorldPosition(new ${D}.camera.position.constructor());
    v.y += hoehe; v.project(${D}.camera);
    return { x: c.left + (v.x + 1) / 2 * c.width, y: c.top + (1 - v.y) / 2 * c.height }; };
  return { schritt: f.schritt, fertig: f.fertig, spaet: f.spaet, satz: zu(satz) ? null : satz.firstChild.textContent,
    knopf: !zu(knopf), stups: !!knopf?.classList.contains('stups'), umrisse, hand,
    ziel: ort('4,0', 0), spiegel: ort('4,3', 0), kuppe: ort('4,3', 0.42), tippen: ort('4,3', 0.375) }; })()`);
const nahe = (a, b, px = 12) => !!a && Math.hypot(a.x - b.x, a.y - b.y) <= px;
/**
 * «Erstes Licht» geführt, wie ein Spieler (Ticket 02 der Führung): Schritt 1 erklärt das Ziel (Umriss um den Kristall,
 * «Weiter», keine Hand); Neustart beginnt wieder bei Schritt 1; «Weiter» → Schritt 2 (Satz in der Befehlsform des
 * Geräts, Umriss und Hand am Spiegel, die Hand geht nach dem Vorzeigen); später Fingerzeig (vorgespult: Hand wieder,
 * Umriss stark); Menü und zurück behält den Schritt; dann den Spiegel antippen: gelöst, nichts bleibt stehen.
 */
async function gefuehrt(g) {
  const was = `${g}, Erstes Licht geführt`;
  await until(`${D}.fuehrung.los && ${D}.fuehrung.level?.name === 'Erstes Licht'`, `${was}: Führung läuft`, 10);
  await sleep(300);
  const schritt1 = async (wann) => {
    const f = await fuehrungStand();
    pruefe(f.schritt === 0 && f.satz === 'Bring das Licht zum Kristall, dann leuchtet er.' && f.knopf && !f.hand
      && f.umrisse.length === 1 && nahe(f.umrisse[0], f.ziel, 15), `${was} (${wann}): Schritt 1 ${JSON.stringify(f)}`);
  };
  await schritt1('Beginn');
  await tippe('#hud-sub .fuehrung-weiter', `${was}: Weiter`);
  await until(`${D}.fuehrung.schritt === 1`, `${was}: Schritt 2`, 5);
  // Neustart: wieder bei Schritt 1. Zur Probe der Anschlüsse bekommt die Übung bis dahin Hinweise nebenbei (die
  // echten verteilt Ticket 03): Die Kamerageste beendet den zur Kamera, der Neustart den zum Neustart, und beim
  // Neustart derselben Übung kommt keiner wieder
  const neben = () => ev(`(() => { const n = document.querySelector('#hud-sub .hinweis.nebenbei');
    return n && !n.hidden ? n.textContent : ''; })()`);
  const neustart = async (wann) => {
    await tippe('#btn-restart', `${was}: Neustart`);
    await until(`${D}.flow.state === 'in'`, `${was}: Neustart wächst`, 10);
    await until(`window.__prisma.playing() && ${D}.fuehrung.los`, `${was}: ${wann}`, 20);
    await sleep(300);
  };
  await ev(`LEVELS[0].nebenbei = ['kamera', 'neustart']`);
  try {
    await neustart('nach dem Neustart');
    const [kamera, neu] = await ev(`[NEBENBEI.kamera.text, NEBENBEI.neustart.text].map((t) => t[${view.phone ? 0 : 1}])`);
    let n = await neben();
    pruefe(n === `${kamera} ${neu}`, `${was}: Hinweise nebenbei «${n}»`);
    const c = await ev(`(() => { const r = ${D}.renderer.domElement.getBoundingClientRect();
      return { x: r.left + r.width * 0.2, y: r.top + r.height * 0.75 }; })()`);
    await scrolle(c.x, c.y, view.phone ? 120 : 40); // Handy: wischen dreht die Kamera, Desktop: das Mausrad zoomt
    n = await neben();
    pruefe(n === neu, `${was}: nach der Kamerageste «${n}»`);
    await neustart('nach dem zweiten Neustart');
    n = await neben();
    pruefe(n === '', `${was}: nach dem Neustart noch Hinweise nebenbei «${n}»`);
  } finally { await ev('delete LEVELS[0].nebenbei'); }
  await schritt1('nach dem Neustart');
  await tippe('#hud-sub .fuehrung-weiter', `${was}: Weiter`);
  await until(`${D}.fuehrung.schritt === 1`, `${was}: Schritt 2`, 5);
  await sleep(200);
  let f = await fuehrungStand();
  const satz2 = `${view.phone ? 'Tippe' : 'Klicke'} den Spiegel an, so dreht er sich.`;
  pruefe(f.satz === satz2 && !f.knopf && f.umrisse.length === 1 && nahe(f.umrisse[0], f.spiegel, 15)
    && f.hand?.art === 'tippen' && nahe(f.hand, f.kuppe, 3), `${was}: Schritt 2 ${JSON.stringify(f)}`);
  await bild(`dorf-${slug(g)}-fuehrung-schritt-2`);
  await sleep(2800); // die Hand zeigt einmal vor und geht
  f = await fuehrungStand();
  pruefe(!f.hand && f.umrisse.length === 1 && !f.spaet, `${was}: Hand nach dem Vorzeigen ${JSON.stringify(f)}`);
  await ev(`${D}.fuehrung.vorspulen()`);
  f = await fuehrungStand();
  pruefe(f.spaet && f.hand?.art === 'tippen' && f.umrisse[0]?.stark, `${was}: später Fingerzeig ${JSON.stringify(f)}`);
  // Menü und zurück: derselbe Schritt, darunter nichts über dem Brett
  if (view.phone) await tippe('#btn-menu', 'Menü');
  else await taste('Escape');
  await until(`${menueOffen} && !${D}.story.tweens.length`, `${was}: Menü`, 10);
  f = await fuehrungStand();
  pruefe(!f.umrisse.length && !f.hand, `${was}: unter dem Menü ${JSON.stringify(f)}`);
  if (view.phone) await tippe('#menue .menue-weiter', 'Weiter');
  else await taste('Escape');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && !${D}.story.running`, `${was}: zurück`, 15);
  f = await fuehrungStand();
  pruefe(f.schritt === 1 && f.satz === satz2 && f.umrisse.length === 1 && nahe(f.umrisse[0], f.spiegel, 15),
    `${was}: nach dem Menü ${JSON.stringify(f)}`);
  // den Spiegel antippen wie ein Spieler: gelöst, die Führung ist durch
  await tippeBei(f.tippen.x, f.tippen.y);
  await until(`${D}.game.result.solved`, `${was}: Spiegel angetippt`, 5);
  f = await fuehrungStand();
  pruefe(f.fertig && f.satz === null && !f.umrisse.length && !f.hand, `${was}: gelöst ${JSON.stringify(f)}`);
}

/**
 * Stand der Führung in einer beliebigen Übung (Ticket 03 der Führung): wie fuehrungStand, dazu die Lage der Elemente
 * in den Zellen zellen (Mitte am Brett, Kuppe der Hand, Punkt zum Antippen) und ob Satz, «Weiter» und Hinweise
 * nebenbei ganz im Bild stehen, ohne Abschneiden (keine Ellipse, nichts breiter als sein Kasten) und ohne die Knöpfe
 * unten rechts oder «Überspringen» zu berühren.
 */
const fuehrungIn = (zellen) => ev(`(() => { const f = ${D}.fuehrung, b = document.getElementById('fuehrung');
  const satz = document.querySelector('#hud-sub .hinweis.schritt'), knopf = document.querySelector('#hud-sub .fuehrung-weiter');
  const neben = document.querySelector('#hud-sub .hinweis.nebenbei');
  const zu = (e) => !e || e.hidden || e.closest('[hidden]') || e.closest('.hidden') || !e.getClientRects().length;
  const sichtbar = b && b.style.display !== 'none';
  const umrisse = sichtbar ? [...b.querySelectorAll('.fz-umriss')].filter((p) => p.style.display !== 'none')
    .map((p) => { const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      stark: p.classList.contains('stark') }; }) : [];
  const h = b?.querySelector('.fz-hand'), hand = sichtbar && h.style.display !== 'none'
    ? { art: h.dataset.art, x: h.getScreenCTM().e, y: h.getScreenCTM().f } : null;
  const c = ${D}.renderer.domElement.getBoundingClientRect();
  const ort = (z, hoehe) => { const el = ${D}.game.board.elements.find((e) => e.x + ',' + e.z === z);
    const v = ${D}.game.objects.get(el.id).getWorldPosition(new ${D}.camera.position.constructor());
    v.y += hoehe; v.project(${D}.camera);
    return { x: c.left + (v.x + 1) / 2 * c.width, y: c.top + (1 - v.y) / 2 * c.height }; };
  const orte = Object.fromEntries(${JSON.stringify(zellen)}.map((z) => [z,
    { mitte: ort(z, 0), kuppe: ort(z, 0.42), tippen: ort(z, 0.375) }]));
  // ganz im Bild: jede Zeile des Texts im Fenster, kein Kasten breiter als sein Inhalt erlaubt, kein Knopf darüber
  const w = innerWidth, hh = innerHeight, schnitt = (a, r) => r.width > 0 && a.left < r.right && a.right > r.left
    && a.top < r.bottom && a.bottom > r.top;
  const knoepfe = [document.getElementById('controls'), document.getElementById('btn-skip')]
    .filter((e) => !zu(e)).map((e) => e.getBoundingClientRect());
  const imBild = (e) => { if (zu(e)) return true; const g = document.createRange(); g.selectNodeContents(e);
    const zeilen = [...g.getClientRects()], rs = [...zeilen, e.getBoundingClientRect()];
    // im Fenster auch der Kasten; die Knöpfe berührt kein Text (je Zeile, der Kasten ist breiter als sein Text)
    return rs.every((r) => r.left >= 0 && r.right <= w + 0.5 && r.top >= 0 && r.bottom <= hh + 0.5)
      && !zeilen.some((r) => knoepfe.some((k) => schnitt(r, k))) && e.scrollWidth <= e.clientWidth + 1
      && getComputedStyle(e).textOverflow !== 'ellipsis'; };
  return { schritt: f.schritt, fertig: f.fertig, spaet: f.spaet, satz: zu(satz) ? null : satz.firstChild.textContent,
    knopf: !zu(knopf), umrisse, hand, orte, neben: zu(neben) ? '' : neben.textContent,
    imBild: imBild(satz) && imBild(knopf) && imBild(neben),
    teile: [imBild(satz), imBild(knopf), imBild(neben)].join(), zeilen: zu(satz) ? 0 : Math.round(satz.firstChild
      .getClientRects().length) }; })()`);
/**
 * Die Führung der laufenden Übung n steht beim Schritt k (Ticket 04 der Führung, Unterbrechungen mitten in ihr): sein
 * Satz in der Kopfzeile, je Element ein Umriss, «Weiter» nur an einer Erklärung.
 */
async function schrittIst(n, k, was) {
  await until(`${D}.fuehrung.los && ${D}.fuehrung.level === LEVELS[${n}] && ${D}.flow.state === 'play'`,
    `${was}: Führung läuft`, 15);
  await sleep(300);
  const s = await ev(`(({ text, bei, weiter }) => ({ text: geraeteText(text, ${view.phone}),
    zellen: [].concat(bei ?? []).length, erklaerung: weiter === 'erklaerung' }))(LEVELS[${n}].schritte[${k}])`);
  const f = await fuehrungIn([]);
  pruefe(f.schritt === k && !f.fertig && f.satz === s.text && f.knopf === s.erklaerung && f.umrisse.length === s.zellen,
    `${was}: Schritt ${k + 1} erwartet ${JSON.stringify(f)}`);
  console.log(`  ${was}: Schritt ${k + 1} «${f.satz}»`);
}
/** Langes Drücken (Handy) bzw. Rechtsklick (Desktop) bei (x, y): dreht ein drehbares Element zurück. */
async function halteBei(x, y) {
  if (view.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await sleep(650); // länger als INPUT.longPressMs
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'right', clickCount: 1 });
    }
  }
}
/**
 * Jeden Schritt einer Übung spielen wie ein Spieler (Ticket 03 der Führung): je Schritt Satz in der Befehlsform des
 * Geräts, «Weiter» nur an Erklärungen, je Element des Schritts ein Umriss an seiner Lage, die Hand mit der Geste des
 * Schritts am ersten Element, Satz und Hinweise nebenbei ganz im Bild. Dann die Handlung: «Weiter» tippen, das Element
 * antippen (ein festes weigert sich), drehen (zurück mit langem Drücken bzw. Rechtsklick) oder drehen, bis der Strahl
 * trifft. Wer so folgt, löst die Übung nicht vor ihrem letzten Schritt; den Rest löst die Probe (loese).
 */
async function schritteSpielen(g, n) {
  const was = `${g}, Übung ${n + 1} geführt`;
  await until(`${D}.fuehrung.los && ${D}.fuehrung.level === LEVELS[${n}] && ${D}.flow.state === 'play'`,
    `${was}: Führung läuft`, 10);
  const { schritte, nebenbei } = await ev(`({ schritte: LEVELS[${n}].schritte.map((s) => ({ ...s,
    text: geraeteText(s.text, ${view.phone}) })), nebenbei: (LEVELS[${n}].nebenbei ?? [])
    .map((k) => NEBENBEI[k].text[${view.phone ? 0 : 1}]).join(' ') })`);
  const handArt = (s) => (s.weiter === 'erklaerung' || (s.weiter === 'strahl' && !s.trifft) ? null
    : s.richtung === -1 ? (view.phone ? 'halten' : 'rechtsklick') : 'tippen');
  for (let k = 0; k < schritte.length; k++) {
    const s = schritte[k], zellen = [].concat(s.bei ?? []);
    await until(`${D}.fuehrung.schritt === ${k} || ${D}.fuehrung.fertig`, `${was}: Schritt ${k + 1}`, 10);
    // vor dem ersten Schritt wartete die Probe (Knöpfe, Bild), die Hand hat schon vorgezeigt: noch einmal beginnen
    if (k === 0) await ev(`${D}.fuehrung.beginneSchritt()`);
    await sleep(250);
    const f = await fuehrungIn(zellen);
    pruefe(!f.fertig, `${was}: schon in Schritt ${k + 1} gelöst`);
    if (f.fertig) return;
    const umrandet = zellen.every((z) => f.umrisse.some((u) => nahe(u, f.orte[z].mitte, 15)));
    const art = handArt(s);
    pruefe(f.satz === s.text && f.knopf === (s.weiter === 'erklaerung') && f.umrisse.length === zellen.length
      && umrandet && (art ? f.hand?.art === art && nahe(f.hand, f.orte[zellen[0]].kuppe, 3) : !f.hand)
      && f.imBild && f.neben === (k === 0 ? nebenbei : f.neben), `${was}: Schritt ${k + 1} ${JSON.stringify(f)}`);
    if (k === 0 && nebenbei) console.log(`  ${was}: Hinweis nebenbei «${f.neben}»`);
    console.log(`  ${was}: Schritt ${k + 1} «${f.satz}» (${f.zeilen} Zeile${f.zeilen === 1 ? '' : 'n'})`);
    if (s.weiter === 'erklaerung') {
      await tippe('#hud-sub .fuehrung-weiter', `${was}: Weiter`);
    } else {
      // die Geste am ersten Element des Schritts, beim Strahl so oft, bis er trifft (höchstens eine Runde)
      for (let i = 0; i < 8; i++) {
        const p = f.orte[zellen[0]].tippen;
        if (s.richtung === -1) await halteBei(p.x, p.y);
        else await tippeBei(p.x, p.y);
        await sleep(450);
        if (await ev(`${D}.fuehrung.schritt > ${k} || ${D}.fuehrung.fertig`)) break;
        if (s.weiter !== 'strahl') break;
      }
    }
    await until(`${D}.fuehrung.schritt > ${k} || ${D}.fuehrung.fertig`, `${was}: Schritt ${k + 1} erfüllt`, 5);
    const fertig = await ev(`${D}.fuehrung.fertig`);
    pruefe(!fertig || k === schritte.length - 1, `${was}: nach Schritt ${k + 1} gelöst`);
    if (fertig) break;
  }
  // nach den Schritten: der letzte Satz bleibt stehen, bis die Übung gelöst ist
  if (!(await ev(`${D}.game.result.solved`))) {
    const f = await fuehrungIn([]);
    pruefe(f.satz === schritte.at(-1).text && !f.knopf && f.imBild, `${was}: nach den Schritten ${JSON.stringify(f)}`);
    await ev(`${D}.loese()`);
  }
}

/**
 * Eine Übung im Dorf: warten, bis sie läuft, Kopfzeile prüfen (seit Ticket 03 der Führung der Satz des ersten Schritts
 * statt des Hinweises), lösen, «Gelöst» prüfen, Weiter. fuehren: 'erstes' spielt «Erstes Licht» mit den Proben des
 * Gerüsts (gefuehrt), true jeden Schritt der Übung (schritteSpielen), sonst löst die Probe an den Schritten vorbei.
 */
async function uebung(g, n, { bilder = false, weiter = true, replay = false, fuehren = false } = {}) {
  await until(`${D}.story.inDorf && ${D}.story.uebung === ${n} && window.__prisma.playing()`,
    `${g}: Übung ${n + 1} läuft`, 60);
  const k = await ev(`({ titel: document.getElementById('hud-title').textContent,
    sub: document.getElementById('hud-sub').textContent,
    grad: document.getElementById('hud-grad').hidden ? null : document.getElementById('hud-grad').textContent,
    hinweis: document.querySelector('#hud-sub .hinweis.schritt')?.firstChild.textContent ?? null,
    erster: geraeteText(LEVELS[${n}].schritte[0].text, ${view.phone}), index: ${D}.game.levelIndex,
    uebersicht: !document.getElementById('btn-overview').hidden,
    skip: !document.getElementById('btn-skip').classList.contains('hidden') })`);
  pruefe(k.titel === `Im Dorf – ${uebungen[n]}` && k.index === n, `${g}, Übung ${n + 1}: Titel «${k.titel}»`);
  pruefe(k.grad === GRAD_TEXT[g] && k.sub.startsWith(`Übung ${n + 1} / 9`) && k.hinweis === k.erster,
    `${g}, Übung ${n + 1}: Unterzeile «${k.sub}», erster Schritt «${k.erster}»`);
  await brettDerWelt(`${g}, Übung ${n + 1}`);
  // «Dorf überspringen»: nicht beim Wiederholen nach dem Kapitel, nach einem Einstieg erst nach einer Pause
  const skipText = !replay ? await warteSkip(true) : null;
  pruefe(k.uebersicht && (replay ? !k.skip : skipText === 'Dorf überspringen'),
    `${g}, Übung ${n + 1}: Knöpfe Übersicht ${k.uebersicht}, Überspringen ${k.skip} «${skipText}»`);
  if (bilder) { await sleep(2200); await bild(`dorf-${slug(g)}-uebung-${n + 1}`); }
  if (fuehren === 'erstes') await gefuehrt(g); // geführt, wie ein Spieler bis zur Lösung
  else if (fuehren) await schritteSpielen(g, n);
  else await ev(`${D}.loese()`);
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
 * (Milchstrasse, gesehen prolog, angebot, dorf, ohne wald) → drei Übungen geführt (Kopfzeile, erster Schritt, jeder
 * Schritt wie ein Spieler, «Gelöst», dorf.platz) →
 * Neuladen: Menü «Dorf · 0 / 60», «Weiter» → Übung 4 ohne Prolog, Angebot und Einstieg → Menü und zurück in dieselbe
 * Übung → Übersicht im Dorf (Reihe «Im Dorf», laufende Übung) → «Überspringen» mitten in der Übung → Satz zum Ende →
 * Glühwürmchen in den Bergwald (dorf.ende uebersprungen) → Übersicht: übrige Übungen frei.
 * Mittel: Einstieg ins Dorf während des Flugs übersprungen, «Überspringen» während die nächste Übung wächst, dann den
 * Einstieg in den Bergwald während des Falls.
 * Schwer: «Gleich los» (Desktop: Tab und Enter), den Einstieg in den Bergwald gleich zu Beginn übersprungen (Himmel lädt
 * evtl. noch: kein leeres Brett); kein dorf im Stand, Übersicht ohne Dorf.
 * Sehr schwer: alle 9 Übungen geführt, jeder Schritt wie ein Spieler (schritteSpielen), bis zum Ende → Bergwald
 * (dorf.ende gespielt), dann aus der Übersicht Übung 8 wiederholen → 9 → «Zur Übersicht». Dazu die Bildzeiten; auf dem
 * Handy quer, ob «Überspringen» etwas überdeckt.
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
  await waehle('leicht', 'Karte Leicht');
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
  // Leiste C auch im Dorf (alle Zeichen blass), und das Licht steigt über den Untertitel in der Mitte (Review Ticket 08:
  // es lag gut 3 s hinter dem Text)
  await pruefeLeiste(0, 'Leicht: Einstieg ins Dorf', { licht: false });
  let lichtOben = false;
  for (let i = 0; i < 60 && !lichtOben; i++) {
    lichtOben = await ev(`(() => { const s = ${D}.story, v = s.flare.position.clone().project(${D}.camera);
      return s.flare.visible && (1 - v.y) / 2 * innerHeight
        < document.querySelector('#story .caption .kicker').getBoundingClientRect().top; })()`);
    if (!lichtOben) await sleep(100);
  }
  pruefe(lichtOben, 'Leicht: Einstieg ins Dorf: das Licht steigt nicht über den Untertitel');
  await halt('Leicht: Einstieg ins Dorf', { station: 0, warten: 2, name: 'dorf-einstieg-halt' });
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
  for (let n = 0; n < 3; n++) await uebung('leicht', n, { bilder: n === 1, fuehren: n === 0 ? 'erstes' : true });
  await until(`${D}.story.uebung === 3 && window.__prisma.playing()`, 'Leicht: Übung 4', 30);
  s = await stand('leicht');
  pruefe(s.dorf?.platz === 3 && s.platz === 0 && s.geloest.join() === uebungen.slice(0, 3).join(),
    `Leicht nach drei Übungen ${JSON.stringify(s)}`);

  // mitten in der Führung von Übung 4 («Brechung»): «Weiter» zum zweiten Schritt, dann Neuladen, Menü, Übersicht und
  // «Dorf überspringen» (Ticket 04 der Führung)
  await schrittIst(3, 0, 'Leicht, Übung 4');
  await tippe('#hud-sub .fuehrung-weiter', 'Leicht, Übung 4: Weiter');
  await schrittIst(3, 1, 'Leicht, Übung 4 vor dem Neuladen');
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
  // Neuladen beginnt beim ersten Schritt; wieder zum zweiten, den Menü und Übersicht behalten
  await schrittIst(3, 0, 'Leicht, Übung 4 nach dem Neuladen');
  await tippe('#hud-sub .fuehrung-weiter', 'Leicht, Übung 4: Weiter');
  await schrittIst(3, 1, 'Leicht, Übung 4');
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
  await schrittIst(3, 1, 'Leicht, Übung 4 nach dem Menü');
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
  await schrittIst(3, 1, 'Leicht, Übung 4 nach der Übersicht');
  // Überspringen mitten in der Übung (und der Führung): Satz zum Ende, dann die Glühwürmchen in den Bergwald
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
  await halt('Leicht: Einstieg in den Bergwald nach dem Dorf', { station: 1 });
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'Leicht: Bergwald 1', 40);
  await ende('Leicht: Satz zum Ende → Bergwald 1');
  await kopfzeile('leicht', 0);
  s = await stand('leicht');
  pruefe(s.gesehen.join() === 'prolog,angebot,dorf,wald' && !(await skipSichtbar()) && !(await ev(`${D}.story.inDorf`)),
    `Leicht im Bergwald ${JSON.stringify(s)}`);
  // nach «Dorf überspringen» mitten in der Führung bleibt im Bergwald nichts von ihr stehen
  const fw = await fuehrungIn([]);
  pruefe(!(await ev(`${D}.fuehrung.level`)) && fw.satz === null && !fw.knopf && !fw.umrisse.length && !fw.hand,
    `Leicht im Bergwald: Führung übrig ${JSON.stringify(fw)}`);
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
  await waehle('mittel', 'Karte Mittel');
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
  await waehle('schwer', 'Karte Schwer');
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
  await waehle(g, 'Karte Sehr schwer');
  await prologWeg(g);
  await angebot(g, 'Üben');
  for (let n = 0; n < 9; n++) await uebung(g, n, { bilder: n === 8, fuehren: true }); // jeder Schritt jeder Übung
  await until(`${storyMode} === 'caption' && ${D}.story.waitTap !== null`, 'Sehr schwer: Ende des Dorfs', 30);
  s = await stand(g);
  pruefe(s.dorf?.ende === 'gespielt' && s.geloest.length === 9, `Sehr schwer nach dem Dorf ${JSON.stringify(s)}`);
  await tippe('#story .caption .text', 'Untertitel');
  // den Einstieg in den Bergwald überspringen, während das Licht über dem Untertitel wartet (Abnahme Ticket 11)
  tippeHalt = true;
  try { await until(`${D}.story.halt === true`, 'Sehr schwer: Licht hält über dem Untertitel an', 60); }
  finally { tippeHalt = false; }
  await sleep(600);
  await einstiegWeg(g, 'Einstieg in den Bergwald (Halt)', 'wald', { esc: !view.phone });
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'Sehr schwer: Bergwald 1',
    60);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'Sehr schwer: Übersicht', 10);
  if (view.phone) { // eine Welt je Seite, offen ist der Bergwald: zur Station des Dorfs blättern
    await tippe(`${UEB} .ueb-tab[data-reihe="0"]`, 'Station Dorf');
    await sleep(700);
  }
  await messe();
  await tippeKachel(0, 7, 'Kachel Übung 8');
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
  await waehle('leicht', 'Karte Leicht');
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
  await waehle('mittel', 'Karte Mittel');
  await prologWeg('mittel');
  await until(`document.querySelectorAll('${ANGEBOT}').length === 2`, 'Mittel: Angebot', 60);
  pruefe((await stand('mittel'))?.gesehen.join() === 'prolog', 'Mittel: Prolog gesehen, sobald das Angebot steht');
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.ticks > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  await geste();
  await waehle('mittel', 'Karte Mittel');
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
  await waehle('leicht', 'Karte Leicht');
  await uebungLaeuft(3);
  await tippe('#btn-overview', 'Übersicht');
  await until(`${uebOffen} && !${D}.story.tweens.length`, 'a: Übersicht', 10);
  await zurDorfReihe(0);
  await tippeKachel(0, 1, 'Kachel Übung 2');
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
  await tippeKachel(1, 0, 'Kachel Bergwald 1');
  await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
    + "'Kapitel 1 · Der Bergwald'", 'b: Einstieg in den Bergwald', 30);
  await until(`window.__prisma.playing() && !${D}.story.running && ${D}.story.step === 0`, 'b: Bergwald 1', 40);
  s = await stand('leicht');
  pruefe(s.dorf?.ende === 'uebersprungen' && s.gesehen.includes('wald') && !(await ev('window.__dorfSatz')),
    `b: Bergwald 1 aus der Übersicht ${JSON.stringify(s)}, Satz zum Ende ${await ev('window.__dorfSatz')}`);
  await kopfzeile('leicht', 0);

  // c) Neuladen während des Einstiegs ins Dorf
  await laden();
  await waehle('schwer', 'Karte Schwer');
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
  await waehle('mittel', 'Karte Mittel');
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
  await waehle('sehr schwer', 'Karte Sehr schwer');
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
    const loop = (bildZeit) => { // Zeit des Bilds (rAF), nicht des Aufrufs: unter Last gleichmässiger
      if (!a.an) return;
      const e = cam.matrixWorld.elements, blick = cam.position.clone().set(-e[8], -e[9], -e[10]);
      const licht = s.flare.position.clone().sub(cam.position);
      const cap = document.querySelector('#story .caption').getBoundingClientRect();
      const kick = document.querySelector('#story .caption.mitte .kicker:not(:empty)')?.getBoundingClientRect();
      const strahlen = s.beams.filter((b) => b.visible).map((b) => b.material.uniforms.uStrength.value);
      // wie viel der Strahlen noch leuchtet: Stärke mal der Teil, den ihr Ende noch nicht freigegeben hat (uTail ab
      // Ticket 12, sein weiches Stück 0,2 lang)
      const rest = (b) => { const u = b.material.uniforms; return u.uStrength.value
        * Math.max(0, Math.min(1, 1 - ((u.uTail?.value ?? 0) - 0.1) / 1.1)); };
      a.log.push({ ts: bildZeit, wach: H.stand.wach.length, welt: H.stand.welt, linien: H.stand.linien.length,
        glanz: [...H.glanz].map((x) => +x.toFixed(2)), anteil: [...H.anteil].map((x) => +x.toFixed(2)),
        blick: sterne.map((d) => grad(blick, d)), licht: s.flare.visible ? sterne.map((d) => grad(licht, d)) : null,
        bild: sterne.map((d) => ((p) => [+p.x.toFixed(4), +p.y.toFixed(4)])(d.clone().multiplyScalar(70)
          .add(cam.position).project(cam))), modus: ${storyMode}, tippen: s.waitTap !== null, halt: s.halt,
        unten: cap.height > 0 ? +(cap.top / innerHeight).toFixed(3) : null,
        kicker: kick?.height > 0 ? +(kick.top / innerHeight).toFixed(4) : null,
        kam: [-e[8], -e[9], -e[10]].map((x) => +x.toFixed(5)), lp: s.flare.position.toArray().map((x) => +x.toFixed(3)),
        strahlen: strahlen.length ? +Math.max(...strahlen).toFixed(3) : 0,
        rest: +Math.max(0, ...s.beams.filter((b) => b.visible).map(rest)).toFixed(3),
        antwortRest: s.answer.visible ? +rest(s.answer).toFixed(3) : null, bloom: +bloomPass.strength.toFixed(3),
        schock: +shockUniforms.uShock.value.y.toFixed(3),
        lb: s.flare.visible ? ((p) => [+((p.x + 1) / 2 * innerWidth).toFixed(2), +((1 - p.y) / 2 * innerHeight)
          .toFixed(2)])(s.flare.position.clone().project(cam)) : null, lo: +s.flare.material.opacity.toFixed(3),
        antwort: s.answer.visible ? +s.answer.material.uniforms.uHead.value.toFixed(3) : null });
      requestAnimationFrame(loop);
    };
    a.W = innerWidth; a.H = innerHeight;
    requestAnimationFrame(loop); })()`);
}
/** Winkel (Grad) zwischen zwei Blickrichtungen [x, y, z] der Aufzeichnung (kam). */
const zwischen = (a, b) => Math.acos(Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2])
  / Math.hypot(...a) / Math.hypot(...b))) * 180 / Math.PI;
/**
 * Fall des Lichts aufs Brett nach dem Halt (Abnahme Ticket 11; Aufzeichnung a): ab dem Tippen, solange das Licht zu sehen
 * ist, gleichmässig schnell, ohne Abbremsen vor dem Brett: Die Geschwindigkeit (Weg des Lichtpunkts je Sekunde) in der
 * Mitte und am Ende des Falls weicht höchstens 15 % von der am Anfang (nach dem kurzen Anlauf) ab.
 */
function pruefeFall(a, was) {
  const { log } = a, iH = log.findLastIndex((e) => e.halt);
  pruefe(iH >= 0, `${was}: kein Halt vor dem Fall`);
  if (iH < 0) return;
  // der Fall beginnt, wo das Licht sinkt (auf der Reise schwebt es davor, solange die neue Welt noch einblendet)
  let iT = iH;
  while (iT + 1 < log.length && log[iT + 1].licht && log[iT + 1].lp[1] > log[iH].lp[1] - 0.05) iT++;
  let iE = iT + 1;
  while (iE < log.length && log[iE].licht) iE++;
  const fall = log.slice(iT, iE), t0 = fall[0]?.ts, d = (fall.at(-1)?.ts ?? 0) - t0;
  if (fall.length < 20 || d < 1500) {
    pruefe(false, `${was}: Fall zu kurz aufgezeichnet (${fall.length} Bilder)`);
    return;
  }
  // Weg in der Welt je Sekunde (nur zum Ablesen; massgebend ist seit Ticket 12 das Bild)
  const v = ([u0, u1]) => {
    const f = fall.filter((e) => e.ts >= t0 + u0 * d && e.ts <= t0 + u1 * d);
    const weg = f.slice(1).reduce((s, e, i) => s + Math.hypot(...e.lp.map((x, j) => x - f[i].lp[j])), 0);
    return weg / ((f.at(-1).ts - f[0].ts) / 1000);
  };
  console.log(`  ${was}: Fall ${(d / 1000).toFixed(2)} s, in der Welt ${[[0.2, 0.35], [0.5, 0.65], [0.8, 0.95]].map(v)
    .map((x) => x.toFixed(1)).join(' / ')} je s (Anfang / Mitte / Ende)`);
  pruefeFallImBild(fall, d, was);
}
/**
 * Der Fall im Bild (Abnahme Ticket 12; fall: Bilder der Aufzeichnung vom Beginn des Falls, solange das Licht zu sehen
 * ist, d: seine Dauer in ms): Massgebend ist, wie das Licht über den Bildschirm fällt (CSS-Pixel je Bild bei 60
 * Bildern/s, gemittelt über je FALL_FENSTER ms). Nach dem Anlauf (erste 12 % der Zeit) bis es ausblendet (Deckkraft
 * unter 0,5) weicht seine Geschwindigkeit höchstens FALL_STREUUNG vom Mittel ab: kein Beschleunigen, Abbremsen und
 * wieder Beschleunigen. Die Kamera folgt ruhig: Ihre Drehung (Grad je Bild) steigt bis zu einem Höchstwert und fällt
 * danach, ohne zweiten Anstieg (je höchstens FALL_KAMERA über dem tiefsten Wert davor bzw. danach). Die Werte je Bild
 * schreibt die Probe nach tests/output/geschichte/<bildschirm>-fall-<was>.json. Gezählt werden nur Bilder, die das
 * Spiel gezeichnet hat (Licht oder Blick anders als im Bild davor): Lässt es unter Last eines aus, sähe die
 * Aufzeichnung sonst einmal Stillstand und dann den doppelten Schritt.
 */
function pruefeFallImBild(alle, d, was) {
  const gleich = (a, b) => JSON.stringify([a.lb, a.kam]) === JSON.stringify([b.lb, b.kam]);
  const fall = alle.filter((e, i) => i === 0 || !gleich(e, alle[i - 1])), t0 = fall[0].ts;
  const proBild = (f, weg) => (f.length < 2 ? 0 : f.slice(1).reduce((s, e, i) => s + weg(f[i], e), 0)
    / (f.at(-1).ts - f[0].ts) * 1000 / 60);
  const px = (a, b) => (a.lb && b.lb ? Math.hypot(b.lb[0] - a.lb[0], b.lb[1] - a.lb[1]) : 0);
  const reihe = (weg, u0, u1) => {
    const r = [];
    for (let t = t0 + u0 * d; t + FALL_FENSTER <= t0 + u1 * d; t += FALL_FENSTER / 2) {
      r.push(proBild(fall.filter((e) => e.ts >= t && e.ts <= t + FALL_FENSTER), weg));
    }
    return r;
  };
  const sichtbar = fall.findIndex((e) => e.lo < 0.5), bis = sichtbar > 0 ? (fall[sichtbar].ts - t0) / d : 1;
  const licht = reihe(px, 0.12, bis), kamera = reihe((a, b) => zwischen(a.kam, b.kam), 0, 1);
  const mittel = licht.reduce((s, x) => s + x, 0) / Math.max(1, licht.length);
  const streut = Math.max(...licht.map((x) => Math.abs(x / mittel - 1)));
  const z = (r) => r.map((x) => x.toFixed(2)).join(' ');
  console.log(`  ${was}: Licht im Bild (px je Bild, je ${FALL_FENSTER} ms, nach dem Anlauf bis zum Ausblenden bei `
    + `${(bis * 100).toFixed(0)} %): ${z(licht)}; Mittel ${mittel.toFixed(2)}, grösste Abweichung `
    + `${(streut * 100).toFixed(0)} %`);
  console.log(`  ${was}: Kamera (Grad je Bild über den ganzen Fall): ${z(kamera)}`);
  const iMax = kamera.indexOf(Math.max(...kamera));
  // grösster Rückschritt (Anteil des Höchstwerts): vor ihm ein Abfall und wieder Anstieg, nach ihm ein neuer Anstieg
  let zurueck = 0;
  for (let i = 0; i < iMax; i++) {
    zurueck = Math.max(zurueck, (kamera[i] - Math.min(...kamera.slice(i, iMax + 1))) / kamera[iMax]);
  }
  for (let i = iMax + 1; i < kamera.length; i++) {
    zurueck = Math.max(zurueck, (kamera[i] - Math.min(...kamera.slice(iMax, i + 1))) / kamera[iMax]);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${view.name}-fall-${was.replace(/[^\wäöü]+/gi, '-').toLowerCase()}.json`),
    JSON.stringify({ d, bis, licht, kamera, bilder: fall.map((e) => ({ ts: +(e.ts - t0).toFixed(1), lb: e.lb, lo: e.lo,
      kam: e.kam, lp: e.lp })) }));
  pruefe(licht.length >= 4 && streut <= FALL_STREUUNG, `${was}: Das Licht fällt im Bild nicht gleichmässig `
    + `(grösste Abweichung ${(streut * 100).toFixed(0)} % vom Mittel ${mittel.toFixed(2)} px je Bild: ${z(licht)})`);
  pruefe(zurueck <= FALL_KAMERA, `${was}: Die Kamera folgt nicht ruhig (zweiter Anstieg bzw. Abfall der Drehung um `
    + `${(zurueck * 100).toFixed(0)} % ihres Höchstwerts: ${z(kamera)})`);
}
const FALL_FENSTER = 200, FALL_STREUUNG = 0.15, FALL_KAMERA = 0.15;
const himmelAuswerten = () => ev('(() => { const a = window.__himmel; a.an = false; return a; })()');
/**
 * Der Wagen nur einmal (Abnahme Ticket 11, Nachtrag): Hinter Menü und Übersicht ist der Wagen am Himmel aus (ihre
 * Sternkarte zeigt ihn schon), im Spiel wieder da (zu sehen: aus false). Gelesen über das Objekt der Geschichte.
 */
async function pruefeWagenEinmal(was, { aus = true } = {}) {
  await sleep(700); // er blendet in 0,4 s aus bzw. ein
  const r = await ev(`(() => { const h = ${D}.story.himmel;
    return { sichtbar: h.mesh.visible, hell: +Math.max(...h.mesh.material.uniforms.uHell.value).toFixed(3) }; })()`);
  console.log(`  ${was}: Wagen am Himmel ${r.sichtbar ? 'zu sehen' : 'aus'} (hellster ${r.hell})`);
  const fehlt = aus ? 'zu sehen (doppelt mit der Sternkarte)' : 'fehlt';
  pruefe(aus ? !r.sichtbar : r.sichtbar && r.hell > 0, `${was}: Wagen am Himmel ${fehlt} ${JSON.stringify(r)}`);
}
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
  pruefe(e0.welt === k && e0.licht && e0.licht[k - 1] < 1,
    `${was}: beim Erwachen Licht ${e0.licht?.[k - 1]}° vom Stern ${k}, Stern der Welt ${e0.welt}`);
  // Abnahme Ticket 11: Der Stern steht beim Erwachen schon dort, wo er über dem Untertitel der Reise stehen muss
  // (waagrecht mittig, in der Mitte des freien Raums über dem Kicker), und dort bleibt er, bis der Träger das Licht
  // aufgenommen hat (Aufblitzen 1,3 s, Aufnehmen 1 s): kein Nachschieben des Bilds
  const bleibt = log.slice(i0).filter((e) => e.ts <= e0.ts + 2200);
  const px = ([x, y], [u, v]) => Math.hypot((x - u) / 2 * a.W, (y - v) / 2 * a.H);
  const weg = Math.max(...bleibt.map((e) => px(e.bild[k - 1], e0.bild[k - 1])));
  // der Kicker der Reise: der erste nach dem Erwachen (nicht nur in bleibt: ein Bild der Probe hält die Seite dort an,
  // dann fehlt er in diesen 2,2 s; Review Ticket 11, Handy)
  const mitText = log.slice(i0).find((e) => e.modus === 'caption' && e.kicker !== null);
  const oben = (1 - e0.bild[k - 1][1]) / 2, mitte = (e0.bild[k - 1][0] + 1) / 2;
  console.log(`  ${was}: Stern ${k} beim Erwachen bei ${mitte.toFixed(3)} / ${oben.toFixed(3)} (Breite / Höhe), `
    + `Kicker der Reise bei ${mitText?.kicker}, danach höchstens ${weg.toFixed(1)} px verschoben`);
  pruefe(weg < 3, `${was}: Das Bild verschiebt sich nach dem Erwachen (Stern ${k} um ${weg.toFixed(1)} px)`);
  pruefe(mitText && Math.abs(oben - mitText.kicker / 2) < 0.04 && Math.abs(mitte - 0.5) < 0.02,
    `${was}: Stern ${k} steht beim Erwachen nicht über dem Untertitel der Reise (${mitte.toFixed(3)} / `
    + `${oben.toFixed(3)}, Kicker ${mitText?.kicker})`);
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
  pruefeFall(a, was);
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
  pruefeFall(a, was);
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
  pruefe(e0.licht && e0.licht[5] < 1, `${was}: beim Erwachen Licht ${e0.licht?.[5]}° vom Stern 6`);
  const iP = log.findIndex((e, i) => i > i0 && e.glanz[0] > 0.5); // der Puls bei Stern 1
  // Abnahme Ticket 11: Die Kamera kommt beim Erwachen schon im Blick auf den ganzen Wagen an (kein Nachschieben zu
  // Satz 1), und die Strahlen gehen aus, sobald der Stern wach ist (spätestens 1 s danach, vor dem Puls)
  if (iP > 0) {
    const dreh = Math.max(...log.slice(i0, iP + 1).map((e) => zwischen(e.kam, e0.kam)));
    pruefe(dreh < 0.3, `${was}: Der Blick verschiebt sich nach dem Erwachen noch um ${dreh.toFixed(2)}°`);
    const aus = log.findIndex((e, i) => i > i0 && e.strahlen === 0);
    pruefe(aus > 0 && log.slice(aus, iP + 1).every((e) => e.strahlen === 0),
      `${was}: Die Strahlen gehen nach dem Erwachen nicht vor dem Puls aus (${aus > 0 ? Math.round(log[aus].ts - e0.ts)
        : '–'} ms)`);
    // Abnahme Ticket 12: nicht abrupt, sie laufen aus. Was von ihnen leuchtet (rest), nimmt über mindestens
    // AUSLAUFEN_MS ab, in keinem Bild um mehr als AUSLAUFEN_SPRUNG (je Bild bei 60 Bildern/s)
    const lauf = log.slice(i0, aus > 0 ? aus + 1 : iP), ab = lauf.findIndex((e) => (e.rest ?? e.strahlen) < 0.99);
    const sprung = auslaufSprung(lauf);
    const dauer = ab >= 0 ? lauf.at(-1).ts - lauf[ab].ts : 0;
    console.log(`  ${was}: nach dem Erwachen dreht der Blick ${dreh.toFixed(2)}°, Strahlen aus nach `
      + `${aus > 0 ? Math.round(log[aus].ts - e0.ts) : '–'} ms, laufen ${Math.round(dauer)} ms aus, grösster Schritt `
      + `${sprung.toFixed(3)} je Bild`);
    pruefe(dauer >= AUSLAUFEN_MS && sprung <= AUSLAUFEN_SPRUNG, `${was}: Die Strahlen verschwinden abrupt (in `
      + `${Math.round(dauer)} ms, grösster Schritt ${sprung.toFixed(3)} je Bild)`);
  }
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
  // Antwort (Abnahme Ticket 11): kein Blick zum Polarstern, bevor sein Strahl fällt; die Kamera steht, während die
  // Spitze des Strahls oben im Bild ist (das erste Zehntel des Wegs)
  const iA = log.findIndex((e) => e.antwort !== null);
  if (iA > 0) {
    const frueh = log.slice(iA).filter((e) => e.antwort !== null && e.antwort < 0.1);
    const dreh = Math.max(0, ...frueh.map((e) => zwischen(e.kam, log[iA - 1].kam)));
    console.log(`  ${was}: Antwort des Polarsterns, Blick dreht im ersten Zehntel des Strahls ${dreh.toFixed(2)}° `
      + `(${frueh.length} Bilder)`);
    pruefe(frueh.length > 5 && dreh < 0.3,
      `${was}: Die Kamera schwenkt vor dem Strahl des Polarsterns (${dreh.toFixed(2)}°)`);
    // weicher Aufprall (Abnahme Ticket 12): Das Brett glüht schon, bevor die Spitze ankommt, der Schein (bloom) steigt
    // danach weich an (in keinem Bild um mehr als AUFPRALL_SCHEIN der Grundhelligkeit), und der Strahl läuft aus
    const iH = log.findIndex((e, i) => i > iA && e.antwort !== null && e.antwort >= 0.999);
    if (iH > 0) {
      const vorher = log[iH - 1].schock ?? 0, grund = log[iH - 1].bloom;
      const nach = log.slice(iH, iH + 90), schein = Math.max(0, ...nach.slice(1).map((e, i) => (e.bloom - nach[i].bloom)
        / grund / Math.max(1, (e.ts - nach[i].ts) / (1000 / 60))));
      const rest = log.slice(iH).filter((e) => e.antwortRest !== null && e.antwortRest !== undefined);
      const sprung = auslaufSprung(rest.map((e) => ({ ts: e.ts, rest: e.antwortRest })));
      const weg = rest.findIndex((e) => e.antwortRest < 0.01), an = rest.findIndex((e) => e.antwortRest < 0.99);
      const dauer = weg > an && an >= 0 ? rest[weg].ts - rest[an].ts : 0;
      console.log(`  ${was}: Aufprall der Antwort: Brett glüht davor ${vorher}, Schein steigt höchstens `
        + `${(schein * 100).toFixed(1)} % je Bild, Strahl läuft ${Math.round(dauer)} ms aus (grösster Schritt `
        + `${sprung.toFixed(3)})`);
      pruefe(vorher > 0.1 && schein <= AUFPRALL_SCHEIN && dauer >= AUSLAUFEN_MS && sprung <= AUSLAUFEN_SPRUNG,
        `${was}: Der Aufprall der Antwort ist hart (Glut davor ${vorher}, Schein ${(schein * 100).toFixed(1)} % `
        + 'je Bild, '
        + `Auslaufen ${Math.round(dauer)} ms, Schritt ${sprung.toFixed(3)})`);
    } else pruefe(false, `${was}: Die Antwort erreicht das Brett nicht`);
  } else pruefe(false, `${was}: keine Antwort des Polarsterns aufgezeichnet`);
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
  // Abnahme Ticket 11: der Wagen (mit dem Polarstern) rechts der Mitte, damit Noa weniger steil leuchtet
  const mitte = ((Math.max(...xs) + Math.min(...xs)) / 2 + 1) / 2;
  console.log(`  ${was}: Mitte des Wagens am Ende bei ${mitte.toFixed(3)} der Breite`);
  pruefe(mitte > 0.55, `${was}: Der Wagen steht am Ende nicht rechts der Mitte (${mitte.toFixed(3)})`);
  pruefe(ab[k] <= WAGEN_IN_WAGEN, `${was}: Wagen in Wagen nicht ohne Sprung: Stern ${k + 1} ${ab[k].toFixed(1)} px daneben `
    + `(am Ende ${JSON.stringify(e.bild)}, Bühne ${JSON.stringify(buehne.sterne)})`);
}
/**
 * Nach dem letzten Level einer Welt (Abnahme Ticket 12): Strahlen, Aufstieg und Erwachen kommen erst mit «Weiter zum …»
 * (bzw. «Hinaufschauen» vor dem Finale). Nach dem Lösen steht «Gelöst» mit dem Knopf, und 3 s lang beginnt nichts:
 * keine Zwischenszene, kein Strahl, kein Blick in den Himmel, der Stern schläft noch.
 */
async function pruefeWartetAufWeiter(was) {
  const s = await ev(`(() => { const s = ${D}.story, r = [];
    return new Promise((fertig) => { const ab = performance.now(); const schau = () => {
      r.push({ laeuft: s.running, strahl: s.beams.some((b) => b.visible), blick: s.gaze, gelöst: window.__prisma
        .solvedPanel(), wach: s.himmel.stand.wach.length });
      if (performance.now() - ab < 3000) setTimeout(schau, 100); else fertig(r); };
    schau(); }); })()`);
  const wach = s[0].wach, falsch = s.find((e) => e.laeuft || e.strahl || e.blick > 0 || !e.gelöst || e.wach !== wach);
  console.log(`  ${was}: nach dem Lösen ${falsch ? 'beginnt die Szene ohne «Weiter»'
    : '3 s lang «Gelöst», nichts sonst'}`);
  pruefe(!falsch, `${was}: Strahlen bzw. Aufstieg ohne Klick auf «Weiter» ${JSON.stringify(falsch)}`);
}
/**
 * Nur der Fall aufs Brett (--fall, Abnahme Ticket 12, gut 1 min): der Einstieg in den Vulkan beim Fortsetzen und die
 * Reise vom Bergwald ins Meer, je mit Halt und dem Fall danach im Bild (pruefeFall), dazu, dass das Ende des Bergwalds
 * auf «Weiter» wartet (pruefeWartetAufWeiter).
 */
async function fallAblauf() {
  console.log(`${view.name}: Fall aufs Brett`);
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', 30, 2) });
  await himmelAufzeichnen();
  await tippe('#menue .menue-weiter', 'Weiter');
  await halt('Leicht: Einstieg in den Vulkan', { station: 4 });
  await until(`${D}.story.step === 30 && window.__prisma.playing() && !${D}.story.running`, 'Leicht 31 läuft', 60);
  pruefeEinstieg(await himmelAuswerten(), 4, 3, 'Einstieg in den Vulkan');
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', 9, 0) });
  await tippe('#menue .menue-weiter', 'Weiter');
  await loeseLevel('leicht', 9);
  await pruefeWartetAufWeiter('Ende der Welt 1');
  await himmelAufzeichnen();
  await tippe('#btn-next', 'Weiter');
  await halt('Leicht: Reise in Welt 2', { station: 2 });
  await until(`${D}.story.step === 10 && window.__prisma.playing() && !${D}.story.running`, 'Leicht: Meer 1', 90);
  await sleep(300);
  pruefeErwachen(await himmelAuswerten(), 1, 'Reise in Welt 2');
}
/**
 * Wiederholen über die Weltgrenzen am Vulkan (--grenzen; Ticket 09 von .scratch/brett-je-himmel/): Stand Leicht bis
 * Planeten 6, aus der Übersicht das letzte Level der Wüste wiederholen, «Weiter» zum Vulkan, dann ebenso das letzte des
 * Vulkans und «Weiter» zu den Planeten. Je Grenze geprüft (grenzeBrett): kein Untertitel, kein Träger, der Blick bleibt
 * auf dem Brett; das Brett gleitet gleichzeitig mit dem Himmel und steigend vom alten ins neue, ohne Notfall, mit der Art
 * seiner Brett-Angabe in jedem Bild (Basaltsäulen am Vulkan, Steinbrett bei den Planeten); dazu die Bildzeiten.
 */
async function grenzenAblauf() {
  console.log(`${view.name}: Wiederholen über die Grenzen des Vulkans`);
  await laden({ 'prisma.noa.zuletzt': 'leicht', 'prisma.noa.leicht': standBis('leicht', 45, 4) });
  await tippe('#menue .menue-weiter', 'Weiter');
  await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === 45 && !${D}.story.running`,
    'Leicht 46 läuft', 90);
  for (const [w, von, nach, name] of [[2, 'desert', 'volcano', 'Wüste → Vulkan'], [3, 'volcano', null, 'Vulkan → Planeten']]) {
    await tippe('#btn-overview', 'Übersicht');
    await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, `${name}: Übersicht`, 10);
    await sleep(600);
    await tippeKachel(w, 9, `${name}: Kachel ${w + 1}/10`);
    await until(`window.__prisma.playing() && ${D}.story.gaze === 0 && ${D}.story.step === ${w * 10 + 9}`
      + ` && !${D}.story.running`, `${name}: letztes Level wiederholen`, 60);
    await ev(`${D}.loese()`);
    await until('window.__prisma.solvedPanel()', `${name}: gelöst`, 30);
    await sleep(700);
    await messe();
    await tippe('#btn-next', `${name}: Weiter`);
    await until(`window.__prisma.playing() && ${D}.story.step === ${w * 10 + 10} && !${D}.story.running`,
      `${name}: erstes Level der nächsten Welt`, 60);
    await sleep(1500);
    const log = await ende(`Wiederholen: ${name}`);
    grenzeBrett(log, von, nach ?? await ev(`${D}.skyTheme.current`), name);
    await bild(`grenze-${von}`);
  }
}
/** Weiter über eine Weltgrenze beim Wiederholen: Das Brett wechselt mit dem Himmel von von nach nach (Log von messe). */
function grenzeBrett(log, von, nach, name) {
  ohneZwischenszene(log, name);
  const blick = Math.max(...log.map((e) => e.gaze));
  pruefe(blick < 0.01, `${name}: der Blick hob sich (${blick})`);
  const bf = log.filter((e) => e.brett.von === von && e.brett.himmel === nach);
  const steigt = bf.every((e, i) => i === 0 || e.brett.anteil >= bf[i - 1].brett.anteil);
  const a0 = log.indexOf(bf[0]), a1 = log.indexOf(bf.at(-1)) + 1;
  const h0 = log.findIndex((e) => !(e.shown === von && e.w === 1)), h1 = log.findIndex((e) => e.shown === nach && e.w === 1);
  const falsch = log.find((e) => e.brett.notfall || !e.brett.himmel || e.brett.art !== e.brett.soll);
  pruefe(bf.length > 10 && steigt && Math.abs(a0 - h0) <= 1 && Math.abs(a1 - h1) <= 1 && log.at(-1).brett.himmel === nach
    && log.at(-1).brett.anteil === 1 && log.at(-1).brett.bereit, `${name}: das Brett wechselt nicht mit dem Himmel `
    + `(Brett Bild ${a0}–${a1}, Himmel ${h0}–${h1}, ${bf.length} Bilder, steigend ${steigt}, am Ende `
    + `${JSON.stringify(log.at(-1).brett)})`);
  pruefe(!falsch, `${name}: falsches Brett oder Notfall (${JSON.stringify(falsch)})`);
  console.log(`  ${name}: Brett ${log[0].brett.art} → ${log.at(-1).brett.art}, mit dem Himmel über `
    + `${((log[h1]?.ts - log[h0]?.ts) / 1000).toFixed(2)} s`);
}
/** Grösster Rückgang dessen, was von Strahlen leuchtet (rest bzw. strahlen der Aufzeichnung), je Bild (60 je s). */
const auslaufSprung = (lauf) => Math.max(0, ...lauf.slice(1).map((e, i) => ((lauf[i].rest ?? lauf[i].strahlen)
  - (e.rest ?? e.strahlen)) / Math.max(1, (e.ts - lauf[i].ts) / (1000 / 60))));
/** Auslaufen der Strahlen im Finale (Abnahme Ticket 12): mindestens so lange (ms), je Bild höchstens so viel weg. */
const AUSLAUFEN_MS = 1000, AUSLAUFEN_SPRUNG = 0.05;
/** Aufprall der Antwort: So viel (Anteil der Grundhelligkeit) darf der Schein je Bild höchstens steigen. */
const AUFPRALL_SCHEIN = 0.12;
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
 * wagen-epilog-anfang. Seit Ticket 11 (Abnahme): der Halt des Lichts über dem Untertitel bei Einstiegen und Reisen
 * (halt) und der gleichmässige Fall danach (pruefeFall); beim Erwachen steht der Stern schon dort, wo ihn der folgende
 * Untertitel braucht, und das Bild verschiebt sich danach nicht (pruefeErwachen, im Finale der ganze Wagen); die
 * Strahlen gehen im Finale nach dem Erwachen aus, die Kamera schwenkt vor der Antwort nicht zum Polarstern, und der
 * Wagen steht am Ende rechts der Mitte (pruefeFinale).
 * Etwa 4 min (mit Ticket 07 gemessen: 245–252 s in Desktop, Handy hoch und quer).
 */
async function wagenAblauf() {
  console.log(`${view.name}: Kleiner Wagen`);
  await laden();
  for (const g of GRADE) await pruefeWagen(g, 0, 'neu');
  const mittel = standBis('mittel', 43, 4); // Planeten 44: Bergwald bis Vulkan geschafft, vier Sterne wach

  // Einstieg in den Bergwald nach dem Prolog («Gleich los»): am schlafenden ersten Stern vorbei, ohne Erwachen
  await waehle('leicht', 'Karte leicht');
  await until(`${storyMode} === 'scene'`, 'Leicht: Prolog');
  await sleep(1500);
  await tippe('#story .scene .skip', 'Überspringen');
  await angebot('leicht', 'Gleich los');
  await himmelAufzeichnen();
  await until(`${D}.story.himmel.glanz[0] > 0.3`, 'Leicht: Einstieg am Stern 1 vorbei', 60);
  await bild('wagen-einstieg-wald-vorbeiflug');
  await halt('Leicht: Einstieg in den Bergwald', { station: 1 });
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
    await pruefeWartetAufWeiter(`Ende der Welt ${w + 1}`);
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
      await halt(`Leicht: Reise in Welt ${w + 2}`, { station: w + 2 });
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
  await pruefeLeiste(4, 'Leicht: Einstieg in den Vulkan', { licht: false });
  await pruefeWagen('leicht', 3, 'beim Einstieg in den Vulkan');
  await until(`${D}.story.himmel.glanz[3] > 0.3`, 'Leicht: Einstieg am Stern 4 vorbei', 30);
  await bild('wagen-einstieg-vulkan-vorbeiflug');
  await halt('Leicht: Einstieg in den Vulkan', { station: 4 });
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
  await waehle('mittel', 'Karte Mittel');
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
  await tippeKachel(0, 9, 'Kachel Bergwald 10');
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
  await tippe(karte('mittel'), 'Reiter Mittel');
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
  // nach dem Neuladen mit geschafftem Grad: hinter dem Menü nur der Wagen der Sternkarte (Abnahme Ticket 11)
  await tippe(karte('leicht'), 'Reiter Leicht (geschafft)');
  await pruefeWagenEinmal('Menü nach Neuladen, Leicht geschafft');
  await bild('wagen-menue-geschafft');
  // geschafft: der ganze Wagen am Himmel (Wiederholen aus der Übersicht, die die Karte im Menü öffnet: Sterne 9)
  await tippe('#menue .menue-weiter', 'Leicht (geschafft): Knopf');
  await until(`${uebOffen} && ${D}.story.gaze === 1 && !${D}.story.tweens.length`, 'Übersicht Leicht', 10);
  await pruefeWagenEinmal('Übersicht, Leicht geschafft');
  await sleep(600);
  if (view.phone) { // eine Welt je Seite: zu den Sternen über ihre Station
    await tippe(`${UEB} .ueb-tab[data-reihe="5"]`, 'Station Sterne');
    await sleep(900);
  }
  await tippeKachel(5, 8, 'Kachel Sterne 9');
  await until(`${D}.story.grade === 'leicht' && ${D}.story.replay && window.__prisma.playing() && !${D}.story.running`,
    'Leicht: Sterne 9 (Wiederholen)', 60);
  await pruefeHimmel(7, 6, 'geschafft, beim Wiederholen in den Sternen');
  await pruefeWagenEinmal('Spiel nach der Übersicht, Leicht geschafft', { aus: false });
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

let arbeitJe = null;
try {
  await emulate(send, view);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: ARBEIT });
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.ticks > 2', 'Spiel startet');
  reise = await ev('STORY_LEVELS');
  if (startTaste && !view.phone) await gehaltenesEnter();
  if (menue) await menueAblauf();
  if (uebersichtProbe) await uebersichtAblauf();
  if (dorfProbe) await dorfAblauf();
  if (dorfRaenderProbe) await dorfRaender();
  if (wagenProbe) await wagenAblauf();
  if (fallProbe) await fallAblauf();
  if (grenzenProbe) await grenzenAblauf();
  for (const [i, g] of grade.entries()) await (ganz ? ganzerDurchgang : durchgang)(g, i === 0);
  if (finaleGrad) await finale(finaleGrad);
} catch (e) {
  pruefe(false, e.message);
  await bild('abbruch').catch(() => {});
} finally {
  arbeitJe = await arbeitBericht().catch((e) => { console.log(`Protokoll der Arbeit: ${e.message}`); return null; });
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
    bildschirm: view, abschnitte: bildzeiten, arbeit: arbeitJe, fehler }, null, 1)}\n`);
  console.log(`\nMesswerte nach ${messwerte}`);
}
console.log(fehler.length ? `\nProbe FEHLGESCHLAGEN (${fehler.length})` : '\nProbe bestanden, Konsole ohne Fehler.');
process.exit(fehler.length ? 1 : 0);
