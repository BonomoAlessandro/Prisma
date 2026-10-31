// Bilder und Prüfung des Menü-Bausteins (Ticket 05) mit probe.html in headless Chrome. Nur über tools/leise.sh, aus
// dem Worktree:
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/bausteine/menue/aufnahme.mjs [alles|bilder|pruefen] [format]
// bilder: je Stand und Format (desktop 1440×900, hoch 390×844, quer 844×390, Gerätepixel 2 auf dem Handy) ein Bild nach
// bilder/, dazu die offene Rückfrage und der Tastaturfokus. pruefen: Regeln des Menüs, Tastatur, Rückfrage, Aktionen und
// Neuzeichnen bei Grössenänderung. Bei jedem Bild prüft die Seite die Lage: nichts ausserhalb, nichts überlappt, kein Weg
// läuft über eine Beschriftung, jeder Weg beginnt an seiner Lampe und endet am Stern. Fehler stehen am Ende; Exit-Code 1.
// Zeitrahmen: jede Anfrage an Chrome hat FRIST_MS, der ganze Lauf GESAMT_MS; danach wird Chrome geschlossen und der Lauf
// bricht ab (er hält sonst die Sperre von leise.sh). Auf dem Handy wird getippt (Input.dispatchTouchEvent): Mit der
// Touch-Emulation von emulate() kam Input.dispatchMouseEvent nie zurück, und der Lauf hing.
// Format: desktop, hoch, quer oder mehrere mit Komma (hoch,quer).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../../../../tools/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const bilder = join(here, 'bilder');
mkdirSync(bilder, { recursive: true });
const PROBE = pathToFileURL(join(here, 'probe.html')).href;

const FORMATE = {
  desktop: { width: 1440, height: 900, dpr: 1, phone: false },
  hoch: { width: 390, height: 844, dpr: 2, phone: true },
  quer: { width: 844, height: 390, dpr: 2, phone: true },
};
const STAENDE = ['neu', 'mitte', 'leicht', 'epilog', 'alle', 'bunt'];
const [modus = 'alles', nurFormat] = process.argv.slice(2);
const FRIST_MS = 20000, GESAMT_MS = 12 * 60000;
let schliessen = null; // close() des laufenden Chrome, für den Abbruch
setTimeout(async () => {
  console.error(`
Zeitrahmen von ${GESAMT_MS / 60000} min überschritten: Abbruch`);
  await Promise.race([schliessen?.(), sleep(5000)]);
  process.exit(3);
}, GESAMT_MS).unref();
/** send mit Frist: eine Anfrage, auf die Chrome nicht antwortet, bricht nach FRIST_MS mit Fehler ab statt zu hängen. */
const mitFrist = (send) => (method, params) => {
  let t;
  const frist = new Promise((_, nein) => { t = setTimeout(() => nein(new Error(`keine Antwort auf ${method} nach ${FRIST_MS / 1000} s`)), FRIST_MS); });
  return Promise.race([send(method, params), frist]).finally(() => clearTimeout(t));
};
const fehler = [];
const pruefe = (bedingung, text) => { if (!bedingung) { fehler.push(text); console.log('  FEHLER', text); } };

const TASTEN = {
  Tab: 9, Enter: 13, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35,
};
async function taste(send, key, n = 1) {
  for (let i = 0; i < n; i++) {
    const vk = TASTEN[key];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(key === 'Enter' ? { text: '\r' } : {}) });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await sleep(60);
  }
}
/** Klick (Desktop) bzw. Tippen mit dem Finger (Handy, Touch-Emulation an). */
async function klick(send, f, x, y) {
  if (f.phone) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  await sleep(150);
}
const rahmen = (send) => evaluate(send, `getComputedStyle(document.activeElement).outlineStyle !== 'none'`);
const fokus = (send) => evaluate(send, `document.activeElement?.dataset?.menueFokus ?? document.activeElement?.dataset?.menueFrage ?? document.activeElement?.tagName`);

/** Seite laden und das Menü öffnen: per Klick (ohne Fokusrahmen, wie nach «Klicken zum Starten») oder per Enter. */
async function oeffne(send, f, stand, { mit = 'klick', extra = '' } = {}) {
  await send('Page.navigate', { url: `${PROBE}?stand=${stand}&aufnahme&start${extra}` });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(send, `document.readyState === 'complete' && !!window.__probe`)) break;
    await sleep(100);
  }
  await evaluate(send, 'document.fonts.ready.then(() => true)');
  if (mit === 'taste') await taste(send, 'Enter');
  else await klick(send, f, f.width / 2, f.height / 2);
  for (let i = 0; i < 40 && !(await evaluate(send, '__probe.menu.offen')); i++) await sleep(100);
  if (!(await evaluate(send, '__probe.menu.offen'))) throw new Error(`${stand}: Menü nach ${mit} nicht offen`);
  await sleep(150);
}

/** Lage im Menü prüfen (in der Seite); Rückgabe: Liste der Probleme. */
const LAGE = `(() => {
  const root = document.getElementById('menue'), R = root.getBoundingClientRect(), W = R.width, H = R.height;
  const out = [];
  if (getComputedStyle(root).stroke !== 'none') out.push('die Wurzel vererbt einen Strich an die Kreise im SVG: ' + getComputedStyle(root).stroke);
  const rel = (el) => { const r = el.getBoundingClientRect(); return { l: r.left - R.left, t: r.top - R.top, r: r.right - R.left, b: r.bottom - R.top }; };
  const name = (el) => (el.dataset.menueFokus || el.className.baseVal || el.className).toString().split(' ')[0];
  const boxen = [...root.querySelectorAll('.menue-wahl, .menue-vonvorn, .menue-weiter:not([hidden]), .menue-titel, .menue-unter, .menue-wort')]
    .map((el) => ({ el, n: name(el), ...rel(el) }));
  for (const b of boxen) if (b.l < -0.5 || b.t < -0.5 || b.r > W + 0.5 || b.b > H + 0.5) out.push('ausserhalb: ' + b.n + ' ' + [b.l, b.t, b.r, b.b].map(Math.round));
  for (let i = 0; i < boxen.length; i++) for (let j = i + 1; j < boxen.length; j++) {
    const a = boxen[i], b = boxen[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1) out.push('überlappt: ' + a.n + ' / ' + b.n);
  }
  // Schrift ragt nicht aus ihrem Knopf
  for (const k of root.querySelectorAll('.menue-wahl, .menue-vonvorn, .menue-weiter:not([hidden])')) {
    const kb = rel(k);
    for (const t of k.querySelectorAll('.menue-name, .menue-stand, .menue-aktion, span')) {
      if (!t.getClientRects().length) continue;
      const tb = rel(t), luft = parseFloat(getComputedStyle(t).fontSize) * 0.5; // Laufweite nach dem letzten Buchstaben
      if (tb.l < kb.l - 1 || tb.r > kb.r + luft) { out.push('Schrift ragt hinaus: ' + name(k) + ' «' + t.textContent.trim() + '»'); break; }
    }
  }
  // Wege: an der Lampe beginnen, am Stern enden, über keine Beschriftung laufen («Weiter» deckt sie auf dem Desktop
  // absichtlich zu und zählt nicht)
  const stern = rel(root.querySelector('.menue-ziel .menue-stern')), S = { x: (stern.l + stern.r) / 2, y: (stern.t + stern.b) / 2 };
  const texte = boxen.filter((b) => !b.el.classList.contains('menue-weiter'));
  for (const g of root.querySelectorAll('.menue-weg')) {
    const pl = g.querySelector('.menue-grund').points;
    const pts = Array.from({ length: pl.numberOfItems }, (_, i) => pl.getItem(i)).map((p) => ({ x: p.x, y: p.y }));
    const li = root.querySelector('.menue-grad[data-grad="' + g.dataset.grad + '"]');
    const lb = rel(li.querySelector('.menue-lampe')), L = { x: (lb.l + lb.r) / 2, y: (lb.t + lb.b) / 2 };
    if (Math.hypot(pts[0].x - L.x, pts[0].y - L.y) > 1.5) out.push('Weg ' + g.dataset.grad + ' beginnt nicht an der Lampe');
    const e = pts[pts.length - 1];
    if (Math.hypot(e.x - S.x, e.y - S.y) > 1.5) out.push('Weg ' + g.dataset.grad + ' endet nicht am Stern');
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
      for (let s = 0; s <= n; s++) {
        const x = a.x + (b.x - a.x) * s / n, y = a.y + (b.y - a.y) * s / n;
        const t = texte.find((t) => x > t.l + 2 && x < t.r - 2 && y > t.t + 2 && y < t.b - 2);
        if (t) { out.push('Weg ' + g.dataset.grad + ' läuft über ' + t.n); k = pts.length; break; }
      }
    }
  }
  return out;
})()`;

/** Regeln des Stands: Weiter, Von vorn, Polarstern, Hervorhebung, Beschriftungen. */
const REGELN = `(() => {
  const root = document.getElementById('menue'), w = root.querySelector('.menue-weiter');
  return {
    weiter: w.hidden ? null : w.getAttribute('aria-label'),
    vonvorn: [...root.querySelectorAll('.menue-vonvorn')].map((b) => b.closest('.menue-grad').dataset.grad),
    sterne: [...root.querySelectorAll('.menue-stand .menue-stern')].map((b) => b.closest('.menue-grad').dataset.grad),
    hervor: [...root.querySelectorAll('li.menue-hervor')].map((b) => b.dataset.grad),
    labels: [...root.querySelectorAll('.menue-wahl')].map((b) => b.getAttribute('aria-label')),
    fokus: document.activeElement?.dataset?.menueFokus ?? null,
    lampenAn: [...root.querySelectorAll('.menue-grad')].filter((li) => getComputedStyle(li.querySelector('.menue-lampe')).backgroundColor === 'rgb(255, 255, 255)').map((li) => li.dataset.grad),
  };
})()`;

const ERWARTET = {
  neu: { weiter: null, vonvorn: [], sterne: [], hervor: [], fokus: 'wahl:leicht' },
  mitte: { weiter: 'Weiter: Mittel, Wüste, 23 von 60 Leveln gelöst', vonvorn: ['mittel'], sterne: [], hervor: [], fokus: 'weiter' },
  leicht: { weiter: 'Weiter: Mittel, Wüste, 23 von 60 Leveln gelöst', vonvorn: ['leicht', 'mittel'], sterne: ['leicht'], hervor: [], fokus: 'weiter' },
  epilog: { weiter: null, vonvorn: ['leicht'], sterne: ['leicht'], hervor: ['mittel'], fokus: 'wahl:mittel' },
  alle: { weiter: null, vonvorn: ['leicht', 'mittel', 'schwer', 'sehr schwer'], sterne: ['leicht', 'mittel', 'schwer', 'sehr schwer'], hervor: [], fokus: 'wahl:sehr schwer' },
  bunt: { weiter: 'Weiter: Schwer, Bergwald, 4 von 60 Leveln gelöst', vonvorn: ['leicht', 'mittel', 'schwer'], sterne: ['leicht'], hervor: [], fokus: 'weiter' },
};

async function bild(send, datei) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(bilder, datei), Buffer.from(shot.result.data, 'base64'));
  console.log('  ', join(bilder, datei));
}

async function lauf(format) {
  const f = FORMATE[format];
  console.log(`\n== ${format} ${f.width}×${f.height}`);
  const chrome = await startChrome({ width: f.width, height: f.height });
  const { logs, close } = chrome, send = mitFrist(chrome.send);
  schliessen = close;
  try {
    await emulate(send, f);
    if (modus !== 'pruefen') {
      for (const stand of STAENDE) {
        await oeffne(send, f, stand);
        await sleep(3200); // Einblenden und Wachsen der Wege
        const lage = await evaluate(send, LAGE);
        for (const p of lage) pruefe(false, `${format}/${stand}: ${p}`);
        const r = await evaluate(send, REGELN);
        const e = ERWARTET[stand];
        for (const k of ['weiter', 'fokus']) pruefe(r[k] === e[k], `${format}/${stand}: ${k} ${JSON.stringify(r[k])}, erwartet ${JSON.stringify(e[k])}`);
        for (const k of ['vonvorn', 'sterne', 'hervor']) pruefe(JSON.stringify(r[k]) === JSON.stringify(e[k]), `${format}/${stand}: ${k} ${JSON.stringify(r[k])}, erwartet ${JSON.stringify(e[k])}`);
        if (format === 'desktop') console.log('   ', stand, r.labels.join(' | '));
        await bild(send, `${stand}-${format}.png`);
      }
      // offene Rückfrage (Mittel, begonnen) über die Tastatur
      await oeffne(send, f, 'leicht', { mit: 'taste' });
      await taste(send, 'ArrowDown', 2);
      await taste(send, 'Tab');
      pruefe(await fokus(send) === 'vonvorn:mittel', `${format}: Tab nach Mittel erreicht «Von vorn»`);
      await taste(send, 'Enter');
      await sleep(900);
      pruefe(await fokus(send) === 'nein', `${format}: Rückfrage öffnet mit Fokus auf «Abbrechen»`);
      const box = await evaluate(send, `(() => { const r = document.querySelector('.menue-frage-box').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); })()`);
      pruefe(box[0] >= 0 && box[1] >= 0 && box[2] <= f.width && box[3] <= f.height, `${format}: Rückfrage ganz sichtbar ${box}`);
      await bild(send, `rueckfrage-${format}.png`);
      // Tastaturfokus: nach Enter, zwei Mal Pfeil nach unten → Mittel
      await oeffne(send, f, 'leicht', { mit: 'taste' });
      await sleep(3200);
      await taste(send, 'ArrowDown', 2);
      pruefe(await fokus(send) === 'wahl:mittel', `${format}: Pfeile führen von «Weiter» zu Mittel`);
      pruefe(await rahmen(send), `${format}: Fokusrahmen sichtbar`);
      await sleep(400);
      await bild(send, `fokus-${format}.png`);
    }
    if (modus !== 'bilder' && format === 'desktop') await pruefeAblauf(send, f);
    if (modus !== 'bilder' && format === 'hoch') await pruefeGroessen(send, f);
    const fl = logs.filter((l) => /\[exception\]|\[error\]|log:error/.test(l));
    pruefe(!fl.length, `${format}: Konsole ohne Fehler\n    ${fl.join('\n    ')}`);
  } catch (e) {
    pruefe(false, `${format}: Abbruch: ${e.message}`);
  } finally {
    schliessen = null;
    await Promise.race([close(), sleep(10000)]);
  }
}

/** Tastatur, Rückfrage, Aktionen (Desktop). */
async function pruefeAblauf(send, f) {
  console.log('  Ablauf');
  // Klick: kein Fokusrahmen, aber der Fokus liegt auf «Weiter»
  await oeffne(send, f, 'leicht');
  pruefe(await fokus(send) === 'weiter', 'nach Klick: Fokus auf «Weiter»');
  pruefe(!(await rahmen(send)), 'nach Klick: kein Fokusrahmen');
  // Pfeile, Home, End (mit der ersten Taste erscheint der Rahmen)
  const folge = [];
  for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Home', 'End', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
    await taste(send, k);
    folge.push(await fokus(send));
  }
  pruefe(JSON.stringify(folge) === JSON.stringify(['wahl:leicht', 'wahl:mittel', 'wahl:schwer', 'wahl:sehr schwer', 'wahl:sehr schwer', 'weiter', 'wahl:sehr schwer', 'wahl:schwer', 'wahl:mittel', 'wahl:schwer']),
    `Pfeiltasten: ${folge.join(', ')}`);
  pruefe(await rahmen(send), 'nach einer Taste: Fokusrahmen da');
  // Tab-Reihenfolge
  await taste(send, 'Home');
  const tabs = [];
  for (let i = 0; i < 6; i++) { await taste(send, 'Tab'); tabs.push(await fokus(send)); }
  pruefe(JSON.stringify(tabs) === JSON.stringify(['wahl:leicht', 'vonvorn:leicht', 'wahl:mittel', 'vonvorn:mittel', 'wahl:schwer', 'wahl:sehr schwer']), `Tab: ${tabs.join(', ')}`);
  // Rückfrage: Escape schliesst, Fokus zurück; Tab bleibt drin; Abbrechen; Bestätigen
  await taste(send, 'Home');
  await taste(send, 'ArrowDown', 2);
  await taste(send, 'Tab');
  await taste(send, 'Enter');
  await sleep(400);
  pruefe(await evaluate(send, `!document.querySelector('.menue-frage').hidden && document.querySelector('.menue-inhalt').inert`), 'Rückfrage offen, Menü dahinter inert');
  pruefe(await evaluate(send, `document.querySelector('.menue-frage-titel').textContent`) === 'Mittel von vorn beginnen?', 'Titel der Rückfrage');
  const inFrage = [];
  for (let i = 0; i < 3; i++) { await taste(send, 'Tab'); inFrage.push(await fokus(send)); }
  pruefe(JSON.stringify(inFrage) === '["ja","nein","ja"]', `Tab bleibt in der Rückfrage: ${inFrage}`);
  await taste(send, 'Escape');
  await sleep(400);
  pruefe(await evaluate(send, `document.querySelector('.menue-frage').hidden`), 'Escape schliesst die Rückfrage');
  pruefe(await fokus(send) === 'vonvorn:mittel', 'nach Escape: Fokus zurück auf «Von vorn»');
  pruefe((await evaluate(send, '__probe.log.length')) === 0, 'Escape löst keine Aktion aus');
  await taste(send, 'Enter');
  await sleep(300);
  await taste(send, 'Enter'); // Abbrechen
  await sleep(400);
  pruefe(await fokus(send) === 'vonvorn:mittel' && (await evaluate(send, '__probe.log.length')) === 0, 'Abbrechen: keine Aktion, Fokus zurück');
  await taste(send, 'Enter');
  await sleep(300);
  await taste(send, 'ArrowRight');
  pruefe(await fokus(send) === 'ja', 'Pfeil in der Rückfrage zu «Von vorn»');
  await taste(send, 'Enter');
  await sleep(500);
  pruefe(JSON.stringify(await evaluate(send, '__probe.log')) === '[{"aktion":"vonvorn","grad":"mittel"}]', 'Bestätigen meldet vonvorn mittel');
  const nach = await evaluate(send, REGELN);
  pruefe(nach.weiter === null && JSON.stringify(nach.vonvorn) === '["leicht"]', `nach «Von vorn»: Mittel neu, kein «Weiter» (${JSON.stringify(nach)})`);
  pruefe(nach.fokus === 'wahl:mittel', `nach «Von vorn»: Fokus auf Mittel (${nach.fokus})`);
  pruefe(await evaluate(send, `document.querySelector('.menue-sr').textContent`) === 'Mittel: Stand gelöscht.', 'Meldung für den Bildschirmleser');
  // Beginnen: eine Aktion, auch bei zwei Mal Enter; danach ausgeblendet
  await taste(send, 'Enter');
  await taste(send, 'Enter');
  await sleep(1100);
  pruefe(JSON.stringify(await evaluate(send, '__probe.log.slice(1)')) === '[{"aktion":"beginnen","grad":"mittel"}]', 'Beginnen genau einmal');
  pruefe(await evaluate(send, `document.getElementById('menue').hidden && !__probe.menu.offen`), 'nach der Aktion ausgeblendet (hidden)');
  // wieder zeigen: «Zum Menü» → Menü, Fokus darin
  await taste(send, 'Enter');
  await sleep(300);
  pruefe(await evaluate(send, '__probe.menu.offen') && (await fokus(send)) === 'wahl:leicht', 'erneut gezeigt, Fokus im Menü');
  // geschaffter Grad: Übersicht; ohne Übersicht: Rückfrage
  await oeffne(send, f, 'leicht');
  await evaluate(send, `document.querySelector('[data-menue-fokus="wahl:leicht"]').click()`);
  pruefe(JSON.stringify(await evaluate(send, '__probe.log')) === '[{"aktion":"uebersicht","grad":"leicht"}]', 'geschafft → Übersicht');
  await oeffne(send, f, 'leicht', { extra: '&ohne-uebersicht' });
  await evaluate(send, `document.querySelector('[data-menue-fokus="wahl:leicht"]').click()`);
  await sleep(300);
  pruefe(await evaluate(send, `!document.querySelector('.menue-frage').hidden && __probe.log.length === 0`), 'ohne Übersicht: geschafft → Rückfrage');
  pruefe((await evaluate(send, REGELN)).vonvorn.join() === 'mittel', 'ohne Übersicht: kein eigener «Von vorn» beim geschafften');
  // Weiter
  await oeffne(send, f, 'mitte');
  await taste(send, 'Enter');
  pruefe(JSON.stringify(await evaluate(send, '__probe.log')) === '[{"aktion":"weiter","grad":"mittel"}]', 'Weiter → mittel');
  // Fokus ausserhalb (Klick ins Leere): Pfeil holt ihn zurück
  await oeffne(send, f, 'mitte');
  await evaluate(send, 'document.activeElement.blur()');
  await taste(send, 'ArrowDown');
  pruefe(await fokus(send) === 'weiter', 'Pfeil holt den Fokus ins Menü zurück');
  // Daten am Rand: unbekannte Werte, Zahlen ausserhalb, Welt als Nummer
  const rand = await evaluate(send, `(() => {
    __probe.menu.show({ grade: { leicht: { stand: 'begonnen', geloest: 99 }, mittel: { stand: 'quatsch' }, schwer: { stand: 'begonnen', welt: 4, geloest: -3 } }, zuletzt: 'schwer', hervorheben: true });
    return [...document.querySelectorAll('.menue-wahl')].map((b) => b.getAttribute('aria-label'));
  })()`);
  pruefe(rand[0].includes('Sterne, 60 von 60') && rand[1].includes('noch nicht begonnen') && rand[2].includes('Planeten, 0 von 60'), `Randwerte: ${rand.join(' | ')}`);
  pruefe((await evaluate(send, REGELN)).hervor.length === 0, 'hervorheben ohne geschafften zuletzt: nichts hervorgehoben');
}

/** Neuzeichnen bei Grössenänderung, auch über die Grenze hoch / breit, und kleine Handys. */
async function pruefeGroessen(send, f) {
  console.log('  Grössen');
  await oeffne(send, f, 'bunt');
  for (const [w, h, dpr] of [[360, 640, 2], [430, 932, 3], [640, 360, 2], [1024, 768, 1], [768, 1024, 1], [390, 844, 2]]) {
    await emulate(send, { width: w, height: h, dpr, phone: w < 800 });
    await sleep(500);
    const lage = await evaluate(send, LAGE);
    for (const p of lage) pruefe(false, `${w}×${h}: ${p}`);
    if (w === 360) await bild(send, 'bunt-360x640.png');
  }
}

if (modus === 'alles' || modus === 'bilder' || modus === 'pruefen') {
  for (const format of nurFormat ? nurFormat.split(',') : Object.keys(FORMATE)) await lauf(format);
  console.log(fehler.length ? `\n${fehler.length} Fehler` : '\nalles in Ordnung');
  process.exitCode = fehler.length ? 1 : 0;
} else {
  console.log('Modus: alles | bilder | pruefen');
  process.exitCode = 2;
}
