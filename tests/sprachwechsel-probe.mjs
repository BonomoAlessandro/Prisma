// Probe für den Wechsel der Sprache ohne Neuladen (Ticket 01 von .scratch/sprachwahl/; kurz und gezielt statt eines
// Bildvergleichs, Entscheid des Nutzers 18.11.2026): Das Spiel lädt auf Deutsch, wechselt im Menü auf Englisch und
// zurück und in einigen Zuständen danach, und nach jedem Wechsel steht kein Text im Dokument mehr in der alten Sprache,
// auch kein verborgener: Text, aria-label, title, alt, placeholder, content (Beschreibung), document.title. Alt ist ein
// Text, wenn er ein Stück eines Blatts der alten Sprachdatei enthält, das in der neuen anders lautet (die Wörter je
// Gerät eingesetzt, sonst bis zum nächsten Platzhalter; nur Stücke mit mindestens drei Buchstaben, die in keinem Text
// der neuen Sprache vorkommen; als ganzes Wort gesucht). Vor jedem Wechsel findet dieselbe Suche die Texte der Sprache,
// die gleich die alte ist (Gegenprobe).
// Abläufe (je ein frisches Laden; die Sprache wechselt jedes Mal zur anderen):
//   start:   Startbildschirm (mit ?sprache=, über die Testschnittstelle): lang, Seitentitel, Manifest, Adresse ohne
//            ?sprache= (die übrigen Parameter wörtlich), gespeichert; danach Neuladen ohne und mit ?sprache=
//   menue:   Menü mit zwei begonnenen Graden, ein anderer Reiter gewählt, Klick auf den Schalter wie ein Spieler,
//            hin und zurück: Fokus bleibt auf dem Schalter, Reiter und Karte bleiben, Ansage in der neuen Sprache;
//            dann die Rückfrage «Von vorn» offen (Testschnittstelle); «Weiter» führt ins Level (Kopfzeile)
//   dorf:    neuer Spieler: Prolog auf der Bühne, Angebot, Einstieg ins Dorf (Untertitel), Übung 1 mit Band (über die
//            Testschnittstelle), Menü aus der Übung (Schalter) und zurück, «Gelöst», Übersicht aus dem Spiel
//   reise:   Ende des Bergwalds: «Gelöst» mit dem Satz der Welt, die Reise ans Meer (Untertitel der Ankunft), Epilog
// Nach jedem Wechsel ausserdem: kein Neuladen, dasselbe Brett, derselbe Himmel, keine Ladeanzeige, lang des Dokuments,
// die Sprache gespeichert, das Manifest der Sprache. Desktop 1280 × 800, Chrome stumm und deutsch (tools/chrome.mjs).
// --handy: Handy hochkant 390 × 844 mit Touch (Tippen als Berührung, Texte je Gerät; Review 18.11.2026). --von en: das
// Spiel lädt auf Englisch (Chrome englisch) und wechselt zu Deutsch und zurück.
// Aufruf: LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node
//           tests/sprachwechsel-probe.mjs [--gpu] [--handy] [--von en] [--nur start,menue,dorf,reise]
// Rückgabe 1 bei einem Fehler (alter Text, Prüfung, Konsole). Ohne Zeitmessung (leichter Lauf; auf der GPU gut 2 min).
import { startChrome, emulate, evaluate, sleep } from '../tools/chrome.mjs';
import { spielServer } from '../tools/spielserver.mjs';
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
/** Parameter der Adresse für die Sprache beim Laden (?sprache=de) */
const PARAM = 'sprache';
/** --handy: Handy hochkant mit Touch (Grösse wie im Bildvergleich), sonst Desktop mit Maus */
const view = args.includes('--handy') ? { name: 'Handy hochkant 390 × 844, Touch', width: 390, height: 844, dpr: 1,
  phone: true } : { name: 'Desktop 1280 × 800', width: 1280, height: 800, dpr: 1, phone: false };

/* ---------- Texte der alten Sprache ---------- */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (z) => '\\' + z);
/** Der Schalter der Sprache im Menü (über die Kennung des Fokus: Die Testschnittstelle liest Strings als Code) */
const SCHALTER = '#menue [data-menue-fokus="sprache"]';
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
  const gang = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n; (n = gang.nextNode());) {
    const p = n.parentElement;
    if (!p || p.closest('script, style, #perf') || !n.data.trim()) continue;
    texte.push([n.data, wo(p)]);
  }
  for (const el of document.querySelectorAll('*')) {
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
 * Wechselt die Sprache zur anderen (wie: 'debug' über die Testschnittstelle, sonst eine Funktion, die den Schalter
 * bedient) und prüft danach Dokument und Spiel. was: der Zustand, für die Meldungen.
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
    : (await wie(), null);
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
    // hin und zurück mit dem Schalter
    for (const was of ['Menü, Schalter', 'Menü, Schalter zurück']) {
      await wechsle(was, () => tippe(SCHALTER));
      const z = await s.ev(`(() => ({ fokus: document.activeElement?.classList.contains('menue-sprache'),
        gewaehlt: document.querySelector('#menue .menue-grad.menue-an')?.dataset.grad,
        text: document.querySelector('#menue .menue-sprache').textContent }))()`);
      pruefe(z.fokus, `${was}: Fokus nicht mehr auf dem Schalter`);
      pruefe(z.gewaehlt === 'mittel', `${was}: gewählter Reiter ${z.gewaehlt} statt mittel`);
      pruefe(z.text === SPRACHEN[sprache].sprache.name, `${was}: Schalter zeigt ${z.text}`);
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
    await wechsle('Menü aus der Übung, Schalter', () => tippe(SCHALTER));
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
