// Probe und Messung der Spiegelung je Welt (Spec .scratch/energie/, Tickets 03 und 04): Das Brett spiegelt nur unter den
// beiden Himmeln im All (spiegelHimmel, boardReflection), ?spiegel=alle überall wie bis energie-3.
// Aufruf: GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/spiegel-probe.mjs
//           [pruefe|messen|bilder] [--handy] [--welten forest,beach,…] [--runden 4] [--level 212]
//           [--fassungen heute,alle,…] [--vorher <html>] [--ordner <pfad>]
//   pruefe: eine Seite, die Himmel nacheinander (skyTheme.set, mit Überblenden): Unter jedem rechnet die Spiegeltextur
//           genau dann, wenn er spiegelt, beim Überblenden ändert sich der Anteil der Spiegelung weich und nie, solange
//           der Himmel hält; nie ein Spiegelbild bei Anteil 0; im Menü (Blick im Himmel) keines. Dasselbe mit
//           ?spiegel=alle (dort spiegeln alle Bretter mit Spiegelfläche). Keine Konsolenfehler.
//   messen: GPU-Zeit je Schritt von draw (Spiegelung, Vorzeichnen des Himmels, Szene samt Schatten, Pinsel, Bloom,
//           letzter Schritt) über EXT_disjoint_timer_query_webgl2, je Fassung (heute: Standard, alle: wie ?spiegel=alle,
//           ohneSpiegel, ohneBloom, ohnePinsel), in Runden im Wechsel, als Stösse von 30 Bildern ohne Pause (Ticket 03:
//           die eingebaute Grafik taktet im Takt von 60 sonst herunter). Nach tests/output/energie/spiegel-<bildschirm>.json.
//   bilder: Vergleichsbilder (Handy hoch, Massstab des Poco, ?t=12) vorher gegen neu je Welt, ganz und ein Ausschnitt der
//           Mitte des Bretts, dazu nebeneinander mit dem Unterschied ×8 und der mittleren Änderung der Helligkeit.
//           Vorher: --vorher <html> (eine Kopie einer früheren index.html im Wurzelordner), sonst ?spiegel=alle.
//   --handy: 393 × 852, Pixeldichte 2,75, Android-Kennung und Touch (wie das Poco); sonst 1440 × 900.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const modus = ['messen', 'bilder', 'pruefe'].includes(args[0]) ? args[0] : 'pruefe';
const wert = (name, vorgabe = null) => { const i = args.indexOf(name); return i < 0 ? vorgabe : args[i + 1]; };
const handy = args.includes('--handy') || modus === 'bilder';
const ALLE_WELTEN = 'village,forest,beach,desert,volcano,icecave,solar,milky';
const welten = wert('--welten', modus === 'messen' ? 'forest,beach,volcano,milky' : ALLE_WELTEN).split(',');
// Level: Vorgabe 212 «Kochab» (vier Quellen, viele Strahlen, die sich im Brett spiegeln)
const LEVEL = +wert('--level', 212);
const runden = +wert('--runden', 4);
const fassungen = wert('--fassungen', 'heute,alle,ohneSpiegel,ohneBloom,ohnePinsel').split(',');
const ordner = resolve(wert('--ordner', join(root, 'tests', 'output', 'energie', 'bilder')));
const vorher = wert('--vorher');
requireQuiet();

const view = handy ? { width: 393, height: 852, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const bildschirm = handy ? 'handy' : 'desktop';
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const chrome = await startChrome({ ...view, gpu: !!process.env.GPU });
const { send, logs, close } = chrome;
setTimeout(async () => { console.error('Zeitrahmen von 14 min überschritten'); await close(); process.exit(3); }, 14 * 60000).unref();
const ev = (expr) => evaluate(send, expr);
async function until(expr, what, seconds = 120) {
  for (let i = 0; i < seconds * 5; i++) {
    if (await ev(expr).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
const seite = (datei = 'index.html') => pathToFileURL(join(root, datei)).href;

async function oeffne(query, warte = 7000) {
  await send('Page.navigate', { url: `${seite()}?nointro&noadapt&${query}` });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(`__prismaDebug.zeige(${LEVEL})`);
  await until('window.__prisma.playing() && window.__prisma.skyReady()', 'Level');
  await sleep(warte); // Strahlen wachsen, Ziele leuchten auf, die Kamera kommt an, Shader sind übersetzt
}

// In der Seite: Fassungen zur Laufzeit an (true) oder aus (false). alle: wie ?spiegel=alle (jeder Himmel spiegelt,
// Spiegeltextur so gross und mit Kantenglättung wie bis energie-3, QUALITY in index.html; pruefe vergleicht es mit dem
// Laden mit ?spiegel=alle)
const SCHALTE = `((name, an) => {
  switch (name) {
    case 'heute': return true;
    case 'alle': {
      for (const e of skyTheme.entries) { e.spiegelVorher ??= !!e.spiegel; e.spiegel = an || e.spiegelVorher; }
      QUALITY.reflectionScale = an ? (IS_MOBILE ? 0.35 : 0.3) : (IS_MOBILE ? 0.25 : 0.22);
      QUALITY.reflectionMsaa = an ? (IS_MOBILE ? 2 : 4) : 0;
      const rt = reflector.getRenderTarget();
      rt.samples = QUALITY.reflectionMsaa;
      rt.dispose(); // three legt das Ziel beim nächsten Zeichnen neu an
      onResize();
      boardReflection.follow(0, true);
      return true;
    }
    case 'ohneSpiegel': QUALITY.reflections = !an; return true;
    case 'ohneBloom': bloomPass.enabled = !an; return true;
    case 'ohnePinsel': brushPass.enabled = !an; return true;
  }
  throw new Error('unbekannte Fassung ' + name);
})`;

// --- messen ---------------------------------------------------------------------------------------------------------
// GPU-Zeit je Schritt von draw. Abfragen nacheinander (nie verschachtelt), ausgelesen, sobald fertig; meldet die
// Grafikkarte «disjunkt», gelten alle offenen nicht.
const EINRICHTEN = `(() => {
  const gl = renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return false;
  const p = window.__mess = { label: null, werte: {}, offen: [], frei: [], bild: null };
  const zeit = (name, fn, self, args) => {
    if (!p.label) return fn.apply(self, args);
    const q = p.frei.pop() ?? gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    try { return fn.apply(self, args); } finally {
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      p.bild.teile.push([name, q]);
    }
  };
  const lies = () => {
    if (gl.getParameter(ext.GPU_DISJOINT_EXT)) { for (const b of p.offen) b.ungueltig = true; }
    while (p.offen.length) {
      const b = p.offen[0];
      if (!b.teile.every(([, q]) => gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE))) break;
      p.offen.shift();
      const summe = {};
      for (const [name, q] of b.teile) {
        summe[name] = (summe[name] ?? 0) + gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
        p.frei.push(q);
      }
      if (b.ungueltig || !b.label) continue;
      (p.werte[b.label] ??= []).push(summe);
    }
  };
  const draw0 = draw;
  draw = function (...a) {
    lies();
    p.bild = { label: p.label, teile: [] };
    const r = draw0.apply(this, a);
    if (p.label) p.offen.push(p.bild);
    return r;
  };
  const rr = renderReflection;
  renderReflection = function (...a) { return zeit('spiegel', rr, this, a); };
  const vz = skyTheme.vorzeichnen;
  skyTheme.vorzeichnen = function (...a) { return zeit('himmelVor', vz, this, a); };
  // Stoss: n Bilder ohne Pause hintereinander (Takt der Grafikkarte oben), dann warten, bis alle Abfragen fertig sind
  p.stoss = async (label, n) => {
    p.label = label;
    for (let i = 0; i < n; i++) draw(1 / 60, 0, false);
    p.label = null;
    gl.finish();
    for (let i = 0; i < 200 && p.offen.length; i++) { await new Promise((r) => setTimeout(r, 5)); lies(); }
    return true;
  };
  const namen = new Map([[composer.passes[0], 'szene'], [brushPass, 'pinsel'], [bloomPass, 'bloom'], [finalPass, 'letzter']]);
  for (const pass of composer.passes) {
    const name = namen.get(pass) ?? 'rest', render = pass.render;
    pass.render = function (...a) { return zeit(name, render, this, a); };
  }
  return true;
})()`;

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const mittel = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r2 = (x) => x === null ? null : +x.toFixed(3);

async function messeWelt(welt) {
  await oeffne(`sky=${welt}&ruhetakt=aus`);
  if (!await ev(EINRICHTEN)) throw new Error('keine Erweiterung EXT_disjoint_timer_query_webgl2');
  const geraet = JSON.parse(await ev(`JSON.stringify({ render: renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),
    pr: renderer.getPixelRatio(), mobil: IS_MOBILE, seite: SEITE })`));
  for (let r = 0; r < runden; r++) {
    for (const f of fassungen) {
      await ev(`${SCHALTE}('${f}', true)`);
      await sleep(400); // umgebaut
      await ev(`__mess.stoss('${f}#w', 10)`); // Takt der Grafikkarte hoch, Shader warm
      if (r === 0) {
        geraet[f] = JSON.parse(await ev(`JSON.stringify({ spiegel: [reflector.getRenderTarget().width,
          reflector.getRenderTarget().height], msaa: reflector.getRenderTarget().samples, anteil: boardReflection.uniform.value })`));
      }
      for (let k = 0; k < 3; k++) await ev(`__mess.stoss('${f}#${r}', 30)`);
      await ev(`${SCHALTE}('${f}', false)`);
    }
  }
  await sleep(500);
  const werte = JSON.parse(await ev('JSON.stringify(__mess.werte)'));
  // je Fassung und Schritt: Mittel je Runde, davon Median, Min, Max
  const out = {};
  for (const f of fassungen) {
    const proRunde = [];
    for (let r = 0; r < runden; r++) {
      const bilder = werte[`${f}#${r}`] ?? [];
      const schritte = [...new Set(bilder.flatMap((b) => Object.keys(b)))];
      const m = { bilder: bilder.length, summe: mittel(bilder.map((b) => Object.values(b).reduce((x, y) => x + y, 0))) };
      for (const s of schritte) m[s] = mittel(bilder.map((b) => b[s] ?? 0));
      proRunde.push(m);
    }
    const schritte = [...new Set(proRunde.flatMap((m) => Object.keys(m)))].filter((s) => s !== 'bilder');
    out[f] = { bilder: proRunde.map((m) => m.bilder) };
    for (const s of schritte) {
      const v = proRunde.map((m) => m[s]).filter((x) => x !== null && x !== undefined);
      out[f][s] = { median: r2(median(v)), min: r2(Math.min(...v)), max: r2(Math.max(...v)) };
    }
  }
  return { geraet, fassungen: out };
}

function tabelle(welt, e) {
  const schritte = ['summe', 'spiegel', 'szene', 'pinsel', 'bloom', 'letzter', 'himmelVor', 'rest'];
  console.log(`  ${welt}: Bild ${e.geraet.render.join('×')}; Spiegel heute ${JSON.stringify(e.geraet.heute)}, alle ${JSON.stringify(e.geraet.alle)}`);
  console.log(`    ${'Fassung'.padEnd(14)}${schritte.map((s) => s.padStart(15)).join('')}`);
  for (const [f, w] of Object.entries(e.fassungen)) {
    console.log(`    ${f.padEnd(14)}${schritte.map((s) => (w[s] ? `${w[s].median.toFixed(2)} ±${((w[s].max - w[s].min) / 2).toFixed(2)}` : '–').padStart(15)).join('')}`);
  }
}

// --- bilder ---------------------------------------------------------------------------------------------------------
// Vergleich in der Seite (about:blank): zwei PNG laden, nebeneinander legen, Unterschied ×8 dazu, Anteil abweichender
// Pixel (über 3/255 in einem Kanal), mittlere Abweichung und mittlere Änderung der Helligkeit (neu − vorher, von 255)
const VERGLEICH = `(async (a, b) => {
  const lade = (src) => new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = nein; i.src = src; });
  const [A, B] = await Promise.all([lade(a), lade(b)]);
  const w = A.width, h = A.height, c = document.createElement('canvas');
  c.width = w * 3 + 16; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, h);
  g.drawImage(A, 0, 0); g.drawImage(B, w + 8, 0);
  const da = g.getImageData(0, 0, w, h).data, db = g.getImageData(w + 8, 0, w, h).data;
  const d = g.createImageData(w, h);
  let n = 0, summe = 0, hell = 0;
  const L = (p, i) => 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
  for (let i = 0; i < da.length; i += 4) {
    let m = 0;
    for (let k = 0; k < 3; k++) { const x = Math.abs(da[i + k] - db[i + k]); m = Math.max(m, x); summe += x; d.data[i + k] = Math.min(255, x * 8); }
    d.data[i + 3] = 255;
    hell += L(db, i) - L(da, i);
    if (m > 3) n++;
  }
  g.putImageData(d, 2 * w + 16, 0);
  return { bild: c.toDataURL('image/png'), anteil: n / (w * h), mittel: summe / (w * h * 3), hell: hell / (w * h) };
})`;

async function bild(url, datei, clip = null) {
  await send('Page.navigate', { url });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(`__prismaDebug.zeige(${LEVEL})`);
  await until('window.__prisma.playing() && window.__prisma.skyReady()', 'Level');
  await ev('__prismaDebug.settle(8)');
  await sleep(1500);
  if (clip === 'brett') {
    clip = JSON.parse(await ev(`JSON.stringify((() => {
      const c = new THREE.Vector3(0, 0, 0).project(camera), w = innerWidth * 0.42;
      return { x: Math.round((c.x + 1) / 2 * innerWidth - w / 2), y: Math.round((1 - c.y) / 2 * innerHeight - w / 2), width: Math.round(w), height: Math.round(w) };
    })())`));
  }
  const voll = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${datei}.png`, Buffer.from(voll.result.data, 'base64'));
  if (clip) {
    const aus = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 2 } });
    writeFileSync(`${datei}-ausschnitt.png`, Buffer.from(aus.result.data, 'base64'));
  }
  return clip;
}

// --- pruefe ---------------------------------------------------------------------------------------------------------
// je gezeichnetes Bild: [Anteil der Spiegelung, Spiegelbilder gerechnet, Himmel blendet, Himmel hält, Platte im Bild,
// Abstand zum letzten Bild in ms, ein gezeigtes Brett hat eine Spiegelfläche]
const MITSCHRIFT = `(() => {
  const p = window.__sp = { bilder: [], spiegelbilder: 0, letzt: null };
  const ob = reflector.onBeforeRender;
  reflector.onBeforeRender = function (...a) { p.spiegelbilder++; return ob.apply(this, a); };
  const draw0 = draw;
  draw = function (...a) {
    const vor = p.spiegelbilder, jetzt = performance.now();
    const r = draw0.apply(this, a);
    p.bilder.push([+boardReflection.uniform.value.toFixed(4), p.spiegelbilder - vor, skyTheme.fading ? 1 : 0,
      skyTheme.holding ? 1 : 0, reflectionInView() ? 1 : 0, p.letzt === null ? 0 : Math.round(jetzt - p.letzt),
      boardTheme.mirrors.length ? 1 : 0]);
    p.letzt = jetzt;
    return r;
  };
  return true;
})()`;

// Folge der Himmel: ohne → ohne, ohne → mit (Vulkan → Planeten), mit → mit, mit → ohne auf demselben Steinbrett
// (Sterne → Eishöhle) und zurück, mit → ohne auf ein anderes Brett (Sterne → Strand), ohne → mit (Strand → Planeten)
const FOLGE = ['village', 'forest', 'beach', 'desert', 'volcano', 'solar', 'milky', 'icecave', 'milky', 'beach', 'solar'];

async function pruefeFolge(alle) {
  const name = alle ? '?spiegel=alle' : 'Standard';
  console.log(`${name}: Himmel ${FOLGE.join(' → ')}`);
  await send('Page.navigate', { url: `${seite()}?nointro&noadapt&ruhetakt=aus&sky=milky${alle ? '&spiegel=alle' : ''}` });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(MITSCHRIFT);
  // Menü: Blick im Himmel, die Platte nicht im Bild, also keine Spiegelung (auch unter einem Himmel, der spiegelt)
  await sleep(1500);
  await ev('__sp.bilder = []');
  await sleep(1500);
  const menue = JSON.parse(await ev('JSON.stringify(__sp.bilder)'));
  const menueSpiegel = menue.filter((b) => b[1]).length;
  console.log(`  Menü (Milchstrasse): ${menue.length} Bilder, ${menueSpiegel} Spiegelbilder, Platte im Bild ${menue.filter((b) => b[4]).length}`);
  pruefe(menue.length > 3 && !menueSpiegel, `${name}: im Menü ${menueSpiegel} Spiegelbilder von ${menue.length}`);
  await ev(`skyTheme.set('village', false)`);
  await ev(`__prismaDebug.zeige(${LEVEL})`);
  await until(`window.__prisma.playing() && window.__prisma.skyReady() && skyTheme.current === 'village'`, 'Level');
  await sleep(4000);
  const ergebnis = [];
  let vorige = null;
  for (const welt of FOLGE) {
    await ev('__sp.bilder = []');
    if (vorige !== null) await ev(`skyTheme.set('${welt}')`);
    await until(`skyTheme.current === '${welt}' && window.__prisma.skyReady()`, `Himmel ${welt}`, 90);
    await sleep(300);
    const wechsel = JSON.parse(await ev('JSON.stringify(__sp.bilder)'));
    await ev('__sp.bilder = []');
    await sleep(1500);
    const steht = JSON.parse(await ev('JSON.stringify(__sp.bilder)'));
    const info = JSON.parse(await ev(`JSON.stringify({ spiegelt: spiegelHimmel('${welt}'), spiegel: boardTheme.mirrors.length,
      rt: [reflector.getRenderTarget().width, reflector.getRenderTarget().height, reflector.getRenderTarget().samples],
      buffer: renderer.getDrawingBufferSize(new THREE.Vector2()).toArray() })`));
    // Anteil nach dem Himmel; Spiegelbilder nur, wenn das Brett auch eine Spiegelfläche hat (Lehm, Wiese, Moos nicht)
    const soll = info.spiegelt ? 1 : 0, rechnet = info.spiegelt && info.spiegel > 0;
    const spiegelbilder = steht.filter((b) => b[1]).length;
    // Wechsel: Schritte des Anteils je Bild, Spiegelbilder bei Anteil 0, Änderung beim Halten, Umkehr
    // veraltet: Anteil über 0, Platte im Bild, ein Brett hat eine Spiegelfläche, aber kein Spiegelbild in diesem Bild (das
    // Brett läse eine alte Textur, etwa beim Einblenden aus einer Welt ohne Spiegelung)
    let maxSchritt = 0, beimHalten = 0, beiNull = 0, veraltet = 0, umkehr = 0, richtung = 0, maxLuecke = 0;
    for (let i = 0; i < wechsel.length; i++) {
      const [a, s, , halt, sicht, luecke, flaeche] = wechsel[i];
      if (s && !(a > 0)) beiNull++;
      if (!s && a > 0 && sicht && flaeche) veraltet++;
      if (i === 0) continue;
      maxLuecke = Math.max(maxLuecke, luecke);
      const d = a - wechsel[i - 1][0];
      maxSchritt = Math.max(maxSchritt, Math.abs(d));
      if (halt && wechsel[i - 1][3] && Math.abs(d) > 1e-6) beimHalten++;
      if (Math.abs(d) > 1e-6) {
        if (richtung && Math.sign(d) !== richtung) umkehr++;
        richtung = Math.sign(d);
      }
    }
    const verlauf = wechsel.filter((b, i) => i === 0 || b[0] !== wechsel[i - 1][0]).map((b) => b[0]);
    const e = { welt, soll, anteil: steht.at(-1)?.[0], spiegelbilder, bilder: steht.length, rt: info.rt, wechsel: wechsel.length,
      verlauf, maxSchritt: +maxSchritt.toFixed(4), maxLuecke };
    ergebnis.push(e);
    console.log(`  ${welt}: Anteil ${e.anteil}, ${spiegelbilder} Spiegelbilder in ${steht.length} Bildern, Spiegeltextur ${info.rt.join('×')}`
      + (vorige ? `; von ${vorige}: ${wechsel.length} Bilder, grösster Schritt ${e.maxSchritt}, längste Lücke ${maxLuecke} ms, `
        + `Anteil ${verlauf.length > 1 ? `in ${verlauf.length - 1} Schritten ${verlauf[0]} → ${verlauf.at(-1)}` : 'gleich'}` : ''));
    pruefe(steht.length > 20, `${name} ${welt}: zu wenige Bilder (${steht.length})`);
    pruefe(e.anteil === soll, `${name} ${welt}: Anteil der Spiegelung ${e.anteil}, soll ${soll}`);
    pruefe(rechnet ? spiegelbilder === steht.length : spiegelbilder === 0, `${name} ${welt}: ${spiegelbilder} Spiegelbilder in ${steht.length} Bildern (soll ${rechnet ? 'jedes' : 'keines'})`);
    pruefe(!beiNull, `${name} ${vorige} → ${welt}: ${beiNull} Spiegelbilder bei Anteil 0`);
    pruefe(!veraltet, `${name} ${vorige} → ${welt}: ${veraltet} Bilder mit Anteil über 0 ohne neues Spiegelbild`);
    // weich: höchstens so viel wie smoothstep in einem Bild (Steigung 1,5 je fadeTime 0,9 s, ein Bild höchstens MAX_DT 0,05 s)
    pruefe(maxSchritt <= 1.5 * 0.05 / 0.9 + 1e-3, `${name} ${vorige} → ${welt}: Anteil springt um ${maxSchritt.toFixed(3)} in einem Bild`);
    pruefe(!beimHalten && !umkehr, `${name} ${vorige} → ${welt}: Anteil ändert sich beim Halten (${beimHalten}) oder kehrt um (${umkehr})`);
    const [w, h, msaa] = info.rt, [bw, bh] = info.buffer;
    const s = alle ? (handy ? 0.35 : 0.3) : (handy ? 0.25 : 0.22), m = alle ? (handy ? 2 : 4) : 0;
    pruefe(Math.abs(w - Math.round(bw * s)) <= 1 && Math.abs(h - Math.round(bh * s)) <= 1 && msaa === m,
      `${name}: Spiegeltextur ${info.rt.join('×')} statt ${s} von ${bw}×${bh} mit MSAA ${m}`);
    vorige = welt;
  }
  return { menue: { bilder: menue.length, spiegelbilder: menueSpiegel }, welten: ergebnis };
}

const ergebnis = { modus, bildschirm };
try {
  await emulate(send, view);
  if (handy) {
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
      + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  }

  if (modus === 'pruefe') {
    ergebnis.standard = await pruefeFolge(false);
    ergebnis.alle = await pruefeFolge(true);
    // Was die Messfassung alle zur Laufzeit umstellt, gleicht dem Laden mit ?spiegel=alle
    await oeffne('sky=volcano', 1500);
    await ev(`${SCHALTE}('alle', true)`);
    await sleep(500);
    const rt = await ev('[reflector.getRenderTarget().width, reflector.getRenderTarget().height, reflector.getRenderTarget().samples, boardReflection.uniform.value].join()');
    const geladen = ergebnis.alle.welten.find((w) => w.welt === 'volcano');
    pruefe(rt === [...geladen.rt, 1].join(), `Messfassung alle: Spiegeltextur und Anteil ${rt}, mit ?spiegel=alle ${geladen.rt.join()},1`);
    const OUT = join(root, 'tests', 'output', 'energie');
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `spiegel-pruefe-${bildschirm}.json`), JSON.stringify(ergebnis, null, 1));
  }

  if (modus === 'messen') {
    ergebnis.welten = {};
    for (const welt of welten) {
      console.log(`Welt ${welt} (${bildschirm}), Fassungen ${fassungen.join(', ')}`);
      const e = await messeWelt(welt);
      ergebnis.welten[welt] = e;
      tabelle(welt, e);
    }
    const OUT = join(root, 'tests', 'output', 'energie');
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `spiegel-${bildschirm}.json`), JSON.stringify(ergebnis, null, 1));
  }

  if (modus === 'bilder') {
    mkdirSync(ordner, { recursive: true });
    ergebnis.bilder = {};
    const url = (datei, welt, extra = '') => `${seite(datei)}?nointro&noadapt&t=12&sky=${welt}${extra}`;
    for (const welt of welten) {
      const basis = join(ordner, `${welt}-vorher`), datei = join(ordner, `${welt}-neu`);
      const fest = await bild(vorher ? url(vorher, welt) : url(undefined, welt, '&spiegel=alle'), basis, 'brett');
      await bild(url(undefined, welt), datei, fest); // derselbe Ausschnitt
      ergebnis.bilder[welt] = {};
      for (const teil of ['', '-ausschnitt']) {
        await send('Page.navigate', { url: 'about:blank' });
        // Bilder von file:// in about:blank: über fetch nicht erlaubt, darum als Daten-URL
        const daten = (f) => `data:image/png;base64,${readFileSync(`${f}${teil}.png`).toString('base64')}`;
        const v = await ev(`${VERGLEICH}(${JSON.stringify(daten(basis))}, ${JSON.stringify(daten(datei))})`);
        writeFileSync(join(ordner, `${welt}${teil}-vergleich.png`), Buffer.from(v.bild.split(',')[1], 'base64'));
        ergebnis.bilder[welt][teil || 'voll'] = { anteil: +v.anteil.toFixed(4), mittel: +v.mittel.toFixed(3), hell: +v.hell.toFixed(3) };
      }
      console.log(`  ${welt}: ${JSON.stringify(ergebnis.bilder[welt])}`);
    }
    writeFileSync(join(ordner, 'vergleich.json'), JSON.stringify(ergebnis, null, 1));
  }
} catch (err) {
  fehler.push(err.message);
  console.log(`  FEHLER ${err.message}`);
} finally {
  await close();
}

const bad = logs.filter((l) => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
pruefe(bad.length === 0, `Konsole: ${bad.join(' | ')}`);
console.log(fehler.length ? `FEHLGESCHLAGEN (${fehler.length})` : 'OK');
process.exit(fehler.length ? 1 : 0);
