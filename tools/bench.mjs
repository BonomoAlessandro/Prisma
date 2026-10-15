// Messskript für die Effizienz von Generator, Strahlregel und Löser (Spec „Effizienz“). Gemessen wird CPU-Zeit
// (process.cpuUsage), nicht die Wanduhr: Der Deckel von leise.sh hält die Prozesse immer wieder an. Unter Windows
// zählt cpuUsage in Schritten von 15,6 ms, deshalb wird über lange, zusammenhängende Abschnitte gemessen.
//
// Aufruf: node tools/bench.mjs <teil …> [gruppe …] [optionen]
//   generator  angenommene Level je CPU-Stunde je Gruppe (heute ein Profil, beim neuen Generator ein Grad). Jede
//              Gruppe bekommt dieselben Seeds start … start + seeds - 1; Blöcke zu höchstens 50 Seeds gehen an
//              --jobs Prozesse (Standard: halb so viele wie logische Kerne, passend zum Deckel von 50 %). Welcher
//              Prozess welchen Block rechnet, ändert die angenommenen Level nicht (Fingerabdruck je Gruppe). Die
//              CPU-Zeit je Seed hängt aber von --jobs ab (Hyperthreading, E-Kerne, Turbo): nur gleiche vergleichen.
//              Ohne Gruppe alle Profile (mit den Standardwerten rund 25 min); „härten“ (harden.mjs, ein Lauf je
//              Seed, oft über 10 CPU-min) nur, wenn genannt.
//   trace      mittlere CPU-Zeit je Aufruf von traceBeams auf zufälligen Stellungen aller Level (Tutorial und
//              Hauptlevel, --positions je Level, Zufall aus --seed), Median aus 10 Runden. Dazu eine Prüfsumme aus
//              einem eigenen, nicht gemessenen Durchgang über dieselben Stellungen (siehe picture). Sie zeigt, dass
//              dieselben Strahlbilder entstehen, ersetzt aber nicht den Golden-Test: Normalen, Längen, Abstände und
//              die Lage der Ereignisse fehlen, und ein Rundungsrest genau an einer Rundungsgrenze kann sie kippen.
//   solver     CPU-Zeit von solve(level) über alle Level, ein Durchgang (rund 15 s), dazu über die Level mit Blockern
//              ohne diese (heute 17, dann fast alle mit mehreren Lösungen; rund 3 s). Mit --unique im Modus unique (nur
//              die Eindeutigkeit, hält bei der zweiten Lösung an): auf den Leveln gleich weit, ohne Blocker kürzer.
// Optionen: --seeds N (Standard 60000) --start S (1) --jobs N --generator alt --accept alt
//           --positions N (Standard 20000) --seed S (1) --unique
//           --save datei     Ergebnisse in eine JSON-Datei schreiben; andere Teile darin bleiben stehen. Gruppen des
//                            Generators kommen zu den vorhandenen dazu (gesamt neu gerechnet), wenn Generator,
//                            Abnahme, Seeds, --jobs und Rechner gleich sind; sonst bricht das Skript ab.
//           --compare datei  mit früheren Ergebnissen vergleichen, z. B. den Ausgangszahlen tools/bench-baseline.json.
//                            Verlässlich nur, wenn vorher und nachher in derselben Sitzung gemessen werden.
// Nur über die gedeckelte Umgebung und nie mehrere Läufe nebeneinander. Ohne tiefste Priorität oder mit LEISE_CPU über
// 50 (mit generator) bzw. 20 (nur trace, solver) bricht das Skript ab:
//   LEISE_CPU=50 sh tools/blender/out/arbeit/leise.sh node tools/bench.mjs generator --save tools/bench-baseline.json
//   sh tools/blender/out/arbeit/leise.sh node tools/bench.mjs trace solver --save tools/bench-baseline.json
import { createHash } from 'node:crypto';
import { execSync, fork } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { L, solve, period, setRot } from './solver.mjs';

/**
 * Generatoren, erst für den Teil generator geladen: { groups, more, make }. make(gruppe, seed) liefert einen
 * Kandidaten, { level } oder { fail: Grund }. groups läuft ohne Angabe, more nur, wenn genannt. Der neue Generator
 * kommt mit den Schwierigkeitsgraden als Gruppen dazu.
 */
const GENERATORS = {
  alt: async () => {
    const [{ generateOne }, { climb }, { PROFILES }] =
      await Promise.all(['./generate.mjs', './harden.mjs', './profiles.mjs'].map(f => import(f)));
    return {
      groups: PROFILES.map(p => p.id),
      more: ['härten'],
      make: (group, seed) => (group === 'härten' ? climb(seed) : generateOne(PROFILES.find(p => p.id === group), seed)),
    };
  },
};
/**
 * Abnahmen: Kandidat → { reason } (verworfen) oder { grade } (angenommen). Liefert eine Abnahme den Grad, zählt die
 * Messung die angenommenen Level zusätzlich nach Grad. Heute gilt die Abnahme des alten Generators: Er prüft selbst
 * und liefert nur Level, die sie bestehen. Später kommt die Beurteilung dazu.
 */
const ACCEPTANCES = {
  alt: (c) => (c.fail ? { reason: c.fail } : {}),
};
const BLOCK = 50;

const cpuNow = () => { const u = process.cpuUsage(); return u.user + u.system; }; // µs
const hash = (text) => createHash('sha1').update(text).digest('hex').slice(0, 16);

// ---- Prozess für den Generator: rechnet Blöcke von Seeds und meldet die CPU-Zeit seit der letzten Meldung. So
//      zählt jede Mikrosekunde des Prozesses genau einmal, auch über die groben Schritte von cpuUsage hinweg. Vorher
//      wärmt er sich 0,3 CPU-s mit Seeds ausserhalb der Messung auf, sonst trüge die erste Gruppe das Aufwärmen.
if (process.env.BENCH_WORKER) {
  let gen = null, last = null;
  process.on('message', async ({ generator, accept, group, from, to }) => {
    if (!gen) {
      gen = await GENERATORS[generator]();
      const t = cpuNow();
      for (let seed = 1e9; cpuNow() - t < 3e5; seed++) gen.make(gen.groups[0], seed);
      last = cpuNow();
    }
    const accepted = [], reasons = {};
    for (let seed = from; seed < to; seed++) {
      const c = gen.make(group, seed);
      const v = ACCEPTANCES[accept](c);
      if (v.reason) reasons[v.reason] = (reasons[v.reason] || 0) + 1;
      else accepted.push([seed, hash(JSON.stringify(c.level)), v.grade ?? null]);
    }
    const now = cpuNow();
    process.send({ group, cpu: now - last, accepted, reasons });
    last = now;
  });
} else {
  await main();
}

/** Angenommene Level je CPU-Stunde für jede Gruppe. */
async function benchGenerator({ generator, accept, groups, start, seeds, jobs }) {
  const tasks = [], block = Math.max(1, Math.min(BLOCK, Math.floor(seeds / (8 * jobs)))); // wenige Seeds: kleine Blöcke
  for (const group of groups) {
    for (let s = start; s < start + seeds; s += block) {
      tasks.push({ generator, accept, group, from: s, to: Math.min(s + block, start + seeds) });
    }
  }
  const open = (g) => tasks.filter(t => t.group === g).length;
  const acc = new Map(groups.map(g => [g, { cpu: 0, accepted: [], reasons: {}, open: open(g) }]));
  const out = {};
  await new Promise((resolve, reject) => {
    let next = 0, alive = Math.min(jobs, tasks.length);
    for (let i = 0; i < alive; i++) {
      const w = fork(fileURLToPath(import.meta.url), [], { env: { ...process.env, BENCH_WORKER: '1' } });
      const feed = () => (next < tasks.length ? w.send(tasks[next++]) : w.disconnect());
      w.on('message', (m) => {
        const a = acc.get(m.group);
        a.cpu += m.cpu;
        a.accepted.push(...m.accepted);
        for (const [k, v] of Object.entries(m.reasons)) a.reasons[k] = (a.reasons[k] || 0) + v;
        if (--a.open === 0) {
          const r = out[m.group] = summarize(a, seeds);
          console.error(`  ${m.group}: ${r.accepted} von ${seeds} Seeds angenommen, ${r.cpuSeconds} CPU-s`);
        }
        feed();
      });
      w.on('exit', (code, signal) => (code || signal
        ? reject(new Error(`Prozess für den Generator beendet: ${code ?? signal}`)) : --alive || resolve()));
      feed();
    }
  });
  const result = Object.fromEntries(groups.map(g => [g, out[g]]));
  return { generator, accept, start, seeds, jobs, groups: result, total: totalOf(result) };
}

/**
 * Angenommene Level je CPU-Stunde; grades: { Grad: Anzahl } aus einer Abnahme mit Grad. cpu in µs. Gerechnet wird mit
 * den gespeicherten, auf 0,1 s gerundeten Sekunden, damit die Summe nach --save dieselben Werte ergibt.
 */
function rates(accepted, grades, cpu) {
  const cpuSeconds = +(cpu / 1e6).toFixed(1), perHour = (n) => (cpuSeconds ? Math.round(n / (cpuSeconds / 3600)) : null);
  const r = { accepted, cpuSeconds, perCpuHour: perHour(accepted) };
  if (Object.keys(grades).length) {
    r.grades = Object.fromEntries(Object.entries(grades).map(([k, n]) => [k, { accepted: n, perCpuHour: perHour(n) }]));
  }
  return r;
}

/** Ergebnis einer Gruppe; der Fingerabdruck fasst Seeds und Inhalt aller angenommenen Level zusammen. */
function summarize(a, seeds) {
  const grades = {};
  for (const [, , grade] of a.accepted) if (grade !== null) grades[grade] = (grades[grade] || 0) + 1;
  return {
    seeds, ...rates(a.accepted.length, grades, a.cpu),
    fingerprint: hash(a.accepted.sort((x, y) => x[0] - y[0]).map(([seed, h]) => seed + ':' + h).join('\n')),
    reasons: Object.fromEntries(Object.entries(a.reasons).sort((x, y) => y[1] - x[1])),
  };
}

/** Summe über die Gruppen (auch nach dem Zusammenführen mit --save). */
function totalOf(groups) {
  const list = Object.values(groups), grades = {};
  for (const g of list) for (const [k, v] of Object.entries(g.grades || {})) grades[k] = (grades[k] || 0) + v.accepted;
  const sum = (f) => list.reduce((s, g) => s + f(g), 0);
  return { seeds: sum(g => g.seeds), ...rates(sum(g => g.accepted), grades, Math.round(sum(g => g.cpuSeconds) * 1e6)) };
}

/** Zufall für die Stellungen: mulberry32 wie rng in generate.mjs, eigen, damit trace ohne die alten Werkzeuge läuft. */
function randomInt(seed) {
  let s = seed >>> 0;
  return (a, b) => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return a + Math.floor(((t ^ t >>> 14) >>> 0) / 4294967296 * (b - a + 1));
  };
}

/**
 * Ein Strahlbild als Text für die Prüfsumme: Farbe und Endpunkte der Abschnitte (auf 1e-6 gerundet), Art, Farbe
 * und Element der Ereignisse in ihrer Reihenfolge, Treffer und Mischungen (nach Id sortiert), „gelöst“ und
 * „abgebrochen“.
 */
function picture(r) {
  const p = (v) => Math.round(v * 1e6);
  const sorted = (m) => [...m].sort((a, b) => a[0] - b[0]).join(' ');
  return r.segments.map(s => `${s.color}:${p(s.x0)},${p(s.z0)},${p(s.x1)},${p(s.z1)}`).join(' ') + '|' +
    r.events.map(e => `${e.kind}${e.color}:${e.element ?? e.target ?? ''}`).join(' ') + '|' +
    sorted(r.hits) + '|' + sorted(r.mixes) + '|' + r.solved + r.truncated;
}

/**
 * Mittlere CPU-Zeit je Aufruf von traceBeams, in 10 Runden über je ein Zehntel der Stellungen; gemeldet wird der
 * Median der Runden (einzelne Runden weichen bei Last auf dem Rechner stark ab) mit der Spannweite.
 */
function benchTrace({ positions, seed }) {
  const int = randomInt(seed);
  const setups = L.LEVELS.map(level => {
    const board = L.createBoard(level);
    const rot = board.elements.filter(L.isRotatable);
    const pos = new Int8Array(positions * rot.length).map((_, i) => int(0, period(rot[i % rot.length]) - 1));
    return { board, rot, pos };
  });
  // Stellungen from … to - 1 aller Level verfolgen; visit bekommt jedes Strahlbild
  const run = (from, to, visit = null) => {
    let calls = 0;
    for (const { board, rot, pos } of setups) {
      for (let k = from, p = from * rot.length; k < to; k++) {
        for (const el of rot) setRot(el, pos[p++]);
        const r = L.traceBeams(board);
        calls++;
        if (visit) visit(r);
      }
    }
    return calls;
  };
  run(0, Math.min(positions, 100)); // aufwärmen
  const rounds = [], n = Math.min(10, positions);
  let cpu = 0, calls = 0;
  for (let i = 0; i < n; i++) {
    const t = cpuNow();
    const c = run(Math.floor(i * positions / n), Math.floor((i + 1) * positions / n));
    const dt = cpuNow() - t;
    cpu += dt; calls += c;
    rounds.push(dt / c);
  }
  rounds.sort((a, b) => a - b);
  const median = (rounds[(n - 1) >> 1] + rounds[n >> 1]) / 2;
  const sum = createHash('sha1');
  run(0, positions, (r) => sum.update(picture(r) + '\n'));
  return {
    seed, positions, levels: setups.length, calls, cpuSeconds: +(cpu / 1e6).toFixed(2), microsPerCall: +median.toFixed(3),
    roundsMicros: [+rounds[0].toFixed(3), +rounds[n - 1].toFixed(3)], checksum: sum.digest('hex').slice(0, 16),
  };
}

/**
 * CPU-Zeit von solve(level) über alle Level; die Summe der Knoten zeigt, dass dieselbe Suche lief. unique: im Modus
 * unique (nur die Eindeutigkeit). Alle Level sind eindeutig, der Modus sucht dort also gleich weit. Deshalb kommen die
 * Level mit Blockern ohne ihre Blocker dazu (withoutBlockers): Sie haben dann fast alle mehrere Lösungen, wie die
 * Kandidaten des Generators vor dem Blockieren, und dort hält der Modus bei der zweiten an.
 */
function benchSolver({ unique }) {
  const seconds = (us, digits = 1) => +(us / 1e6).toFixed(digits);
  const run = (levels) => {
    const runs = levels.map(level => {
      const t = cpuNow();
      const s = solve(level, { unique });
      return { name: level.name, cpu: cpuNow() - t, nodes: s.nodes };
    });
    return { levels: runs.length, cpu: runs.reduce((s, r) => s + r.cpu, 0), nodes: runs.reduce((s, r) => s + r.nodes, 0), runs };
  };
  const all = run(L.LEVELS);
  const unblocked = run(L.LEVELS.filter(l => l.elements.some(e => e.type === 'blocker'))
    .map(l => ({ ...l, elements: l.elements.filter(e => e.type !== 'blocker') })));
  return {
    unique, levels: all.levels, cpuSeconds: seconds(all.cpu), nodes: all.nodes,
    slowest: [...all.runs].sort((a, b) => b.cpu - a.cpu).slice(0, 5).map(r => ({ name: r.name, cpuSeconds: seconds(r.cpu) })),
    withoutBlockers: { levels: unblocked.levels, cpuSeconds: seconds(unblocked.cpu, 2), nodes: unblocked.nodes },
  };
}

/** Bedingungen einer Generator-Messung, die zwischen a und b abweichen, als Text. */
function generatorDiff(a, b) {
  const what = { generator: 'anderer Generator', accept: 'andere Abnahme', start: 'andere Seeds', seeds: 'andere Seeds',
    jobs: 'andere Prozesszahl (--jobs)' };
  return [...new Set(Object.keys(what).filter(k => a[k] !== b[k]).map(k => what[k]))];
}

/** Zeilen „vorher → jetzt“ für die Teile, die in beiden Messungen vorkommen. */
function compare(old, cur) {
  const lines = ['Hinweis: Last auf dem Rechner verschiebt die CPU-Zeit um 20 bis 50 %. Verlässlich ist der Vergleich',
    'nur, wenn vorher und nachher in derselben Sitzung gemessen werden (alter Stand z. B. in einem git worktree).'];
  const factor = (a, b) => (a && b ? ` (× ${(b / a).toFixed(2)})` : ''); // über 1: besser als vorher
  for (const part of ['generator', 'trace', 'solver']) {
    const before = old[part]?.measured?.machine, now = cur[part]?.measured.machine;
    if (before && now && before !== now) {
      lines.push(`WARNUNG: ${part} vorher auf „${before}“ gemessen, jetzt auf „${now}“ – CPU-Zeiten nicht vergleichbar`);
    }
  }
  if (old.generator && cur.generator) {
    const o = old.generator, c = cur.generator, diff = generatorDiff(o, c);
    const sameLevels = diff.every(d => d === 'andere Prozesszahl (--jobs)'); // Fingerabdrücke vergleichbar
    lines.push(diff.length ? `Generator nicht vergleichbar (${diff.join(', ')}), Level je CPU-Stunde ohne Faktor:`
      : 'Generator, Level je CPU-Stunde (≠: andere angenommene Level):');
    for (const [g, now] of Object.entries(c.groups)) {
      const was = o.groups[g];
      if (!was) continue;
      const f = diff.length ? '' : factor(was.perCpuHour, now.perCpuHour);
      const other = sameLevels && was.fingerprint !== now.fingerprint ? '  ≠' : '';
      lines.push(`  ${g.padEnd(10)} ${was.perCpuHour} → ${now.perCpuHour}${f}${other}`);
    }
  }
  if (old.trace && cur.trace) {
    const o = old.trace, c = cur.trace;
    const note = o.seed !== c.seed || o.positions !== c.positions ? '  (andere Stellungen, Prüfsumme nicht verglichen)'
      : o.checksum !== c.checksum ? '  ≠ andere Strahlbilder' : '';
    const f = factor(c.microsPerCall, o.microsPerCall);
    lines.push(`Strahlregel: ${o.microsPerCall} → ${c.microsPerCall} µs je Aufruf${f}${note}`);
  }
  if (old.solver && cur.solver) {
    const o = old.solver, c = cur.solver, note = o.nodes !== c.nodes ? '  ≠ andere Knotenzahl' : '';
    const mode = (s) => (s.unique ? 'Modus unique' : 'Standard');
    const modes = !o.unique === !c.unique ? '' : ` (${mode(o)} → ${mode(c)})`; // alle Level eindeutig: Knoten gleich
    lines.push(o.levels !== c.levels ? `Löser nicht vergleichbar: ${o.levels} → ${c.levels} Level`
      : `Löser: ${o.cpuSeconds} → ${c.cpuSeconds} CPU-s${factor(c.cpuSeconds, o.cpuSeconds)}${modes}${note}`);
    const ob = o.withoutBlockers, cb = c.withoutBlockers;
    if (ob && cb) {
      // mehrere Lösungen: Im Modus unique sind weniger Knoten richtig
      const other = !modes && ob.nodes !== cb.nodes ? '  ≠ andere Knotenzahl' : '';
      lines.push(ob.levels !== cb.levels ? `Löser ohne Blocker nicht vergleichbar: ${ob.levels} → ${cb.levels} Level`
        : `Löser, Level ohne Blocker: ${ob.cpuSeconds} → ${cb.cpuSeconds} CPU-s${factor(cb.cpuSeconds, ob.cpuSeconds)}${modes}${other}`);
    }
  }
  return lines;
}

/** Bricht vor der Messung ab, wenn --save eine Generator-Messung unter anderen Bedingungen zusammenführen müsste. */
function checkMergeable(old, cur, file) {
  const diff = generatorDiff(old, cur);
  if (old.measured.machine !== cur.measured.machine) diff.push('anderer Rechner');
  if (!diff.length) return;
  console.error(`--save: ${file} enthält eine Generator-Messung unter anderen Bedingungen (${diff.join(', ')}). ` +
    'Abbruch vor der Messung; eine andere Datei wählen oder mit denselben Bedingungen messen.');
  process.exit(1);
}

/** Gruppen einer neuen Generator-Messung zu einer gespeicherten hinzufügen oder ersetzen, gesamt neu rechnen. */
function mergeGenerator(old, cur) {
  // Gruppen aus einem anderen Lauf (Datum, Commit …) tragen ihre eigenen Angaben
  const elsewhere = JSON.stringify(old.measured) !== JSON.stringify(cur.measured);
  const groups = { ...old.groups };
  for (const [g, r] of Object.entries(cur.groups)) groups[g] = elsewhere ? { ...r, measured: cur.measured } : r;
  return { ...old, groups, total: totalOf(groups) };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
  const fail = (text) => { console.error(text); process.exit(1); };
  const cpus = os.cpus();
  const generator = flag('--generator', 'alt'), accept = flag('--accept', 'alt');
  const save = flag('--save', null), against = flag('--compare', null);
  const unique = args.includes('--unique');
  if (unique) args.splice(args.indexOf('--unique'), 1);
  const num = { seeds: flag('--seeds', 60000), start: flag('--start', 1), jobs: flag('--jobs', Math.max(1, cpus.length >> 1)),
    positions: flag('--positions', 20000), seed: flag('--seed', 1) };
  const parts = ['generator', 'trace', 'solver'].filter(p => args.includes(p));
  const groups = args.filter(a => !parts.includes(a));
  const usage = 'Aufruf: node tools/bench.mjs <generator|trace|solver …> [gruppe …] [--seeds N] [--start S] [--jobs N] ' +
    '[--generator alt] [--accept alt] [--positions N] [--seed S] [--unique] [--save datei] [--compare datei]';
  for (const [k, v] of Object.entries(num)) {
    num[k] = Number(v);
    if (!Number.isInteger(num[k]) || num[k] < 1) fail(`--${k} braucht eine ganze Zahl ≥ 1\n${usage}`);
  }
  if (!parts.length) fail(usage);
  if (!GENERATORS[generator] || !ACCEPTANCES[accept]) fail(`Unbekannt: --generator ${generator} oder --accept ${accept}`);
  if (groups.length && !parts.includes('generator')) fail(`Gruppen gibt es nur beim Teil generator: ${groups.join(' ')}`);
  if (unique && !parts.includes('solver')) fail('--unique gibt es nur beim Teil solver');
  const cap = Number(process.env.LEISE_CPU || 20), limit = parts.includes('generator') ? 50 : 20;
  if (os.getPriority() !== os.constants.priority.PRIORITY_LOW || !(cap <= limit)) {
    fail(`Nur über die gedeckelte Umgebung starten: tiefste Priorität und LEISE_CPU höchstens ${limit} ` +
      `(jetzt ${process.env.LEISE_CPU ?? 'nicht gesetzt'}; generator bis 50, sonst bis 20), z. B.\n` +
      '  LEISE_CPU=50 sh tools/blender/out/arbeit/leise.sh node tools/bench.mjs generator …\n' +
      '  sh tools/blender/out/arbeit/leise.sh node tools/bench.mjs trace solver …');
  }
  const gen = parts.includes('generator') ? await GENERATORS[generator]() : null;
  for (const g of groups) if (![...gen.groups, ...(gen.more || [])].includes(g)) fail('Gruppe unbekannt: ' + g);

  let commit = '';
  const quiet = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
  try { commit = execSync('git rev-parse --short HEAD', quiet).trim(); } catch { /* ohne git */ }
  const measured = { date: new Date().toISOString().slice(0, 10),
    machine: `${cpus[0].model.trim()}, ${cpus.length} logische Kerne`, node: process.version, commit, cap };
  const saved = () => (save && existsSync(save) ? JSON.parse(readFileSync(save, 'utf8')) : {});
  if (gen && saved().generator) checkMergeable(saved().generator, { generator, accept, ...num, measured }, save);
  const results = {};
  if (gen) {
    console.error(`Generator ${generator}, Abnahme ${accept}: Seeds ${num.start}–${num.start + num.seeds - 1} je Gruppe, ` +
      `${num.jobs} Prozesse`);
    const run = await benchGenerator({ generator, accept, groups: groups.length ? groups : gen.groups, ...num });
    results.generator = { measured, ...run };
    console.log('Gruppe         Seeds  angenommen    CPU-s  Level/CPU-h');
    for (const [g, r] of Object.entries(run.groups).concat([['gesamt', run.total]])) {
      const grades = r.grades ? '  ' + Object.entries(r.grades).map(([k, v]) => `${k} ${v.perCpuHour}`).join(', ') : '';
      console.log(`${g.padEnd(12)} ${String(r.seeds).padStart(7)} ${String(r.accepted).padStart(11)} ` +
        `${r.cpuSeconds.toFixed(1).padStart(8)} ${String(r.perCpuHour).padStart(12)}${grades}`);
    }
  }
  if (parts.includes('trace')) {
    results.trace = { measured, ...benchTrace(num) };
    const t = results.trace;
    console.log(`Strahlregel: ${t.microsPerCall} µs je Aufruf (Runden ${t.roundsMicros.join('–')} µs; ${t.calls} Aufrufe, ` +
      `${t.levels} Level × ${t.positions} Stellungen, Seed ${t.seed}, ${t.cpuSeconds} CPU-s; Prüfsumme ${t.checksum})`);
  }
  if (parts.includes('solver')) {
    results.solver = { measured, ...benchSolver({ unique }) };
    const s = results.solver, w = s.withoutBlockers;
    console.log(`Löser${unique ? ' im Modus unique' : ''}: ${s.cpuSeconds} CPU-s für ${s.levels} Level (${s.nodes} Knoten; ` +
      `am längsten ${s.slowest.map(r => `${r.name} ${r.cpuSeconds} s`).join(', ')}); ${w.cpuSeconds} CPU-s für die ` +
      `${w.levels} Level mit Blockern ohne diese (${w.nodes} Knoten)`);
  }
  if (against) compare(JSON.parse(readFileSync(against, 'utf8')), results).forEach(l => console.log(l));
  if (save) {
    const old = saved();
    if (old.generator && results.generator) results.generator = mergeGenerator(old.generator, results.generator);
    writeFileSync(save, JSON.stringify({ ...old, ...results }, null, 2) + '\n');
    console.error(`gespeichert: ${save}`);
  }
}
