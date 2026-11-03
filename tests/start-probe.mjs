// Probe für den Start (Spec .scratch/leistung/, Ticket 03): Zeit vom Laden der Seite bis zur Enthüllung und bis
// «Klicken zum Starten», dazu der Weg eines Spielers ohne Prolog (Neuladen mitten im Spiel → «Weiter» im Menü) mit den
// Abschnitten des Messwerkzeugs (?perf, leistung.daten(): Startbildschirm, Menü, Laden, Einstieg, Spiel) und der Zeit,
// bis der Himmel steht. Je Lauf ein frischer Chrome.
//   neu:    frischer Stand; Zeiten .go (Enthüllung), .ready (Knopf), skyTheme.shown, längste Lücke im Startbildschirm
//   weiter: Stand mitten in der ersten Welt (Prolog, Angebot und Wald gesehen); Klick 1,5 s nach dem Knopf, im Menü
//           nach 1,5 s «Weiter», bis das Level spielt und der Himmel ganz steht; Abschnitte und längste Bilder
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/start-probe.mjs [--fenster] [--handy]
//           [--drossel 4] [--laeufe 2] [--nur neu|weiter] [--seite <Pfad zu index.html>]
// Headless (ohne --fenster) taktet rAF virtuell: nur zur Regression. Ergebnis als JSON nach tests/output/leistung/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'tests', 'output', 'leistung');
const args = process.argv.slice(2);
const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const handy = args.includes('--handy'), fenster = args.includes('--fenster');
const drossel = Number(wert('--drossel') ?? 1), laeufe = Number(wert('--laeufe') ?? 1), nur = wert('--nur');
const seite = wert('--seite') ? resolve(wert('--seite')) : join(root, 'index.html');
const PAGE = pathToFileURL(seite).href + '?perf';
const view = handy ? { width: 393, height: 873, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const name = `start-${fenster ? 'fenster' : 'headless'}-${handy ? 'handy' : 'desktop'}${drossel > 1 ? `-drossel${drossel}` : ''}`;
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

// vor jedem Laden: Zeiten der Klassen am Startbildschirm und des Himmels, alle rAF-Lücken mit Zeit
const BEOBACHTER = `(() => {
  const z = window.__startZeiten = { go: null, ready: null, shown: null, ganz: null, luecken: [] };
  new MutationObserver(() => {
    const i = document.getElementById('intro'); if (!i) return;
    if (z.go === null && i.classList.contains('go')) z.go = performance.now();
    if (z.ready === null && i.classList.contains('ready')) z.ready = performance.now();
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
  let prev = null;
  const loop = (ts) => {
    if (prev !== null && ts - prev > 25) z.luecken.push([Math.round(prev), Math.round(ts - prev)]);
    prev = ts;
    const s = window.__prismaDebug?.skyTheme;
    if (s && z.shown === null && s.shown) z.shown = performance.now();
    if (s && z.ganz === null && s.ready) z.ganz = performance.now();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();`;

async function lauf(fall, nr) {
  const chrome = await startChrome({ ...view, gpu: fenster || !!process.env.GPU, fenster, maximiert: fenster && !handy });
  const { logs, close } = chrome;
  const send = (m, p) => Promise.race([chrome.send(m, p), sleep(30000).then(() => { throw new Error(`keine Antwort auf ${m}`); })]);
  const ev = (e) => evaluate(send, e);
  const until = async (e, was, s = 60) => {
    for (let i = 0; i < s * 10; i++) { if (await ev(e).catch(() => false)) return; await sleep(100); }
    throw new Error(`Zeitüberschreitung: ${was}`);
  };
  const tippe = async (sel, was) => {
    await until(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[inert]'); })()`, was);
    const { x, y } = await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (view.phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
    return ev('performance.now()');
  };
  const out = { fall, nr };
  try {
    if (handy) {
      await emulate(send, view);
      await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
        + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
    } else if (!fenster) await emulate(send, view);
    if (fenster) await send('Page.bringToFront');
    // Stand setzen (eine leere Seite derselben Herkunft), dann mit Beobachter und Drosselung laden
    await send('Page.navigate', { url: PAGE.replace('?perf', '?nointro&noaudio') });
    await until('document.readyState === "complete"', 'Seite');
    const stand = fall === 'weiter' ? { 'prisma.noa.zuletzt': 'leicht', 'prisma.muted': '1',
      'prisma.noa.leicht': JSON.stringify({ platz: 3, geloest: [], gesehen: ['prolog', 'angebot', 'wald'], geschafft: false }) }
      : { 'prisma.muted': '1' };
    await ev(`localStorage.clear(); ${Object.entries(stand).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')}`);
    await send('Page.navigate', { url: 'about:blank' });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: BEOBACHTER });
    if (drossel > 1) await send('Emulation.setCPUThrottlingRate', { rate: drossel });
    await send('Page.navigate', { url: PAGE });
    await until('window.__startZeiten?.ready !== null && window.__startZeiten?.ready !== undefined', 'Knopf', 90);
    const z = await ev('window.__startZeiten');
    out.go = z.go; out.knopf = z.ready; out.knopfNachGo = z.ready - z.go;
    out.shownBeimKnopf = z.shown !== null;
    // Spec (Ticket 03): «Klicken zum Starten» spätestens 3,9 s nach Beginn der Enthüllung
    pruefe(out.knopfNachGo <= 3900, `${fall} ${nr}: Knopf ${Math.round(out.knopfNachGo)} ms nach .go (höchstens 3900)`);
    if (fall === 'neu') {
      await sleep(6000); // Startbildschirm ruhig: was lädt jetzt?
      const z2 = await ev('window.__startZeiten');
      out.shown = z2.shown; out.ganz = z2.ganz;
      out.lueckenStart = z2.luecken.filter(([t]) => t >= z2.go).sort((a, b) => b[1] - a[1]).slice(0, 6);
      out.daten = (await ev('window.__prisma.leistung.daten()')).abschnitte
        .map((a) => ({ id: a.id, bilder: a.bilder, p95: a.p95, max: a.max, ueber33: a.ueber33 }));
    } else {
      await sleep(1500);
      out.klick = await tippe('#intro .start', 'Klicken zum Starten');
      await until('__prismaDebug.menu.offen', 'Menü');
      await sleep(1500);
      out.weiter = await tippe('#menue .menue-weiter', 'Weiter');
      await until('window.__prisma.playing() && !__prismaDebug.story.running && __prismaDebug.skyTheme.shown', 'Level', 60);
      out.spielt = await ev('performance.now()');
      await until('__prismaDebug.skyTheme.ready', 'Himmel ganz', 30).catch(() => {});
      await sleep(1500);
      const z2 = await ev('window.__startZeiten');
      out.shown = z2.shown; out.ganz = z2.ganz;
      out.shownNachWeiter = z2.shown - out.weiter; out.spieltNachWeiter = out.spielt - out.weiter;
      out.lueckenNachKlick = z2.luecken.filter(([t]) => t >= out.klick - 50).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([t, ms]) => [Math.round(t - out.klick), ms]);
      out.daten = (await ev('window.__prisma.leistung.daten()')).abschnitte
        .map((a) => ({ id: a.id, bilder: a.bilder, p95: a.p95, max: a.max, ueber33: a.ueber33, s: a.sekunden }));
    }
  } catch (e) { pruefe(false, `${fall} ${nr}: ${e.message}`); }
  for (const l of logs.filter((l) => /\[exception\]|\[error\]/.test(l))) pruefe(false, `Konsole: ${l}`);
  // Sicherheitsnetz der Hauptschleife (sceneLoop.guard): Sie ruhte, obwohl etwas anstand – eine Weckstelle fehlt
  const weckstellen = logs.filter((l) => /Weckstelle fehlt/.test(l));
  if (weckstellen.length) console.log(`  WARNUNG ${fall} ${nr}: ${weckstellen.length}× fehlende Weckstelle:\n    ${weckstellen.join('\n    ')}`);
  await close();
  return out;
}

const ergebnisse = [];
for (const fall of ['neu', 'weiter']) {
  if (nur && nur !== fall) continue;
  for (let nr = 1; nr <= laeufe; nr++) {
    const r = await lauf(fall, nr);
    ergebnisse.push(r);
    const f = (v) => (v == null ? '–' : (v / 1000).toFixed(2));
    console.log(`${name} ${fall} ${nr}: .go ${f(r.go)} s, Knopf ${f(r.knopf)} s (${f(r.knopfNachGo)} s nach .go), `
      + `Himmel steht ${f(r.shown)} s, ganz ${f(r.ganz)} s`
      + (fall === 'weiter' ? `; nach «Weiter»: Himmel ${f(r.shownNachWeiter)} s, spielt ${f(r.spieltNachWeiter)} s` : ''));
    for (const a of r.daten ?? []) console.log(`    ${a.id.padEnd(12)} ${String(a.bilder).padStart(5)} Bilder  p95 ${a.p95?.toFixed(1)}  max ${a.max?.toFixed(1)}  >33 ${a.ueber33}`);
    console.log(`    längste Lücken [ms ab ${fall === 'neu' ? 'Laden' : 'Klick'}, ms]: ${JSON.stringify(r.lueckenStart ?? r.lueckenNachKlick)}`);
  }
}
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${name}.json`), JSON.stringify(ergebnisse, null, 2) + '\n');
console.log(fehler.length ? `\n${fehler.length} Fehler` : '\nStart: in Ordnung');
process.exit(fehler.length ? 1 : 0);
