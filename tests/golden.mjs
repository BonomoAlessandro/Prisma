// Golden-Regressionstest: hält für jedes Level aus LEVELS (Tutorial + Hauptlevel) das vollständige
// Ergebnis der Strahlverfolgung fest und meldet jede Abweichung.
// Aufruf: node tests/golden.mjs            vergleicht mit tests/golden.json (Exit-Code 1 bei Abweichung)
//         node tests/golden.mjs --write    schreibt tests/golden.json neu
//
// Je Level festgehalten (Logik aus index.html, Bereich LOGIC:BEGIN … LOGIC:END, geladen über tools/solver.mjs):
//   start, solved: traceBeams(createBoard(level)) in der Startstellung und mit level.solution angewendet –
//                  segments, events, hits (Map → nach Id sortierte Einträge), mixes (ebenso), satisfied
//                  (sortiert), solved, truncated. Zahlen exakt: verglichen werden die JSON-Texte.
//   solver:        solve(level) → count, nodes, leaves, near, guesses, aborted, rotatable, Lösungen
//   score:         metrics(level).score
// Löser und metrics laufen nur für die Tutorial-Level und jedes 10. Hauptlevel (1, 11, …, 141): für alle
// zusammen bräuchten sie über 5 Minuten (die schweren Level 121–150 je bis zu 50 s). Bei den übrigen
// fehlen die Felder solver und score.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { L, setRot, solve, metrics } from '../tools/solver.mjs';

const file = join(dirname(fileURLToPath(import.meta.url)), 'golden.json');
const write = process.argv.includes('--write');

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

const withSolver = (i) => i < L.TUTORIAL_COUNT || (i - L.TUTORIAL_COUNT) % 10 === 0;

function record(level, index) {
  const start = L.traceBeams(L.createBoard(level));
  const b = L.createBoard(level);
  for (const el of b.elements.filter(L.isRotatable)) {
    const k = el.x + ',' + el.z;
    if (level.solution && k in level.solution) setRot(el, level.solution[k]);
  }
  const solvedRes = L.traceBeams(b);
  const entry = { name: level.name, start: snap(start), solved: snap(solvedRes) };
  if (!withSolver(index)) return entry;
  const s = solve(level);
  return {
    ...entry,
    solver: {
      count: s.count, nodes: s.nodes, leaves: s.leaves, near: s.near, guesses: s.guesses,
      aborted: s.aborted, rotatable: s.rotatable, solutions: s.solutions,
    },
    score: metrics(level).score,
  };
}

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
const diffs = [];
if (golden.length !== current.length) diffs.push(`Anzahl Level: erwartet ${golden.length}, jetzt ${current.length}`);
for (let i = 0; i < Math.max(golden.length, current.length); i++) {
  const g = golden[i], c = current[i];
  const tag = `Level ${i + 1} "${(c || g).name}"`;
  if (!g || !c) { diffs.push(`${tag}: ${g ? 'fehlt jetzt' : 'neu (nicht in golden.json)'}`); continue; }
  if (g.name !== c.name) diffs.push(`${tag}: Name erwartet "${g.name}"`);
  for (const part of ['start', 'solved']) {
    for (const key of new Set([...Object.keys(g[part]), ...Object.keys(c[part])])) {
      const a = JSON.stringify(g[part][key]), b = JSON.stringify(c[part][key]);
      if (a !== b) diffs.push(`${tag}: ${part}.${key} weicht ab${firstDiff(a, b)}`);
    }
  }
  if (!g.solver !== !c.solver) diffs.push(`${tag}: Löserdaten ${g.solver ? 'fehlen jetzt' : 'neu'}`);
  else if (g.solver) for (const key of new Set([...Object.keys(g.solver), ...Object.keys(c.solver)])) {
    const a = JSON.stringify(g.solver[key]), b = JSON.stringify(c.solver[key]);
    if (a !== b) diffs.push(`${tag}: solver.${key} erwartet ${short(a)}, jetzt ${short(b)}`);
  }
  if (g.score !== c.score) diffs.push(`${tag}: score erwartet ${g.score}, jetzt ${c.score}`);
}

function short(s) { return s === undefined ? 'undefined' : s.length > 120 ? s.slice(0, 120) + '…' : s; }
function firstDiff(a, b) {
  if (a === undefined || b === undefined) return ` (erwartet ${short(a)}, jetzt ${short(b)})`;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 40);
  return ` ab Zeichen ${i}: erwartet …${a.slice(from, i + 40)}…, jetzt …${b.slice(from, i + 40)}…`;
}

if (diffs.length) {
  for (const d of diffs) console.error('  FAIL', d);
  console.error(`${diffs.length} Abweichung(en) in ${current.length} Leveln (${ms} ms)`);
  process.exit(1);
}
console.log(`  ok   alle ${current.length} Level wie in golden.json (${ms} ms)`);
