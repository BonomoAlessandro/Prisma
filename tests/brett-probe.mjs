// Probe im Browser für das Brett je Himmel (Spec .scratch/brett-je-himmel/, Ticket 02): Wechsel, Bereitsein, Halten,
// Überblenden, Freigeben und Notfall des Bretts, geprüft über die Testschnittstelle (__prisma.brett(), skyReady) und
// ein Protokoll je Bild, ohne Bilder zu vergleichen. Solange alle Himmel das Steinbrett haben, ist der Wechsel unsichtbar;
// darum legt die Probe nur in der Seite eigene Arten an (boardTheme.types: ein Steinbrett, dessen Berechnen sie
// freigibt, und eines, dessen Berechnen scheitert) und gibt einzelnen Himmeln eine Brett-Angabe dieser Arten.
//   mechanik: Desktop, Level 0 auf dem Brett. Wald → Strand mit einem eigenen Brett, das erst nach dem Himmel bereit
//             ist: Himmel und Brett halten, dann gleiten beide gleich lang (2,4 s) direkt ineinander, nie ein drittes
//             Brett im Bild, Laden und Überblenden ohne Lücke über 100 ms. Zurück in den Wald mit keep 0 (Handy): Das
//             Brett des Strands ist danach freigegeben. Strand → Milchstrasse mit keep 3 (Desktop: nach der Frist): Es
//             bleibt, bis die Frist um ist. Das Dorf vorgeladen (preload): Sein Brett ist vor dem Wechsel bereit, Himmel
//             und Brett blenden ohne Halten über. Wüste mit einem Brett, dessen Berechnen scheitert: vom Dorf ins
//             Steinbrett als Notfall, Warnung, kein Fehler. Vulkan ohne Überblenden (kein früheres Brett zum Halten):
//             erst keines, nach 8 s das Steinbrett, dann gleitet es ins richtige.
//             Der Wald zeigt beim Laden sein Moospolster (Ticket 07); danach nimmt die Mechanik ihm die Brett-Angabe,
//             damit nur das Steinbrett und die Bretter der Probe gebaut sind.
//   netz:     Handy-Ansicht über einen lokalen Server, Netz gedrosselt (300 KB/s, 150 ms) und CPU 4× langsamer, Stand
//             mitten in der Wüste, wie im Spiel über den Startbildschirm: «Tippen zum Starten» und «Weiter» je sofort.
//             Der Kleine Wagen wartet, der Blick senkt sich erst, wenn Himmel und Brett der Wüste bereit sind (oder
//             nach 8 s), und unter einem Himmel aus Blender steht nie ein fremdes Brett oder ein Steinbrett als Notfall.
//             Die Wüste lädt dabei ihr eigenes Brett (die Art ihrer Brett-Angabe, Lehmterrasse, Ticket 06).
// Die Prüfung «unter einem Himmel aus Blender nur sein Brett» (brettPasst) vergleicht auch die Art mit der Brett-Angabe
// des Himmels im Register.
//   menue:    Desktop über den Startbildschirm (ohne ?nointro, unter dem Menü lädt nichts Grosses). Im Menü springt der
//             Himmel zum Dorf mit einem eigenen Brett, das nicht bereit wird: Die Frist des Notfalls zählt dort nicht,
//             nach 10 s steht weder ein Steinbrett als Notfall da noch eine Warnung in der Konsole.
//   reise:    Desktop, Stand am Ende des Bergwalds, ohne Vorladen (wie «Weiter» gleich nach dem Lösen): Auf der Reise ans
//             Meer wird das echte Brett des Strands (Gezeitenbecken) berechnet und hochgeladen, während skyTheme.quiet
//             gilt. Der Blick senkt sich auf dieses Brett, bereit und ohne Notfall, und die Reise hat keine Lücke über
//             100 ms.
//   formen:   Desktop (Ticket 05). Übergang zwischen allen Arten des Registers (dazu das Steinbrett), jede geordnete
//             Paarung einmal, flach und herausgezoomt, auf den beiden Himmeln aus dem Code als Trägern; dazu Stein → Lehm,
//             umgelenkt ins Hochbeet, und Hochbeet → Stein, zurück ins Hochbeet. Je Bild nur die Bretter in einem kleinen
//             Bild: Im Kernquader (hinter ihm zeichnet der Himmel nichts) deckt jedes Pixel ein Brett, und kein Teil
//             erscheint oder verschwindet auf einmal, auch nicht im letzten Bild.
// Aufruf: GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/brett-probe.mjs [--nur mechanik|netz|menue|reise|formen]
// Etwa 3 min. Scheitert bei einem falschen Wert oder einer Meldung [error] bzw. einer Ausnahme in der Konsole.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const nur = args.includes('--nur') ? args[args.indexOf('--nur') + 1] : null;
if (nur !== null && !['mechanik', 'netz', 'menue', 'reise', 'formen'].includes(nur)) {
  console.error('Aufruf: node tests/brett-probe.mjs [--nur mechanik|netz|menue|reise|formen]');
  process.exit(1);
}
requireQuiet();
const fehler = [];
const pruefe = (ok, text) => { console.log(`  ${ok ? 'ok  ' : 'FEHLER'} ${text}`); if (!ok) fehler.push(text); };
setTimeout(() => { console.error('Zeitrahmen von 10 min überschritten: Abbruch'); process.exit(3); }, 600000).unref();

/** Chrome mit Hilfen: ev (Ausdruck), until (warten, bis wahr), Protokoll je Bild (an, aus) */
async function browser(view) {
  const chrome = await startChrome({ ...view, gpu: true });
  const send = (m, p) => Promise.race([chrome.send(m, p),
    sleep(30000).then(() => { throw new Error(`keine Antwort auf ${m}`); })]);
  const ev = (e) => evaluate(send, e);
  const until = async (e, was, s = 60) => {
    for (let i = 0; i < s * 10; i++) { if (await ev(e).catch(() => false)) return; await sleep(100); }
    throw new Error(`Zeitüberschreitung: ${was}`);
  };
  await emulate(send, view);
  return { ...chrome, send, ev, until };
}

// je Bild (eigenes requestAnimationFrame): gewählter und gezeigter Himmel (mit Anteil), Überblenden, bereit, das Brett
// (__prisma.brett, dazu soll: die Art der Brett-Angabe seines Himmels im Register) und welche Bretter sichtbar sind; dazu
// Blick (gaze), Kleiner Wagen, Zustand. Läuft auch schon vor dem Spiel (Netz: ab dem Laden der Seite)
const PROTOKOLL = `(() => { const b = window.__bl = { an: true, log: [] };
  const loop = (ts) => { if (!b.an) return; requestAnimationFrame(loop);
    const D = window.__prismaDebug, k = D?.skyTheme; if (!k || !window.__prisma?.brett) return;
    const shown = k.entries.find((e) => k.weight[e.id] > 0), br = window.__prisma.brett();
    b.log.push({ ts, cur: k.current, shown: shown?.id ?? null, w: shown ? k.weight[shown.id] : 0,
      blender: !!shown?.module?.panorama, fading: k.fading, holding: k.holding, ready: k.ready,
      brett: { ...br, soll: br.himmel && (k.byId.get(br.himmel)?.board?.type ?? 'stone') },
      sichtbar: [...D.boardTheme.built.values()].filter((e) => e.board?.group.visible)
        .map((e) => e.key), gaze: D.story.gaze, menu: D.menu.offen, flow: D.flow.state,
      wagen: document.getElementById('lade').classList.contains('an') }); };
  requestAnimationFrame(loop); return true; })()`;
const protokollAus = (ev) => ev('(() => { const b = window.__bl; b.an = false; return b.log; })()');

/**
 * Unter einem Himmel aus Blender steht nie das Brett eines anderen Himmels oder ein Steinbrett als Notfall: ohne
 * Überblenden das Brett des gezeigten Himmels, beim Überblenden (nur während der Himmel überblendet) das neue des
 * gewählten, und zwar in der Art seiner Brett-Angabe im Register (soll). Nur, wo man das Brett sieht (Blick unter 0,6,
 * kein Menü).
 */
function brettPasst(log, was) {
  const falsch = log.find((e) => e.blender && e.gaze < 0.6 && !e.menu && (e.brett.notfall || e.brett.art !== e.brett.soll
    || (e.brett.anteil === 1 ? e.brett.himmel !== e.shown : !e.fading || e.brett.himmel !== e.cur)));
  pruefe(!falsch, `${was}: unter einem Himmel aus Blender nur sein Brett${falsch ? ` (${JSON.stringify(falsch)})` : ''}`);
}

/** Längste Lücke zwischen zwei Bildern im Protokoll: { max (ms), bei (ts ihres Endes), ueber50 (Anzahl) } */
function luecke(log) {
  let max = 0, bei = log[0]?.ts ?? 0, ueber50 = 0;
  for (let i = 1; i < log.length; i++) {
    const d = log[i].ts - log[i - 1].ts;
    if (d > 50) ueber50++;
    if (d > max) { max = d; bei = log[i].ts; }
  }
  return { max, bei, ueber50 };
}

/** Konsole: keine Fehler und Ausnahmen; Warnungen nach Muster zählen */
function konsole(logs, was) {
  const rel = logs.filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l));
  const schlimm = rel.filter((l) => /\[exception\]|\[error\]|\[log:error\]|THREE\.WebGLProgram/.test(l));
  pruefe(!schlimm.length, `${was}: Konsole ohne Fehler${schlimm.length ? `\n      ${schlimm.join('\n      ')}` : ''}`);
  return rel.filter((l) => /^\[warning\]/.test(l));
}

/* ---------- Mechanik ---------- */

async function mechanik() {
  console.log('Mechanik (Desktop 1280 × 800)');
  const b = await browser({ width: 1280, height: 800, dpr: 1, phone: false });
  const { ev, until, logs } = b;
  try {
    await b.send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro' });
    await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady()', 'Wald bereit', 120);
    const start = await ev('__prisma.brett()'), wald = await ev(`__prismaDebug.skyTheme.byId.get('forest').board?.type`);
    pruefe(start.himmel === 'forest' && start.art === wald && start.bereit && start.anteil === 1 && start.von === null
      && !start.notfall, `Start: Brett des Waldes (${wald}) ${JSON.stringify(start)}`);
    // Die Mechanik rechnet mit dem Steinbrett im Wald (nur das Steinbrett und das der Probe gebaut): Der Wald bekommt
    // hier keine Brett-Angabe mehr, sein Moospolster wird frei (seit Ticket 07)
    await ev(`(() => { const B = __prismaDebug.boardTheme; __prismaDebug.skyTheme.byId.get('forest').board = undefined;
      B.free('forest'); B.prepare('forest', undefined); return true; })()`);
    await until(`__prismaDebug.boardTheme.built.size === 1 && __prisma.brett().art === 'stone'`, 'Wald mit Steinbrett', 30);
    await ev('__prismaDebug.zeige(0); true');
    await until('window.__prisma.playing()', 'Level 0', 30);
    // eigene Arten, nur in dieser Seite: «probe» ist ein Steinbrett, dessen Berechnen die Probe freigibt (tor), mit
    // kleinerem Kernquader; «kaputt» scheitert beim Berechnen
    await ev(`(() => { const B = __prismaDebug.boardTheme, tore = window.__tore = {};
      B.types.probe = { core: { lo: [-PLATE / 2, -0.2, -PLATE / 2], hi: [PLATE / 2, 0, PLATE / 2] },
        build(v) { const s = stoneBoard(); const tor = new Promise((ja) => { tore[v.tor] = ja; });
          s.computed = Promise.all([s.computed, tor]); return s; } };
      B.types.kaputt = { core: B.types.stone.core, build() { const s = stoneBoard();
        s.computed = Promise.reject(new Error('Probe: Berechnen gescheitert')); s.computed.catch(() => {}); return s; } };
      return true; })()`);
    const STEIN = JSON.stringify(['stone', []]), PROBE = (tor) => JSON.stringify(['probe', [['tor', tor]]]);

    // Wald → Strand: Halten, bis das Brett bereit ist, dann gleichzeitig mit dem Himmel überblenden
    await ev(`__prismaDebug.skyTheme.byId.get('beach').board = { type: 'probe', tor: 'strand' }; true`);
    await ev(PROTOKOLL);
    await ev(`(() => { const k = __prismaDebug.skyTheme; k.fadeTime = 2.4; k.set('beach'); return true; })()`);
    await until(`__prismaDebug.skyTheme.byId.get('beach').module.settled`, 'Strand geladen', 120);
    await sleep(1500);
    const halt = await ev(`({ brett: __prisma.brett(), w: __prismaDebug.skyTheme.weight.forest, ready: __prisma.skyReady(),
      holding: __prismaDebug.skyTheme.holding, settled: __prismaDebug.skyTheme.settled })`);
    pruefe(halt.brett.himmel === 'forest' && halt.brett.anteil === 1 && halt.w === 1 && !halt.ready && halt.holding
      && !halt.settled, `Halten: Wald und sein Brett stehen, bis das Brett des Strands bereit ist ${JSON.stringify(halt)}`);
    const torT = await ev('performance.now()');
    await ev('__tore.strand(); true');
    await until('__prisma.skyReady()', 'Strand samt Brett bereit', 60);
    await sleep(300);
    let log = await protokollAus(ev);
    // das Brett wird übersetzt und in Häppchen hochgeladen (3 Texturen à 1024²), während das Level spielt: ohne Ruck
    const laden = luecke(log.filter((e) => e.ts >= torT));
    pruefe(laden.max <= 100, `Brett laden und überblenden: längste Lücke ${Math.round(laden.max)} ms bei `
      + `${Math.round(laden.bei - torT)} ms (höchstens 100), ${laden.ueber50} über 50 ms`);
    const ende = await ev('__prisma.brett()');
    pruefe(ende.himmel === 'beach' && ende.art === 'probe' && ende.bereit && ende.anteil === 1 && ende.von === null,
      `Strand: sein Brett steht ${JSON.stringify(ende)}`);
    const fade = log.filter((e) => e.brett.von === 'forest' && e.brett.himmel === 'beach');
    const a0 = log.indexOf(fade[0]), a1 = log.indexOf(fade.at(-1));
    const steigt = fade.every((e, i) => i === 0 || e.brett.anteil >= fade[i - 1].brett.anteil);
    pruefe(fade.length > 20 && fade[0].brett.anteil < 0.1 && fade.at(-1).brett.anteil > 0.9 && steigt,
      `Überblenden: ${fade.length} Bilder, Anteil ${fade[0]?.brett.anteil.toFixed(3)} → ${fade.at(-1)?.brett.anteil.toFixed(3)}, steigend ${steigt}`);
    pruefe(log.slice(0, a0).every((e) => e.brett.himmel === 'forest' && e.brett.anteil === 1 && e.shown === 'forest'
      && e.w === 1), 'vor dem Überblenden: Himmel und Brett des Waldes stehen ganz');
    pruefe(fade.every((e) => e.fading), 'das Brett blendet nur, solange der Himmel überblendet');
    // gleich lang wie der Himmel: Beginn und Ende je höchstens ein Bild auseinander
    const h0 = log.findIndex((e) => !(e.shown === 'forest' && e.w === 1));
    const h1 = log.findIndex((e) => e.shown === 'beach' && e.w === 1);
    const dauer = (log[h1]?.ts - log[h0]?.ts) / 1000, bdauer = (log[a1 + 1]?.ts - log[a0]?.ts) / 1000;
    pruefe(Math.abs(a0 - h0) <= 1 && Math.abs(a1 + 1 - h1) <= 1 && Math.abs(dauer - 2.4) < 0.35,
      `gleichzeitig mit dem Himmel: Himmel Bild ${h0}–${h1} (${dauer.toFixed(2)} s), Brett Bild ${a0}–${a1 + 1} (${bdauer.toFixed(2)} s)`);
    const dritte = log.find((e) => e.sichtbar.some((k) => k !== STEIN && k !== PROBE('strand')) || e.sichtbar.length > 2);
    pruefe(!dritte && fade.some((e) => e.sichtbar.length === 2) && log.at(-1).sichtbar.join() === PROBE('strand'),
      `nur das bisherige und das neue Brett im Bild, am Ende nur das neue${dritte ? ` (${JSON.stringify(dritte.sichtbar)})` : ''}`);
    brettPasst(log, 'Wald → Strand');

    // zurück in den Wald wie auf dem Handy (keep 0): das Brett des Strands ist danach freigegeben
    await ev(PROTOKOLL);
    await ev(`(() => { const k = __prismaDebug.skyTheme; k.keep = 0; k.set('forest'); return true; })()`);
    await until('__prisma.skyReady()', 'Wald', 60);
    log = await protokollAus(ev);
    let gebaut = await ev('[...__prismaDebug.boardTheme.built.keys()]');
    pruefe(log.some((e) => e.brett.von === 'beach' && e.sichtbar.includes(PROBE('strand')))
      && !gebaut.includes(PROBE('strand')) && gebaut.includes(STEIN),
    `Handy: Strand → Wald blendet über, danach ist das Brett des Strands frei (gebaut: ${gebaut.join(' ')})`);
    brettPasst(log, 'Strand → Wald');

    // Desktop (keep 3 statt 30): zur Milchstrasse bleibt das Brett des Strands bis zum Ende der Frist
    await ev(`(() => { const k = __prismaDebug.skyTheme; k.keep = 3; k.set('beach'); return true; })()`);
    await until('!!window.__tore.strand && __prismaDebug.boardTheme.built.size === 2', 'Brett des Strands neu', 10);
    await ev('__tore.strand(); true');
    await until('__prisma.skyReady()', 'Strand', 60);
    await ev(`__prismaDebug.skyTheme.set('milky'); true`);
    await until('__prisma.skyReady()', 'Milchstrasse', 30);
    const frist = await ev(`__prismaDebug.boardTheme.built.has(${JSON.stringify(PROBE('strand'))})`);
    await sleep(3600);
    gebaut = await ev('[...__prismaDebug.boardTheme.built.keys()]');
    pruefe(frist && !gebaut.includes(PROBE('strand')), `Desktop: Brett des Strands erst nach der Frist frei (${frist}, danach ${gebaut.join(' ')})`);

    // Vorladen (wie die nächste Welt, solange «Gelöst» steht): Das Brett des Dorfs wird mit seinem Himmel gebaut,
    // berechnet und hochgeladen, bevor er gewählt ist. Beim Wechsel ist nichts mehr zu tun: Himmel und Brett blenden
    // sofort über, ohne Halten und ohne Ruck
    await ev(`(() => { const k = __prismaDebug.skyTheme; k.byId.get('village').board = { type: 'probe', tor: 'dorf' };
      k.preload('village'); return true; })()`);
    await until('!!window.__tore.dorf', 'Brett des Dorfs gebaut', 10);
    await ev('__tore.dorf(); true');
    await until(`__prismaDebug.skyTheme.byId.get('village').module.settled && [...__prismaDebug.boardTheme.built.values()]
      .some((e) => e.key === ${JSON.stringify(PROBE('dorf'))} && e.ready && e.blendBereit)`, 'Dorf vorgeladen', 120);
    const vorher = await ev('__prisma.brett()');
    await ev(PROTOKOLL);
    await ev(`__prismaDebug.skyTheme.set('village'); true`);
    await until('__prisma.skyReady()', 'Dorf', 30);
    log = await protokollAus(ev);
    const dorf = await ev('__prisma.brett()'), wechsel = luecke(log);
    pruefe(vorher.himmel === 'milky' && dorf.himmel === 'village' && dorf.art === 'probe' && !log.some((e) => e.holding)
      && log.some((e) => e.brett.von === 'milky' && e.brett.himmel === 'village' && e.sichtbar.length === 2)
      && wechsel.max <= 100, `Vorgeladen: Milchstrasse → Dorf ohne Halten, Brett blendet mit, längste Lücke `
      + `${Math.round(wechsel.max)} ms ${JSON.stringify(dorf)}`);

    // Wüste, deren Brett beim Berechnen scheitert: das Steinbrett als Notfall, eine Warnung, kein Fehler. Vom Brett des
    // Dorfs gleitet es mit dem Himmel ins Steinbrett
    await ev(PROTOKOLL);
    await ev(`__prismaDebug.skyTheme.byId.get('desert').board = { type: 'kaputt' }; __prismaDebug.skyTheme.set('desert'); true`);
    await until('__prisma.skyReady()', 'Wüste', 120);
    log = await protokollAus(ev);
    const wueste = await ev('__prisma.brett()');
    pruefe(wueste.himmel === 'desert' && wueste.art === 'stone' && wueste.notfall && wueste.bereit && wueste.anteil === 1
      && log.some((e) => e.brett.von === 'village' && e.brett.notfall && e.sichtbar.length === 2),
    `Wüste: Berechnen gescheitert, vom Dorf ins Steinbrett als Notfall ${JSON.stringify(wueste)}`);

    // Vulkan ohne Überblenden: Es gibt kein früheres Brett zum Halten. Erst keines, nach 8 s das Steinbrett, sobald das
    // richtige bereit ist, gleitet es in fadeTime hinüber
    await ev(PROTOKOLL);
    await ev(`(() => { const k = __prismaDebug.skyTheme; k.byId.get('volcano').board = { type: 'probe', tor: 'vulkan' };
      k.set('volcano', false); return true; })()`);
    const sofort = await ev('__prisma.brett()');
    await sleep(4000);
    const mitte = await ev('__prisma.brett()');
    await until('__prisma.brett().notfall', 'Notfall nach 8 s', 15);
    const notfall = await ev('({ b: __prisma.brett(), t: performance.now() })');
    await sleep(500);
    await ev('__tore.vulkan(); true');
    await until('__prisma.skyReady()', 'Vulkan samt Brett', 120);
    log = await protokollAus(ev);
    const vulkan = await ev('__prisma.brett()');
    pruefe(sofort.himmel === null && mitte.himmel === null, `Vulkan: ohne früheres Brett erst keines (${sofort.himmel}, nach 4 s ${mitte.himmel})`);
    const keines = log.findIndex((e) => e.brett.himmel === null);
    const keinesBis = log.findIndex((e, i) => i > keines && e.brett.himmel !== null);
    const seit = keines < 0 ? 0 : (log[keinesBis]?.ts - log[keines].ts) / 1000;
    pruefe(notfall.b.himmel === 'volcano' && notfall.b.art === 'stone' && seit > 7.8 && seit < 9,
      `Vulkan: nach ${seit.toFixed(1)} s das Steinbrett als Notfall ${JSON.stringify(notfall.b)}`);
    // es wächst ins Bild (aus dem Nichts, eigene Uhr), statt auf einmal dazustehen
    const ein = log.slice(keinesBis).filter((e) => e.brett.notfall && e.brett.von === null && e.brett.anteil < 1);
    pruefe(ein.length > 3 && ein[0].brett.anteil < 0.1,
      `Vulkan: das Steinbrett wächst ins Bild (${ein.length} Bilder, erstes mit Anteil ${ein[0]?.brett.anteil.toFixed(3)})`);
    const ueber = log.filter((e) => e.brett.von === 'volcano' && e.brett.himmel === 'volcano' && e.brett.anteil < 1);
    const udauer = (ueber.at(-1)?.ts - ueber[0]?.ts) / 1000;
    pruefe(ueber.length > 20 && Math.abs(udauer - 2.4) < 0.35 && vulkan.art === 'probe' && !vulkan.notfall
      && vulkan.anteil === 1, `Vulkan: vom Notfall ins richtige Brett in ${udauer.toFixed(2)} s ${JSON.stringify(vulkan)}`);
  } catch (e) {
    pruefe(false, `Mechanik: ${e.message}`);
  }
  const warnungen = konsole(logs, 'Mechanik');
  pruefe(warnungen.some((w) => /Brett kaputt: Probe: Berechnen gescheitert, Steinbrett/.test(w))
    && warnungen.some((w) => /Brett von volcano: nach 8 s nicht bereit, Steinbrett/.test(w)),
  `Mechanik: Warnungen für beide Notfälle (${warnungen.filter((w) => /Brett/.test(w)).join(' | ')})`);
  await b.close();
}

/* ---------- Langsames Netz ---------- */

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
async function netz() {
  console.log('Langsames Netz (Handy 390 × 844, 300 KB/s, 150 ms, CPU 4×)');
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = join(root, path);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const b = await browser({ width: 390, height: 844, dpr: 2, phone: true });
  const { ev, until, send, logs } = b;
  try {
    // Stand mitten in der Wüste (25 gelöst), dann gedrosselt und ohne Zwischenspeicher neu laden
    await send('Page.navigate', { url: base + 'index.html?noadapt&nointro' });
    await until('window.__prisma?.ticks > 2', 'Seite', 60);
    await ev(`(() => { localStorage.clear(); localStorage.setItem('prisma.noa.zuletzt', 'leicht');
      localStorage.setItem('prisma.noa.leicht', JSON.stringify({ platz: 25, geloest: STORY_LEVELS.leicht.flat().slice(0, 25),
        gesehen: ['prolog', 'angebot', 'wald', 'meer', 'wueste'], geschafft: false })); return true; })()`);
    await send('Page.navigate', { url: 'about:blank' });
    await send('Network.enable');
    await send('Network.setBypassServiceWorker', { bypass: true });
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 300 * 1024,
      uploadThroughput: 100 * 1024 });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: PROTOKOLL });
    const t0 = Date.now();
    // wie im Spiel über den Startbildschirm (ohne ?nointro): Unter dem Menü lädt nichts Grosses (ruhe), was dort fehlt,
    // lädt erst hinter der Überblendung nach «Weiter» (ruhe.lade). Getippt wird je sofort, sobald es geht
    await send('Page.navigate', { url: base + 'index.html?noadapt' });
    const tippe = async (sel) => {
      const r = await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: performance.now(),
          ready: __prisma.skyReady(), brett: __prisma.brett() }; })()`);
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      return r;
    };
    await until("document.getElementById('intro')?.classList.contains('ready') && !!window.__prisma?.brett", 'Startbildschirm', 180);
    const start = await tippe('#intro .start');
    console.log(`  «Tippen zum Starten» nach ${((Date.now() - t0) / 1000).toFixed(1)} s: Himmel bereit ${start.ready}, `
      + `Brett ${JSON.stringify(start.brett)}`);
    await until('window.__prismaDebug?.menu.offen', 'Menü', 60);
    await until("!!document.querySelector('#menue .menue-weiter') && !document.querySelector('#menue .menue-weiter').hidden", 'Weiter', 10);
    const klick = await tippe('#menue .menue-weiter');
    console.log(`  «Weiter» nach ${((Date.now() - t0) / 1000).toFixed(1)} s: Himmel bereit ${klick.ready}, `
      + `Brett ${JSON.stringify(klick.brett)}`);
    await until('window.__prisma.playing() && __prismaDebug.story.gaze === 0', 'Level spielt', 120);
    await sleep(500);
    const log = (await protokollAus(ev)).filter((e) => e.ts >= klick.t);
    const sinkt = log.findIndex((e) => !e.menu && e.gaze < 0.98);
    const s = log[sinkt], warten = (s.ts - klick.t) / 1000;
    const wagen = log.slice(0, sinkt).filter((e) => e.wagen).length;
    console.log(`  Blick senkt sich ${warten.toFixed(1)} s nach «Weiter», Kleiner Wagen in ${wagen} von ${sinkt} Bildern`
      + `, dann ${JSON.stringify({ ready: s.ready, brett: s.brett, shown: s.shown })}`);
    pruefe(s.cur === 'desert' && s.brett.himmel === 'desert' && s.brett.art === s.brett.soll && s.brett.bereit
      && !s.brett.notfall && s.brett.anteil === 1 && (s.ready || warten >= 8),
    `Netz: der Blick senkt sich erst, wenn Himmel und Brett der Wüste (${s.brett.soll}) bereit sind (oder nach 8 s)`);
    pruefe(warten < 1 || wagen > 0, 'Netz: der Kleine Wagen zeigt das Warten');
    brettPasst(log, 'Netz');
  } catch (e) {
    pruefe(false, `Netz: ${e.message}`);
  }
  konsole(logs, 'Netz');
  await b.close();
  server.close();
}

/* ---------- Menü ---------- */

// Unter dem Menü lädt kein Brett (ruhe), also zählt dort auch die Frist des Notfalls nicht: Sie meint 8 s, in denen das
// Brett laden durfte (die Geschichte wartet), nicht 8 s im Menü
async function menue() {
  console.log('Menü (Desktop 1280 × 800, über den Startbildschirm)');
  const b = await browser({ width: 1280, height: 800, dpr: 1, phone: false });
  const { ev, until, send, logs } = b;
  try {
    await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + '?noadapt' });
    await until("document.getElementById('intro')?.classList.contains('ready') && __prisma.skyReady()",
      'Startbildschirm, Himmel und Brett bereit', 120);
    const { x, y } = await ev(`(() => { const r = document.querySelector('#intro .start').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
    await until('window.__prismaDebug?.menu.offen', 'Menü', 30);
    // eigene Art, deren Berechnen nie fertig wird: Das Dorf hat kein bereites Brett, und der Himmel springt
    await ev(`(() => { const B = __prismaDebug.boardTheme, k = __prismaDebug.skyTheme;
      B.types.probe = { core: B.types.stone.core, build() { const s = stoneBoard();
        s.computed = Promise.all([s.computed, new Promise(() => {})]); return s; } };
      k.byId.get('village').board = { type: 'probe' }; k.set('village', false); return true; })()`);
    const sofort = await ev('__prisma.brett()');
    await sleep(10000);
    const r = await ev('({ brett: __prisma.brett(), menu: __prismaDebug.menu.offen })');
    pruefe(sofort.himmel === null && r.menu && r.brett.himmel === null && !r.brett.notfall,
      `Menü: 10 s ohne bereites Brett unter dem Menü, kein Steinbrett als Notfall ${JSON.stringify(r)}`);
  } catch (e) {
    pruefe(false, `Menü: ${e.message}`);
  }
  const warnungen = konsole(logs, 'Menü');
  pruefe(!warnungen.some((w) => /nicht bereit, Steinbrett/.test(w)), 'Menü: keine Warnung zum Notfall'
    + ` (${warnungen.filter((w) => /Brett/.test(w)).join(' | ') || 'keine zum Brett'})`);
  await b.close();
}

/* ---------- Reise ohne Vorladen ---------- */

// Stand am Ende des Bergwalds, «Weiter» ans Meer, bevor Himmel und Brett des Meers vorgeladen sind (das Vorladen, solange
// «Gelöst» steht, ist abgeschaltet). Das Gezeitenbecken wird dann erst auf der Reise berechnet, übersetzt und hochgeladen,
// während skyTheme.quiet gilt (Abweichung aus Ticket 02): Der Träger wartet darauf, der Blick senkt sich auf das bereite
// Brett des Meers, und das Laden ruckelt nicht
async function reise() {
  console.log('Reise ohne Vorladen ans Meer (Desktop 1280 × 800)');
  const b = await browser({ width: 1280, height: 800, dpr: 1, phone: false });
  const { ev, until, send, logs } = b;
  const seite = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro';
  const klicke = async (sel) => {
    const { x, y } = await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
  };
  try {
    // Stand: Bergwald 1–9 gelöst, das letzte Level des Bergwalds steht an
    await send('Page.navigate', { url: seite });
    await until('window.__prisma?.ticks > 2', 'Seite', 60);
    await ev(`(() => { localStorage.clear(); localStorage.setItem('prisma.noa.zuletzt', 'leicht');
      localStorage.setItem('prisma.noa.leicht', JSON.stringify({ platz: 9, geloest: STORY_LEVELS.leicht.flat().slice(0, 9),
        gesehen: ['prolog', 'angebot', 'wald'], geschafft: false })); return true; })()`);
    await send('Page.navigate', { url: seite });
    await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.menu.offen', 'Menü', 120);
    await until("!!document.querySelector('#menue .menue-weiter') && !document.querySelector('#menue .menue-weiter').hidden",
      'Weiter im Menü', 10);
    await klicke('#menue .menue-weiter');
    await until('window.__prisma.playing() && __prismaDebug.story.step === 9 && __prismaDebug.story.gaze === 0',
      'Bergwald 10', 60);
    const strand = await ev(`__prismaDebug.skyTheme.byId.get('beach').board?.type ?? 'stone'`);
    await ev('(() => { __prismaDebug.skyTheme.preload = () => {}; return true; })()'); // kein Vorladen
    await ev('__prismaDebug.loese(); true');
    await until('window.__prisma.solvedPanel()', 'Bergwald 10 gelöst', 30);
    await sleep(800); // länger als die 300 ms, nach denen sonst das Vorladen begänne
    const gebaut = await ev('[...__prismaDebug.boardTheme.built.values()].map((e) => e.type)');
    pruefe(strand === 'tidePool' && !gebaut.includes(strand),
      `Reise: das Brett des Meers (${strand}) ist vor «Weiter» nicht gebaut (gebaut: ${gebaut.join(' ')})`);
    await ev(PROTOKOLL);
    const klickT = await ev('performance.now()');
    await klicke('#btn-next');
    // Seit dem Kleinen Wagen wartet die Geschichte unterwegs auf Tippen (das Licht hält bei der Ankunft über dem
    // Untertitel an): tippen wie ein Spieler, bis das erste Level des Meers spielt
    for (let i = 0; ; i++) {
      const z = await ev(`({ tippen: __prismaDebug.story.waitTap !== null, da: window.__prisma.playing()
        && __prismaDebug.story.step === 10 && __prismaDebug.story.gaze === 0, flow: __prismaDebug.flow.state,
        step: __prismaDebug.story.step, gaze: __prismaDebug.story.gaze })`);
      if (z.da) break;
      if (i >= 900) throw new Error(`Zeitüberschreitung: Meer 1 ${JSON.stringify(z)}`);
      if (z.tippen) await klicke('#story .caption .text');
      await sleep(100);
    }
    await sleep(500);
    const log = (await protokollAus(ev)).filter((e) => e.ts >= klickT);
    // das Brett des Meers erscheint (es beginnt überzublenden), der Blick senkt sich zuletzt aufs Brett
    // Warten: ab dem Abflug (der Himmel des Meers ist gewählt, story.travel) bis das Brett erscheint; so lange schwebt
    // der Träger fast still, höchstens 8 s
    const gewaehlt = log.find((e) => e.cur === 'beach'), da = log.find((e) => e.brett.himmel === 'beach');
    const s = log.findLastIndex((e, i) => i > 0 && log[i - 1].gaze >= 0.98 && e.gaze < 0.98);
    const sinkt = log[s];
    console.log(`  Himmel des Meers gewählt ${((gewaehlt?.ts - klickT) / 1000).toFixed(1)} s nach «Weiter», sein Brett im `
      + `Bild ${((da?.ts - klickT) / 1000).toFixed(1)} s nach «Weiter» (Warten ${((da?.ts - gewaehlt?.ts) / 1000).toFixed(1)}`
      + ` s, höchstens 8), Blick senkt sich nach ${((sinkt?.ts - klickT) / 1000).toFixed(1)} s ${JSON.stringify(sinkt?.brett)}`);
    pruefe(sinkt?.cur === 'beach' && sinkt.brett.himmel === 'beach' && sinkt.brett.art === strand && sinkt.brett.bereit
      && sinkt.brett.anteil === 1 && !sinkt.brett.notfall, 'Reise: der Blick senkt sich auf das bereite Brett des Meers');
    const ruck = luecke(log);
    pruefe(ruck.max <= 100, `Reise: längste Lücke ${Math.round(ruck.max)} ms bei ${((ruck.bei - klickT) / 1000).toFixed(1)} s`
      + ` (höchstens 100), ${ruck.ueber50} über 50 ms`);
    brettPasst(log, 'Reise ans Meer');
  } catch (e) {
    pruefe(false, `Reise: ${e.message}`);
  }
  const warnungen = konsole(logs, 'Reise');
  pruefe(!warnungen.some((w) => /Steinbrett/.test(w)), 'Reise: keine Warnung zum Notfall'
    + ` (${warnungen.filter((w) => /Brett/.test(w)).join(' | ') || 'keine zum Brett'})`);
  await b.close();
}

/* ---------- Formen: Übergang zwischen allen Arten (Ticket 05) ---------- */

// In der Seite, je Bild (eigenes requestAnimationFrame) nach dem Spiel: nur die gezeigten Bretter in ein kleines Bild
// zeichnen (320 × 200, ohne Himmel und Elemente, ohne die Schatten neu zu rechnen) und dazu den Kernquader, hinter dem der
// Himmel gerade nichts zeichnet (boardCoreUniforms). luecken: Pixel im Kernquader, die kein Brett deckt (dort sähe man
// ein Loch im Himmel). schritt: Anteil der Pixel mit Brett, deren Farbe sich gegenüber dem vorigen Bild deutlich ändert
// (ein Teil, der auf einmal erscheint oder verschwindet, gibt einen grossen Schritt). Kein Vergleich mit
// Referenzbildern: geprüft werden nur Deckung und Sprünge.
const DECKUNG = `(() => { if (window.__dk) return true;
  const D = __prismaDebug, W = 320, H = 200, rt = new THREE.WebGLRenderTarget(W, H);
  const px = new Uint8Array(W * H * 4), alt = new Uint8Array(W * H * 4), maske = new Uint8Array(W * H * 4);
  const kernSzene = new THREE.Scene(), box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  kernSzene.add(box);
  const dk = window.__dk = { an: false, log: [], erstes: true };
  const bild = () => {
    const { scene, renderer, camera, boardTheme: B } = D, gruppen = new Set();
    for (const e of B.built.values()) if (e.board) gruppen.add(e.board.group);
    const sicht = scene.children.map((c) => c.visible), bg = scene.background, schatten = renderer.shadowMap.needsUpdate;
    const vorher = renderer.getRenderTarget(), farbe = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    scene.children.forEach((c) => { if (!gruppen.has(c)) c.visible = false; });
    scene.background = null;
    renderer.shadowMap.needsUpdate = false;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
    const lo = boardCoreUniforms.uCoreLo.value, hi = boardCoreUniforms.uCoreHi.value;
    let luecken = 0, kern = 0;
    if (hi.y > -1000) {
      box.position.addVectors(lo, hi).multiplyScalar(0.5);
      box.scale.subVectors(hi, lo);
      box.updateMatrixWorld();
      renderer.clear();
      renderer.render(kernSzene, camera);
      renderer.readRenderTargetPixels(rt, 0, 0, W, H, maske);
      for (let i = 0; i < W * H; i++) if (maske[i * 4] > 128) { kern++; if (px[i * 4 + 3] < 250) luecken++; }
    }
    renderer.setRenderTarget(vorher);
    renderer.setClearColor(farbe, alpha);
    scene.background = bg;
    renderer.shadowMap.needsUpdate = schatten;
    scene.children.forEach((c, i) => { c.visible = sicht[i]; });
    let n = 0, anders = 0;
    for (let i = 0; i < W * H * 4; i += 4) {
      if (px[i + 3] < 128 && alt[i + 3] < 128) continue;
      n++;
      if (dk.erstes) continue;
      if ((px[i + 3] < 128) !== (alt[i + 3] < 128) || Math.max(Math.abs(px[i] - alt[i]), Math.abs(px[i + 1] - alt[i + 1]),
        Math.abs(px[i + 2] - alt[i + 2])) > 48) anders++;
    }
    alt.set(px);
    const schritt = dk.erstes ? 0 : anders / Math.max(1, n);
    dk.erstes = false;
    return { luecken, kern, schritt };
  };
  const loop = () => { if (!dk.an) return; requestAnimationFrame(loop);
    const b = __prisma.brett();
    dk.log.push({ ...bild(), anteil: b.anteil, himmel: b.himmel, art: b.art, stuecke: b.stuecke.length }); };
  dk.start = () => { dk.log = []; dk.erstes = true; dk.an = true; requestAnimationFrame(loop); return true; };
  dk.stop = () => { dk.an = false; return dk.log; };
  return true; })()`;

/** Ein Übergang im Protokoll von DECKUNG: Lücken, grösster Schritt, erster und letzter (ins fertige Brett) */
function uebergang(log) {
  const i0 = log.findIndex((e) => e.anteil < 1 || e.stuecke > 1);
  const i1 = log.findIndex((e, i) => i > i0 && e.anteil === 1 && e.stuecke === 1);
  const fade = i0 < 0 || i1 < 0 ? [] : log.slice(i0, i1 + 1);
  return {
    bilder: Math.max(0, i1 - i0), luecken: Math.max(0, ...log.map((e) => e.luecken)),
    kern: Math.min(...fade.map((e) => e.kern)), erster: fade[0]?.schritt ?? 1, letzter: fade.at(-1)?.schritt ?? 1,
    groesster: Math.max(0, ...fade.map((e) => e.schritt)),
    // ein Schritt über dem, was der Fortschritt dieses Bilds erklärt (die Front wächst mit dem Anteil): ein Sprung
    sprung: Math.max(0, ...fade.slice(1).map((e, i) => e.schritt - SCHRITT_FREI - SCHRITT_JE * Math.abs(e.anteil - fade[i].anteil))),
    stuecke: Math.max(0, ...fade.map((e) => e.stuecke)),
  };
}
// Anteil der Pixel mit Brett, die sich von einem Bild zum nächsten ändern: frei (Front samt Leuchten) und je Fortschritt
// des Anteils in diesem Bild; ins erste und ins letzte Bild höchstens LETZTER_MAX
const SCHRITT_FREI = 0.06, SCHRITT_JE = 2, LETZTER_MAX = 0.03;

/** Euler-Weg durch alle geordneten Paare verschiedener Arten (vollständiger gerichteter Graph, Hierholzer) */
function alleWege(arten) {
  const offen = new Map(arten.map((a) => [a, arten.filter((b) => b !== a)])), weg = [], stapel = [arten[0]];
  while (stapel.length) {
    const a = stapel.at(-1), n = offen.get(a);
    if (n.length) stapel.push(n.shift());
    else weg.push(stapel.pop());
  }
  return weg.reverse();
}

async function formen() {
  console.log('Formen (Desktop 1280 × 800): Übergang zwischen allen Arten');
  const b = await browser({ width: 1280, height: 800, dpr: 1, phone: false });
  const { ev, until, logs } = b;
  const ANSICHTEN = ['flach', 'heraus', 'flach-heraus'];
  const kamera = (a) => ev(`(() => { const c = __prismaDebug.cameraRig; c.homing = null; c.goalPhi = 0; c.goalTheta = 0;
    c.goalZoom = 1; if ('${a}'.includes('flach')) { c.goalPhi = c.phiMax - c.basePhi; c.goalTheta = 0.62; }
    if ('${a}'.includes('heraus')) c.goalZoom = c.zoomMax; __prismaDebug.sceneLoop.wake(); return true; })()`);
  // Träger sind die beiden Himmel aus dem Code (ohne Panorama, nie freigegeben): Ihr Brett setzt die Probe
  const traeger = (sky, angabe) => ev(`(() => { const k = __prismaDebug.skyTheme, B = __prismaDebug.boardTheme;
    k.byId.get('${sky}').board = ${JSON.stringify(angabe)}; B.free('${sky}'); k.preload('${sky}'); return true; })()`);
  const bereit = (sky) => `(() => { const e = __prismaDebug.boardTheme.skies.get('${sky}'); return !!e && e.ready
    && e.blendBereit && __prismaDebug.skyTheme.byId.get('${sky}').module?.settled !== false; })()`;
  const pruefeUebergang = (u, was) => {
    pruefe(u.bilder > 20 && u.luecken === 0 && u.kern > 0, `${was}: ${u.bilder} Bilder, im Kernquader keine Lücke `
      + `(höchstens ${u.luecken} Pixel, Kernquader mindestens ${u.kern})`);
    pruefe(u.sprung <= 0 && u.erster <= LETZTER_MAX && u.letzter <= LETZTER_MAX, `${was}: kein Sprung, grösster Schritt `
      + `${(u.groesster * 100).toFixed(1)} % (über das Wachsen hinaus ${(Math.max(0, u.sprung) * 100).toFixed(1)} %), erstes Bild ${(u.erster * 100).toFixed(1)} %, `
      + `letztes ${(u.letzter * 100).toFixed(1)} % (höchstens ${LETZTER_MAX * 100})`);
  };
  try {
    await b.send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro&sky=milky' });
    await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady()', 'Milchstrasse bereit', 120);
    await ev('__prismaDebug.zeige(12); true');
    await until('window.__prisma.playing()', 'Level', 30);
    await ev(DECKUNG);
    // die Arten des Registers mit ihrer Brett-Angabe, dazu das Steinbrett
    const angaben = JSON.parse(await ev(`(() => { const a = { stone: { type: 'stone' } };
      for (const e of __prismaDebug.skyTheme.entries) if (e.board?.type && !a[e.board.type]) a[e.board.type] = e.board;
      return JSON.stringify(a); })()`));
    const weg = alleWege(Object.keys(angaben));
    console.log(`  Arten ${Object.keys(angaben).join(', ')}: ${weg.length - 1} Übergänge`);
    await ev(`(() => { __prismaDebug.skyTheme.fadeTime = 2.4; return true; })()`);
    await traeger('milky', angaben[weg[0]]);
    await ev(`__prismaDebug.skyTheme.set('milky', false); true`);
    await until(`__prisma.skyReady() && __prisma.brett().art === '${weg[0]}'`, 'erstes Brett', 60);
    const tabelle = [];
    for (let i = 1; i < weg.length; i++) {
      const nach = i % 2 ? 'solar' : 'milky', ansicht = ANSICHTEN[i % ANSICHTEN.length];
      await traeger(nach, angaben[weg[i]]);
      await kamera(ansicht);
      await until(bereit(nach), `Brett ${weg[i]} bereit`, 60);
      await sleep(2500); // die Kamera steht
      await ev('__dk.start()');
      await ev(`__prismaDebug.skyTheme.set('${nach}'); true`);
      await until(`__prisma.skyReady() && __prisma.brett().art === '${weg[i]}'`, `${weg[i - 1]} → ${weg[i]}`, 60);
      await sleep(300);
      const u = uebergang(await ev('__dk.stop()'));
      tabelle.push(`${weg[i - 1]} → ${weg[i]} (${ansicht}): ${u.bilder} Bilder, Lücken ${u.luecken}, Schritt grösster `
        + `${(u.groesster * 100).toFixed(1)} %, letzter ${(u.letzter * 100).toFixed(1)} %`);
      pruefeUebergang(u, `${weg[i - 1]} → ${weg[i]} (${ansicht})`);
    }
    console.log(`    ${tabelle.join('\n    ')}`);

    // umgelenkt: Stein → Lehm, bei 40 % weiter ins Hochbeet des Dorfs (vorgeladen), dann vom Dorf zur Milchstrasse und
    // bei 40 % zurück ins Dorf. Jedes Brett behält sein Stück, das nächste wächst darüber
    if (angaben.clay && angaben.raisedBed) {
      await kamera('flach');
      await traeger('milky', angaben.stone);
      await ev(`__prismaDebug.skyTheme.set('milky', false); true`);
      await until(`__prisma.skyReady() && __prisma.brett().art === 'stone'`, 'Steinbrett', 60);
      await ev(`(() => { const k = __prismaDebug.skyTheme; k.keep = 600; k.preload('village'); return true; })()`);
      await until(bereit('village'), 'Dorf vorgeladen', 120);
      await traeger('solar', angaben.clay);
      await until(bereit('solar'), 'Lehm bereit', 60);
      await sleep(2500);
      await ev('__dk.start()');
      await ev(`__prismaDebug.skyTheme.set('solar'); true`);
      await until(`__prisma.brett().himmel === 'solar' && __prisma.brett().anteil >= 0.4`, 'Lehm zu 40 %', 10);
      await ev(`__prismaDebug.skyTheme.set('village'); true`);
      await until(`__prisma.skyReady() && __prisma.brett().art === 'raisedBed'`, 'umgelenkt ins Dorf', 60);
      await sleep(300);
      let u = uebergang(await ev('__dk.stop()'));
      pruefe(u.stuecke === 3, `umgelenkt: Stein, Lehm und Hochbeet zugleich im Bild (${u.stuecke} Stücke)`);
      pruefeUebergang(u, 'Stein → Lehm, umgelenkt ins Hochbeet');
      await ev('__dk.start()');
      await ev(`__prismaDebug.skyTheme.set('milky'); true`);
      await until(`__prisma.brett().himmel === 'milky' && __prisma.brett().anteil >= 0.4`, 'Stein zu 40 %', 10);
      await ev(`__prismaDebug.skyTheme.set('village'); true`);
      await until(`__prisma.skyReady() && __prisma.brett().art === 'raisedBed'`, 'zurück ins Dorf', 60);
      await sleep(300);
      u = uebergang(await ev('__dk.stop()'));
      pruefeUebergang(u, 'Hochbeet → Stein, zurück ins Hochbeet');
    }
  } catch (e) {
    pruefe(false, `Formen: ${e.message}`);
  }
  konsole(logs, 'Formen');
  await b.close();
}

if (!nur || nur === 'mechanik') await mechanik();
if (!nur || nur === 'netz') await netz();
if (!nur || nur === 'menue') await menue();
if (!nur || nur === 'reise') await reise();
if (!nur || nur === 'formen') await formen();
console.log(fehler.length ? `\n${fehler.length} Fehler` : '\nBrett: in Ordnung');
process.exit(fehler.length ? 1 : 0);
