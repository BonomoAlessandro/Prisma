// Prüfung und Aufnahmen des Bausteins createSprachliste (Ticket 02 von .scratch/sprachwahl/) mit probe.html in
// headless Chrome, ein Lauf (leicht, ohne Zeitmessung), aus der Wurzel des Repos:
//   LEISE_ART=leicht sh tools/leise.sh timeout -k 30 900 node .scratch/sprachwahl/bausteine/sprachliste/probe.mjs
// Die Seite kommt ungebaut über http aus der Wurzel (tools/spielserver.mjs, ordner = Wurzel): Das Modul lädt sie ohne
// seinen einzigen Import (ui.js, nur für die Reihenfolge im Spiel), der Stil ist src/stil/index.css.
// Desktop (1280 × 800, Maus) und Handy hochkant (390 × 844, Finger): je alle Punkte einmal mit Zeiger und einmal mit
// Tastatur. Dazu die Lage (ganz im Bild, an welchem Rand, Abstände, Trefferflächen) auch bei 360 × 640, Handy quer
// (844 × 390), Poco (393 × 873, Pixeldichte 2,75, mit dem Massstab SEITE) und mit sicheren Rändern. Aufnahmen als JPEG
// neben diese Datei. Fehler stehen am Ende; Exit-Code 1.
// Zeitrahmen: jede Anfrage an Chrome höchstens 20 s, der ganze Lauf 10 min (dann Chrome zu und Abbruch).
// Auf dem Handy wird getippt (Input.dispatchTouchEvent): Mit der Touch-Emulation kommt Input.dispatchMouseEvent nicht
// zurück (Erfahrung aus .scratch/noa-geschichte/bausteine/menue/aufnahme.mjs).
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../../../../tools/chrome.mjs';
import { root, spielServer } from '../../../../tools/spielserver.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const FRIST_MS = 20000, GESAMT_MS = 10 * 60000, AUS_MS = 350; // AUS_MS: Ausblenden der Liste (300 ms) und etwas Luft
let schliessen = null;
setTimeout(async () => {
  console.error(`Zeitrahmen von ${GESAMT_MS / 60000} min überschritten: Abbruch`);
  await Promise.race([schliessen?.(), sleep(5000)]);
  process.exit(3);
}, GESAMT_MS).unref();

const FORMATE = {
  desktop: { width: 1280, height: 800, dpr: 1, phone: false },
  hoch: { width: 390, height: 844, dpr: 2, phone: true },
  klein: { width: 360, height: 640, dpr: 2, phone: true },
  quer: { width: 844, height: 390, dpr: 2, phone: true, mobile: true },
  // Poco F4 GT: Chrome auf Android (sonst kein Massstab SEITE; emulate setzt die Kennung eines iPhone)
  poco: { width: 393, height: 873, dpr: 2.75, phone: true, android: true },
};
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; 22081212G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

/** Was der Schalter zeigen soll: auf dem Handy (hochkant und quer) das Kürzel, sonst den vollen Namen. */
const text = (f, k) => (f.phone ? k.toUpperCase() : { de: 'Deutsch', en: 'English' }[k]);
const fehler = [];
let n = 0;
const pruefe = (ok, text) => { n++; if (!ok) { fehler.push(text); console.log(`  FEHLER ${text}`); } };

const server = await spielServer({ ordner: root, datei: '.scratch/sprachwahl/bausteine/sprachliste/probe.html', bauen: false });
const chrome = await startChrome({ width: 1280, height: 800 });
schliessen = async () => { await chrome.close(); await server.close(); };
const send = (method, params) => {
  let t;
  const frist = new Promise((_, nein) => { t = setTimeout(() => nein(new Error(`keine Antwort auf ${method}`)), FRIST_MS); });
  return Promise.race([chrome.send(method, params), frist]).finally(() => clearTimeout(t));
};
const ev = (e) => evaluate(send, e);

const TASTEN = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, PageUp: 33, PageDown: 34, End: 35, Home: 36, ArrowLeft: 37,
  ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, d: 68, e: 69 };
async function taste(key, { shift = false } = {}) {
  const vk = TASTEN[key], code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
  const text = key === 'Enter' ? '\r' : key.length === 1 ? key : undefined;
  const basis = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: shift ? 8 : 0 };
  await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...basis, ...(text ? { text, unmodifiedText: text } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...basis });
  await sleep(80);
}
let format = null;
/** Klick (Desktop) bzw. Tippen (Handy) an einer Stelle in Pixeln des Layouts. */
async function tippe(x, y) {
  if (format.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  await sleep(150);
}
const rechteck = (sel) => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
  return { l: r.left, r: r.right, o: r.top, u: r.bottom, w: r.width, h: r.height }; })()`);
async function tippeAuf(sel) { const r = await rechteck(sel); await tippe(r.l + r.w / 2, r.o + r.h / 2); }
/** Zustand eines Schalters und seiner Liste. */
const zustand = (id) => ev(`(() => {
  const k = document.getElementById('${id}'), l = document.getElementById(k.getAttribute('aria-controls')) ?? k.nextElementSibling?.nextElementSibling;
  const a = document.activeElement;
  return {
    offen: __probe.listen.${id}.offen, expanded: k.getAttribute('aria-expanded'), sichtbar: !!l && !l.hidden,
    deckend: !!l && !l.hidden && getComputedStyle(l).opacity === '1',
    fokus: a === k ? 'knopf' : a?.dataset?.sprache ?? a?.id ?? a?.tagName,
    rahmen: a && a !== document.body ? getComputedStyle(a).boxShadow !== 'none' || getComputedStyle(a).outlineStyle !== 'none' : false,
    text: [...k.querySelectorAll('.menue-sl-voll, .menue-sl-kurz')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.textContent).join('|'), aria: k.getAttribute('aria-label'),
    geprueft: l ? [...l.querySelectorAll('[role=menuitemradio]')].filter((e) => e.getAttribute('aria-checked') === 'true').map((e) => e.dataset.sprache).join() : '',
    wahlen: __probe.wahlen.join(), durch: __probe.durch.titel + __probe.durch.reiter,
  };
})()`);
async function laden(f) {
  format = f;
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: false });
  await send('Emulation.setUserAgentOverride', { userAgent: '' });
  await emulate(send, f);
  if (f.android) await send('Emulation.setUserAgentOverride', { userAgent: ANDROID });
  await send('Page.navigate', { url: server.seite() });
  for (let i = 0; i < 100; i++) {
    if (await ev(`document.readyState === 'complete' && !!window.__probe`).catch(() => false)) break;
    await sleep(100);
  }
  await ev('document.fonts.ready.then(() => true)');
  await sleep(100);
}
async function bild(name) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
  const datei = join(hier, `${name}.jpg`);
  writeFileSync(datei, Buffer.from(r.result.data, 'base64'));
  console.log(`  Bild ${relative(root, datei)}`);
}

/**
 * Lage der offenen Liste eines Schalters: ganz im Bild (mit 8 px und den sicheren Rändern), an der Seite der Richtung,
 * an der Kante der Ausrichtung, Trefferflächen; Werte in Pixeln der Oberfläche (SEITE).
 */
async function lage(id, was, { richtung, ausrichtung, finger }) {
  const m = await ev(`(() => {
    const S = typeof SEITE === 'number' ? SEITE : 1, k = document.getElementById('${id}');
    const l = document.getElementById(k.getAttribute('aria-controls')), cs = getComputedStyle(l.previousElementSibling);
    const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left / S, r: b.right / S, o: b.top / S, u: b.bottom / S, w: b.width / S, h: b.height / S }; };
    return { S, W: innerWidth / S, H: innerHeight / S, k: r(k), l: r(l), e: [...l.children].map((e) => r(e).h),
      sa: ['Top', 'Right', 'Bottom', 'Left'].map((x) => parseFloat(cs['padding' + x]) || 0),
      pfeil: (() => { const p = k.querySelector('.menue-sl-pfeil'); return p ? r(p) : null; })() };
  })()`);
  const [so, sr, su, sl] = m.sa, eps = 0.6;
  pruefe(m.l.l >= sl + 8 - eps && m.l.r <= m.W - sr - 8 + eps && m.l.o >= so + 8 - eps && m.l.u <= m.H - su - 8 + eps,
    `${was}: Liste nicht ganz im Bild (${JSON.stringify(m.l)}, Bild ${m.W.toFixed(0)} × ${m.H.toFixed(0)}, Ränder ${m.sa})`);
  if (richtung === 'unten') pruefe(m.l.o >= m.k.u - eps, `${was}: Liste nicht unter dem Schalter (${m.l.o.toFixed(1)} < ${m.k.u.toFixed(1)})`);
  if (richtung === 'oben') pruefe(m.l.u <= m.k.o + eps, `${was}: Liste nicht über dem Schalter (${m.l.u.toFixed(1)} > ${m.k.o.toFixed(1)})`);
  // an der Kante des Schalters; steht er näher als 8 px am Rand (mit den sicheren Rändern), 8 px vom Rand
  const sollR = Math.min(m.k.r, m.W - sr - 8), sollL = Math.max(m.k.l, sl + 8);
  if (ausrichtung === 'ende') pruefe(Math.abs(m.l.r - sollR) < 1, `${was}: rechte Kante ${m.l.r.toFixed(1)} statt ${sollR.toFixed(1)}`);
  if (ausrichtung === 'start') pruefe(Math.abs(m.l.l - sollL) < 1, `${was}: linke Kante ${m.l.l.toFixed(1)} statt ${sollL.toFixed(1)}`);
  const min = Math.min(...m.e);
  if (finger) pruefe(min >= 44, `${was}: Trefferfläche ${min.toFixed(1)} px < 44 px`);
  pruefe(!!m.pfeil && m.pfeil.r <= m.k.r - 4, `${was}: ▾ fehlt oder liegt am Rand des Schalters`);
  console.log(`  ${was}: Liste ${m.l.w.toFixed(0)} × ${m.l.h.toFixed(0)} bei ${m.l.l.toFixed(0)}, ${m.l.o.toFixed(0)}; Schalter ${m.k.w.toFixed(0)} × ${m.k.h.toFixed(0)}; Einträge ${m.e.map((h) => h.toFixed(0)).join(', ')} px; SEITE ${m.S}`);
  return m;
}

/* ---------- Zeiger (Maus bzw. Finger) ---------- */
async function zeiger(f, name) {
  console.log(`${name}: Zeiger`);
  await laden(f);
  let z = await zustand('oben');
  const attr = await ev(`(() => { const k = document.getElementById('oben'), l = document.getElementById(k.getAttribute('aria-controls'));
    return { haspopup: k.getAttribute('aria-haspopup'), controls: !!l, rolle: l?.getAttribute('role'), label: l?.getAttribute('aria-label'),
      eintraege: [...l.children].map((e) => [e.getAttribute('role'), e.lang, e.textContent.trim(), e.tabIndex].join(':')),
      pfeil: !!k.querySelector('svg.menue-sl-pfeil path') }; })()`);
  pruefe(attr.haspopup === 'menu' && attr.controls && z.expanded === 'false', `${name}: Schalter ohne aria-haspopup/aria-controls/aria-expanded (${JSON.stringify(attr)})`);
  pruefe(attr.rolle === 'menu' && attr.label === 'Sprache', `${name}: Liste ohne role=menu oder Namen`);
  pruefe(attr.eintraege.join('|') === 'menuitemradio:de:Deutsch:-1|menuitemradio:en:English:-1', `${name}: Einträge ${attr.eintraege.join('|')}`);
  pruefe(attr.pfeil, `${name}: ▾ fehlt am Schalter`);
  pruefe(z.text === text(f, 'de') && z.aria === 'Sprache: Deutsch' && !z.sichtbar, `${name}: Schalter am Anfang ${JSON.stringify(z)}`);

  // öffnen
  await tippeAuf('#oben');
  for (let i = 0; i < 15 && !(await zustand('oben')).deckend; i++) await sleep(100); // eingeblendet (300 ms)
  z = await zustand('oben');
  pruefe(z.offen && z.expanded === 'true' && z.deckend,`${name}: Antippen öffnet nicht ${JSON.stringify(z)}`);
  pruefe(z.fokus === 'de' && z.geprueft === 'de', `${name}: Fokus nach dem Öffnen auf ${z.fokus}, aktuell ${z.geprueft}`);
  pruefe(!z.rahmen, `${name}: Fokusrahmen nach Zeiger`);
  const haken = await ev(`[...document.querySelectorAll('#${await ev(`document.getElementById('oben').getAttribute('aria-controls')`)} .menue-sl-haken svg')].map((s) => getComputedStyle(s).visibility).join()`);
  pruefe(haken === 'visible,hidden', `${name}: Häkchen ${haken}`);
  await lage('oben', `${name} oben rechts`, { richtung: 'unten', ausrichtung: 'ende', finger: f.phone });
  await bild(`${name}-offen-unten`);

  // erneutes Antippen des Schalters schliesst
  await tippeAuf('#oben');
  z = await zustand('oben');
  pruefe(!z.offen && z.expanded === 'false' && z.fokus === 'knopf', `${name}: erneutes Antippen ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  z = await zustand('oben');
  pruefe(!z.sichtbar, `${name}: Liste nach dem Ausblenden noch da`);

  // Antippen ausserhalb schliesst, ohne darunter etwas auszulösen (Titel, Reiter)
  for (const sel of ['.menue-titel', '.menue-grad:nth-child(2) .menue-wahl']) {
    await tippeAuf('#oben');
    await sleep(AUS_MS);
    await tippeAuf(sel);
    z = await zustand('oben');
    pruefe(!z.offen && z.fokus === 'knopf' && z.durch === 0 && z.wahlen === '', `${name}: Antippen ausserhalb (${sel}) ${JSON.stringify(z)}`);
    await sleep(AUS_MS);
  }

  // die aktuelle Sprache wählen schliesst nur
  await tippeAuf('#oben');
  await sleep(AUS_MS);
  await tippeAuf('[role=menuitemradio][data-sprache="de"]');
  z = await zustand('oben');
  pruefe(!z.offen && z.wahlen === '' && z.fokus === 'knopf', `${name}: aktuelle wählen ${JSON.stringify(z)}`);
  await sleep(AUS_MS);

  // eine andere wählen: onWahl, zu, Schalter «EN», Häkchen bei English
  await tippeAuf('#oben');
  await sleep(AUS_MS);
  await tippeAuf('#oben ~ [role=menu] [data-sprache="en"]');
  z = await zustand('oben');
  pruefe(!z.offen && z.wahlen === 'oben:en' && z.fokus === 'knopf' && z.text === text(f, 'en') && z.aria === 'Language: English'
    && z.geprueft === 'en', `${name}: andere wählen ${JSON.stringify(z)}`);
  const pfeilNach = await ev(`!!document.querySelector('#oben .menue-sl-pfeil')`);
  pruefe(pfeilNach, `${name}: ▾ nach dem Wechsel weg`);
  await sleep(AUS_MS);
  await tippeAuf('#oben');
  await sleep(AUS_MS);
  z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'en', `${name}: nach dem Wechsel öffnet mit Fokus auf ${z.fokus}`);
  const label = await ev(`document.getElementById(document.getElementById('oben').getAttribute('aria-controls')).getAttribute('aria-label')`);
  pruefe(label === 'Language', `${name}: Name der Liste nach setze ${label}`);
  await tippeAuf('.menue-titel');
  await sleep(AUS_MS);

  // Richtung oben (Schalter weiter unten, am Anfang ausgerichtet)
  await tippeAuf('#unten');
  await sleep(AUS_MS);
  z = await zustand('unten');
  pruefe(z.offen && z.fokus === 'de', `${name}: unterer Schalter ${JSON.stringify(z)}`);
  await lage('unten', `${name} unten`, { richtung: 'oben', ausrichtung: 'start', finger: f.phone });
  if (name === 'desktop') {
    await taste('ArrowDown'); // Fokusrahmen in der Aufnahme
    await bild(`${name}-offen-oben`);
  }
  await tippeAuf('.menue-titel');
  await sleep(AUS_MS);

  // nur eine Sprache: kein ▾, keine Liste, Antippen tut nichts
  const eins = await ev(`(() => { const k = document.getElementById('eins');
    return { pfeil: !!k.querySelector('.menue-sl-pfeil'), haspopup: k.hasAttribute('aria-haspopup'), expanded: k.hasAttribute('aria-expanded'),
      controls: k.hasAttribute('aria-controls') }; })()`);
  pruefe(!eins.pfeil && !eins.haspopup && !eins.expanded && !eins.controls, `${name}: eine Sprache ${JSON.stringify(eins)}`);
  await tippeAuf('#eins');
  const einsOffen = await ev(`__probe.listen.eins.offen || [...document.querySelectorAll('.menue-sl')].some((l) => !l.hidden)`);
  pruefe(!einsOffen, `${name}: eine Sprache öffnet eine Liste`);

  // das Menü blendet aus: schliessen(true) mit offener Liste, ohne Animation
  await tippeAuf('#oben');
  await sleep(AUS_MS);
  const sofort = await ev(`(() => { __probe.listen.oben.schliessen(true); const k = document.getElementById('oben');
    return { offen: __probe.listen.oben.offen, weg: document.getElementById(k.getAttribute('aria-controls')).hidden, fokus: document.activeElement === k }; })()`);
  pruefe(!sofort.offen && sofort.weg && sofort.fokus, `${name}: schliessen(true) ${JSON.stringify(sofort)}`);
}

/* ---------- Tastatur ---------- */
async function tastatur(f, name) {
  console.log(`${name}: Tastatur`);
  await laden(f);
  await ev(`document.getElementById('oben').focus()`);
  const fokus = async () => (await zustand('oben')).fokus;
  // Enter öffnet, Fokus auf der aktuellen, Fokusrahmen sichtbar
  await taste('Enter');
  await sleep(AUS_MS);
  let z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'de' && z.expanded === 'true', `${name}: Enter öffnet ${JSON.stringify(z)}`);
  pruefe(z.rahmen, `${name}: kein Fokusrahmen nach Taste`);
  if (name === 'hoch') await bild(`${name}-tastatur`);
  // Pfeile mit Umlauf, Pos1, Ende, Bild auf/ab, Buchstabe; links/rechts nehmen nichts weg
  const folge = [['ArrowDown', 'en'], ['ArrowDown', 'de'], ['ArrowUp', 'en'], ['ArrowUp', 'de'], ['End', 'en'], ['Home', 'de'],
    ['PageDown', 'en'], ['PageUp', 'de'], ['e', 'en'], ['d', 'de'], ['ArrowRight', 'de'], ['ArrowLeft', 'de']];
  for (const [k, soll] of folge) {
    await taste(k);
    const ist = await fokus();
    pruefe(ist === soll, `${name}: ${k} → Fokus auf ${ist} statt ${soll}`);
  }
  pruefe((await zustand('oben')).offen, `${name}: Liste nach den Pfeilen zu`);
  // Esc schliesst, Fokus am Schalter
  await taste('Escape');
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf' && z.expanded === 'false', `${name}: Esc ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  pruefe(!(await zustand('oben')).sichtbar, `${name}: nach Esc noch sichtbar`);
  // Pfeil hoch öffnet mit Fokus auf der letzten; Tab schliesst, Fokus am Schalter
  await taste('ArrowUp');
  z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'en', `${name}: Pfeil hoch öffnet ${JSON.stringify(z)}`);
  await taste('Tab');
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf', `${name}: Tab ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  await taste('ArrowUp');
  await taste('Tab', { shift: true });
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf', `${name}: Umschalt+Tab ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  // Pfeil runter öffnet mit Fokus auf der aktuellen; Enter auf der aktuellen schliesst nur (und öffnet nicht wieder)
  await taste('ArrowDown');
  z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'de', `${name}: Pfeil runter öffnet ${JSON.stringify(z)}`);
  await taste('Enter');
  await sleep(150);
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf' && z.wahlen === '', `${name}: Enter auf der aktuellen ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  // Leertaste öffnet; Leertaste auf English wählt (und öffnet beim Loslassen nicht wieder)
  await taste(' ');
  z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'de', `${name}: Leertaste öffnet ${JSON.stringify(z)}`);
  await taste('ArrowDown');
  await taste(' ');
  await sleep(150);
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf' && z.wahlen === 'oben:en' && z.text === text(f, 'en') && z.geprueft === 'en',
    `${name}: Leertaste wählt ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  // Enter öffnet mit Fokus auf der neuen aktuellen; Enter auf Deutsch wählt zurück
  await taste('Enter');
  z = await zustand('oben');
  pruefe(z.offen && z.fokus === 'en', `${name}: Enter nach dem Wechsel ${JSON.stringify(z)}`);
  await taste('Home');
  await taste('Enter');
  await sleep(150);
  z = await zustand('oben');
  pruefe(!z.offen && z.fokus === 'knopf' && z.wahlen === 'oben:en,oben:de' && z.text === text(f, 'de'), `${name}: Enter wählt ${JSON.stringify(z)}`);
  await sleep(AUS_MS);
  // zu: Tasten des Menüs bleiben dem Menü (Pfeil links/rechts, Esc), die Liste nimmt sie nicht
  const frei = await ev(`(() => { const k = document.getElementById('oben'); k.focus();
    return ['ArrowLeft', 'ArrowRight', 'Escape', 'Home', 'm'].map((key) => { const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      k.dispatchEvent(e); return e.defaultPrevented; }).join(); })()`);
  pruefe(frei === 'false,false,false,false,false', `${name}: zu nimmt die Liste Tasten des Menüs (${frei})`);
  // offen: Tasten von aussen (keydown(e), etwa vom Tastatur-Handler des Spiels)
  const aussen = await ev(`(() => { const l = __probe.listen.oben; l.oeffnen(); document.activeElement.blur();
    const e1 = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }); const r1 = l.keydown(e1);
    const f1 = document.activeElement?.dataset?.sprache;
    const e2 = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }); const r2 = l.keydown(e2);
    return [r1, e1.defaultPrevented, f1, r2, l.offen, document.activeElement?.id].join(); })()`);
  pruefe(aussen === 'true,true,de,true,false,oben', `${name}: keydown von aussen ${aussen}`);
  await sleep(AUS_MS);
  // nur eine Sprache: Enter und Pfeil runter öffnen nichts
  await ev(`document.getElementById('eins').focus()`);
  await taste('Enter');
  await taste('ArrowDown');
  const eins = await ev(`__probe.listen.eins.offen || [...document.querySelectorAll('.menue-sl')].some((l) => !l.hidden)`);
  pruefe(!eins, `${name}: eine Sprache öffnet mit Tasten`);
  // Richtung oben mit Tasten
  await ev(`document.getElementById('unten').focus()`);
  await taste('ArrowDown');
  await sleep(AUS_MS);
  z = await zustand('unten');
  pruefe(z.offen && z.fokus === 'de', `${name}: unterer Schalter mit Pfeil runter ${JSON.stringify(z)}`);
  await taste('Escape');
  pruefe((await zustand('unten')).fokus === 'knopf', `${name}: unterer Schalter Esc`);
}

/* ---------- Bewegung: mit prefers-reduced-motion ohne Verschieben ---------- */
async function bewegung() {
  const verschub = () => ev(`(() => { const l = document.getElementById(document.getElementById('oben').getAttribute('aria-controls'));
    __probe.listen.oben.oeffnen(); l.style.transition = 'none'; l.classList.add('menue-sl-aus'); const t = getComputedStyle(l).transform;
    l.classList.remove('menue-sl-aus'); void l.offsetWidth; l.style.transition = ''; __probe.listen.oben.schliessen(true); return t; })()`);
  const normal = await verschub();
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const still = await verschub();
  await send('Emulation.setEmulatedMedia', { features: [] });
  pruefe(normal !== 'none' && still === 'none', `Bewegung: ohne Einstellung ${normal}, mit reduce ${still}`);
  console.log(`  Bewegung: Ausblenden mit ${normal}, mit prefers-reduced-motion ${still}`);
}

/* ---------- Lage in weiteren Grössen, mit SEITE und sicheren Rändern ---------- */
async function groessen() {
  for (const name of ['desktop', 'hoch', 'klein', 'quer', 'poco']) {
    const f = FORMATE[name];
    console.log(`${name}: Lage`);
    await laden(f);
    const S = await ev('SEITE');
    const z = await zustand('oben');
    pruefe(z.text === text(f, 'de') && z.aria === 'Sprache: Deutsch', `${name}: Text des Schalters ${z.text}, ${z.aria}`);
    if (name === 'poco') pruefe(Math.abs(S - 1.375) < 1e-6, `poco: SEITE ${S} statt 1.375`);
    for (const [id, richtung, ausrichtung] of [['oben', 'unten', 'ende'], ['unten', 'oben', 'start']]) {
      await ev(`__probe.listen.${id}.oeffnen()`);
      await sleep(AUS_MS);
      await lage(id, `${name} ${id}`, { richtung, ausrichtung, finger: f.phone });
      if (id === 'oben' && (name === 'klein' || name === 'poco')) await bild(`${name}-offen-unten`);
      await ev(`__probe.listen.${id}.schliessen(true)`);
    }
    // Platz für das ▾: Lücke von der Schrift des Titels bzw. Untertitels (die Überschrift ist ein Block über die ganze
    // Breite, darum der Umfang der Schrift) zum Globus und zur Trefferfläche des Schalters, wo sie auf gleicher Höhe sind
    const luecke = await ev(`(() => { const k = document.getElementById('oben').getBoundingClientRect();
      const schrift = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
      const t = schrift(document.querySelector('.menue-titel')), u = schrift(document.querySelector('.menue-unter'));
      const g = document.querySelector('#oben svg').getBoundingClientRect(), S = typeof SEITE === 'number' ? SEITE : 1;
      const ueber = (a) => a.bottom > k.top && a.top < k.bottom; // gleiche Höhe wie die Trefferfläche
      const l = (a) => (ueber(a) ? [(g.left - a.right) / S, (k.left - a.right) / S] : null);
      return { titel: l(t), unter: l(u), rechts: (innerWidth - k.right) / S, w: k.width / S, h: k.height / S }; })()`);
    const fmt = (l) => (l ? `${l[0].toFixed(1)} px (Trefferfläche ${l[1].toFixed(1)} px)` : 'nicht auf gleicher Höhe');
    console.log(`  ${name}: Schalter ${luecke.w.toFixed(0)} × ${luecke.h.toFixed(0)}, ${luecke.rechts.toFixed(0)} px vom Rand; Titel → Globus ${fmt(luecke.titel)}; Untertitel → Globus ${fmt(luecke.unter)}`);
    pruefe((luecke.titel?.[0] ?? 1) > 0 && (luecke.unter?.[0] ?? 1) > 0, `${name}: Schalter überdeckt Titel oder Untertitel (${JSON.stringify(luecke)})`);
    if (f.phone) pruefe(luecke.w >= 44 && luecke.h >= 44, `${name}: Trefferfläche des Schalters ${luecke.w} × ${luecke.h}`);
  }
  // sichere Ränder (Handy hochkant mit Kerbe oben und Leiste unten): Liste bleibt innerhalb; dazu Randfälle mit einem
  // Schalter ganz am Rand (Ausrichtung am Anfang ganz rechts, Richtung unten ganz unten)
  const r = await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 20 } }).catch((e) => ({ error: { message: e.message } }));
  if (r.error) { console.log(`  sichere Ränder: nicht emulierbar (${r.error.message})`); return; }
  for (const name of ['hoch', 'quer']) {
    console.log(`${name}: sichere Ränder`);
    await laden(FORMATE[name]);
    if (name === 'quer') await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, bottom: 21, left: 47, right: 47 } });
    const sa = await ev(`getComputedStyle(document.querySelector('.menue-sl-schleier')).paddingTop + ' ' + getComputedStyle(document.querySelector('.menue-sl-schleier')).paddingRight`);
    console.log(`  Ränder (oben, rechts): ${sa}`);
    pruefe(sa !== '0px 0px', `${name}: sichere Ränder kommen nicht an`);
    for (const [id, richtung, ausrichtung] of [['oben', 'unten', 'ende'], ['unten', 'oben', 'start']]) {
      await ev(`__probe.listen.${id}.oeffnen()`);
      await sleep(AUS_MS);
      await lage(id, `${name} sichere Ränder ${id}`, { richtung, ausrichtung, finger: true });
      await ev(`__probe.listen.${id}.schliessen(true)`);
    }
    // Randfälle: neue Schalter ganz rechts (Ausrichtung am Anfang) und ganz unten (Richtung unten → geht nach oben auf)
    const rand = await ev(`(() => {
      const S = typeof SEITE === 'number' ? SEITE : 1, aus = [];
      for (const [stil, richtung, ausrichtung] of [['right: 0; top: 30%', 'unten', 'start'], ['left: 0; right: auto; top: auto; bottom: 0', 'unten', 'ende']]) {
        const k = document.createElement('button'); k.className = 'menue-sprache'; k.style.cssText = stil;
        k.textContent = 'XX'; document.querySelector('.menue-inhalt').append(k);
        const l = __probe.createSprachliste({ knopf: k, sprachen: [{ kuerzel: 'de', name: 'Deutsch' }, { kuerzel: 'en', name: 'English' }], aktuell: 'de', richtung, ausrichtung });
        l.oeffnen();
        const li = document.getElementById(k.getAttribute('aria-controls')), b = li.getBoundingClientRect(), kb = k.getBoundingClientRect();
        const cs = getComputedStyle(li.previousElementSibling), sa = ['Top', 'Right', 'Bottom', 'Left'].map((x) => parseFloat(cs['padding' + x]));
        aus.push({ l: b.left / S, r: b.right / S, o: b.top / S, u: b.bottom / S, W: innerWidth / S, H: innerHeight / S, sa, kO: kb.top / S, kU: kb.bottom / S });
        l.schliessen(true); li.previousElementSibling.remove(); li.remove(); k.remove();
      }
      return aus; })()`);
    for (const [i, m] of rand.entries()) {
      const [so, sr, su, sl] = m.sa;
      const ok = m.l >= sl + 7.4 && m.r <= m.W - sr - 7.4 && m.o >= so + 7.4 && m.u <= m.H - su - 7.4;
      pruefe(ok, `${name}: Randfall ${i + 1} nicht im Bild ${JSON.stringify(m)}`);
      if (i === 1) pruefe(m.u <= m.kO + 0.6, `${name}: Randfall unten geht nicht nach oben auf ${JSON.stringify(m)}`);
      console.log(`  Randfall ${i + 1}: Liste ${m.l.toFixed(0)}–${m.r.toFixed(0)} × ${m.o.toFixed(0)}–${m.u.toFixed(0)} im Bild ${m.W.toFixed(0)} × ${m.H.toFixed(0)}`);
    }
  }
  await send('Emulation.setSafeAreaInsetsOverride', { insets: {} }).catch(() => {});
}

try {
  for (const name of ['desktop', 'hoch']) {
    await zeiger(FORMATE[name], name);
    await tastatur(FORMATE[name], name);
  }
  await bewegung();
  await groessen();
} catch (e) {
  fehler.push(`Abbruch: ${e.stack ?? e}`);
  console.log(`  ABBRUCH ${e.stack ?? e}`);
}
const meldungen = chrome.logs.filter((l) => /exception|error/i.test(l));
for (const m of meldungen) pruefe(false, `Konsole: ${m}`);
await schliessen();
console.log(`\n${n} Prüfungen, ${fehler.length} Fehler`);
for (const f of fehler) console.log(`- ${f}`);
process.exit(fehler.length ? 1 : 0);
