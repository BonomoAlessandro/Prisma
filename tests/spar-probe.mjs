// Probe und Messung der Sparfassungen (Spec .scratch/energie/, Ticket 03): Was kosten Spiegelung, Bloom, Pinsel, letzter
// Schritt, Himmel und Auflösung auf der Grafikkarte, und was sparen die Schalter ?spar=…?
// Gemessen in der Seite: Jeder Schritt von draw (Spiegelung, Vorzeichnen des Himmels, Szene samt Schatten, Pinsel,
// Bloom, letzter Schritt) bekommt eine eigene Abfrage über EXT_disjoint_timer_query_webgl2 (GPU-Zeit in ms je Bild).
// Die Fassungen wechseln zur Laufzeit in mehreren Runden (A B C … A B C …), damit Takt und Wärme der Grafikkarte alle
// gleich treffen; je Fassung zählt der Median je Runde, dazu die Spanne über die Runden (stabil?).
// Aufruf: GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/spar-probe.mjs
//           [messen|bilder|pruefe] [--handy] [--welten forest,beach,volcano] [--runden 4] [--sek 2]
//           [--fassungen heute,ohneSpiegel,…] [--ordner <pfad>] [--level 212]
//   messen: GPU-Zeit je Schritt und Fassung (headless mit GPU), nach tests/output/energie/spar-<bildschirm>.json.
//   bilder: Vergleichsbilder heute gegen jede Sparfassung mit ?t=12 (Handy hoch, Massstab des Poco), je Welt ganz und
//           ein Ausschnitt in doppelter Grösse, dazu nebeneinander und der Unterschied verstärkt, nach --ordner.
//   pruefe: lädt jede Sparfassung einmal mit ?spar=… (dazu alle zusammen), dreht ein Element, zieht die Kamera; keine
//           Konsolenfehler, die Fassung ist aktiv (SPAR), es wird gezeichnet.
//   --handy: 393 × 852, Pixeldichte 2,75, Android-Kennung und Touch (wie das Poco); sonst 1440 × 900.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { requireQuiet } from '../tools/ki-tester/shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const modus = ['messen', 'bilder', 'pruefe'].includes(args[0]) ? args[0] : 'messen';
const wert = (name, vorgabe = null) => { const i = args.indexOf(name); return i < 0 ? vorgabe : args[i + 1]; };
const handy = args.includes('--handy') || modus === 'bilder';
const welten = wert('--welten', 'forest,beach,volcano').split(',');
// Level: Vorgabe 212 «Kochab» (vier Quellen, viele Strahlen, die sich im Brett spiegeln)
const LEVEL = +wert('--level', 212);
const runden = +wert('--runden', 4), sek = +wert('--sek', 2);
const stoss = !args.includes('--takt'); // Vorgabe: Stösse ohne Pause; --takt: im Takt des Spiels (60), Takt der Grafik schwankt
const ordner = resolve(wert('--ordner', join(root, 'tests', 'output', 'energie', 'bilder')));
requireQuiet();

const view = handy ? { width: 393, height: 852, dpr: 2.75, phone: true } : { width: 1440, height: 900, dpr: 1, phone: false };
const bildschirm = handy ? 'handy' : 'desktop';
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

// Sparfassungen (Namen wie ?spar=…) und Fassungen nur zum Messen (ohne… schaltet einen Effekt ab)
const SPAR = ['spiegel2', 'spiegelklein', 'pinsel3', 'aufloesung'];
const MESS = ['heute', 'ohneSpiegel', 'ohneBloom', 'ohnePinsel', ...SPAR];
const fassungenWahl = wert('--fassungen', MESS.join(',')).split(',');
const fassungen = fassungenWahl;

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

// In der Seite: GPU-Zeit je Schritt von draw. Abfragen nacheinander (nie verschachtelt), ausgelesen, sobald fertig;
// meldet die Grafikkarte «disjunkt», gelten alle offenen nicht.
const EINRICHTEN = `(() => {
  const gl = renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return false;
  const p = window.__spar = { label: null, werte: {}, offen: [], frei: [], bild: null, bilder: 0 };
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
      const w = p.werte[b.label] ??= [];
      w.push(summe);
    }
  };
  const draw0 = draw;
  draw = function (...a) {
    lies();
    p.bild = { label: p.label, teile: [] };
    const r = draw0.apply(this, a);
    if (p.label) { p.offen.push(p.bild); p.bilder++; }
    return r;
  };
  const rr = renderReflection;
  renderReflection = function (...a) { return zeit('spiegel', rr, this, a); };
  const vz = skyTheme.vorzeichnen;
  skyTheme.vorzeichnen = function (...a) { return zeit('himmelVor', vz, this, a); };
  // Stoss: n Bilder ohne Pause hintereinander (die Grafikkarte voll ausgelastet, ihr Takt oben: Im Takt von 60 senkt
  // eine eingebaute Grafik den Takt bei weniger Arbeit, gleiche Arbeit dauert dann länger), dann warten, bis alle
  // Abfragen fertig sind. Der Spiegel zählt seine Bilder in draw mit (spiegel2), darum über draw.
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

// Fassungen zur Laufzeit: an (true) oder aus (false)
const SCHALTE = `((name, an) => {
  const reflRT = reflector.getRenderTarget();
  const neuSpiegel = () => { reflRT.dispose(); onResize(); };
  // Zerlegung der Szene: Pfad aus Indizes der Kinder (ohneKind5.3: scene.children[5].children[3])
  const knoten = (pfad) => pfad.split('.').filter(Boolean).reduce((o, i) => o.children[+i], scene);
  if (name.startsWith('ohneKind')) {
    const o = knoten(name.slice(8));
    if (an) { o.userData.sparSichtbar = o.visible; o.visible = false; } else o.visible = o.userData.sparSichtbar;
    return true;
  }
  if (name.startsWith('zerlege')) {
    const pfad = name.slice(7), o = knoten(pfad);
    return JSON.stringify(o.children.map((k, i) => {
      let n = 0;
      k.traverse((x) => { if (x.isMesh || x.isPoints || x.isLine) n++; });
      return [(pfad ? pfad + '.' : '') + i, k.name || k.userData?.typ || k.type, k.visible, n];
    }));
  }
  switch (name) {
    case 'heute': return true;
    case 'ohneAlles': // leere Szene: was der Szenenschritt ohne Inhalt kostet (Löschen, Auflösen)
      for (const o of scene.children) {
        if (an) { o.userData.sparSichtbar = o.visible; o.visible = false; } else o.visible = o.userData.sparSichtbar;
      }
      return true;
    case 'pr150': case 'pr175': case 'pr100': // Auflösung zur Laufzeit (nur Messung; die Sparfassung heisst aufloesung)
      window.__sparPr ??= QUALITY.pixelRatio;
      QUALITY.pixelRatio = an ? +name.slice(2) / 100 : window.__sparPr;
      adaptiveResolution.set(1);
      return true;
    case 'ohneSpiegel': QUALITY.reflections = !an; return true;
    case 'ohneBloom': bloomPass.enabled = !an; return true;
    case 'ohnePinsel': brushPass.enabled = !an; return true;
    case 'aufloesung': case 'spiegelklein': case 'spiegel2': case 'pinsel3':
      SPAR[name] = an; sparAnwenden(); return true;
  }
  throw new Error('unbekannte Fassung ' + name);
})`;

async function oeffne(query) {
  await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + `?nointro&noadapt&${query}` });
  await until('window.__prisma?.ticks > 2 && window.__prisma.skyReady() && __prismaDebug.story.choosing', 'Menü');
  await ev(`__prismaDebug.zeige(${LEVEL})`);
  await until('window.__prisma.playing() && window.__prisma.skyReady()', 'Level');
  await sleep(7000); // Strahlen wachsen, Ziele leuchten auf, die Kamera kommt an, Shader sind übersetzt
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const mittel = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r2 = (x) => x === null ? null : +x.toFixed(3);

async function messeWelt(welt, query = '') {
  await oeffne(`sky=${welt}&ruhetakt=aus${query}`); // spiegel2 lässt nur im vollen Takt aus (frameRate.gap)
  if (!await ev(EINRICHTEN)) throw new Error('keine Erweiterung EXT_disjoint_timer_query_webgl2');
  const geraet = JSON.parse(await ev(`JSON.stringify({ render: renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),
    pr: renderer.getPixelRatio(), spiegel: [reflector.getRenderTarget().width, reflector.getRenderTarget().height],
    msaa: reflector.getRenderTarget().samples, mobil: IS_MOBILE, seite: SEITE, gpu: perfHud.gpu ?? null })`));
  const fassungen = [...fassungenWahl];
  const z = fassungen.findIndex((f) => f.startsWith('zerlege'));
  if (z >= 0) {
    const kinder = JSON.parse(await ev(`${SCHALTE}('${fassungen[z]}', true)`));
    geraet.kinder = kinder;
    fassungen.splice(z, 1, ...kinder.filter((k) => k[2] && k[3] > 0).map((k) => `ohneKind${k[0]}`));
  }
  for (let r = 0; r < runden; r++) {
    for (const f of fassungen) {
      await ev(`${SCHALTE}('${f}', true)`);
      await sleep(400); // umgebaut, Shader neu
      if (stoss) {
        await ev(`__spar.stoss('${f}#w', 10)`); // Takt der Grafikkarte hoch, Shader warm
        for (let k = 0; k < 3; k++) await ev(`__spar.stoss('${f}#${r}', 30)`);
      } else {
        await ev(`__spar.label = '${f}#${r}'`);
        await sleep(sek * 1000);
        await ev('__spar.label = null');
      }
      await ev(`${SCHALTE}('${f}', false)`);
    }
  }
  await sleep(500);
  const werte = JSON.parse(await ev('JSON.stringify(__spar.werte)'));
  // je Fassung und Schritt: Median je Runde, davon Median, Min, Max
  const out = {};
  for (const f of fassungen) {
    const proRunde = [];
    for (let r = 0; r < runden; r++) {
      const bilder = werte[`${f}#${r}`] ?? [];
      const schritte = [...new Set(bilder.flatMap((b) => Object.keys(b)))];
      // Mittel je Runde (spiegel2 wechselt Bild um Bild zwischen voll und 0, ein Median nähme eines davon)
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
  console.log(`  ${welt}: Bild ${e.geraet.render.join('×')}, Spiegel ${e.geraet.spiegel.join('×')} MSAA ${e.geraet.msaa}`);
  if (e.geraet.kinder) console.log(`    Kinder der Szene ${JSON.stringify(e.geraet.kinder)}`);
  console.log(`    ${'Fassung'.padEnd(14)}${schritte.map((s) => s.padStart(15)).join('')}`);
  for (const [f, w] of Object.entries(e.fassungen)) {
    console.log(`    ${f.padEnd(14)}${schritte.map((s) => (w[s] ? `${w[s].median.toFixed(2)} ±${((w[s].max - w[s].min) / 2).toFixed(2)}` : '–').padStart(15)).join('')}`);
  }
}

// --- Bilder ---------------------------------------------------------------------------------------------------------
// Vergleich in der Seite (about:blank): zwei PNG laden, nebeneinander legen, Unterschied ×8 dazu, Anteil abweichender
// Pixel (über 3/255 in einem Kanal) und mittlere Abweichung
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
  let n = 0, summe = 0;
  for (let i = 0; i < da.length; i += 4) {
    let m = 0;
    for (let k = 0; k < 3; k++) { const x = Math.abs(da[i + k] - db[i + k]); m = Math.max(m, x); summe += x; d.data[i + k] = Math.min(255, x * 8); }
    d.data[i + 3] = 255;
    if (m > 3) n++;
  }
  g.putImageData(d, 2 * w + 16, 0);
  return { bild: c.toDataURL('image/png'), anteil: n / (w * h), mittel: summe / (w * h * 3) };
})`;

async function bild(query, datei, clip = null) {
  await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href + `?nointro&noadapt&t=12&${query}` });
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

const ergebnis = { modus, bildschirm };
try {
  await emulate(send, view);
  if (handy) {
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; 22021211RG) '
      + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
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
    writeFileSync(join(OUT, `spar-${bildschirm}.json`), JSON.stringify(ergebnis, null, 1));
  }

  if (modus === 'bilder') {
    mkdirSync(ordner, { recursive: true });
    const nur = (wert('--spar', SPAR.filter((s) => s !== 'spiegel2').join(','))).split(',');
    ergebnis.bilder = {};
    for (const welt of welten) {
      // Ausschnitt: die Mitte des Bretts (Spiegel, Strahlen) bzw. mit --clip x,y,b,h in CSS-Pixeln der Seite
      const c = wert('--clip');
      const clip = c ? Object.fromEntries(['x', 'y', 'width', 'height'].map((k, i) => [k, +c.split(',')[i]])) : 'brett';
      const basis = join(ordner, `${welt}-heute`);
      const fest = await bild(`sky=${welt}`, basis, clip); // derselbe Ausschnitt für alle Fassungen
      for (const s of nur) {
        const datei = join(ordner, `${welt}-${s}`);
        await bild(`sky=${welt}&spar=${s}`, datei, fest);
        ergebnis.bilder[`${welt}-${s}`] = {};
        for (const teil of ['', '-ausschnitt']) {
          await send('Page.navigate', { url: 'about:blank' });
          // Bilder von file:// in about:blank: über fetch nicht erlaubt, darum als Daten-URL
          const daten = (f) => `data:image/png;base64,${readFileSync(`${f}${teil}.png`).toString('base64')}`;
          const v = await ev(`${VERGLEICH}(${JSON.stringify(daten(basis))}, ${JSON.stringify(daten(datei))})`);
          writeFileSync(`${datei}${teil}-vergleich.png`, Buffer.from(v.bild.split(',')[1], 'base64'));
          ergebnis.bilder[`${welt}-${s}`][teil || 'voll'] = { anteil: +v.anteil.toFixed(4), mittel: +v.mittel.toFixed(3) };
        }
        console.log(`  ${welt} ${s}: ${JSON.stringify(ergebnis.bilder[`${welt}-${s}`])}`);
      }
    }
    writeFileSync(join(ordner, 'vergleich.json'), JSON.stringify(ergebnis, null, 1));
  }

  if (modus === 'pruefe') {
    // Ziehen der Kamera (Touch bzw. rechte Maustaste) über dauer ms
    const ziehe = async (dauer) => {
      const x = view.width / 2, y = view.height * 0.55, n = Math.round(dauer / 30);
      if (view.phone) {
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let i = 1; i <= n; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + Math.sin(i / 8) * 120, y }] }); await sleep(30); }
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', clickCount: 1 });
        for (let i = 1; i <= n; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + Math.sin(i / 8) * 150, y, buttons: 2 }); await sleep(30); }
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', clickCount: 1 });
      }
    };
    // je gezeichnetes Bild: Spiegel ausgelassen? Kamera gezogen? dreht etwas? (für spiegel2)
    const MITSCHRIFT = `(() => {
      const p = window.__sp = { an: false, bilder: [] };
      const draw0 = draw;
      draw = function (...a) {
        const r = draw0.apply(this, a);
        if (p.an) p.bilder.push([spiegelTakt.ausgelassen ? 1 : 0, drag.active || !!input.pointer ? 1 : 0, sceneLoop.pending() ? 1 : 0]);
        return r;
      };
      return true;
    })()`;
    const abschnitt = async (fn) => {
      await ev('__sp.bilder = []; __sp.an = true');
      await fn();
      await ev('__sp.an = false');
      const b = JSON.parse(await ev('JSON.stringify(__sp.bilder)'));
      return { bilder: b.length, ausgelassen: b.filter((x) => x[0]).length,
        ausgelassenBewegt: b.filter((x) => x[0] && (x[1] || x[2])).length, folge: Math.max(0, ...b.map((x, i) => x[0] && b[i - 1]?.[0] ? 2 : 0)) };
    };
    // Ruhe-Bildrate (Tickets 01 und 02 der Energie) aus: spiegel2 lässt nur im vollen Takt aus. Dazu einmal mit Ruhe
    // (30, ?ruhehimmel: bis Ticket 01 hielten die Fische am Strand sonst den vollen Takt): dort nie auslassen
    const faelle = [...[...SPAR, SPAR.join(','), 'alle', ''].map((q) => [q, 'aus']), ['spiegel2', '30&ruhehimmel']];
    for (const [q, ruhe] of faelle) {
      console.log(`?spar=${q}&ruhetakt=${ruhe}`);
      await oeffne(`sky=beach&spar=${q}&ruhetakt=${ruhe}`);
      const an = JSON.parse(await ev('JSON.stringify(SPAR)'));
      const soll = q === 'alle' ? SPAR : q.split(',').filter(Boolean);
      pruefe(SPAR.every((s) => an[s] === soll.includes(s)), `?spar=${q}: SPAR ${JSON.stringify(an)}`);
      const q0 = JSON.parse(await ev(`JSON.stringify({ pr: renderer.getPixelRatio(), spiegel: reflector.getRenderTarget().width,
        msaa: reflector.getRenderTarget().samples, pinsel: QUALITY.brush })`));
      console.log(`  ${JSON.stringify(q0)}`);
      await ev(MITSCHRIFT);
      // erst messen, wenn die Seite flüssig zeichnet (headless hängt nach dem Laden manchmal ein paar Sekunden)
      for (let i = 0; i < 20; i++) {
        const f0 = await ev('window.__prisma.frames');
        await sleep(500);
        if (await ev('window.__prisma.frames') - f0 >= 20) break;
      }
      const ruhig = await abschnitt(() => sleep(2000));
      const dreh = await abschnitt(async () => {
        await ev(`(() => { const o = [...game.objects.values()].find((o) => isRotatable(o.userData.element)); if (o) rotateElement(o.userData.element, 1); })()`);
        await sleep(600);
      });
      await sleep(1500);
      const zug = await abschnitt(() => ziehe(1500));
      console.log(`  ruhig ${JSON.stringify(ruhig)}, Drehen ${JSON.stringify(dreh)}, Ziehen ${JSON.stringify(zug)}`);
      pruefe(ruhig.bilder > (ruhe === 'aus' ? 60 : 25) && zug.bilder > 40, `?spar=${q}: zu wenige Bilder (ruhig ${ruhig.bilder}, Ziehen ${zug.bilder})`);
      for (const [name, x] of [['ruhig', ruhig], ['Drehen', dreh], ['Ziehen', zug]]) {
        pruefe(!x.ausgelassenBewegt && !x.folge, `?spar=${q} ${name}: Spiegel ausgelassen, obwohl sich etwas bewegt (${x.ausgelassenBewegt}) oder zweimal in Folge (${x.folge})`);
      }
      if (an.spiegel2 && ruhe === 'aus') {
        pruefe(ruhig.ausgelassen >= ruhig.bilder * 0.4, `?spar=${q}: in Ruhe nur ${ruhig.ausgelassen} von ${ruhig.bilder} Spiegelbildern ausgelassen`);
        pruefe(dreh.ausgelassen <= 2 && zug.ausgelassen <= 3, `?spar=${q}: beim Drehen ${dreh.ausgelassen}, beim Ziehen ${zug.ausgelassen} ausgelassen`);
      } else if (an.spiegel2) {
        pruefe(!ruhig.ausgelassen && !dreh.ausgelassen && zug.ausgelassen <= 3, `?spar=${q}&ruhetakt=${ruhe}: Spiegel in der Ruhe-Bildrate ausgelassen (ruhig ${ruhig.ausgelassen}, Drehen ${dreh.ausgelassen}, Ziehen ${zug.ausgelassen})`);
      } else pruefe(!ruhig.ausgelassen && !dreh.ausgelassen && !zug.ausgelassen, `?spar=${q}: Spiegel ausgelassen ohne spiegel2`);
    }
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
