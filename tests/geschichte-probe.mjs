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
// über 100 ms sind Fehler, ausser während eines Bilds der Probe und beim ersten Zeichnen der Bühne, siehe ende).
// Bilder der wichtigen Momente nach tests/output/geschichte/<bildschirm>-<name>.png. Sie scheitert bei einem falschen
// Wert oder einer Meldung in der Konsole ([error], Ausnahme, Shader).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs [--handy | --quer]
//           [--grad leicht,mittel] [--welten 2] [--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf]
//           [--dorf-raender]
//   --handy: 390 × 844, --quer: 844 × 390 (Pixeldichte 2, Touch) statt 1440 × 900; --grad: die Grade des Durchgangs
//   («sehr schwer» als sehr-schwer); --welten: so viele Welten je Durchgang (Vorgabe 2, mit der Reise in die nächste);
//   --finale: dazu das Finale in diesem Grad; --menue: dazu der Ablauf im Menü; --start: nur das gehaltene Enter;
//   --uebersicht: dazu Übersicht und Wiederholen; --dorf: dazu «Im Dorf»; --dorf-raender: Randfälle des Dorfs (Review
//   Ticket 07, etwa 5 min). Ohne --grad, --finale, --menue, --start, --uebersicht, --dorf und --dorf-raender alle vier
//   Grade. Etwa 3 min je Grad, das Finale gut 4 min, das Menü etwa 3 min, die
//   Übersicht etwa 4 min, das Dorf etwa 6 min. Zeitrahmen: jede
//   Anfrage an Chrome höchstens 30 s, der ganze Lauf höchstens 14 min; dann schliesst die Probe Chrome und bricht mit
//   Fehler ab.
import { mkdirSync, writeFileSync } from 'node:fs';
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
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const grad = (x) => x.replace('-', ' ');
const finaleGrad = wert('--finale') && grad(wert('--finale'));
const menue = args.includes('--menue');
const uebersichtProbe = args.includes('--uebersicht');
const dorfProbe = args.includes('--dorf');
const dorfRaenderProbe = args.includes('--dorf-raender');
const startTaste = args.includes('--start') || menue; // gehaltenes Enter am Startbildschirm (nur Desktop)
const grade = wert('--grad') ? wert('--grad').split(',').map(grad)
  : finaleGrad || startTaste || uebersichtProbe || dorfProbe || dorfRaenderProbe ? [] : GRADE;
const welten = +(wert('--welten') ?? 2);
if ([...grade, finaleGrad].some(g => g && !GRADE.includes(g)) || !(welten >= 1 && welten <= 5)
  || args.includes('--handy') && args.includes('--quer')) {
  console.error('Aufruf: node tests/geschichte-probe.mjs [--handy | --quer] [--grad leicht,mittel,…] [--welten 1–5] '
    + '[--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf] [--dorf-raender]');
  process.exit(1);
}
requireQuiet();

const view = args.includes('--handy') ? { name: 'handy', width: 390, height: 844, dpr: 2, phone: true }
  : args.includes('--quer') ? { name: 'quer', width: 844, height: 390, dpr: 2, phone: true }
    : { name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false };
const PAGE = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro';
const PAGE_START = pathToFileURL(join(root, 'index.html')).href + '?noadapt'; // mit Startbildschirm
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };
const bildzeiten = []; // je Übergang: Name, längste Lücke, Lücken über 50 und 100 ms

// Zeitrahmen: eine Anfrage, auf die Chrome nicht antwortet, bricht nach FRIST_MS ab; der ganze Lauf nach GESAMT_MS
// (sonst hielte ein hängender Lauf die Sperre von leise.sh)
const FRIST_MS = 30000, GESAMT_MS = 14 * 60000;
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

/** Klick (Desktop) bzw. Tippen mit dem Finger (Handy) auf die Mitte eines sichtbaren Elements. */
async function tippe(selector, was = selector) {
  await until(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[inert]')
      && getComputedStyle(el).visibility !== 'hidden'; })()`, `${was} bereit`, 30);
  const { x, y } = await ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)})
    .getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await tippeBei(x, y);
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
async function messe() {
  fotos = [];
  await ev(`(() => { const b = window.__bz = { an: true, log: [] }; const loop = (ts) => { if (!b.an) return;
    const s = ${D}.story, k = ${D}.skyTheme; b.log.push({ ts, gaze: s.gaze, flow: ${D}.flow.state, sky: k.current,
      ready: k.ready, settled: k.byId.get(k.current).module?.settled ?? true, menu: ${D}.menu.offen,
      ueb: ${D}.uebersicht.offen, story: ${storyMode}, traeger: !!s.carrier?.kind, bild: window.__prisma.frames,
      blick: ((m) => [-m[8], -m[9], -m[10]])(${D}.camera.matrixWorld.elements) });
      requestAnimationFrame(loop); };
    requestAnimationFrame(loop); })()`);
}
/**
 * buehne: Der Übergang zeigt die Bühne zum ersten Mal (Prolog). Ihr erstes Zeichnen hält die Seite einmal an, auf dem
 * Handy 180–230 ms, gleich wie vor dem Menü (Ticket 04, gemessen gegen HEAD); diese eine Lücke gleich zu Beginn (in den
 * ersten 400 ms, höchstens 300 ms) zählt nicht als neu, sie wird nur gemeldet.
 */
async function ende(name, { buehne = false } = {}) {
  const log = await ev('(() => { const b = window.__bz; b.an = false; return b.log; })()');
  const foto = (i) => fotos.some(([a, b]) => log[i].ts < b && log[i + 1].ts > a);
  let erstesBild = buehne;
  const art = log.slice(1).map((e, i) => {
    const d = e.ts - log[i].ts;
    if (foto(i)) return 'Bild der Probe';
    if (!erstesBild || d <= 100 || d > 300 || log[i].ts - log[0].ts >= 400) return '';
    erstesBild = false;
    return 'erstes Zeichnen der Bühne';
  });
  fotos = null;
  const luecken = log.slice(1).map((e, i) => (art[i] ? 0 : e.ts - log[i].ts));
  const max = Math.max(0, ...luecken), ueber = (ms) => luecken.filter((d) => d > ms).length;
  bildzeiten.push({ name, bilder: log.length, max: Math.round(max), ueber50: ueber(50), ueber100: ueber(100) });
  console.log(`  Bildzeiten ${name}: ${log.length} Bilder, längste Lücke ${Math.round(max)} ms, über 50 ms ${ueber(50)}`
    + `, über 100 ms ${ueber(100)}`);
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
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${menueOffen}`, 'Menü');
  await ev('document.fonts.ready.then(() => true)');
  await geste();
}
/**
 * Eine erste Geste wie der Klick auf «Klicken zum Starten», der mit ?nointro fehlt: ins Leere des Menüs (unten rechts).
 * Sie schaltet den Ton frei (audio.unlock); das hält die Seite einmal 0,2–0,3 s an und gehört im Spiel zum Start, nicht
 * zu den Übergängen des Menüs. Der Tipp ins Leere nimmt den Fokus weg; danach bekommt ihn der Knopf zurück, der ihn
 * hatte (im Spiel setzt das Menü den Fokus erst nach dem Start).
 */
async function geste() {
  const fokus = await ev('document.activeElement?.dataset?.menueFokus ?? null');
  // mit dem Finger gilt die Geste erst ab dem Loslassen, freigeschaltet wird beim Aufsetzen: dann ein zweites Mal
  for (let n = 0; n < 3 && !(await ev(`!!${D}.audio.ctx`)); n++) {
    await tippeBei(view.width - 4, view.height - 4);
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
  await until('window.__prisma?.frames > 2', 'Spiel startet');
}

/** Tippen, bis die Bühne fertig ist (Prolog: bis sie ausblendet; Epilog: bis die Knöpfe am Ende stehen). */
async function buehneDurch(name, { bisKnoepfe = false } = {}) {
  for (let n = 1; ; n++) {
    await until(`${D}.story.waitTap !== null || ${storyMode} !== 'scene' || ${knoepfe}`, `${name}: Einstellung ${n}`,
      60);
    if (await ev(knoepfe)) { await bild(`${name}-ende`); return; }
    if (!(await ev(`${D}.story.waitTap !== null`))) { pruefe(!bisKnoepfe, `${name}: ohne Knöpfe am Ende`); return; }
    if (n === 1) { await sleep(800); await bild(`${name}-1`); }
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
}

/** Ein Level spielen: warten, bis es läuft, Kopfzeile prüfen, lösen, warten auf «gelöst», Weiter. */
async function level(g, platz, { bilder = false } = {}) {
  const w = Math.floor(platz / 10), k = platz % 10;
  await until(`${D}.story.step === ${platz} && window.__prisma.playing()`, `${g}: Level ${platz + 1} läuft`);
  await kopfzeile(g, platz);
  if (bilder) { await sleep(2200); await bild(`${slug(g)}-${platz + 1}`); }
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', `${g}: Level ${platz + 1} gelöst`, 30);
  if (bilder || k === 9) { await sleep(600); await bild(`${slug(g)}-${platz + 1}-geloest`); }
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
  if (erster) await buehneDurch(`${slug(g)}-prolog`);
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
  for (let w = 0; w < welten; w++) {
    for (let k = 0; k < 10; k++) await level(g, w * 10 + k, { bilder: k === 0 });
    await until(`${storyMode} === 'caption' && document.querySelector('#story .caption .kicker').textContent === `
      + `'Kapitel ${w + 2} · ${WELTEN[w + 1]}'`, `${g}: Reise in Welt ${w + 2}`, 60);
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
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
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
  await tippe('#menue .menue-weiter', 'Weiter');
  await sofortZu(`${g}: Weiter`);
  await until(`${storyMode} === 'caption'`, `${g}: Einstieg in die Sterne`, 60);
  await sleep(1800);
  await bild(`${slug(g)}-einstieg-sterne`);
  for (let k = 0; k < 10; k++) await level(g, 50 + k, { bilder: k === 0 || k === 9 });
  // Finale: zwei Sätze zum Tippen, dann die Antwort des Sterns und der Epilog
  for (let n = 1; n <= 2; n++) {
    await until(`${D}.story.waitTap !== null && ${storyMode} === 'caption'`, `${g}: Finale, Satz ${n}`, 60);
    await sleep(900);
    await bild(`${slug(g)}-finale-${n}`);
    await tippe('#story .caption .text', 'Untertitel');
    await sleep(400);
  }
  await until(`${storyMode} === 'scene'`, `${g}: Epilog`, 60);
  await sleep(2500);
  await bild(`${slug(g)}-epilog`);
  await buehneDurch(`${slug(g)}-epilog`, { bisKnoepfe: true });
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
  await ende('Menü → Prolog (neuer Grad, das Brett versinkt)', { buehne: true });
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
    await taste('Home', { strg: true });
    pruefe(JSON.stringify((await uebStand()).fokus) === '[0,0]', 'Strg+Pos1 in der Übersicht');
  }
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
  pruefe(f.msg === 'Ganz oben' && f.knopf === 'Zur Übersicht', `letztes Level im Wiederholen ${JSON.stringify(f)}`);
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
  await ende('Leicht: Menü → Prolog → Überspringen', { buehne: true });
  // solange das Angebot steht, lädt der Wald fertig (quiet aus): keine Lücke über 100 ms, er ist danach bereit
  await messe();
  await until(`document.querySelectorAll('${ANGEBOT}').length === 2`, 'Leicht: Angebot', 60);
  await sleep(4000);
  await ende('Leicht: Angebot steht, der Wald lädt fertig');
  console.log(`  Wald nach 4 s Angebot bereit: ${await ev(`${D}.skyTheme.ready`)}`);
  await angebot('leicht', 'Üben', { name: 'dorf-angebot', mitTaste: !view.phone });
  await messe();
  await until(`${storyMode} === 'caption'`, 'Leicht: Einstieg ins Dorf', 30);
  pruefe(await kicker() === 'Im Dorf · Erstes Licht' && await ev(`${D}.skyTheme.current`) === 'milky',
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
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
  await geste();
  const wohin = await ev("document.querySelector('#menue .menue-wohin').textContent");
  const karteStand = await ev(`document.querySelector('${karte('leicht')} .menue-stand').textContent`);
  pruefe(wohin === 'Leicht · Dorf 0 / 60', `Leicht nach dem Neuladen: Weiter «${wohin}», Karte «${karteStand}»`);
  pruefe(await ev(`${D}.skyTheme.current`) === 'milky', 'Leicht: Himmel hinter dem Menü nicht der des Dorfs');
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
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${menueOffen}`, 'Menü nach dem Neuladen');
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
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${menueOffen}`, 'c: Menü nach dem Neuladen');
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

try {
  await emulate(send, view);
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.frames > 2', 'Spiel startet');
  reise = await ev('STORY_LEVELS');
  if (startTaste && !view.phone) await gehaltenesEnter();
  if (menue) await menueAblauf();
  if (uebersichtProbe) await uebersichtAblauf();
  if (dorfProbe) await dorfAblauf();
  if (dorfRaenderProbe) await dorfRaender();
  for (const [i, g] of grade.entries()) await durchgang(g, i === 0);
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
if (bildzeiten.length) {
  console.log('\nBildzeiten (Lücken zwischen zwei Bildern des Browsers):');
  for (const b of bildzeiten) {
    console.log(`  ${b.name}: ${b.bilder} Bilder, längste Lücke ${b.max} ms, über 50 ms ${b.ueber50}, `
      + `über 100 ms ${b.ueber100}`);
  }
}
console.log(fehler.length ? `\nProbe FEHLGESCHLAGEN (${fehler.length})` : '\nProbe bestanden, Konsole ohne Fehler.');
process.exit(fehler.length ? 1 : 0);
