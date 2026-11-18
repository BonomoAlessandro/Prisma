// Probe der Android-App im Browser (Ticket 10 von .scratch/umbau/): der Build der App (vite build --mode app, in einen
// eigenen Ordner) über http in Headless-Chrome als Handy. Was ohne Android geht: kein Manifest und kein Service Worker,
// der Link zur Datenschutzerklärung auf GitHub Pages, und die Logik der Zurück-Taste (zurueckTaste in
// src/seite/geschichte/geschichte.js, in der App vom Hörer auf backButton gerufen): Startbildschirm → App schliesst,
// offene Liste der Sprachen → nur sie zu, ein Wechsel der Sprache ohne Neuladen führt den Link nach (Text, #en),
// Menü nach dem Start → App schliesst, Prolog → überspringen, Level → Menü, Menü aus dem Level → zurück ins Level,
// Übersicht → zu. Die Taste selbst, Vollbild, Drehen und den Spielstand nach Neustart und Update prüft der Nutzer auf
// dem Handy (Prüfliste im Ticket). Leichter Lauf (keine Zeitmessung, etwa 2 min in SwiftShader):
//   LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/app-probe.mjs [--gpu]
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emulate, evaluate, sleep, startChrome } from '../tools/chrome.mjs';
import { root, spielServer } from '../tools/spielserver.mjs';

const GPU = process.argv.includes('--gpu');
const ordner = mkdtempSync(join(tmpdir(), 'prisma-app-probe-'));
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const b = spawnSync(process.execPath, [vite, 'build', '--mode', 'app', '--outDir', ordner, '--emptyOutDir', '--logLevel', 'warn'],
  { cwd: root, encoding: 'utf8' });
if (b.status !== 0) { console.error(`Build der App gescheitert:\n${b.stdout}\n${b.stderr}`); process.exit(1); }

const spiel = await spielServer({ ordner, bauen: false });
const chrome = await startChrome({ width: 390, height: 844, gpu: GPU });
const ev = (x) => evaluate(chrome.send, x);
/** Wartet, bis der Ausdruck wahr ist (höchstens s Sekunden). */
async function bis(ausdruck, was, s = 90) {
  for (let i = 0; i < s * 5; i++) {
    if (await ev(ausdruck).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${was}`);
}
let ok = 0;
const schritt = (was) => { ok++; console.log(`  ok    ${was}`); };
try {
  await emulate(chrome.send, { width: 390, height: 844, dpr: 1, phone: true });
  await chrome.send('Page.navigate', { url: spiel.seite('noadapt') });
  await bis('window.__prisma?.ticks > 2', 'Spiel startet');
  assert.equal(await ev('window.PRISMA_APP'), true);
  assert.equal(await ev('!!document.querySelector(\'link[rel="manifest"]\')'), false, 'Manifest eingebunden');
  schritt('PRISMA_APP gesetzt, kein Manifest');
  assert.equal(await ev('flow.state'), 'intro');
  assert.equal(await ev('zurueckTaste()'), false);
  schritt('Startbildschirm: Zurück schliesst die App');

  await bis(`(document.querySelector('#intro .start')?.click(), flow.state !== 'intro')`, 'Start', 60);
  await bis('menu.offen && story.choosing', 'Menü nach dem Start');
  const link = await ev(`document.querySelector('#menue .menue-datenschutz')?.href`);
  assert.equal(link, 'https://bonomoalessandro.github.io/Prisma/datenschutz.html');
  schritt('Menü: Datenschutz verweist auf GitHub Pages');
  // Liste der Sprachen (Sprachwahl, Merge mit Ticket 10): Zurück schliesst wie Esc zuerst nur sie, das Menü bleibt
  await ev(`document.querySelector('#menue .menue-sprache').click()`);
  await bis(`document.querySelector('#menue .menue-sprache').getAttribute('aria-expanded') === 'true'`, 'Liste offen', 5);
  assert.equal(await ev('zurueckTaste()'), true);
  await bis(`document.querySelector('#menue .menue-sprache').getAttribute('aria-expanded') === 'false'`, 'Liste zu', 5);
  assert.equal(await ev('menu.offen && story.choosing'), true, 'Menü offen');
  schritt('Liste der Sprachen offen: Zurück schliesst nur sie');
  // Wechsel ohne Neuladen: Text und Ziel des Links folgen (Englisch: #en), hin und zurück
  for (const [k, text, ziel] of [['en', 'Privacy', '#en'], ['de', 'Datenschutz', '']]) {
    await ev(`document.querySelector('#menue .menue-sprache').click()`);
    await bis(`!!document.querySelector('#menue [role="menuitemradio"][lang="${k}"]')?.offsetParent`, 'Liste offen', 5);
    await ev(`document.querySelector('#menue [role="menuitemradio"][lang="${k}"]').click()`);
    await bis(`document.documentElement.lang === '${k}'`, `Sprache ${k}`, 10);
    assert.deepEqual(await ev(`['textContent', 'href'].map((p) => document.querySelector('#menue .menue-datenschutz')[p])`),
      [text, `https://bonomoalessandro.github.io/Prisma/datenschutz.html${ziel}`]);
  }
  schritt('Wechsel der Sprache: Datenschutz folgt (Text, Pages mit #en)');
  assert.equal(await ev('zurueckTaste()'), false);
  schritt('Menü nach dem Start: Zurück schliesst die App');

  // «Beginnen» im Grad leicht: Prolog, dann das Dorf (erste Übung)
  await ev(`document.querySelector('#menue .menue-weiter').click()`);
  await bis(`flow.state === 'story' || !document.querySelector('#story').classList.contains('hidden')`, 'Prolog');
  assert.equal(await ev('zurueckTaste()'), true);
  schritt('Prolog: Zurück überspringt');
  // das Angebot «Üben» / «Gleich los»: gleich los in den Bergwald
  await bis(`document.querySelectorAll('#story .scene .actions.angebot button').length === 2`, 'Angebot');
  await ev(`document.querySelector('#story .scene .actions.angebot button:nth-child(2)').click()`);
  // der Einstieg des Kapitels wartet auf Tippen (wie im Bildvergleich: tippen, bis das Level steht)
  await bis(`(!story.el.classList.contains('hidden') && story.tap(), flow.state === 'play' && !menu.offen && !story.running)`,
    'erstes Level', 180).catch(async (e) => {
    console.error(`  Zustand: ${await ev('JSON.stringify({ s: flow.state, m: menu.offen, r: story.running, h: story.el.classList.contains("hidden") })')}`);
    throw e;
  });
  await sleep(1500);
  assert.equal(await ev('zurueckTaste()'), true);
  await bis('menu.offen && story.choosing && !!story.paused', 'Menü aus dem Level');
  schritt('Level: Zurück öffnet das Menü');
  await sleep(1000);
  assert.equal(await ev('zurueckTaste()'), true);
  await bis(`!menu.offen && flow.state === 'play'`, 'zurück im Level');
  schritt('Menü aus dem Level: Zurück führt ins Level');
  await sleep(1500);
  // «Übersicht» (Taste L): wirkt erst, wenn die Kamera wieder beim Brett ist (story.running)
  await bis('(story.toOverview(), uebersicht.offen)', 'Übersicht');
  assert.equal(await ev('zurueckTaste()'), true);
  await bis('!uebersicht.offen', 'Übersicht zu');
  schritt('Übersicht: Zurück schliesst sie');

  await bis('navigator.serviceWorker.getRegistrations().then((r) => r.length === 0)', 'keine Registrierung', 5);
  assert.equal(await ev('navigator.serviceWorker.getRegistrations().then((r) => r.length)'), 0);
  schritt('kein Service Worker registriert');
  const fehler = chrome.logs.filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l))
    .filter((l) => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
  assert.deepEqual(fehler, [], 'Fehler in der Konsole');
  schritt('Konsole ohne Fehler');
  console.log(`\n${ok} Schritte bestanden.`);
} catch (e) {
  console.error(`  FAIL  ${e.message}`);
  process.exitCode = 1;
} finally {
  await chrome.close();
  await spiel.close();
  rmSync(ordner, { recursive: true, force: true });
}
