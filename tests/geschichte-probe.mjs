// Probe im Browser für Noas Geschichte (Spec .scratch/noa-geschichte/, «Ablauf im Spiel»; Ticket 04): spielt in
// Headless-Chrome (auf der Grafikkarte) je Grad einen Durchgang durch die ersten Welten und auf Wunsch das Finale ab
// der letzten Welt, über die Testschnittstelle (__prismaDebug: story.choose über die Knöpfe der Wahl des Grads, loese
// löst das Level Drehung für Drehung, Weiter wie ein Spieler; den Stand für das Finale setzt sie in localStorage). Sie
// prüft unterwegs Kopfzeile, Speicherstand und das Fortsetzen nach dem Neuladen und nimmt Bilder der wichtigen
// Momente auf (Wahl des Grads, Prolog, Einstieg, Level, gelöst, Reise, Finale, Epilog) nach
// tests/output/geschichte/<bildschirm>-<grad>-<moment>.png. Sie scheitert bei einer falschen Kopfzeile, einem falschen
// Stand oder einer Meldung in der Konsole ([error], Ausnahme, Shader).
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh node tests/geschichte-probe.mjs [--handy] [--grad leicht,mittel]
//           [--welten 2] [--finale <grad>]
//   --handy: 390 × 844 (Pixeldichte 2, Touch) statt 1440 × 900; --grad: die Grade des Durchgangs (Vorgabe alle, «sehr
//   schwer» als sehr-schwer); --welten: so viele Welten je Durchgang (Vorgabe 2, mit der Reise in die nächste);
//   --finale: dazu das Finale in diesem Grad (ohne --grad nur das Finale). Etwa 3 min je Grad, das Finale gut 3 min.
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
const STATIONEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne'];
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const handy = args.includes('--handy');
const grad = (x) => x.replace('-', ' ');
const finaleGrad = wert('--finale') && grad(wert('--finale'));
const grade = wert('--grad') ? wert('--grad').split(',').map(grad) : finaleGrad ? [] : GRADE;
const welten = +(wert('--welten') ?? 2);
if ([...grade, finaleGrad].some(g => g && !GRADE.includes(g)) || !(welten >= 1 && welten <= 5)) {
  console.error('Aufruf: node tests/geschichte-probe.mjs [--handy] [--grad leicht,mittel,…] [--welten 1–5] '
    + '[--finale <grad>]');
  process.exit(1);
}
requireQuiet();

const view = handy ? { name: 'handy', width: 390, height: 844, dpr: 2, phone: true }
  : { name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false };
const PAGE = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro';
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const { send, logs, close } = await startChrome({ ...view, gpu: true });
const ev = (expr) => evaluate(send, expr);
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 10; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(100);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
async function bild(name) {
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `${view.name}-${name}.png`);
  writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
  console.log(`  Bild ${file}`);
}
const D = '__prismaDebug';
const storyMode = `(!document.getElementById('story').classList.contains('hidden') && document.getElementById('story')`
  + '.dataset.mode)';
const knoepfe = "document.querySelector('#story .scene .actions').children.length > 0";
const slug = (g) => g.replace(' ', '-');
const stand = (g) => ev(`JSON.parse(localStorage.getItem('prisma.noa.${slug(g)}') || 'null')`);

/** Seite neu laden (mit vorbereitetem localStorage) und warten, bis die Wahl des Grads offen ist. */
async function laden(storage = {}) {
  const setzen = Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, `
    + `${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join(' ');
  await ev(`localStorage.clear(); ${setzen} window.__vorher = true`);
  await send('Page.reload');
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${storyMode} === 'grades'`, 'Wahl des Grads');
}
async function waehle(g) {
  await ev(`document.querySelector('#story .grades [data-grade="${g}"]').click()`);
}
/** Tippen, bis die Bühne fertig ist (Prolog: bis sie ausblendet; Epilog: bis die Knöpfe am Ende stehen). */
async function buehneDurch(name, { bisKnoepfe = false } = {}) {
  for (let n = 1; ; n++) {
    await until(`${D}.story.waitTap !== null || ${storyMode} !== 'scene' || ${knoepfe}`, `${name}: Einstellung ${n}`,
      60);
    if (await ev(knoepfe)) { await bild(`${name}-ende`); return; }
    if (!(await ev(`${D}.story.waitTap !== null`))) { pruefe(!bisKnoepfe, `${name}: ohne Knöpfe am Ende`); return; }
    if (n === 1) { await sleep(800); await bild(`${name}-1`); }
    await ev(`${D}.story.tap()`);
    await sleep(300);
  }
}

/** Ein Level spielen: warten, bis es läuft, Kopfzeile prüfen, lösen, warten auf «gelöst», Weiter. */
async function level(g, platz, { bilder = false } = {}) {
  const w = Math.floor(platz / 10), k = platz % 10;
  await until(`${D}.story.step === ${platz} && window.__prisma.playing()`, `${g}: Level ${platz + 1} läuft`);
  const titel = await ev("document.getElementById('hud-title').textContent");
  const sub = await ev("document.getElementById('hud-sub').textContent");
  const name = await ev(`(() => { const l = LEVELS[${D}.game.levelIndex]; return l.titel ?? l.name; })()`);
  pruefe(titel === `${WELTEN[w]} – ${name}`, `${g} ${platz + 1}: Titel «${titel}»`);
  pruefe(sub.startsWith(`${GRAD_TEXT[g]} · Kapitel ${w + 1} / 6 · Level ${k + 1} / 10`),
    `${g} ${platz + 1}: Unterzeile «${sub}»`);
  if (bilder) { await sleep(2200); await bild(`${slug(g)}-${platz + 1}`); }
  await ev(`${D}.loese()`);
  await until('window.__prisma.solvedPanel()', `${g}: Level ${platz + 1} gelöst`, 30);
  if (bilder || k === 9) { await sleep(600); await bild(`${slug(g)}-${platz + 1}-geloest`); }
  await ev("document.getElementById('btn-next').click()");
}

/** Durchgang: neuer Stand, Prolog, Einstieg, welten × 10 Level mit den Reisen, dann Fortsetzen nach dem Neuladen. */
async function durchgang(g, erster) {
  console.log(`${view.name}, ${g}: Durchgang durch ${welten} Welten`);
  await laden();
  if (erster) await bild('wahl');
  await waehle(g);
  await until(`${storyMode} === 'scene'`, `${g}: Prolog`);
  if (erster) await buehneDurch(`${slug(g)}-prolog`);
  else {
    await sleep(2500);
    await bild(`${slug(g)}-prolog`);
    await ev("document.querySelector('#story .scene .skip').click()");
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
  // Neuladen: dieselbe Welt ohne Einstieg, dasselbe Level
  await ev('window.__vorher = true');
  await send('Page.reload');
  await until(`!window.__vorher && ${storyMode} === 'grades'`, 'Wahl des Grads nach dem Neuladen');
  const fokus = await ev('document.activeElement?.dataset.grade ?? null');
  pruefe(fokus === g, `${g}: Fokus nach dem Neuladen auf ${fokus}`);
  await waehle(g);
  let einstieg = false;
  for (let i = 0; i < 300 && !(await ev('window.__prisma.playing()')); i++) {
    if (await ev(`${storyMode} === 'caption' || ${storyMode} === 'scene'`)) einstieg = true;
    await sleep(100);
  }
  pruefe(!einstieg, `${g}: nach dem Neuladen ein Einstieg oder Prolog`);
  pruefe(await ev(`${D}.story.step`) === welten * 10, `${g}: nach dem Neuladen am Platz ${welten * 10}`);
}

/** Finale: Stand am Anfang der letzten Welt, Einstieg, 10 Level, Finale, Epilog bis «Zum Menü». */
async function finale(g) {
  console.log(`${view.name}, ${g}: Finale ab der letzten Welt`);
  const vorher = { platz: 50, geloest: [], gesehen: ['prolog', ...STATIONEN.slice(0, 5)], geschafft: false };
  await laden({ 'prisma.noa.zuletzt': g, [`prisma.noa.${slug(g)}`]: vorher });
  await waehle(g);
  await until(`${storyMode} === 'caption'`, `${g}: Einstieg in die Sterne`, 60);
  await sleep(1800);
  await bild(`${slug(g)}-einstieg-sterne`);
  for (let k = 0; k < 10; k++) await level(g, 50 + k, { bilder: k === 0 || k === 9 });
  // Finale: zwei Sätze zum Tippen, dann die Antwort des Sterns und der Epilog
  for (let n = 1; n <= 2; n++) {
    await until(`${D}.story.waitTap !== null && ${storyMode} === 'caption'`, `${g}: Finale, Satz ${n}`, 60);
    await sleep(900);
    await bild(`${slug(g)}-finale-${n}`);
    await ev(`${D}.story.tap()`);
    await sleep(400);
  }
  await until(`${storyMode} === 'scene'`, `${g}: Epilog`, 60);
  await sleep(2500);
  await bild(`${slug(g)}-epilog`);
  await buehneDurch(`${slug(g)}-epilog`, { bisKnoepfe: true });
  const s = await stand(g);
  pruefe(s?.geschafft === true && s.geloest.length === 10, `${g}: Stand nach dem Finale ${JSON.stringify(s)}`);
  const knopf = await ev("[...document.querySelectorAll('#story .scene .actions button')].map(b => b.textContent)"
    + '.join()');
  pruefe(knopf === 'Zum Menü', `${g}: Knöpfe am Ende «${knopf}»`);
  await ev('window.__vorher = true');
  await ev("document.querySelector('#story .scene .actions button').click()");
  await until(`!window.__vorher && window.__prisma?.frames > 2 && ${storyMode} === 'grades'`, 'Zum Menü');
  await bild(`${slug(g)}-zum-menue`);
}

try {
  await emulate(send, view);
  await send('Page.navigate', { url: PAGE });
  await until('window.__prisma?.frames > 2', 'Spiel startet');
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
console.log(fehler.length ? `\nProbe FEHLGESCHLAGEN (${fehler.length})` : '\nProbe bestanden, Konsole ohne Fehler.');
process.exit(fehler.length ? 1 : 0);
