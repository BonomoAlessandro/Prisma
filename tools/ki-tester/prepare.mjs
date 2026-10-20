// Bereitet einen Lauf der KI-Tester vor: je Level das Feld als Text und Screenshots der Startstellung, dasselbe für die
// Anker, die Aufträge an beide KI-Tester (brief in protocol.mjs, aus brief.md) und lauf.json für merge.mjs. Alles liegt
// unter tests/output/ki-tester/<lauf>/ (nicht versioniert). Die KI-Tester lesen nur eingabe/ und schreiben je in ihren
// eigenen Ordner antwort-A/ bzw. antwort-B/; lauf.json (Namen, Referenzen, Plätze der Anker, Reihenfolgen) und die
// Aufträge liegen ausserhalb.
// Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--kandidaten <datei>]
//         [--anker] [--ohne-bilder] [--ohne-zwischenspeicher]
//   platz          Level zum Beurteilen, Platz in der Reihenfolge im Spiel (1–150, ohne Tutorial); ein Anker wird
//                  dabei als Anker beurteilt
//   --kandidaten   neue Level ohne Platz im Spiel (Austausch, Tickets 23–26; Läufe ersatz-…): eine JSON-Liste mit je
//                  { formel, level }, etwa die Ausgabe von tools/ordne-level.mjs --austausch … --json (dort die
//                  Einträge mit Leveldaten). formel ist der Platz, den das Level nach der Formel im Spiel bekäme; er
//                  und der Grad dort sind seine Referenz, wie levelliste.mjs (reihenfolge) sie für ein neues Level
//                  rechnet, und der Grad des Levels muss derselbe sein. Ein Kandidat heisst im Protokoll „Kandidat
//                  <Abdruck>“ (kandidatName in leveldaten.mjs), bis sein Name genehmigt ist. Seine Bilder kommen von
//                  einer Kopie von index.html mit den Kandidaten (<lauf>/seite/, ausserhalb von eingabe/, denn sie
//                  enthält die Lösungen).
//   --anker        auch alle Anker beurteilen (Probelauf)
//   --ohne-bilder  nur Texte und Aufträge (schnell, zum Durchsehen; die Screenshots brauchen leise.sh)
//   --ohne-zwischenspeicher  auch die Bilder der Anker neu aufnehmen (sie kommen danach wieder in den Zwischenspeicher)
// Die Level bekommen neutrale Kennungen (L1, L2 …, nach einer festen Mischung ihrer Namen), damit die KI-Tester ihren
// Platz nicht kennen. KI-Tester A beurteilt in einer gemischten Reihenfolge, KI-Tester B in der umgekehrten.
// Zwischenspeicher der Anker-Bilder (tests/output/ki-tester/anker-bilder/, nicht versioniert): Die Bilder eines Ankers
// werden nicht neu aufgenommen, wenn sich nichts geändert hat, was sie beeinflusst. Der Schlüssel umfasst den
// Fingerabdruck des Ablaufs, den Inhalt von index.html, vendor/ und backgrounds/ (was die Seite lädt), von shots.mjs
// und chrome.mjs, den Chrome selbst (Pfad, Grösse, Zeitstempel, Versionsordner), die Leveldaten und den Platz des
// Ankers im Spiel und seine Kennung. Eine Aufnahme ist wiederholbar byte-gleich (Ticket 05), also auch das
// gespeicherte Bild.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { L } from '../solver.mjs';
import { findChrome } from '../chrome.mjs';
import { kandidatName, seiteMitLeveln } from '../leveldaten.mjs';
import {
  VERSION, FINGERPRINT, AGENT, TESTERS, answerPath, brief, fingerprint, gradeOf, levelAt, loadAnchors, reference, today,
} from './protocol.mjs';
import { fieldText } from './field.mjs';
import { VIEWS, seitenUrl, takeShots } from './shots.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const args = process.argv.slice(2);
const mitKandidaten = args.indexOf('--kandidaten');
const kandidatenDatei = mitKandidaten < 0 ? null : args.splice(mitKandidaten, 2)[1] ?? '';
const flags = new Set(args.filter(a => a.startsWith('--')));
const [run, ...positions] = args.filter(a => !a.startsWith('--')).map(String);
const MAIN = L.LEVELS.length - L.TUTORIAL_COUNT;
const unknown = [...flags].filter(f => !['--anker', '--ohne-bilder', '--ohne-zwischenspeicher'].includes(f));
if (!run || !/^[\w-]+$/.test(run) || unknown.length || kandidatenDatei === ''
  || positions.some(p => !(Number.isInteger(+p) && +p >= 1 && +p <= MAIN))) {
  console.error('Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] '
    + `[--kandidaten <datei>] [--anker] [--ohne-bilder] [--ohne-zwischenspeicher]   (Platz 1–${MAIN})`);
  process.exit(1);
}
if (fingerprint() !== FINGERPRINT) {
  console.error('Auftrag, Anker, Schema, Glossar oder Feld eines Ankers geändert, aber keine neue Version (siehe protocol.mjs).');
  process.exit(1);
}
const dir = join(root, 'tests', 'output', 'ki-tester', run);
const input = join(dir, 'eingabe');
const slash = (p) => p.replaceAll('\\', '/');
for (const t of TESTERS) {
  if (existsSync(join(dir, answerPath(t)))) {
    console.error(`${slash(dir)} hat schon Antworten: neuer Name für den Lauf oder Antworten zuerst wegräumen.`);
    process.exit(1);
  }
}

const anchors = loadAnchors();
for (const a of anchors) {
  if (gradeOf(a.position).name !== a.grad) throw new Error(`Anker ${a.id} ${a.name} steht auf Platz ${a.position}, nicht in ${a.grad}`);
}
const byPosition = new Map(anchors.map(a => [a.position, a]));
// Die Leveldaten je Kennung: aus dem Spiel nach Platz, bei einem Kandidaten aus der Datei
const daten = new Map();
const level = (position, id, anchor = null, kandidat = null) => {
  daten.set(id, kandidat ?? levelAt(position));
  return {
    id, name: kandidat ? kandidatName(kandidat) : levelAt(position).name, position, grad: gradeOf(position).name,
    anker: anchor, referenz: reference(position), ...(kandidat ? { kandidat: true } : {}),
  };
};
const kandidaten = kandidatenDatei ? ladeKandidaten(kandidatenDatei) : [];
const hash = (s) => createHash('sha256').update(s).digest('hex');
const others = [
  ...[...new Set(positions.map(Number))].filter(p => !byPosition.has(p)).map(p => ({ p, name: levelAt(p).name })),
  ...kandidaten.map(x => ({ p: x.formel, name: kandidatName(x.level), kandidat: x.level })),
].sort((a, b) => hash(a.name).localeCompare(hash(b.name)));
const judged = [
  ...anchors.filter(a => flags.has('--anker') || positions.map(Number).includes(a.position)).map(a => level(a.position, a.id, a.id)),
  ...others.map((o, k) => level(o.p, `L${k + 1}`, null, o.kandidat ?? null)),
];
if (!judged.length) { console.error('Keine Level zum Beurteilen: Plätze angeben oder --anker.'); process.exit(1); }
const orderA = judged.map(l => l.id).sort((a, b) => hash(run + a).localeCompare(hash(run + b)));
const order = { A: orderA, B: [...orderA].reverse() };

// Eingaben: Feld als Text, Bilder, Schema; je KI-Tester ein leerer Antwortordner
mkdirSync(join(input, 'bilder'), { recursive: true });
for (const t of TESTERS) mkdirSync(dirname(join(dir, answerPath(t))), { recursive: true });
const all = [...anchors.map(a => level(a.position, a.id, a.id)), ...judged.filter(l => !l.anker)];
for (const l of all) writeFileSync(join(input, `${l.id}.md`), fieldText(daten.get(l.id), l.id));
copyFileSync(join(here, 'answer.schema.json'), join(input, 'answer.schema.json'));
// Die Kandidaten stehen für die Bilder am Ende von LEVELS in einer Kopie von index.html (ausserhalb von eingabe/)
const imSpiel = all.filter(l => !l.kandidat), neu = all.filter(l => l.kandidat);
const seite = join(dir, 'seite', 'index.html');
if (neu.length) {
  mkdirSync(dirname(seite), { recursive: true });
  writeFileSync(seite, seiteMitLeveln(readFileSync(join(root, 'index.html'), 'utf8'), neu.map(l => daten.get(l.id)),
    pathToFileURL(root).href + '/'));
}
let seconds = null, reused = [];
if (!flags.has('--ohne-bilder')) {
  const shots = imSpiel.map(l => ({
    l, index: L.LEVELS.indexOf(levelAt(l.position)), label: l.id, file: join(input, 'bilder', l.id),
  }));
  // Zwischenspeicher der Anker-Bilder (siehe Kopf): je Anker und Bildschirm eine Datei <Schlüssel>-<Bildschirm>.png
  const cache = join(root, 'tests', 'output', 'ki-tester', 'anker-bilder');
  const environment = environmentHash();
  const cached = (s, view) => join(cache, `${hash(JSON.stringify({
    ablauf: FINGERPRINT, umgebung: environment, index: s.index, level: levelAt(s.l.position), kennung: s.label,
  })).slice(0, 32)}-${view.name}.png`);
  const fromCache = flags.has('--ohne-zwischenspeicher') ? []
    : shots.filter(s => s.l.anker && VIEWS.every(v => existsSync(cached(s, v))));
  for (const s of fromCache) for (const v of VIEWS) copyFileSync(cached(s, v), `${s.file}-${v.name}.png`);
  const fresh = shots.filter(s => !fromCache.includes(s));
  if (fresh.length) seconds = await takeShots(fresh.map(({ index, label, file }) => ({ index, label, file })));
  mkdirSync(cache, { recursive: true });
  for (const s of fresh.filter(x => x.l.anker)) {
    for (const v of VIEWS) copyFileSync(`${s.file}-${v.name}.png`, cached(s, v));
  }
  reused = fromCache.map(s => s.label);
  if (neu.length) {
    const mehr = await takeShots(neu.map((l, j) => ({ index: L.LEVELS.length + j, label: l.id,
      file: join(input, 'bilder', l.id) })), console.log, seitenUrl(seite));
    seconds = Object.fromEntries(VIEWS.map(v => [v.name, [...(seconds?.[v.name] ?? []), ...mehr[v.name]]]));
  }
}

// Aufträge und lauf.json
for (const t of TESTERS) {
  writeFileSync(join(dir, `auftrag-${t}.md`), brief({
    tester: t, lauf: run, eingabe: slash(input), ausgabe: slash(join(dir, answerPath(t))), anchors,
    levels: order[t].map(id => judged.find(l => l.id === id)),
  }));
}
writeFileSync(join(dir, 'lauf.json'), JSON.stringify({
  lauf: run, ablauf: VERSION, fingerabdruck: FINGERPRINT, agent: AGENT, erstellt: today(),
  referenz: 'Reihenfolge im Spiel', anker: Object.fromEntries(anchors.map(a => [a.id, a.position])), level: judged,
  reihenfolge: order, ankerBilderAusZwischenspeicher: reused,
}, null, 2) + '\n');

console.log(`Lauf ${run} vorbereitet in ${slash(dir)}`);
for (const l of judged) {
  const art = l.kandidat ? ', Kandidat' : '';
  console.log(`  ${l.id.padEnd(4)} ${String(l.position).padStart(3)} ${l.name} (${l.grad}${art})`);
}
if (reused.length) console.log(`  Bilder der Anker aus dem Zwischenspeicher: ${reused.join(', ')}`);
if (seconds) {
  for (const [view, list] of Object.entries(seconds)) {
    console.log(`  Screenshots ${view}: ${list.length} Level, ${(list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)} s je Aufnahme`);
  }
}
console.log(`Aufträge: ${TESTERS.map(t => slash(join(dir, `auftrag-${t}.md`))).join(', ')}`);
console.log(`Antworten: ${TESTERS.map(t => slash(join(dir, answerPath(t)))).join(', ')}`);

/**
 * Die Kandidaten aus der Datei (siehe Kopf): je Eintrag mit Leveldaten { formel, level }. Der Grad des Levels muss der
 * Grad seines Platzes im Spiel sein, und kein Kandidat darf doppelt vorkommen.
 */
function ladeKandidaten(datei) {
  const text = readFileSync(datei, 'utf8').trim();
  const liste = (text.startsWith('[') ? JSON.parse(text)
    : text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l))).filter(x => x.level);
  if (!liste.length) throw new Error(`${datei}: keine Einträge mit Leveldaten`);
  for (const x of liste) {
    const wo = `${datei}: ${kandidatName(x.level)}`;
    if (!(Number.isInteger(x.formel) && x.formel >= 1 && x.formel <= MAIN)) {
      throw new Error(`${wo}: Platz der Formel (formel) 1–${MAIN} nötig`);
    }
    if (x.level.grad !== gradeOf(x.formel).name) {
      throw new Error(`${wo}: Grad ${x.level.grad}, auf Platz ${x.formel} gilt ${gradeOf(x.formel).name}`);
    }
    const gleich = liste.filter(y => kandidatName(y.level) === kandidatName(x.level));
    if (gleich.length > 1) throw new Error(`${wo}: doppelt`);
  }
  return liste;
}

/**
 * Fingerabdruck dessen, was ausser dem Level ein Bild beeinflusst: die Dateien, die die Seite lädt, das Werkzeug der
 * Aufnahme und der Chrome, der sie macht.
 */
function environmentHash() {
  const h = createHash('sha256');
  const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).sort().flatMap(f => walk(join(p, f))) : [p]);
  for (const p of ['index.html', 'vendor', 'backgrounds', 'tools/ki-tester/shots.mjs', 'tools/chrome.mjs']) {
    for (const f of walk(join(root, p))) h.update(slash(relative(root, f))).update(readFileSync(f));
  }
  const chrome = findChrome();
  if (chrome) {
    const { size, mtimeMs } = statSync(chrome);
    const versions = readdirSync(dirname(chrome)).filter(d => /^\d+(\.\d+){3}$/.test(d)).sort();
    h.update(JSON.stringify({ chrome, size, mtimeMs, versions }));
  }
  return h.digest('hex');
}
