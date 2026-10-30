// Probe im Browser für Noas Geschichte (Spec .scratch/noa-geschichte/, «Ablauf im Spiel»; Tickets 04 und 05): spielt
// in Headless-Chrome (auf der Grafikkarte) über das Menü. Je Grad ein Durchgang durch die ersten Welten, auf Wunsch das
// Finale ab der letzten Welt bis «Zum Menü» und weiter in den nächsten Grad, und mit --menue das Menü selbst: «Weiter»,
// «Menü» im Spiel und zurück ins selbe Level, Wechsel in einen Grad in einer anderen Welt, «Von vorn» mit Rückfrage,
// ein neuer Grad aus dem Spiel heraus, Tastatur, dazu auf dem Desktop ein gehaltenes Enter am Startbildschirm (--start
// allein). Bedient wird wie ein Spieler: auf dem Desktop mit der Maus
// (Input.dispatchMouseEvent), auf dem Handy mit dem Finger (Input.dispatchTouchEvent; Mausereignisse kommen mit der
// Touch-Emulation nie zurück). Gelöst wird über die Testschnittstelle (__prismaDebug.loese, Drehung für Drehung), einen
// Stand setzt die Probe in localStorage. Sie prüft Kopfzeile, Speicherstand, Menü (Stand je Grad, «Weiter», Fokus,
// Hervorhebung), dass das Menü nach der Wahl sofort ausblendet, dass die Kamera im Himmel bleibt, bis die Welt bereit
// ist (kein leeres Brett), und misst die Bildzeiten der Übergänge (Lücken zwischen zwei requestAnimationFrame; Lücken
// über 100 ms sind Fehler, ausser während eines Bilds der Probe und beim ersten Zeichnen der Bühne, siehe ende).
// Bilder der wichtigen Momente nach tests/output/geschichte/<bildschirm>-<name>.png. Sie scheitert bei einem falschen
// Wert oder einer Meldung in der Konsole ([error], Ausnahme, Shader).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs [--handy | --quer]
//           [--grad leicht,mittel] [--welten 2] [--finale <grad>] [--menue] [--start]
//   --handy: 390 × 844, --quer: 844 × 390 (Pixeldichte 2, Touch) statt 1440 × 900; --grad: die Grade des Durchgangs
//   («sehr schwer» als sehr-schwer); --welten: so viele Welten je Durchgang (Vorgabe 2, mit der Reise in die nächste);
//   --finale: dazu das Finale in diesem Grad; --menue: dazu der Ablauf im Menü; --start: nur das gehaltene Enter. Ohne
//   --grad, --finale, --menue und --start alle vier Grade. Etwa 3 min je Grad, das Finale gut 4 min, das Menü etwa
//   3 min. Zeitrahmen: jede Anfrage an Chrome höchstens 30 s, der ganze Lauf höchstens 14 min; dann schliesst die Probe
//   Chrome und bricht mit Fehler ab.
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
const startTaste = args.includes('--start') || menue; // gehaltenes Enter am Startbildschirm (nur Desktop)
const grade = wert('--grad') ? wert('--grad').split(',').map(grad) : finaleGrad || startTaste ? [] : GRADE;
const welten = +(wert('--welten') ?? 2);
if ([...grade, finaleGrad].some(g => g && !GRADE.includes(g)) || !(welten >= 1 && welten <= 5)
  || args.includes('--handy') && args.includes('--quer')) {
  console.error('Aufruf: node tests/geschichte-probe.mjs [--handy | --quer] [--grad leicht,mittel,…] [--welten 1–5] '
    + '[--finale <grad>] [--menue] [--start]');
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
const TASTEN = { Tab: 9, Enter: 13, Escape: 27, Space: 32, ArrowUp: 38, ArrowDown: 40 };
async function taste(key) {
  const vk = TASTEN[key], k = key === 'Space' ? ' ' : key;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: key, windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk, ...(key === 'Enter' ? { text: '\r' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: key, windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk });
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
      ready: k.ready, menu: ${D}.menu.offen, bild: window.__prisma.frames }); requestAnimationFrame(loop); };
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
    const z = ({ ts, ...x }) => JSON.stringify({ ...x, gaze: +x.gaze.toFixed(3) });
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
    && JSON.stringify(s.gesehen) === JSON.stringify(['prolog', ...STATIONEN.slice(0, welten + 1)]),
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
  await until(`${storyMode} === 'caption'`, `${naechster}: Einstieg`, 60);
  await level(naechster, 0, { bilder: true });
  pruefe((await stand(naechster))?.gesehen?.join() === 'prolog,wald', `${naechster}: Stand nach dem ersten Level`);
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
  pruefe(start.vonvorn === 'vonvorn:leicht,vonvorn:mittel,vonvorn:schwer', `«Von vorn» bei ${start.vonvorn}`);

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
  await until(`${storyMode} === 'caption'`, 'Schwer: Einstieg', 60);
  await level('schwer', 0);
  const s = await stand('schwer');
  pruefe(s?.gesehen?.join() === 'prolog,wald' && s.geloest.length === 1 && s.gespielt > 1000,
    `Schwer neu: Stand ${JSON.stringify(s)}`);
}

try {
  await emulate(send, view);
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.frames > 2', 'Spiel startet');
  reise = await ev('STORY_LEVELS');
  if (startTaste && !view.phone) await gehaltenesEnter();
  if (menue) await menueAblauf();
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
