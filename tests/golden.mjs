// Golden-Regressionstest: hält für jedes Level aus LEVELS (Tutorial + Hauptlevel) das vollständige
// Ergebnis der Strahlverfolgung und des Lösers fest und meldet jede Abweichung.
// Aufruf: node tests/golden.mjs            vergleicht mit tests/golden.json (Exit-Code 1 bei Abweichung)
//         node tests/golden.mjs --voll     vergleicht zusätzlich den Löser aller Level (vor Änderungen am Löser)
//         node tests/golden.mjs --schnell  vergleicht nur die Strahlbilder, ohne Löser und alte Wertung (etwa 1 s,
//                                          für Zwischenschritte eines Umbaus; nach mehreren Schritten, am Schluss und
//                                          immer, wenn der Löser berührt ist, ein Lauf ohne --schnell)
//         node tests/golden.mjs --write    schreibt tests/golden.json neu (nur bei bewusster Änderung des Verhaltens)
//
// Je Level festgehalten (Logik aus index.html, Bereich LOGIC:BEGIN … LOGIC:END, geladen über tools/solver.mjs):
//   start, solved: traceBeams(createBoard(level)) in der Startstellung und mit level.solution angewendet –
//                  segments, events, hits (Map → nach Id sortierte Einträge), mixes (ebenso), satisfied
//                  (sortiert), solved, truncated.
//   solver:        solve(level) → count, nodes, leaves, near, guesses, aborted, rotatable, Lösungen
//   score:         alte Wertung (`score`) aus metrics(level), nur für die Tutorial-Level und jedes 10. Hauptlevel
//                  (1, 11, …, 141), weil sie den Löser ein zweites Mal rechnet
// Verglichen wird Wert für Wert und exakt; nur Kommazahlen (Endpunkte, Normalen, Längen, Abstände) dürfen um
// höchstens 1e-9 abweichen, damit Rundungsreste keinen Umbau der Strahlregel blockieren (ADR 0003). Eine
// Gegenprobe prüft den Vergleich selbst.
// Laufzeit (gemessen über leise.sh, Stand nach Ticket 03): Strahlbilder aller Level wenige ms, Löser für alle 159 Level
// etwa 35 s (fast alles in den Leveln 121–150), alte Wertung (`score`) für die 24 Level etwa 10 s. Der normale Lauf
// rechnet den Löser deshalb nur für dieselben 24 Level (etwa 12 s); --voll und --write rechnen ihn für alle (knapp
// 1 min).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { L, setRot, keyOf, solve, metrics } from '../tools/solver.mjs';

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

const withScore = (i) => i < L.TUTORIAL_COUNT || (i - L.TUTORIAL_COUNT) % 10 === 0;

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

function record(level, index) {
  const entry = { name: level.name, ...traces(L, level) };
  if (quick || (!full && !withScore(index))) return entry;
  const s = solve(level);
  entry.solver = {
    count: s.count, nodes: s.nodes, leaves: s.leaves, near: s.near, guesses: s.guesses,
    aborted: s.aborted, rotatable: s.rotatable, solutions: s.solutions,
  };
  if (withScore(index)) entry.score = metrics(level).score;
  return entry;
}

// Kommazahlen der Segmente und Ereignisse (Endpunkte, Normalen, Längen, Abstände) dürfen um TOLERANCE abweichen,
// alles andere muss exakt stimmen: Treffer, Mischungen, „gelöst“, Art, Farbe, Element-Bezüge, Löser und alte Wertung
// (`score`). Zellen und Richtungen stecken in den Koordinaten; eine falsche Zelle weicht um mindestens 0,0046 ab
// (Spiegelkante gegen schräges Auslaufen über die Feldecke), also weit über der Toleranz.
const TOLERANCE = 1e-9;
const FLOAT = new Set(['x', 'z', 'x0', 'z0', 'x1', 'z1', 'n0', 'n1', 'normal', 'length', 'fade', 'dist', 'dist0']);
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

/** Abweichungen der Level `current` von `golden`, je Level und Teil (name, start, solved, solver …) die erste. */
function compare(golden, current) {
  const diffs = [];
  if (golden.length !== current.length) diffs.push(`Anzahl Level: erwartet ${golden.length}, jetzt ${current.length}`);
  for (let i = 0; i < Math.max(golden.length, current.length); i++) {
    const g = golden[i], c = current[i];
    const tag = `Level ${i + 1} "${(c || g).name}"`;
    if (!g || !c) { diffs.push(`${tag}: ${g ? 'fehlt jetzt' : 'neu (nicht in golden.json)'}`); continue; }
    for (const key of new Set([...Object.keys(g), ...Object.keys(c)])) {
      const d = firstDiff(g[key], c[key], key);
      if (d) diffs.push(`${tag}: ${d}`);
    }
  }
  return diffs;
}

function short(s) { return s === undefined ? 'undefined' : s.length > 120 ? s.slice(0, 120) + '…' : s; }

const t0 = Date.now();
const current = L.LEVELS.map(record);
const ms = Date.now() - t0;

if (write) {
  writeFileSync(file, '[\n' + current.map(e => JSON.stringify(e)).join(',\n') + '\n]\n');
  console.log(`golden.json geschrieben: ${current.length} Level (${ms} ms)`);
  process.exit(0);
}

if (!existsSync(file)) { console.error('tests/golden.json fehlt – zuerst mit --write erzeugen'); process.exit(1); }
const golden = JSON.parse(readFileSync(file, 'utf8'));
let failed = false;
const report = (ok, text) => { if (ok) console.log('  ok  ', text); else { console.error('  FAIL', text); failed = true; } };

// Gegenprobe des Vergleichs: Lenkt ein Spiegel einen Strahl, der nach Osten läuft, nach Norden statt nach Süden, muss
// das auffallen (die Logik ruft dafür reflectOnMirror auf). Auf der Kopie eines Eintrags mit Löserdaten darf eine
// Abweichung von 1e-12 in einer Normalen nicht auffallen; jede der Änderungen in `detect` dagegen schon.
{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bent = new Function(html.slice(html.indexOf('/* LOGIC:BEGIN'), html.indexOf('/* LOGIC:END')) + `
    const reflect = reflectOnMirror;
    reflectOnMirror = (dir, rot) => { const d = reflect(dir, rot); return dir === 0 && d === 2 ? 6 : d; };
    return { createBoard, traceBeams, isRotatable };`)();
  const caught = L.LEVELS.filter((level, i) => golden[i]
    && compare([golden[i]], [{ ...golden[i], ...traces(bent, level) }]).length).length;
  report(caught > 0, `Gegenprobe: ein Spiegel, der nach Norden statt nach Süden lenkt, fällt auf (in ${caught} Leveln)`);
  const sample = golden.find((g) => 'score' in g);
  const changed = (edit) => { const g = structuredClone(sample); edit(g); return compare([sample], [g]).length > 0; };
  report(!changed((g) => { g.start.segments[0].n1[0] += 1e-12; }), 'Gegenprobe: 1e-12 in einer Normalen fällt nicht auf');
  const detect = {
    '1e-6 in einer Normalen': (g) => { g.start.segments[0].n1[0] += 1e-6; },
    'solver.nodes + 1': (g) => { g.solver.nodes++; },
    'alte Wertung (score) + 0,1': (g) => { g.score += 0.1; },
    '1e-12 in color': (g) => { g.start.segments[0].color += 1e-12; },
    '1e-12 in element': (g) => { g.start.events.find((e) => 'element' in e).element += 1e-12; },
  };
  const missed = Object.keys(detect).filter((name) => !changed(detect[name]));
  report(!missed.length, missed.length ? `Gegenprobe: nicht erkannt: ${missed.join(', ')}`
    : `Gegenprobe: es fallen auf: ${Object.keys(detect).join(', ')}`);
}

// Ohne --voll fehlen die Löserdaten der übrigen Level im aktuellen Lauf und werden nicht verglichen, mit --schnell
// fehlen Löserdaten und alte Wertung aller Level
const expected = full ? golden : golden.map((g, i) => (quick ? { ...g, solver: undefined, score: undefined }
  : withScore(i) ? g : { ...g, solver: undefined }));
const diffs = compare(expected, current);
for (const d of diffs) console.error('  FAIL', d);
const scope = quick ? 'nur Strahlbilder (--schnell), ohne Löser und alte Wertung'
  : full ? 'Löser für alle Level' : 'Löser für die Level mit alter Wertung (score), --voll für alle';
if (diffs.length) console.error(`${diffs.length} Abweichung(en) in ${current.length} Leveln (${ms} ms)`);
else console.log(`  ok   alle ${current.length} Level wie in golden.json, ${scope} (${ms} ms)`);
if (failed || diffs.length) process.exit(1);
