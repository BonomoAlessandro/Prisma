// Probe für das Messwerkzeug (Spec .scratch/leistung/, Ticket 01): fährt den Referenzdurchlauf wie ein Spieler über die
// Knöpfe der Leistungsanzeige. Vorher ein erfundener «echter» Spielstand; Knopf «Referenzdurchlauf» (die Seite lädt
// mit frischem Stand neu) → «Klicken zum Starten» → Leicht im Menü → Prolog Bild für Bild antippen → «Gleich los» →
// Einstieg → erstes Level (gelöst über __prismaDebug.loese) → «Menü» → «Weiter zur Reise» (Sprung ans Ende der ersten
// Welt, Reise ins Meer) → Ergebniskarte nach dem Neuladen. Sie prüft die Abschnitte und Werte der Karte
// (window.__prisma.leistung.ergebnis), dass der echte Stand wieder da ist und die Konsole ohne Fehler bleibt, und legt die
// Karte unter tests/output/leistung/<name>.txt ab.
// Headless (tools/chrome.mjs, ohne GPU in Software, rAF virtuell getaktet) ist das nur eine Regressionsprüfung, die
// Zeiten sind keine echten Messwerte. Echte Werte: --fenster (sichtbares Chrome-Fenster, maximiert, auf der
// Grafikkarte), dazu --handy --drossel 4 für die Handy-Emulation der Spec. Das Fenster dabei nicht verdecken.
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/leistung-probe.mjs [--handy] [--drossel 4]
//           [--fenster]
//   --handy: 393 × 873, Pixeldichte 2,75 (etwa das Poco F4 GT), Touch und Android-Kennung, bedient mit
//   Input.dispatchTouchEvent (Mausereignisse kommen mit der Touch-Emulation nie zurück); --drossel n: CPU n-mal
//   langsamer (Emulation.setCPUThrottlingRate); --fenster: echtes Fenster. Etwa 2 bis 3 min; Zeitrahmen 12 min.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'tests', 'output', 'leistung');
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const handy = args.includes('--handy'), fenster = args.includes('--fenster');
const drossel = wert('--drossel') === null ? 1 : Number(wert('--drossel'));
if (!(drossel >= 1 && drossel <= 20)) {
  console.error('Aufruf: node tests/leistung-probe.mjs [--handy] [--drossel 4] [--fenster]');
  process.exit(1);
}
requireQuiet();

const view = handy ? { width: 393, height: 873, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const name = `${fenster ? 'fenster' : 'headless'}-${handy ? 'handy' : 'desktop'}${drossel > 1 ? `-drossel${drossel}` : ''}`;
const PAGE = pathToFileURL(join(root, 'index.html')).href + '?perf';
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const FRIST_MS = 30000, GESAMT_MS = 12 * 60000;
const chrome = await startChrome({ ...view, gpu: fenster || !!process.env.GPU, fenster, maximiert: fenster && !handy });
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
  for (let i = 0; i < seconds * 5; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
/** Klick (Desktop) bzw. Tippen mit dem Finger (Handy) auf die Mitte eines sichtbaren Elements. */
async function tippe(selector, was = selector) {
  await until(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[inert]')
      && getComputedStyle(el).visibility !== 'hidden'; })()`, `${was} bereit`, 60);
  const { x, y } = await ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)})
    .getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
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
/** Auf die nächste Seite warten (nach location.replace): Merker der alten Seite weg, Bedingung erfüllt. */
async function neueSeite(expr, what, seconds = 120) {
  await until(`!window.__alteSeite && (${expr})`, what, seconds);
}
const D = '__prismaDebug';
const storyMode = `(!document.getElementById('story').classList.contains('hidden') && document.getElementById('story')`
  + '.dataset.mode)';

try {
  if (handy) {
    await emulate(send, view);
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
      + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  } else if (!fenster) await emulate(send, view);
  if (drossel > 1) await send('Emulation.setCPUThrottlingRate', { rate: drossel });
  if (fenster) await send('Page.bringToFront');
  console.log(`${name}: Referenzdurchlauf`);

  // ein «echter» Stand, der den Durchlauf überleben muss
  const echt = { 'prisma.noa.mittel': JSON.stringify({ platz: 23, geloest: ['x'], gesehen: ['prolog'], geschafft: false }),
    'prisma.noa.zuletzt': 'mittel', 'prisma.muted': '1' };
  await send('Page.navigate', { url: PAGE });
  await until('document.readyState === "complete"', 'Seite');
  await ev(`localStorage.clear(); ${Object.entries(echt).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, `
    + `${JSON.stringify(v)});`).join(' ')} window.__alteSeite = true; location.reload()`);
  await neueSeite('window.__prisma?.leistung && document.querySelector(\'#perf [data-leistung="Referenzdurchlauf"]\')',
    'Anzeige mit «Referenzdurchlauf»');
  await ev('window.__alteSeite = true');
  await tippe('#perf [data-leistung="Referenzdurchlauf"]', 'Referenzdurchlauf');
  await neueSeite("window.__prisma?.leistung?.schritt() === 'teil1'", 'Durchlauf nach dem Neuladen');
  pruefe(await ev("localStorage.getItem('prisma.noa.mittel') === null && localStorage.getItem('prisma.muted') === null"),
    'frischer Stand im Durchlauf');

  await until(`${D}.ui.canStart`, '«Klicken zum Starten»', 60);
  await sleep(1500); // wie ein Spieler: das Pulsieren einen Moment ansehen
  await tippe('#intro .start', 'Klicken zum Starten');
  await until(`${D}.menu.offen`, 'Menü', 30);
  await sleep(1500);
  await tippe('#menue .menue-wahl[data-menue-fokus="wahl:leicht"]', 'Leicht');
  await until(`${storyMode} === 'scene'`, 'Prolog', 30);
  for (let n = 1; ; n++) { // Prolog: jedes Bild nach der Fahrt kurz lesen, dann antippen
    await until(`${D}.story.waitTap !== null || document.querySelectorAll('#story .scene .actions.angebot button')`
      + '.length === 2', `Prolog: Bild ${n}`, 60);
    if (await ev(`${D}.story.waitTap === null`)) break;
    await sleep(1200);
    await tippe('#story .scene .lines', 'Bühne');
    await sleep(300);
  }
  await sleep(1500);
  await tippe('#story .scene .actions.angebot button:nth-child(2)', 'Gleich los');
  await until(`${D}.story.step === 0 && window.__prisma.playing() && !${D}.story.running`, 'erstes Level', 90);
  await sleep(3000);
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', '«Gelöst»', 30);
  await sleep(2500);
  await tippe('#btn-menu', 'Menü');
  await until(`${D}.menu.offen`, 'Menü aus dem Spiel', 30);
  await sleep(1500);
  await ev('window.__alteSeite = true');
  await tippe('#perf [data-leistung="Weiter zur Reise"]', 'Weiter zur Reise');
  await neueSeite('(window.__prisma?.leistung?.ergebnis() ?? null) !== null', 'Ergebniskarte', 240);

  const d = await ev('window.__prisma.leistung.ergebnis()');
  const text = await ev("document.querySelector('#leistung-karte pre').textContent");
  pruefe(await ev("!document.getElementById('leistung-karte').hidden"), 'Ergebniskarte nicht zu sehen');
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.txt`), text + '\n');
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(d, null, 2) + '\n');
  console.log(text.split('\n').map((z) => `  ${z}`).join('\n'));

  const ids = d.abschnitte.map((a) => a.id);
  for (const id of ['start', 'menue', 'prolog', 'einstieg', 'spiel', 'reise', 'ankunft']) {
    pruefe(ids.includes(id), `Abschnitt ${id} fehlt (${ids.join(', ')})`);
  }
  for (const a of d.abschnitte) {
    pruefe(a.bilder > 0 && Number.isFinite(a.p95) && a.max >= a.p95 && a.p95 > 0, `${a.name}: Werte ${JSON.stringify(a)}`);
  }
  const reise = d.abschnitte.find((a) => a.id === 'reise');
  pruefe(reise && reise.sekunden > 5 && reise.gezeichnet > 0, `Reise zu kurz oder ohne Bild: ${JSON.stringify(reise)}`);
  pruefe(d.gesamt.zeichnenP95 !== null && d.mass.length > 0, `Zeichenzeit nicht gemessen (${d.mass})`);
  pruefe(d.version && text.includes(d.version) && text.includes(d.geraet.gpu), 'Version oder GPU fehlt auf der Karte');
  // der echte Stand ist zurück, vom Durchlauf bleibt nur das Ergebnis
  const nachher = await ev(`Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('prisma.'))
    .map((k) => [k, localStorage.getItem(k)]))`);
  const sortiert = (o) => JSON.stringify(Object.entries(o).sort());
  const ohneErgebnis = Object.fromEntries(Object.entries(nachher).filter(([k]) => k !== 'prisma.leistung.ergebnis'));
  pruefe(sortiert(ohneErgebnis) === sortiert(echt), `echter Stand nicht zurück: ${JSON.stringify(ohneErgebnis)}`);
  pruefe(await ev('window.__prisma.leistung.schritt() === null'), 'nach dem Durchlauf läuft noch einer');
  // Schliessen vergisst die Karte
  await tippe('#leistung-karte .schliessen', 'Schliessen');
  await sleep(300);
  pruefe(await ev("document.getElementById('leistung-karte').hidden && !localStorage.getItem('prisma.leistung.ergebnis')"),
    'Schliessen: Karte bzw. Ergebnis bleibt');
} catch (e) {
  fehler.push(e.message);
  console.log(`  FEHLER ${e.message}`);
}

const relevant = logs.filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
for (const l of relevant.filter((l) => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l))) {
  pruefe(false, `Konsole: ${l}`);
}
await close();
console.log(fehler.length ? `\n${fehler.length} Fehler` : '\nLeistung: Referenzdurchlauf in Ordnung');
process.exit(fehler.length ? 1 : 0);
