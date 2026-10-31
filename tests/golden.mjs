// Golden-Regressionstest: hält für jedes Level aus LEVELS (Tutorial + Hauptlevel) und LEVELS_3D (Würfel-Level, seit
// .scratch/wuerfel-500/ Ticket 01) das vollständige Ergebnis der Strahlverfolgung und des Lösers fest und meldet jede
// Abweichung.
// Aufruf: node tests/golden.mjs            vergleicht mit tests/golden.json (Exit-Code 1 bei Abweichung)
//         node tests/golden.mjs --voll     vergleicht zusätzlich den Löser aller Level (vor Änderungen am Löser)
//         node tests/golden.mjs --schnell  vergleicht nur die Strahlbilder, ohne Löser (etwa 1 s, für Zwischenschritte
//                                          eines Umbaus; nach mehreren Schritten, am Schluss und immer, wenn der Löser
//                                          berührt ist, ein Lauf ohne --schnell)
//         node tests/golden.mjs --write    schreibt tests/golden.json neu (nur bei bewusster Änderung des Verhaltens
//                                          oder wenn Level dazukommen oder wegfallen)
//
// Je Level festgehalten (Logik aus index.html, Bereich LOGIC:BEGIN … LOGIC:END, geladen über tools/solver.mjs):
//   start, solved: traceBeams(createBoard(level)) in der Startstellung und mit level.solution angewendet –
//                  segments, events, hits (Map → nach Id sortierte Einträge), mixes (ebenso), satisfied
//                  (sortiert), solved, truncated.
//   solver:        solve(level) → count, nodes, leaves, near, guesses, aborted, rotatable, Lösungen; in der Referenz
//                  für alle Level
// Bis Ticket 21 hielt die Referenz für 24 Level auch die alte Wertung fest (`score` aus metrics in solver.mjs), und
// diese Einträge bestimmten, für welche Level der normale Lauf den Löser vergleicht. Beides entfällt mit der alten
// Wertung. Jetzt vergleicht der normale Lauf den Löser für eine Stichprobe aus Spiel und Vorrat (seit Ticket 08 von
// Noas Geschichte nicht mehr nach dem Platz in der Reihe): das Tutorial, je Grad der Geschichte jedes 10. Level
// (STORY_LEVELS, Platz 1, 11, …, 51, also das erste jeder Welt), jedes 10. flache Level des Vorrats (in der Folge seiner
// Datei) und jedes 10. Würfel-Level (Platz 1, 11, … unter ihnen, Spiel und Vorrat). Die Referenz hat die Löserdaten
// aller Level, also passt jede Stichprobe, auch nachdem tools/ordne-level.mjs, tools/ordne-wuerfel.mjs oder
// tools/geschichte.mjs spiel Level neu geordnet oder zwischen Spiel und Vorrat verschoben hat. Die Namen sind über
// flache und Würfel-Level eindeutig.
// Verglichen wird je Level nach Namen, gleich auf welchem Platz es steht (seit Ticket 15 ordnet tools/ordne-level.mjs
// die Level neu), Wert für Wert und exakt; nur Kommazahlen (Endpunkte, Normalen, Längen, Abstände) dürfen um höchstens
// 1e-9 abweichen, damit Rundungsreste keinen Umbau der Strahlregel blockieren (ADR 0003). Eine Gegenprobe prüft den
// Vergleich selbst.
// Laufzeit (über leise.sh, Stand Ticket 21): Strahlbilder aller Level wenige ms, Löser für alle 159 Level etwa 20–25 s
// (fast alles in den 30 schwersten Leveln). Der normale Lauf rechnet den Löser deshalb nur für die Stichprobe (etwa
// 2 s); --voll und --write rechnen ihn für alle.
// Alle Level heisst seit dem Vorrat (Spec .scratch/noa-geschichte/, Ticket 02): aus Spiel und Vorrat, über den
// gemeinsamen Lader (tools/lader.mjs), in der Folge wie nach dem Zurückholen aller; so fehlt keines in der Referenz.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { L, setRot, keyOf, solve } from '../tools/solver.mjs';
import { ALLE as SPIEL_UND_VORRAT, VORRAT } from '../tools/lader.mjs';

const { LEVELS, TUTORIAL_COUNT, LEVELS_3D } = SPIEL_UND_VORRAT;

const file = join(dirname(fileURLToPath(import.meta.url)), 'golden.json');
const write = process.argv.includes('--write');
const full = write || process.argv.includes('--voll');
const quick = process.argv.includes('--schnell');
if (quick && full) { console.error('--schnell lässt den Löser weg und passt nicht zu --voll oder --write'); process.exit(1); }

const byKey = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
const snap = (r) => ({
  segments: r.segments,
  events: r.events,
  hits: byKey(r.hits),
  mixes: byKey(r.mixes),
  satisfied: [...r.satisfied].sort((a, b) => a - b),
  solved: r.solved,
  truncated: r.truncated,
});

const golden = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
// Den Löser rechnet der normale Lauf für die Stichprobe (siehe Kopf): das Tutorial, je Grad der Geschichte jedes 10.
// Level, jedes 10. flache Level des Vorrats und jedes 10. Würfel-Level. Verglichen wird auch sie nach Namen: Ein neu
// geordnetes Level hat dieselben Strahlbilder und Löserergebnisse.
const jedesZehnte = (liste) => liste.filter((_, i) => i % 10 === 0);
const STICHPROBE = new Set([...LEVELS.slice(0, TUTORIAL_COUNT).map(l => l.name),
  ...Object.values(L.STORY_LEVELS).flatMap(welten => jedesZehnte(welten.flat())),
  ...jedesZehnte(VORRAT.flach).map(l => l.name), ...jedesZehnte(LEVELS_3D).map(l => l.name)]);
{
  const fremd = [...STICHPROBE].filter(x => !LEVELS.some(l => l.name === x) && !LEVELS_3D.some(l => l.name === x));
  if (fremd.length) { console.error(`Stichprobe: nicht in Spiel und Vorrat: ${fremd.join(', ')}`); process.exit(1); }
}
/** Alle Level, flach und im Würfel, aus Spiel und Vorrat. */
const ALLE = [...LEVELS, ...LEVELS_3D];
const inStichprobe = (level) => STICHPROBE.has(level.name);

// Strahlbilder in Start- und Lösungsstellung, gerechnet mit `logic` (L oder die veränderte Logik der Gegenprobe)
function traces(logic, level) {
  const start = logic.traceBeams(logic.createBoard(level));
  const b = logic.createBoard(level);
  for (const el of b.elements.filter(logic.isRotatable)) {
    const k = keyOf(el);
    if (level.solution && k in level.solution) setRot(el, level.solution[k]);
  }
  return { start: snap(start), solved: snap(logic.traceBeams(b)) };
}

function record(level) {
  const entry = { name: level.name, ...traces(L, level) };
  if (quick || (!full && !inStichprobe(level))) return entry;
  const s = solve(level);
  entry.solver = {
    count: s.count, nodes: s.nodes, leaves: s.leaves, near: s.near, guesses: s.guesses,
    aborted: s.aborted, rotatable: s.rotatable, solutions: s.solutions,
  };
  return entry;
}

// Kommazahlen der Segmente und Ereignisse (Endpunkte, Normalen, Längen, Abstände) dürfen um TOLERANCE abweichen,
// alles andere muss exakt stimmen: Treffer, Mischungen, „gelöst“, Art, Farbe, Element-Bezüge und der Löser. Zellen
// und Richtungen stecken in den Koordinaten; eine falsche Zelle weicht um mindestens 0,0046 ab
// (Spiegelkante gegen schräges Auslaufen über die Feldecke), also weit über der Toleranz.
const TOLERANCE = 1e-9;
const FLOAT = new Set(['x', 'y', 'z', 'x0', 'y0', 'z0', 'x1', 'y1', 'z1', 'n0', 'n1', 'normal', 'length', 'fade', 'dist',
  'dist0']);
const isObject = (v) => v !== null && typeof v === 'object';

/** Erste Abweichung von `a` (erwartet) zu `b` (jetzt) als Text mit Pfad, sonst null. */
function firstDiff(a, b, path, float = false) {
  if (isObject(a) && isObject(b) && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = firstDiff(a[k], b[k], Array.isArray(a) ? `${path}[${k}]` : `${path}.${k}`, float || FLOAT.has(k));
      if (d) return d;
    }
    return null;
  }
  const same = float && typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= TOLERANCE : a === b;
  return same ? null : `${path} erwartet ${short(JSON.stringify(a))}, jetzt ${short(JSON.stringify(b))}`;
}

/**
 * Abweichungen der Level `current` von `golden`, je Level und Teil (start, solved, solver …) die erste. Verglichen wird
 * nach Namen, nicht nach Platz: Wird die Reihenfolge geändert (Ticket 15), bleibt jedes Level nach Namen gleich.
 */
function compare(golden, current) {
  const diffs = [];
  if (golden.length !== current.length) diffs.push(`Anzahl Level: erwartet ${golden.length}, jetzt ${current.length}`);
  const nachName = new Map(golden.map(g => [g.name, g]));
  for (const g of golden) if (!current.some(c => c.name === g.name)) diffs.push(`Level "${g.name}": fehlt jetzt`);
  for (const [i, c] of current.entries()) {
    const g = nachName.get(c.name);
    const tag = `Level ${i + 1} "${c.name}"`;
    if (!g) { diffs.push(`${tag}: neu (nicht in golden.json)`); continue; }
    for (const key of new Set([...Object.keys(g), ...Object.keys(c)])) {
      const d = firstDiff(g[key], c[key], key);
      if (d) diffs.push(`${tag}: ${d}`);
    }
  }
  return diffs;
}

function short(s) { return s === undefined ? 'undefined' : s.length > 120 ? s.slice(0, 120) + '…' : s; }

const t0 = Date.now();
const current = ALLE.map(record);
const ms = Date.now() - t0;

if (write) {
  writeFileSync(file, '[\n' + current.map(e => JSON.stringify(e)).join(',\n') + '\n]\n');
  console.log(`golden.json geschrieben: ${current.length} Level (${ms} ms)`);
  process.exit(0);
}

if (!golden) { console.error('tests/golden.json fehlt – zuerst mit --write erzeugen'); process.exit(1); }
const gold = (level) => golden.find(g => g.name === level.name);
let failed = false;
const report = (ok, text) => { if (ok) console.log('  ok  ', text); else { console.error('  FAIL', text); failed = true; } };

// Die Stichprobe richtet sich nach Spiel und Vorrat; dafür braucht die Referenz die Löserdaten jedes Levels
const ohneLoeser = golden.filter(g => !g.solver).map(g => g.name);
report(!ohneLoeser.length, ohneLoeser.length ? `Referenz ohne Löserdaten: ${ohneLoeser.join(', ')} (mit --write neu)`
  : `Referenz: Löserdaten für alle ${golden.length} Level`);
report(!golden.some(g => 'score' in g), 'Referenz ohne alte Wertung (score, bis Ticket 21)');

// Gegenprobe des Vergleichs: Lenkt ein Spiegel einen Strahl, der nach Osten läuft, nach Norden statt nach Süden, muss
// das auffallen (die Logik ruft dafür reflectOnMirror auf). Auf der Kopie eines Eintrags mit Löserdaten darf eine
// Abweichung von 1e-12 in einer Normalen nicht auffallen; jede der Änderungen in `detect` dagegen schon.
{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bent = new Function(html.slice(html.indexOf('/* LOGIC:BEGIN'), html.indexOf('/* LOGIC:END')) + `
    const reflect = reflectOnMirror;
    reflectOnMirror = (dir, rot) => { const d = reflect(dir, rot); return dir === 0 && d === 2 ? 6 : d; };
    return { createBoard, traceBeams, isRotatable };`)();
  const caught = ALLE.filter(level => gold(level)
    && compare([gold(level)], [{ ...gold(level), ...traces(bent, level) }]).length).length;
  report(caught > 0, `Gegenprobe: ein Spiegel, der nach Norden statt nach Süden lenkt, fällt auf (in ${caught} Leveln)`);
  const sample = golden.find((g) => g.solver);
  const changed = (edit) => { const g = structuredClone(sample); edit(g); return compare([sample], [g]).length > 0; };
  report(!changed((g) => { g.start.segments[0].n1[0] += 1e-12; }), 'Gegenprobe: 1e-12 in einer Normalen fällt nicht auf');
  const detect = {
    '1e-6 in einer Normalen': (g) => { g.start.segments[0].n1[0] += 1e-6; },
    'solver.nodes + 1': (g) => { g.solver.nodes++; },
    '1e-12 in color': (g) => { g.start.segments[0].color += 1e-12; },
    '1e-12 in element': (g) => { g.start.events.find((e) => 'element' in e).element += 1e-12; },
  };
  const missed = Object.keys(detect).filter((name) => !changed(detect[name]));
  report(!missed.length, missed.length ? `Gegenprobe: nicht erkannt: ${missed.join(', ')}`
    : `Gegenprobe: es fallen auf: ${Object.keys(detect).join(', ')}`);
}

// Ohne --voll fehlen die Löserdaten der Level ausserhalb der Stichprobe im aktuellen Lauf und werden nicht verglichen,
// mit --schnell die aller Level
const expected = full ? golden : golden.map(g => (!quick && inStichprobe(g) ? g : { ...g, solver: undefined }));
const diffs = compare(expected, current);
for (const d of diffs) console.error('  FAIL', d);
const umgestellt = current.filter((c, i) => golden[i]?.name !== c.name).length;
if (umgestellt) {
  console.log(`  ok   ${umgestellt} Level stehen an einem anderen Platz als in golden.json, verglichen nach Namen`);
}
const scope = quick ? 'nur Strahlbilder (--schnell), ohne Löser'
  : full ? 'Löser für alle Level'
    : `Löser für die Stichprobe (${STICHPROBE.size} Level: Tutorial, Geschichte, Vorrat, Würfel), --voll für alle`;
const wuerfel = current.filter(c => LEVELS_3D.some(l => l.name === c.name)).length;
if (diffs.length) console.error(`${diffs.length} Abweichung(en) in ${current.length} Leveln (${ms} ms)`);
else console.log(`  ok   alle ${current.length} Level (davon ${wuerfel} Würfel) wie in golden.json, ${scope} (${ms} ms)`);
if (failed || diffs.length) process.exit(1);
