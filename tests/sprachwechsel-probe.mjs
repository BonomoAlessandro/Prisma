// Probe für den Wechsel der Sprache ohne Neuladen (Ticket 01 von .scratch/sprachwahl/; kurz und gezielt statt eines
// Bildvergleichs, Entscheid des Nutzers 18.11.2026): Das Spiel lädt auf Deutsch, wechselt im Menü auf Englisch und
// zurück und in einigen Zuständen danach, und nach jedem Wechsel steht kein Text im Dokument mehr in der alten Sprache,
// auch kein verborgener: Text, aria-label, title, alt, placeholder, content (Beschreibung), document.title. Alt ist ein
// Text, wenn er ein Stück eines Blatts der alten Sprachdatei enthält, das in der neuen anders lautet (die Wörter je
// Gerät eingesetzt, sonst bis zum nächsten Platzhalter; nur Stücke mit mindestens drei Buchstaben, die in keinem Text
// der neuen Sprache vorkommen; als ganzes Wort gesucht). Vor jedem Wechsel findet dieselbe Suche die Texte der Sprache,
// die gleich die alte ist (Gegenprobe). Ausgenommen sind Texte in einem Element mit eigenem lang: die Namen der
// Sprachen in der Liste am Schalter, je in ihr selbst.
// Abläufe (je ein frisches Laden; die Sprache wechselt jedes Mal zur anderen):
//   start:   Startbildschirm (mit ?sprache=, über die Testschnittstelle): lang, Seitentitel, Manifest, Adresse ohne
//            ?sprache= (die übrigen Parameter wörtlich), gespeichert; danach Neuladen ohne und mit ?sprache=
//   menue:   Menü mit zwei begonnenen Graden, ein anderer Reiter gewählt, wie ein Spieler den Schalter antippen und in
//            der Liste die andere Sprache, hin und zurück: Fokus bleibt auf dem Schalter, Reiter und Karte bleiben,
//            Ansage in der neuen Sprache; dann die Rückfrage «Von vorn» offen (Testschnittstelle); «Weiter» führt ins
//            Level (Kopfzeile)
//   liste:   die Liste am Schalter (Ticket 02 von .scratch/sprachwahl/) im echten Menü: Schalter (auf dem Desktop der
//            volle Name, auf dem Handy das Kürzel, ▾, aria-label mit Name und Kürzel), Antippen öffnet (Fokus auf der
//            aktuellen, Häkchen, Lage im Bild unter dem Schalter, Trefferflächen auf dem Handy), Antippen ausserhalb
//            (Reiter, Knopf) schliesst, ohne darunter etwas auszulösen, erneutes Antippen schliesst, die aktuelle
//            wählen schliesst nur, Esc schliesst nur die Liste (das Menü bleibt offen), Tastatur (Enter, Pfeile, Pos1,
//            Ende, Tab; ein Wechsel mit Enter), ein Wechsel mit dem Zeiger, «Von vorn» schliesst die Liste, das Menü
//            blendet mit offener Liste aus (Testschnittstelle)
//   dorf:    neuer Spieler: Prolog auf der Bühne, Angebot, Einstieg ins Dorf (Untertitel), Übung 1 mit Band (über die
//            Testschnittstelle), Menü aus der Übung (Schalter und Liste) und zurück, «Gelöst», Übersicht aus dem Spiel
//   reise:   Ende des Bergwalds: «Gelöst» mit dem Satz der Welt, die Reise ans Meer (Untertitel der Ankunft), Epilog
// Nach jedem Wechsel ausserdem: kein Neuladen, dasselbe Brett, derselbe Himmel, keine Ladeanzeige, lang des Dokuments,
// die Sprache gespeichert, das Manifest der Sprache. Desktop 1280 × 800, Chrome stumm und deutsch (tools/chrome.mjs).
// --handy: Handy hochkant 390 × 844 mit Touch (Tippen als Berührung, Texte je Gerät; Review 18.11.2026). --von en: das
// Spiel lädt auf Englisch (Chrome englisch) und wechselt zu Deutsch und zurück. --bilder: Aufnahmen der offenen Liste
// nach tests/output/sprachwechsel/ (<desktop|handy>-liste-<zeiger|tastatur>.png).
// Aufruf: LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node
//           tests/sprachwechsel-probe.mjs [--gpu] [--handy] [--von en] [--bilder] [--nur start,menue,liste,dorf,reise]
// Rückgabe 1 bei einem Fehler (alter Text, Prüfung, Konsole). Ohne Zeitmessung (leichter Lauf; auf der GPU knapp 3 min).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { root, spielServer } from '../tools/spielserver.mjs';
import { sprachen } from '../tools/texte.mjs';
import { blaetter, uebersetzer } from '../src/texte/uebersetzung.js';

const args = process.argv.slice(2);
const wert = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const GPU = args.includes('--gpu') || process.env.GPU === '1';
const SPRACHEN = sprachen();
/** Sprache beim Laden (--von, Vorgabe Deutsch; auch die des Geräts) und die andere, zu der gewechselt wird */
const VON = wert('--von') ?? 'de', NACH = VON === 'de' ? 'en' : 'de';
if (!SPRACHEN[VON] || !SPRACHEN[NACH]) {
  console.error(`Aufruf: --von ${VON}: keine Sprachdatei (vorhanden: ${Object.keys(SPRACHEN).join(', ')})`);
  process.exit(2);
}
const NUR = wert('--nur')?.split(',') ?? null;
const BILDER = args.includes('--bilder') ? join(root, 'tests', 'output', 'sprachwechsel') : null;
/** Parameter der Adresse für die Sprache beim Laden (?sprache=de) */
const PARAM = 'sprache';
/** --handy: Handy hochkant mit Touch (Grösse wie im Bildvergleich), sonst Desktop mit Maus */
const view = args.includes('--handy') ? { name: 'Handy hochkant 390 × 844, Touch', width: 390, height: 844, dpr: 1,
  phone: true } : { name: 'Desktop 1280 × 800', width: 1280, height: 800, dpr: 1, phone: false };

/* ---------- Texte der alten Sprache ---------- */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (z) => '\\' + z);
/** Der Schalter der Sprache im Menü (über die Kennung des Fokus: Die Testschnittstelle liest Strings als Code) */
const SCHALTER = '#menue [data-menue-fokus="sprache"]';
/** Der Eintrag der Sprache k in der Liste am Schalter (jeder Name steht mit lang in seiner Sprache). */
const EINTRAG = (k) => `#menue [role="menuitemradio"][lang="${k}"]`;
/** Die Sprachen in der Reihenfolge der Liste (Deutsch zuerst, wie VORHANDEN in src/texte/sprache.js). */
const REIHE = Object.keys(SPRACHEN).sort((a, b) => (b === 'de') - (a === 'de') || a.localeCompare(b));
/** Was der Schalter zu k zeigt: auf dem Handy (hochkant und quer) das Kürzel, sonst den vollen Namen. */
const schalterText = (k) => (view.phone ? k.toUpperCase() : SPRACHEN[k].sprache.name);
/** aria-label des Schalters und Name der Liste in der Sprache k (menue.sprache mit Name und Kürzel, menue.sprachliste). */
const schalterLabel = (k) => uebersetzer(SPRACHEN, k)('menue.sprache',
  { sprache: SPRACHEN[k].sprache.name, kuerzel: k.toUpperCase() });
const listenName = (k) => uebersetzer(SPRACHEN, k)('menue.sprachliste');
/** Alle Texte einer Sprache je Gerät (Wörter je Gerät eingesetzt, Werte als {name}): Map «touch|Schlüssel» → Text. */
function texteVon(k) {
  const aus = new Map();
  for (const touch of [true, false]) {
    const t = uebersetzer(SPRACHEN, k, touch);
    for (const [s, w] of blaetter(SPRACHEN[k])) {
      if (!s.startsWith('geraet.')) aus.set(`${touch}|${s}`, s.startsWith('titel.') ? w : t(s)); // Titel: nicht über t
    }
  }
  return aus;
}
/**
 * Stücke der alten Sprache, die nach einem Wechsel zu neu nicht mehr im Dokument stehen dürfen ({ stueck, schluessel }).
 * Aus jedem Blatt, das in der neuen Sprache anders lautet, die Teile zwischen Platzhaltern mit mindestens drei
 * Buchstaben; ohne Stücke, die (als Wort) auch in einem Text der neuen Sprache stehen.
 */
function alteStuecke(alt, neu) {
  const neuTexte = texteVon(neu), alle = [...neuTexte.values()];
  const inNeu = (stueck) => {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(stueck)}(?![\\p{L}\\p{N}])`, 'u');
    return alle.some((x) => re.test(x));
  };
  const stuecke = new Map();
  for (const [k, x] of texteVon(alt)) {
    const s = k.slice(k.indexOf('|') + 1);
    if (x === neuTexte.get(k)) continue;
    for (const teil of x.split(/\{[^{}]+\}/).map((y) => y.trim())) {
      if ((teil.match(/\p{L}/gu) ?? []).length < 3 || stuecke.has(teil) || inNeu(teil)) continue;
      stuecke.set(teil, s);
    }
  }
  return [...stuecke].map(([stueck, schluessel]) => ({ stueck, schluessel }));
}
const STUECKE = { [VON]: alteStuecke(VON, NACH), [NACH]: alteStuecke(NACH, VON) };
/** Erwartete Ansage im Menü nach dem Wechsel zu k (menue.spracheGewechselt). */
const ansage = (k) => uebersetzer(SPRACHEN, k)('menue.spracheGewechselt', { sprache: SPRACHEN[k].sprache.name });

/* ---------- Seite ---------- */

const D = 'window.__prismaDebug';
const spiel = await spielServer();
const fehler = [];
const pruefe = (ok, text) => { if (!ok) { fehler.push(`${ablauf}: ${text}`); console.log(`  FEHLER ${text}`); } };
let s = null, ablauf = '', sprache = VON;

async function sitzung() {
  const chrome = await startChrome({ ...view, gpu: GPU, hochleistung: GPU, sprache: VON });
  const send = (m, p) => Promise.race([chrome.send(m, p),
    sleep(120000).then(() => { throw new Error(`keine Antwort auf ${m}`); })]);
  await emulate(send, view);
  return { chrome, send, ev: (e) => evaluate(send, e), logs: chrome.logs };
}
async function until(expr, was, sekunden = 180) {
  for (let i = 0; i < sekunden * 5; i++) {
    if (await s.ev(expr).catch(() => false)) return;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${was}`);
}
/** Die Seite frisch laden (query), mit diesem Stand im localStorage (Schlüssel → Wert; Objekte als JSON). */
async function laden(query, stand = {}) {
  const url = spiel.seite(query);
  await s.send('Page.navigate', { url: new URL('favicon.svg', url).href });
  await until('document.readyState === "complete"', 'Seite für den Stand');
  const setzen = Object.entries(stand).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, `
    + `${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join(' ');
  await s.ev(`localStorage.clear(); ${setzen} window.__vorher = true`);
  await s.send('Page.navigate', { url });
  await until('!window.__vorher && window.__prisma?.ticks > 2', 'Seite geladen');
  sprache = await s.ev('document.documentElement.lang');
}
const klick = (sel) => s.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) throw new Error('fehlt: ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);
/**
 * Wie ein Spieler: Maus (Desktop) bzw. Finger (Handy: Input.dispatchTouchEvent, Mausereignisse kommen mit der
 * Touch-Emulation nie zurück, wie in tests/geschichte-probe.mjs) auf die Mitte von sel.
 */
async function tippe(sel) {
  const [x, y] = await s.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  if (view.phone) {
    await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  for (const type of ['mousePressed', 'mouseReleased']) {
    await s.send('Input.dispatchMouseEvent',
      { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  }
}
const TASTEN = { Tab: 9, Enter: 13, Escape: 27, End: 35, Home: 36, ArrowUp: 38, ArrowDown: 40 };
/** Eine Taste drücken und loslassen wie auf der Tastatur (Enter mit Zeichen: Chrome löst den Klick eines Knopfs aus). */
async function taste(key) {
  const vk = TASTEN[key], text = key === 'Enter' ? '\r' : undefined;
  const basis = { key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  await s.send('Input.dispatchKeyEvent',
    { type: text ? 'keyDown' : 'rawKeyDown', ...basis, ...(text ? { text, unmodifiedText: text } : {}) });
  await s.send('Input.dispatchKeyEvent', { type: 'keyUp', ...basis });
  await sleep(120);
}

/* ---------- Liste am Schalter (Ticket 02 von .scratch/sprachwahl/) ---------- */

/** In der Seite: k der Schalter, l seine Liste (aria-controls). */
const HOLE = `const k = document.querySelector(${JSON.stringify(SCHALTER)}),
  l = k && document.getElementById(k.getAttribute('aria-controls'));`;
/** Zustand von Schalter, Liste und Menü. fokus: 'schalter', das Kürzel eines Eintrags oder was sonst den Fokus hat. */
const LISTE = () => s.ev(`(() => { ${HOLE}
  const a = document.activeElement, cs = a && a !== document.body ? getComputedStyle(a) : null;
  return {
    text: [...k.querySelectorAll('.menue-sl-voll, .menue-sl-kurz')].filter((e) => getComputedStyle(e).display !== 'none')
      .map((e) => e.textContent).join('|'),
    aria: k.getAttribute('aria-label'), haspopup: k.getAttribute('aria-haspopup'), expanded: k.getAttribute('aria-expanded'),
    pfeil: !!k.querySelector('svg.menue-sl-pfeil path'),
    rolle: l?.getAttribute('role') ?? null, name: l?.getAttribute('aria-label') ?? null,
    eintraege: l ? [...l.children].map((e) => [e.getAttribute('role'), e.lang, e.textContent.trim()].join(':')).join('|') : '',
    geprueft: l ? [...l.querySelectorAll('[aria-checked="true"]')].map((e) => e.lang).join() : '',
    sichtbar: !!l && !l.hidden, deckend: !!l && !l.hidden && getComputedStyle(l).opacity === '1',
    fokus: a === k ? 'schalter' : a?.getAttribute('role') === 'menuitemradio' ? a.lang
      : a?.dataset?.menueFokus ?? a?.dataset?.menueFrage ?? a?.tagName ?? null,
    rahmen: !!cs && (cs.boxShadow !== 'none' || cs.outlineStyle !== 'none'),
    menue: ${D}.menu.offen && !document.getElementById('menue').hidden,
    reiter: document.querySelector('#menue .menue-grad.menue-an')?.dataset.grad ?? null,
    frage: !document.querySelector('#menue .menue-frage').hidden,
    lang: document.documentElement.lang, gespeichert: localStorage.getItem('prisma.sprache'),
  }; })()`);
const listeDa = `(() => { ${HOLE} return !!l && !l.hidden && getComputedStyle(l).opacity === '1'; })()`;
const AUS_MS = 400; // die Liste blendet in 300 ms aus
/** Wie ein Spieler: den Schalter antippen, warten, bis die Liste da ist, dann die Sprache k darin antippen. */
async function waehle(k) {
  await tippe(SCHALTER);
  await until(listeDa, 'Liste am Schalter offen', 5);
  await tippe(EINTRAG(k));
}
/**
 * Lage der offenen Liste (Pixel des Layouts, ohne Massstab): ganz im Bild mit 8 px Rand, unter dem Schalter, rechts an
 * seiner Kante; auf dem Handy Einträge von mindestens 44 px Höhe; was sie vom Menü verdeckt (nur gemeldet).
 */
async function liegtRichtig(was) {
  const m = await s.ev(`(() => { ${HOLE}
    const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, o: b.top, u: b.bottom }; };
    const L = r(l), ueber = (b) => b.l < L.r && b.r > L.l && b.o < L.u && b.u > L.o;
    const teile = ['.menue-titel', '.menue-unter', '.menue-grad', '.menue-weiter', '.menue-vonvorn:not([hidden])'];
    const deckt = teile.filter((sel) => [...document.querySelectorAll('#menue ' + sel)].some((el) => ueber(r(el))));
    return { W: innerWidth, H: innerHeight, k: r(k), l: L, e: [...l.children].map((e) => r(e).u - r(e).o), deckt }; })()`);
  const eps = 0.6, rechts = Math.min(m.k.r, m.W - 8);
  pruefe(m.l.l >= 8 - eps && m.l.r <= m.W - 8 + eps && m.l.o >= 8 - eps && m.l.u <= m.H - 8 + eps,
    `${was}: Liste nicht ganz im Bild (${JSON.stringify(m.l)}, Bild ${m.W} × ${m.H})`);
  pruefe(m.l.o >= m.k.u - eps, `${was}: Liste nicht unter dem Schalter (${m.l.o.toFixed(1)} < ${m.k.u.toFixed(1)})`);
  pruefe(Math.abs(m.l.r - rechts) < 1, `${was}: rechte Kante der Liste ${m.l.r.toFixed(1)} statt ${rechts.toFixed(1)}`);
  if (view.phone) pruefe(Math.min(...m.e) >= 44, `${was}: Trefferfläche ${Math.min(...m.e).toFixed(1)} px < 44 px`);
  console.log(`  ${was}: Liste ${(m.l.r - m.l.l).toFixed(0)} × ${(m.l.u - m.l.o).toFixed(0)} bei ${m.l.l.toFixed(0)}, `
    + `${m.l.o.toFixed(0)} (Schalter ${m.k.l.toFixed(0)}–${m.k.r.toFixed(0)} × ${m.k.o.toFixed(0)}–${m.k.u.toFixed(0)}); `
    + `Einträge ${m.e.map((h) => h.toFixed(0)).join(', ')} px; verdeckt ${m.deckt.join(', ') || 'nichts'}`);
}
/** Aufnahme nach tests/output/sprachwechsel/ (nur mit --bilder). */
async function bild(name) {
  if (!BILDER) return;
  mkdirSync(BILDER, { recursive: true });
  const r = await s.send('Page.captureScreenshot', { format: 'png' });
  const datei = join(BILDER, `${view.phone ? 'handy' : 'desktop'}-${name}.png`);
  writeFileSync(datei, Buffer.from(r.result.data, 'base64'));
  console.log(`  Bild ${datei}`);
}

/**
 * In der Seite: Texte des Dokuments mit einem Stück der alten Sprache, als ganzes Wort (die Ränder nur, wo das Stück mit
 * einem Buchstaben beginnt bzw. endet). Zurück [{ stueck, schluessel, wo, text }].
 */
const ALT_IM_DOKUMENT = (stuecke) => `(() => {
  const stuecke = ${JSON.stringify(stuecke)}, buchstabe = /[\\p{L}\\p{N}]/u, funde = [];
  const wo = (el) => {
    const teile = [];
    for (let e = el; e && e !== document.documentElement && teile.length < 4; e = e.parentElement) {
      teile.unshift(e.id ? '#' + e.id : e.tagName.toLowerCase() + [...e.classList].map((c) => '.' + c).join(''));
    }
    return teile.join(' > ');
  };
  const texte = [];
  // ein Element mit eigenem lang steht bewusst in dieser Sprache (die Namen in der Liste der Sprachen)
  const eigen = (el) => el.closest('[lang]') !== document.documentElement;
  const gang = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n; (n = gang.nextNode());) {
    const p = n.parentElement;
    if (!p || p.closest('script, style, #perf') || !n.data.trim() || eigen(p)) continue;
    texte.push([n.data, wo(p)]);
  }
  for (const el of document.querySelectorAll('*')) {
    if (eigen(el)) continue;
    for (const a of ['aria-label', 'title', 'alt', 'placeholder', 'content']) {
      const v = el.getAttribute(a);
      if (v) texte.push([v, wo(el) + '[' + a + ']']);
    }
  }
  texte.push([document.title, 'document.title']);
  for (const [text, ort] of texte) {
    for (const { stueck, schluessel } of stuecke) {
      for (let i = text.indexOf(stueck); i >= 0; i = text.indexOf(stueck, i + 1)) {
        const vor = text[i - 1] ?? '', nach = text[i + stueck.length] ?? '';
        const b = (x) => buchstabe.test(x), imWort = b(stueck[0]) && b(vor) || b(stueck.at(-1)) && b(nach);
        if (imWort) continue;
        funde.push({ stueck, schluessel, wo: ort, text: text.slice(0, 120) });
        break;
      }
    }
  }
  return funde;
})()`;

/** Kein Text der alten Sprache alt im Dokument (siehe Kopf); was: der Zustand, für die Meldung. */
async function keinAlterText(alt, was) {
  const funde = await s.ev(ALT_IM_DOKUMENT(STUECKE[alt]));
  pruefe(!funde.length, `${was}: ${funde.length} Text(e) noch auf ${alt}: `
    + funde.slice(0, 8).map((f) => `«${f.stueck}» (${f.schluessel}) in ${f.wo}: «${f.text}»`).join('; '));
  if (!funde.length) console.log(`  ok   ${was}: kein Text mehr auf ${alt}`);
}
/** Was ein Wechsel nicht ändern darf: Seite (kein Neuladen), Brett, Himmel, Ladeanzeige (ab hier beobachtet). */
const VORHER = `(() => { const D = ${D};
  window.__seite ??= Math.random(); window.__brett = D.game.board; window.__himmel = D.skyTheme.current;
  window.__lade = false;
  window.__ladeBeobachter?.disconnect();
  window.__ladeBeobachter = new MutationObserver(() => {
    if (document.getElementById('lade').classList.contains('an')) window.__lade = true;
  });
  window.__ladeBeobachter.observe(document.getElementById('lade'), { attributes: true, attributeFilter: ['class'] });
  return window.__seite; })()`;

/**
 * Wechselt die Sprache zur anderen (wie: 'debug' über die Testschnittstelle, sonst eine Funktion, die mit der neuen
 * Sprache Schalter und Liste bedient) und prüft danach Dokument und Spiel. was: der Zustand, für die Meldungen.
 */
async function wechsle(was, wie = 'debug') {
  const alt = sprache, neu = alt === VON ? NACH : VON;
  // Gegenprobe: Vor dem Wechsel findet die Suche die Texte der Sprache, die gleich die alte ist
  const gegen = (await s.ev(ALT_IM_DOKUMENT(STUECKE[alt]))).length;
  pruefe(gegen > 0, `${was}: Gegenprobe, vor dem Wechsel kein Text auf ${alt} gefunden`);
  const seite = await s.ev(VORHER);
  const ladeVorher = await s.ev(`document.getElementById('lade').classList.contains('an')`);
  const ms = wie === 'debug'
    ? await s.ev(`(() => { const t0 = performance.now(); ${D}.sprache(${JSON.stringify(neu)});
      return performance.now() - t0; })()`)
    : (await wie(neu), null);
  await until(`document.documentElement.lang === ${JSON.stringify(neu)}`, `${was}: lang ${neu}`, 10);
  sprache = neu;
  await sleep(1000); // was danach noch käme (Ladeanzeige nach 0,4 s, Bilder)
  const z = await s.ev(`(() => { const D = ${D};
    return { seite: window.__seite, brett: window.__brett === D.game.board,
      himmel: D.skyTheme.current === window.__himmel,
      lade: window.__lade, gespeichert: localStorage.getItem('prisma.sprache'),
      manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? null }; })()`);
  pruefe(z.seite === seite, `${was}: die Seite wurde neu geladen`);
  pruefe(z.brett, `${was}: das Brett ist ein anderes`);
  pruefe(z.himmel, `${was}: der Himmel ist ein anderer`);
  pruefe(ladeVorher || !z.lade, `${was}: die Ladeanzeige kam`);
  pruefe(z.gespeichert === neu, `${was}: gespeichert ${z.gespeichert} statt ${neu}`);
  pruefe(z.manifest === null || z.manifest === (neu === 'de' ? 'manifest.webmanifest' : `manifest-${neu}.webmanifest`),
    `${was}: Manifest ${z.manifest}`);
  const dauer = ms !== null ? ` (${ms.toFixed(1)} ms)` : '';
  console.log(`  ${alt} → ${neu}: ${was}${dauer}; vorher ${gegen} Texte auf ${alt}`);
  await keinAlterText(alt, was);
  return neu;
}

/* ---------- Abläufe ---------- */

const GRAD = 'leicht';
const STATIONEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne'];
let reise = null; // die Level des Grads je Welt (STORY_LEVELS)
function standBis(platz, welt, mehr = {}) {
  return { 'prisma.noa.zuletzt': GRAD, [`prisma.noa.${GRAD}`]: { platz, geloest: reise.flat().slice(0, platz),
    gesehen: ['prolog', 'angebot', ...STATIONEN.slice(0, welt + 1)], geschafft: false, ...mehr } };
}
const levelSteht = (platz) => `window.__prisma.playing() && window.__prisma.skyReady() && ${D}.story.gaze === 0
  && !${D}.story.running && ${D}.story.tweens.length === 0 && ${D}.story.step === ${platz}`;
const buehneWartet = `${D}.story.waitTap !== null && document.getElementById('story').dataset.mode === 'scene'`;
const untertitelHaelt = `${D}.story.halt === true && ${D}.story.waitTap !== null
  && document.getElementById('story').dataset.mode === 'caption'`;
/** Tippen, bis expr gilt (Untertitel und Bühne warten auf Tippen). */
async function tippeBis(expr, was, sekunden = 180) {
  for (let i = 0; i < sekunden; i++) {
    if (await s.ev(expr)) return;
    if (await s.ev(`${D}.story.waitTap !== null`)) await s.ev(`${D}.story.tap(); true`);
    await sleep(1000);
  }
  throw new Error(`Zeitüberschreitung: ${was}`);
}

const ABLAEUFE = {
  async start() {
    await laden(`${PARAM}=${VON}&noadapt&x=1`);
    await until(`${D}.ui.canStart && document.getElementById('intro').classList.contains('ready')`, 'Startbildschirm');
    pruefe(sprache === VON, `geladen auf ${sprache} statt ${VON}`);
    await wechsle('Startbildschirm');
    const adresse = await s.ev('location.search');
    pruefe(adresse === '?noadapt&x=1', `Adresse nach dem Wechsel: ${adresse} (ohne den Parameter der Sprache, sonst wörtlich)`);
    pruefe(await s.ev('document.title') === SPRACHEN[NACH].seite.titel, 'Seitentitel');
    // Wahl beim Laden: gespeicherte Sprache vor der des Geräts; ?sprache= vor der gespeicherten, ohne sie zu ändern
    await s.send('Page.navigate', { url: spiel.seite('noadapt') });
    await until('window.__prisma?.ticks > 2', 'neu geladen');
    pruefe(await s.ev('document.documentElement.lang') === NACH, 'nach Neuladen: die gespeicherte Sprache');
    await s.send('Page.navigate', { url: spiel.seite(`noadapt&${PARAM}=${VON}`) });
    await until('window.__prisma?.ticks > 2', 'mit dem Parameter der Sprache geladen');
    const nachher = await s.ev(`[document.documentElement.lang, localStorage.getItem('prisma.sprache')].join()`);
    pruefe(nachher === `${VON},${NACH}`,
      'der Parameter der Sprache gilt und wird nicht gespeichert');
  },

  async menue() {
    const platz = reise.slice(0, 3).flat().length - 1, stand = standBis(platz, 2);
    stand['prisma.noa.mittel'] = { platz: 2, geloest: [], gesehen: ['prolog', 'angebot', 'wald'], geschafft: false };
    await laden('nointro', stand);
    await until(`window.__prisma.skyReady() && ${D}.menu.offen`, 'Menü');
    await sleep(1500);
    await tippe('#menue .menue-grad[data-grad="mittel"] .menue-wahl');
    const karte = `document.querySelector('#menue .menue-sternkarte').innerHTML.replace(/>[^<]*</g, '><')`;
    const vorher = await s.ev(karte);
    // hin und zurück mit dem Schalter und der Liste
    for (const was of ['Menü, Schalter und Liste', 'Menü, Schalter und Liste zurück']) {
      await wechsle(was, waehle);
      const z = await LISTE();
      pruefe(z.fokus === 'schalter', `${was}: Fokus nicht mehr auf dem Schalter (${z.fokus})`);
      pruefe(z.reiter === 'mittel', `${was}: gewählter Reiter ${z.reiter} statt mittel`);
      pruefe(z.text === schalterText(sprache) && z.aria === schalterLabel(sprache),
        `${was}: Schalter zeigt ${z.text} (${z.aria})`);
      pruefe(z.expanded === 'false' && z.geprueft === sprache, `${was}: Liste ${z.expanded}, Häkchen bei ${z.geprueft}`);
      pruefe(await s.ev(karte) === vorher, `${was}: die Karte hat sich verändert (ausser den Namen)`);
      await until(`document.querySelector('#menue .menue-sr').textContent === ${JSON.stringify(ansage(sprache))}`,
        `${was}: Ansage «${ansage(sprache)}»`, 5).catch((e) => pruefe(false, e.message));
    }
    // offene Rückfrage «Von vorn» (der Schalter ist dann nicht bedienbar: über die Testschnittstelle)
    await klick('#menue .menue-vonvorn:not([hidden])');
    await until(`!document.querySelector('#menue .menue-frage').hidden`, 'Rückfrage');
    await wechsle('Menü mit Rückfrage');
    pruefe(await s.ev(`document.activeElement?.dataset.menueFrage === 'nein'`), 'Fokus in der Rückfrage verloren');
    await klick('#menue [data-menue-frage="nein"]');
    // «Weiter» (Leicht): ins Level, Kopfzeile in der Sprache
    await klick('#menue .menue-grad[data-grad="leicht"] .menue-wahl');
    await klick('#menue .menue-weiter');
    await tippeBis(levelSteht(platz), 'Level nach «Weiter»');
    await keinAlterText(sprache === VON ? NACH : VON, 'Level nach dem Menü');
  },

  async liste() {
    const platz = reise.slice(0, 3).flat().length - 1, stand = standBis(platz, 2);
    stand['prisma.noa.mittel'] = { platz: 2, geloest: [], gesehen: ['prolog', 'angebot', 'wald'], geschafft: false };
    await laden('nointro', stand);
    await until(`window.__prisma.skyReady() && ${D}.menu.offen`, 'Menü');
    // ins Level und mit Esc zurück ins Menü: Esc führt von dort zurück ins Spiel (story.back), ausser die Liste ist offen
    await klick('#menue .menue-weiter');
    await tippeBis(levelSteht(platz), 'Level nach «Weiter»');
    await taste('Escape');
    await until(`${D}.menu.offen`, 'Menü aus dem Level', 10);
    await sleep(1500);
    await tippe('#menue .menue-grad[data-grad="mittel"] .menue-wahl');
    const n = REIHE.length, zeig = (z) => JSON.stringify(z);
    let z = await LISTE();
    const gespeichert = z.gespeichert;
    // zu: Globus, Sprache (Desktop der volle Name, Handy das Kürzel), ▾; aria-label mit Name und Kürzel; die Liste
    pruefe(z.text === schalterText(sprache) && z.aria === schalterLabel(sprache) && z.pfeil, `Schalter: ${zeig(z)}`);
    pruefe(z.haspopup === 'menu' && z.expanded === 'false' && !z.sichtbar, `Schalter zu: ${zeig(z)}`);
    pruefe(z.rolle === 'menu' && z.name === listenName(sprache)
      && z.eintraege === REIHE.map((k) => ['menuitemradio', k, SPRACHEN[k].sprache.name].join(':')).join('|'),
    `Liste: ${zeig(z)}`);
    console.log(`  Schalter «${z.text}» (${z.aria}), Liste «${z.name}»: ${z.eintraege}`);

    // Antippen öffnet: Fokus auf der aktuellen, Häkchen, ohne Fokusrahmen (Zeiger); Lage
    await tippe(SCHALTER);
    await until(listeDa, 'Liste eingeblendet', 5);
    z = await LISTE();
    pruefe(z.expanded === 'true' && z.fokus === sprache && z.geprueft === sprache && !z.rahmen && z.menue,
      `Antippen öffnet: ${zeig(z)}`);
    await liegtRichtig('offen');
    await bild('liste-zeiger');
    // Antippen ausserhalb (ein anderer Reiter, der Knopf) schliesst, ohne darunter etwas auszulösen
    for (const [sel, was] of [['#menue .menue-grad[data-grad="leicht"] .menue-wahl', 'Reiter «leicht»'],
      ['#menue .menue-weiter', 'Knopf']]) {
      if (!(await LISTE()).sichtbar) { await tippe(SCHALTER); await until(listeDa, 'Liste offen', 5); }
      await tippe(sel);
      await sleep(AUS_MS);
      z = await LISTE();
      pruefe(z.expanded === 'false' && !z.sichtbar && z.fokus === 'schalter' && z.menue && z.reiter === 'mittel',
        `Antippen ausserhalb (${was}): ${zeig(z)}`);
    }
    // erneutes Antippen des Schalters schliesst
    await tippe(SCHALTER);
    await until(listeDa, 'Liste offen', 5);
    await tippe(SCHALTER);
    await sleep(AUS_MS);
    z = await LISTE();
    pruefe(z.expanded === 'false' && !z.sichtbar && z.fokus === 'schalter', `erneutes Antippen: ${zeig(z)}`);
    // die aktuelle wählen schliesst nur (kein Wechsel, nichts gespeichert)
    await waehle(sprache);
    await sleep(AUS_MS);
    z = await LISTE();
    pruefe(z.expanded === 'false' && !z.sichtbar && z.fokus === 'schalter' && z.lang === sprache
      && z.gespeichert === gespeichert, `die aktuelle wählen: ${zeig(z)}`);
    // Esc schliesst nur die Liste, das Menü bleibt offen (ohne Liste führte Esc zurück ins Spiel, Gegenprobe unten)
    await tippe(SCHALTER);
    await until(listeDa, 'Liste offen', 5);
    await taste('Escape');
    await sleep(1000);
    z = await LISTE();
    pruefe(z.expanded === 'false' && !z.sichtbar && z.fokus === 'schalter' && z.menue, `Esc: ${zeig(z)}`);

    // Tastatur: Enter öffnet (Fokus auf der aktuellen, mit Rahmen), Pfeile mit Umlauf, Ende, Pos1; Tab schliesst;
    // Pfeil runter am Schalter öffnet; die Tasten des Menüs greifen nicht hinein (der Fokus bleibt in der Liste)
    await taste('Enter');
    await until(listeDa, 'Liste mit Enter', 5);
    z = await LISTE();
    pruefe(z.expanded === 'true' && z.fokus === sprache && z.rahmen, `Enter öffnet: ${zeig(z)}`);
    await bild('liste-tastatur');
    const i = REIHE.indexOf(sprache);
    for (const [k, soll] of [['ArrowDown', REIHE[(i + 1) % n]], ['ArrowUp', sprache], ['End', REIHE[n - 1]],
      ['Home', REIHE[0]]]) {
      await taste(k);
      z = await LISTE();
      pruefe(z.fokus === soll && z.expanded === 'true' && z.menue, `${k} in der Liste: Fokus auf ${z.fokus} statt ${soll}`);
    }
    await taste('Tab');
    z = await LISTE();
    pruefe(z.expanded === 'false' && z.fokus === 'schalter' && z.menue, `Tab schliesst: ${zeig(z)}`);
    await sleep(AUS_MS);
    await taste('ArrowDown');
    z = await LISTE();
    pruefe(z.expanded === 'true' && z.fokus === sprache, `Pfeil runter am Schalter öffnet: ${zeig(z)}`);
    await taste('Escape');
    await sleep(AUS_MS);
    /** Nach einem Wechsel: Fokus auf dem Schalter, er und die Liste in der neuen Sprache, Ansage, Reiter bleibt. */
    const nachWechsel = async (was) => {
      const y = await LISTE();
      pruefe(y.fokus === 'schalter' && y.expanded === 'false' && y.text === schalterText(sprache)
        && y.aria === schalterLabel(sprache) && y.name === listenName(sprache) && y.geprueft === sprache && y.menue
        && y.reiter === 'mittel', `${was}: ${zeig(y)}`);
      await until(`document.querySelector('#menue .menue-sr').textContent === ${JSON.stringify(ansage(sprache))}`,
        `${was}: Ansage «${ansage(sprache)}»`, 5).catch((e) => pruefe(false, e.message));
    };
    // ein Wechsel mit der Tastatur (Enter, Pfeil runter bis zur neuen, Enter), zurück mit dem Zeiger
    await wechsle('Menü, Liste mit der Tastatur', async (neu) => {
      await taste('Enter');
      await until(listeDa, 'Liste mit Enter', 5);
      for (let j = 0; j < n && (await LISTE()).fokus !== neu; j++) await taste('ArrowDown');
      await taste('Enter');
    });
    await nachWechsel('Menü, Liste mit der Tastatur');
    await sleep(AUS_MS);
    await wechsle('Menü, Liste mit dem Zeiger', waehle);
    await nachWechsel('Menü, Liste mit dem Zeiger');
    await sleep(AUS_MS);

    // «Von vorn» öffnet die Rückfrage: Die Liste geht sofort zu (nie beide zugleich). Durch den Schleier ist der Knopf
    // nicht zu erreichen, darum über das DOM.
    await tippe(SCHALTER);
    await until(listeDa, 'Liste offen', 5);
    await klick('#menue .menue-vonvorn:not([hidden])');
    z = await LISTE();
    pruefe(!z.sichtbar && z.expanded === 'false' && z.frage && z.fokus === 'nein', `«Von vorn» mit offener Liste: ${zeig(z)}`);
    await klick('#menue [data-menue-frage="nein"]');
    await sleep(AUS_MS);
    // Gegenprobe zu Esc: ohne offene Liste führt Esc zurück ins Spiel
    await taste('Escape');
    await until(`!${D}.menu.offen`, 'Esc ohne Liste: zurück ins Spiel', 5).catch((e) => pruefe(false, e.message));
    await tippeBis(levelSteht(platz), 'zurück im Level');
    await taste('Escape');
    await until(`${D}.menu.offen`, 'wieder im Menü', 10);
    await sleep(1200);

    // das Menü blendet mit offener Liste aus (Testschnittstelle; ein Spieler erreicht mit offener Liste nur sie): die
    // Liste ist sofort weg, der Fokus nicht mehr im Menü; danach öffnet das Menü mit geschlossener Liste
    await tippe(SCHALTER);
    await until(listeDa, 'Liste offen', 5);
    await s.ev(`${D}.menu.hide(); true`);
    z = await LISTE();
    pruefe(!z.sichtbar && z.expanded === 'false' && z.fokus === 'BODY', `Menü blendet mit offener Liste aus: ${zeig(z)}`);
    await sleep(1000);
    await s.ev(`${D}.menu.show(${D}.story.menuStand()); true`);
    await sleep(1000);
    z = await LISTE();
    pruefe(z.menue && !z.sichtbar && z.expanded === 'false', `Menü wieder offen: ${zeig(z)}`);
    await tippe(SCHALTER);
    await until(listeDa, 'Liste nach dem Ausblenden', 5).catch((e) => pruefe(false, e.message));
    await taste('Escape');
    z = await LISTE();
    pruefe(z.expanded === 'false' && z.menue && z.fokus === 'schalter', `danach Esc: ${zeig(z)}`);
  },

  async dorf() {
    await laden('nointro');
    await until(`${D}.menu.offen`, 'Menü');
    await klick('#menue .menue-weiter');
    await until(buehneWartet, 'Prolog');
    await sleep(1500);
    await wechsle('Prolog auf der Bühne');
    await klick('#story .scene .skip');
    await until(`document.querySelectorAll('#story .scene .actions.angebot button').length === 2`, 'Angebot');
    await sleep(1500);
    await wechsle('Angebot');
    await klick('#story .scene .actions.angebot button:nth-child(1)'); // «Üben»
    await until(untertitelHaelt, 'Einstieg ins Dorf');
    await wechsle('Einstieg ins Dorf (Untertitel)');
    await tippeBis(`${levelSteht(0)} && ${D}.story.inDorf && ${D}.fuehrung.los`, 'Übung 1');
    await sleep(1500);
    await wechsle('Übung 1 mit Band');
    await tippe('#btn-menu');
    await until(`${D}.menu.offen`, 'Menü aus der Übung');
    await sleep(1200);
    await wechsle('Menü aus der Übung, Schalter und Liste', waehle);
    await klick('#menue .menue-weiter'); // zurück in dieselbe Übung
    await until(`${levelSteht(0)} && !${D}.menu.offen && !document.getElementById('hud').classList.contains('hidden')`,
      'zurück in der Übung');
    await keinAlterText(sprache === VON ? NACH : VON, 'zurück in der Übung (Kopfzeile, Band)');
    await s.ev(`${D}.loese(); true`);
    await until('window.__prisma.solvedPanel()', 'Übung 1 gelöst');
    await wechsle('«Gelöst» nach Übung 1');
    await tippe('#btn-overview');
    await until(`${D}.uebersicht.offen`, 'Übersicht');
    await sleep(1200);
    const vorher = await s.ev(`document.activeElement?.className ?? ''`);
    await wechsle('Übersicht aus dem Spiel');
    pruefe(await s.ev(`document.activeElement?.className ?? ''`) === vorher, 'Fokus in der Übersicht verloren');
    await klick('#uebersicht .ueb-schliessen');
    await until(`!${D}.uebersicht.offen && window.__prisma.solvedPanel()`, 'zurück aus der Übersicht');
    await sleep(1000);
    await keinAlterText(sprache === VON ? NACH : VON, 'zurück aus der Übersicht («Gelöst»)');
  },

  async reise() {
    const platz = reise[0].length - 1;
    await laden('nointro', standBis(platz, 0));
    await until(`window.__prisma.skyReady() && ${D}.menu.offen`, 'Menü');
    await klick('#menue .menue-weiter');
    await tippeBis(levelSteht(platz), 'letztes Level im Bergwald');
    await s.ev(`${D}.loese(); true`);
    await until('window.__prisma.solvedPanel()', 'gelöst');
    await wechsle('«Gelöst» am Ende des Bergwalds');
    await klick('#btn-next');
    await until(untertitelHaelt, 'Reise: Untertitel der Ankunft', 240);
    await wechsle('Reise ans Meer (Untertitel der Ankunft)');
    await tippeBis(levelSteht(platz + 1), 'erstes Level am Meer');
    await s.ev(`${D}.story.ending(); true`);
    await until(buehneWartet, 'Epilog');
    await sleep(1500);
    await wechsle('Epilog auf der Bühne');
  },
};

/* ---------- Lauf ---------- */

const t0 = Date.now();
console.log(`Sprachwechsel ${VON} ⇄ ${NACH}, ${view.name}, ${GPU ? 'GPU' : 'SwiftShader'};`
  + ` ${STUECKE[VON].length} Stücke auf ${VON}, ${STUECKE[NACH].length} auf ${NACH}`);
for (const [name, fn] of Object.entries(ABLAEUFE)) {
  if (NUR && !NUR.includes(name)) continue;
  ablauf = name;
  console.log(name);
  s = await sitzung();
  try {
    if (!reise) {
      await s.send('Page.navigate', { url: spiel.seite('nointro') });
      await until('window.__prisma?.ticks > 2', 'Spiel startet');
      reise = await s.ev(`${D}.STORY_LEVELS[${JSON.stringify(GRAD)}]`);
    }
    const vorher = s.logs.length;
    try { await fn(); } catch (e) { pruefe(false, e.message); }
    const schlimm = s.logs.slice(vorher).filter((l) => !/GPU stall|swiftshader|WebGL-|Automatic fallback/i.test(l))
      .filter((l) => /\[exception\]|\[error\]|\[log:error\]/.test(l));
    pruefe(!schlimm.length, `Konsole:\n      ${schlimm.join('\n      ')}`);
  } finally { await s.chrome.close(); }
}
await spiel.close();
console.log(`\n${Math.round((Date.now() - t0) / 1000)} s`);
for (const f of fehler) console.log(`FEHLER ${f}`);
console.log(fehler.length ? 'ROT' : 'GRÜN');
process.exit(fehler.length ? 1 : 0);
