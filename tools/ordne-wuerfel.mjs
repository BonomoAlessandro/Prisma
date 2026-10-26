// Reihenfolge und Grade der Würfel-Level (.scratch/wuerfel-500/, Ticket 01): das Werkzeug, aus dem sie entstehen, wie
// tools/ordne-level.mjs für die flachen Level. Es beurteilt die Würfel-Level im Spiel und die Kandidaten
// (beurteilung/parallel.mjs), rechnet nach den Regeln in wuerfelliste.mjs (eine Reihenfolge ohne Bestand, Grade nach
// der Schwelle, Korrekturen der KI-Tester aus den Läufen wuerfel-…, Häufungsregel wie im Ausbau) und berichtet; mit
// --schreiben trägt es Reihenfolge und Grade in index.html ein (zwischen WUERFEL:BEGIN und WUERFEL:END).
// - Kreisschluss wie im flachen Feld: Der Grad geht in die Beurteilung ein (Füllteil und Zerfall ab „mittel“). Darum
//   rechnet es bis zum Fixpunkt: zuerst mit dem Grad aus den Leveldaten (bei einem Kandidaten dem seines Auftrags),
//   dann mit den Graden der Reihenfolge, bis sie sich nicht mehr ändern.
// - Geprüft je Level: keine Regel verletzt (verletzt in wuerfelliste.mjs; im Würfel gibt es keine Duldungsliste),
//   genau eine Lösung (die notierte), keinem anderen Würfel-Level zu ähnlich (aehnlichkeit.mjs), Name eindeutig über
//   flache und Würfel-Level und nicht von der Liste entfernter Level, ein zählendes Urteil der KI-Tester aus einem
//   Lauf wuerfel-…; für die Reihenfolge: keine Häufung der Haupt-Kernidee offen, das Mittel je 10
//   Level fällt nicht, der Grad sinkt nie.
// Aufruf: sh tools/leise.sh node tools/ordne-wuerfel.mjs [--kandidaten <datei>] [--schreiben] [--json <datei>]
//   --kandidaten: eine JSON-Liste (oder eine JSON-Zeile je Eintrag) { level, name, auftrag, seed, schwierigkeit, stand }, etwa
//                 die Ausgabe von tools/wuerfel.mjs wahl: neue Würfel-Level (level wie in LEVELS_3D), name der
//                 vergebene Name; ohne name heisst es wie bei den KI-Testern „Kandidat <Abdruck>“ (kandidatName in
//                 leveldaten.mjs). auftrag, seed, schwierigkeit (Ziel-Schwierigkeit [von, bis]) und stand (der Commit,
//                 mit dem der Pool gebaut ist) sind wahlweise und stehen als Herkunft im Kommentar des Levels, damit
//                 ausbau.mjs pool … --wuerfel es auf diesem Stand nachbaut. gesenkt (wuerfel.mjs umrechnen): um so viele
//                 Ebenen ist das Level aus dem Würfel 7 × 7 × 7 jenes Stands in den Quader gesenkt.
//   --schreiben:  ordnet die Würfel-Level in index.html und setzt ihren Grad; die Kandidaten kommen mit ihrem Namen
//                 dazu (levelCode in leveldaten.mjs). Nur wenn alle Prüfungen oben bestehen, also jeder Kandidat einen
//                 Namen und ein zählendes Urteil hat, das ihn nicht ablehnt.
//   --json:       schreibt das Ergebnis je Level nach Platz in die Datei, in der Form von ordne-level.mjs --json und
//                 mit wuerfel: true (für tools/ki-tester/prepare.mjs --kandidaten): { platz, name, schwierigkeit, formel,
//                 grad, gradNachSchwelle, kiTester, verletzt, ausschluesse, hauptKernidee, spielwert, wuerfel } und bei
//                 einem Kandidaten ohne Platz im Spiel kandidat (der Name bei den KI-Testern) und level (mit Grad).
import { readFileSync, writeFileSync } from 'node:fs';
import { L, solve, period, keyOf } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { gradVon } from './beurteilung/grad.mjs';
import { aehnlichkeit, AEHNLICH_AB } from './aehnlichkeit.mjs';
import { kandidatName, levelCode } from './leveldaten.mjs';
import {
  HAUPT_KERNIDEE_JE_10, HAUPT_KERNIDEE_JE_10_OBEN, fallendeSeiten, ladeLevelliste, zaehlendeWuerfelUrteile,
} from './levelliste.mjs';
import { WUERFEL_TEXT, istWuerfel, verletzt, wuerfelReihenfolge } from './wuerfelliste.mjs';

const INDEX = new URL('../index.html', import.meta.url);
const argument = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');
const schreiben = process.argv.includes('--schreiben'), jsonDatei = argument('--json');
const start = Date.now();

const kandidaten = argument('--kandidaten') ? ladeKandidaten(argument('--kandidaten')) : [];
const levels = [...L.LEVELS_3D, ...kandidaten.map(k => k.level)], n = levels.length;
const imSpiel = levels.map((_, i) => i < L.LEVELS_3D.length);
/** Der Name bei den KI-Testern: der des Levels, bei einem Kandidaten ohne Platz im Spiel „Kandidat <Abdruck>“. */
const kandidat = levels.map((l, i) => (imSpiel[i] ? null : kandidatName(l)));
const namen = levels.map(l => l.name || null); // ein Kandidat ohne vergebenen Namen: null
const name = (i) => namen[i] ?? kandidat[i];

// Bis zum Fixpunkt: Reihenfolge und Grade aus der Schwierigkeit und den Urteilen der KI-Tester, die Beurteilung mit
// diesen Graden
const urteile = zaehlendeWuerfelUrteile();
let grad = levels.map((l, i) => l.grad ?? kandidaten[i - L.LEVELS_3D.length]?.grad ?? null), b, r, runde = 0;
for (;;) {
  if (++runde > 5) throw new Error('Kein Fixpunkt nach 5 Durchgängen: Die Grade wechseln hin und her.');
  console.log(`Durchgang ${runde}: beurteile die ${n} Würfel-Level …`);
  b = await beurteileAlle(levels.map((level, i) => ({ level, opts: { grad: grad[i], teuer: true } })));
  r = wuerfelReihenfolge(b.map(x => x.schwierigkeit.wert), namen.map((x, i) => x ?? kandidat[i]),
    b.map(x => x.hauptKernidee.begriff), { kandidat: levels.map(kandidatName), urteile });
  if (r.grad.every((g, i) => g === grad[i])) break;
  grad = r.grad;
}
const { folge, ki } = r, werte = b.map(x => x.schwierigkeit.wert), platz = new Array(n);
folge.forEach((i, p) => { platz[i] = p + 1; });

// Die Prüfungen (siehe Kopf)
const fehler = [];
const pruefe = (text, liste) => {
  console.log(`  ${text}: ${liste.length ? liste.join(', ') : 'ja'}`);
  if (liste.length) fehler.push(text);
};
console.log(`\n${n} Würfel-Level (${L.LEVELS_3D.length} im Spiel, ${kandidaten.length} Kandidaten), `
  + `${runde} Durchgänge, ${zahl((Date.now() - start) / 1000)} s`);
console.log(`  je Grad: ${GRADE.map(g => `${g} ${folge.filter(i => r.grad[i] === g).length}`).join(', ')}`);
const regeln = levels.map((_, i) => verletzt(b[i], r.grad[i], ki.get(i)));
pruefe('keine Regel verletzt', folge.filter(i => regeln[i].length).map(i => `${name(i)} (${regeln[i].join(', ')})`));
pruefe('genau eine Lösung (die notierte)', folge.filter(i => !eindeutig(levels[i])).map(name));
const nah = [];
for (let p = 0; p < n; p++) {
  for (let q = p + 1; q < n; q++) {
    const wert = aehnlichkeit(levels[folge[p]], levels[folge[q]]);
    if (wert >= AEHNLICH_AB) nah.push(`${name(folge[p])} – ${name(folge[q])} ${zahl(wert, 2)}`);
  }
}
pruefe(`keinem anderen Würfel-Level zu ähnlich (ab ${zahl(AEHNLICH_AB, 2)})`, nah);
const flach = L.LEVELS.map(l => l.name), entfernt = ladeLevelliste().entfernteNamen ?? [];
const alleNamen = [...flach, ...namen.filter(Boolean)];
pruefe('Namen eindeutig über flache und Würfel-Level, keiner entfernt', [
  ...alleNamen.filter((x, k) => alleNamen.indexOf(x) !== k), ...namen.filter(x => entfernt.includes(x))]);
pruefe('Urteil der KI-Tester', folge.filter(i => !ki.has(i)).map(name));
const zug = ({ i, von, nach, tausch }) => `${name(i)} (${b[i].hauptKernidee.begriff}) ${tausch ? "tauscht" : "von"} Platz ${von + 1} ${tausch ? "mit" : "auf"} ${nach + 1}`;
console.log(`  Häufungsregel (höchstens ${HAUPT_KERNIDEE_JE_10}, ab „mittel“ ${HAUPT_KERNIDEE_JE_10_OBEN} je 10 Level): `
  + `${r.zuege.length ? r.zuege.map(zug).join('; ') : 'keine Züge'}`);
pruefe('keine Häufung offen', r.offen.map(h => `Seite ${h.gruppe + 1} ${h.begriff} ${h.mit.length}-mal`));
pruefe('Mittel je 10 Level fällt nicht', fallendeSeiten(folge, werte).map(k => `Seite ${k + 1}`));
pruefe('Grad sinkt nie', folge.filter((i, p) => p && GRADE.indexOf(r.grad[i]) < GRADE.indexOf(r.grad[folge[p - 1]]))
  .map(name));
console.log(`  Urteile: ${ki.size}; eigene Korrektur: ${[...ki].filter(([, u]) => u.verschiebung)
  .map(([i, u]) => `${name(i)} ${u.verschiebung > 0 ? '+' : ''}${u.verschiebung}`).join(', ') || '–'}; abgelehnt: `
  + `${[...ki].filter(([, u]) => u.abgelehnt).map(([i]) => name(i)).join(', ') || '–'}`);

console.log('\nReihenfolge:');
for (const i of folge) {
  console.log(`  ${String(platz[i]).padStart(3)}  ${name(i).padEnd(20)} ${r.grad[i].padEnd(11)} ${zahl(werte[i])
    .padStart(5)}  ${b[i].hauptKernidee.begriff ?? '–'}${regeln[i].length ? `  ! ${regeln[i].join(', ')}` : ''}`);
}

if (jsonDatei) {
  writeFileSync(jsonDatei, JSON.stringify(folge.map(i => ({
    platz: platz[i], name: name(i), schwierigkeit: werte[i], formel: r.formel[i], grad: r.grad[i],
    gradNachSchwelle: gradVon(werte[i]),
    kiTester: ki.has(i) ? { lauf: ki.get(i).eintrag.lauf, verschiebung: ki.get(i).verschiebung,
      abgelehnt: ki.get(i).abgelehnt } : null,
    verletzt: regeln[i], ausschluesse: [...new Set(b[i].ausschluesse.map(a => a.begriff))],
    hauptKernidee: b[i].hauptKernidee.begriff, spielwert: b[i].spielwert.wert,
    ...(imSpiel[i] ? {} : { kandidat: kandidat[i], level: { ...levels[i], grad: r.grad[i] } }),
    wuerfel: true,
  })), null, 1) + '\n');
  console.log(`\n${jsonDatei} geschrieben.`);
}

if (schreiben) {
  const ohneName = kandidaten.filter(k => !k.level.name);
  if (ohneName.length) fehler.push(`${ohneName.length} Kandidaten ohne Namen`);
  if (fehler.length) {
    console.error(`\nNicht geschrieben: ${fehler.join('; ')}.`);
    process.exit(1);
  }
  schreibeWuerfel();
  console.log('\nindex.html geschrieben.');
}

/** Hat das Level genau eine Lösung, die notierte (Stellungen bis auf die Periode des Elements)? */
function eindeutig(level) {
  const s = solve(level, { unique: true });
  const norm = (set) => Object.entries(set).map(([k, v]) => {
    const el = level.elements.find(e => keyOf(e) === k);
    return `${k}:${v % period(el)}`;
  }).sort().join(' ');
  return !s.aborted && s.count === 1 && norm(s.solutions[0].set) === norm(level.solution);
}

/**
 * Die Kandidaten aus der Datei (JSON-Liste oder eine JSON-Zeile je Eintrag, siehe Kopf), mit dem Namen im Level (oder
 * ohne) und dem Grad ihres Auftrags; kein Level doppelt, keines schon im Spiel, jedes ein Würfel 7 × 7 × 7.
 */
function ladeKandidaten(datei) {
  const text = readFileSync(datei, 'utf8').trim();
  const roh = text.startsWith('[') ? JSON.parse(text) : text.split('\n').filter(z => z.trim()).map(z => JSON.parse(z));
  const liste = roh.map(k => ({ ...k, level: { ...k.level, ...(k.name ? { name: k.name } : {}) },
    grad: k.auftrag ? k.auftrag.replace(/-[a-z]+$/, '') : null, seed: k.seed ?? null, schwierigkeit: k.schwierigkeit }));
  const abdruecke = new Set(L.LEVELS_3D.map(kandidatName));
  for (const k of liste) {
    const wer = k.name ?? kandidatName(k.level);
    if (!istWuerfel(k.level)) throw new Error(`${datei}: ${wer} ist kein Würfel ${WUERFEL_TEXT}`);
    if (k.grad && !GRADE.includes(k.grad)) throw new Error(`${datei}: ${wer} mit unbekanntem Auftrag ${k.auftrag}`);
    if (abdruecke.has(kandidatName(k.level))) throw new Error(`${datei}: ${wer} doppelt oder schon im Spiel`);
    abdruecke.add(kandidatName(k.level));
  }
  return liste;
}

/**
 * Ordnet die Würfel-Level in index.html zwischen WUERFEL:BEGIN und WUERFEL:END nach der Reihenfolge und setzt je Level
 * das Feld grad hinter dim und size (und height). Jedes Level steht dort als Block von „  {“ bis „  },“; sein Text bleibt sonst
 * unverändert. Die Kandidaten kommen dazu (levelCode in leveldaten.mjs, mit Herkunft im Kommentar).
 */
function schreibeWuerfel() {
  const html = readFileSync(INDEX, 'utf8'), nl = html.includes('\r\n') ? '\r\n' : '\n';
  const a = html.indexOf('/* WUERFEL:BEGIN */'), e = html.indexOf('/* WUERFEL:END */');
  if (a < 0 || e < a) throw new Error('index.html: Markierungen WUERFEL:BEGIN/END fehlen');
  const von = html.indexOf(nl, a) + nl.length, bis = html.lastIndexOf(nl, e) + nl.length;
  const NAMENSZEILE = /^( {4}name: '([^']+)', dim: 3, size: \d+(?:, height: \d+)?)(?:, grad: '[a-z ]+')?,$/;
  const bloecke = new Map();
  let block = null;
  for (const zeile of html.slice(von, bis).split(nl).slice(0, -1)) {
    if (zeile === '  {') block = [zeile];
    else if (!block) throw new Error(`index.html: Zeile ausserhalb eines Würfel-Levels: ${zeile}`);
    else block.push(zeile);
    if (zeile === '  },') {
      const m = block.map(z => z.match(NAMENSZEILE)).find(Boolean);
      if (!m) throw new Error(`index.html: Würfel-Level ohne Namenszeile: ${block.slice(0, 3).join(' ')}`);
      bloecke.set(m[2], block);
      block = null;
    }
  }
  for (const k of kandidaten) {
    // Herkunft im Kommentar, so dass ausbau.mjs pool … --wuerfel das Level nachbaut; das Ziel wie in ordne-level.mjs
    // (zielText) mit den Zahlen wie angegeben, etwa „74–86“ statt „74,0–86,0“ (Review Quader 07)
    const teile = [k.seed !== null && `Seed ${k.seed}`, k.schwierigkeit && `Ziel ${k.schwierigkeit
      .map(x => String(x).replace('.', ',')).join('–')}`, k.stand && `Stand ${k.stand}`,
      // aus dem Würfel 7 × 7 × 7 in den Quader gesenkt (wuerfel.mjs umrechnen, .scratch/wuerfel-7x7x5/)
      Number.isInteger(k.gesenkt) && `gesenkt um ${k.gesenkt}`].filter(Boolean);
    const herkunft = k.auftrag ? `Generator ${[k.auftrag, ...teile].join(', ')} · ` : '';
    const kommentar = [`${herkunft}Würfel „${r.grad[levels.indexOf(k.level)]}“`];
    bloecke.set(k.level.name, levelCode(k.level, kommentar).split('\n'));
  }
  if (bloecke.size !== n) throw new Error(`index.html: ${bloecke.size} Würfel-Level, erwartet ${n}`);
  const text = folge.map(i => bloecke.get(levels[i].name).map(z => z.replace(NAMENSZEILE, `$1, grad: '${r.grad[i]}',`))
    .join(nl)).join(nl) + nl;
  writeFileSync(INDEX, html.slice(0, von) + text + html.slice(bis));
}
