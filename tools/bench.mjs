// Messskript für die Effizienz von Generator, Strahlregel und Löser (Spec „Effizienz“). Gemessen wird CPU-Zeit
// (process.cpuUsage), nicht die Wanduhr: Der Deckel von leise.sh hält die Prozesse immer wieder an. Unter Windows
// zählt cpuUsage in Schritten von 15,6 ms, deshalb wird über lange, zusammenhängende Abschnitte gemessen.
//
// Aufruf: node tools/bench.mjs <teil …> [gruppe …] [optionen]
//   generator  angenommene Level je CPU-Stunde je Gruppe: beim alten Generator (--generator alt) ein Profil, beim neuen
//              (--generator neu, tools/generator/) ein Auftrag aus Grad und Kernidee wie „leicht“ oder
//              „leicht-mischziel“. Jede Gruppe bekommt dieselben Seeds start … start + seeds - 1; Blöcke zu höchstens
//              50 Seeds gehen an --jobs Prozesse (Standard: halb so viele wie logische Kerne, passend zum Deckel von
//              50 %). Welcher Prozess welchen Block rechnet, ändert die angenommenen Level nicht (Fingerabdruck je
//              Gruppe). Die CPU-Zeit je Seed hängt aber von --jobs ab (Hyperthreading, E-Kerne, Turbo): nur gleiche
//              vergleichen. Ohne Gruppe alle Gruppen des Generators (alle Profile: mit den Standardwerten rund 25 min);
//              „härten“ (harden.mjs, ein Lauf je Seed, oft über 10 CPU-min) nur, wenn genannt. Mit der Abnahme
//              beurteilung (--accept beurteilung) zählt die Messung zusätzlich je Grad und je Grad und nötiger Kernidee
//              und nennt die Schwierigkeit der angenommenen Level (Quartile).
//   trace      mittlere CPU-Zeit je Aufruf von traceBeams auf zufälligen Stellungen aller Level (Tutorial und
//              Hauptlevel, --positions je Level, Zufall aus --seed), Median aus 10 Runden. Dazu eine Prüfsumme aus
//              einem eigenen, nicht gemessenen Durchgang über dieselben Stellungen (siehe picture). Sie zeigt, dass
//              dieselben Strahlbilder entstehen, ersetzt aber nicht den Golden-Test: Normalen, Längen, Abstände und
//              die Lage der Ereignisse fehlen, und ein Rundungsrest genau an einer Rundungsgrenze kann sie kippen.
//   solver     CPU-Zeit von solve(level) über alle Level, ein Durchgang (rund 15 s), dazu über die Level mit Blockern
//              ohne diese (heute 17, dann fast alle mit mehreren Lösungen; rund 3 s). Mit --unique im Modus unique (nur
//              die Eindeutigkeit, hält bei der zweiten Lösung an): auf den Leveln gleich weit, ohne Blocker kürzer.
// Optionen: --seeds N (Standard 60000) --start S (1) --jobs N --generator alt|neu --accept alt|beurteilung
//           --positions N (Standard 20000) --seed S (1) --unique
//           --save datei     Ergebnisse in eine JSON-Datei schreiben; andere Teile darin bleiben stehen. Gruppen des
//                            Generators kommen zu den vorhandenen dazu (gesamt neu gerechnet), wenn Generator,
//                            Abnahme, Seeds, --jobs und Rechner gleich sind; sonst bricht das Skript ab.
//           --compare datei  mit früheren Ergebnissen vergleichen, z. B. den Ausgangszahlen tools/bench-baseline.json.
//                            Verlässlich nur, wenn vorher und nachher in derselben Sitzung gemessen werden. Gruppen
//                            gleichen Namens, je Grad und gesamt. Über einen Generatorwechsel (alt nach Profilen gegen
//                            neu nach Aufträgen) vergleicht es je Auftrag des neuen mit demselben Grad und derselben
//                            nötigen Kernidee des alten, über alle seine Profile und mit dem besten Profil; dafür
//                            brauchen beide dieselbe Abnahme mit Grad.
// Nur über die gedeckelte Umgebung und nie mehrere Läufe nebeneinander. Ohne tiefste Priorität oder mit LEISE_CPU über
// 50 (mit generator) bzw. 20 (nur trace, solver) bricht das Skript ab:
//   LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator --save tools/bench-baseline.json
//   sh tools/leise.sh node tools/bench.mjs trace solver --save tools/bench-baseline.json
import { createHash } from 'node:crypto';
import { execSync, fork } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { L, solve, period, setRot } from './solver.mjs';

/**
 * Generatoren, erst für den Teil generator geladen: { groups, more, auftrag, make }. make(gruppe, seed) liefert einen
 * Kandidaten, { level } oder { fail: Grund }; der neue Generator gibt seine Beurteilung mit (beurteilung). groups läuft
 * ohne Angabe, more nur, wenn genannt. auftrag(gruppe): { grad, kernidee } einer Gruppe des neuen Generators, für den
 * Vergleich über einen Generatorwechsel.
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
  neu: async () => {
    const [{ generiere, angebot }, { feldformVon }] =
      await Promise.all(['./generator/index.mjs', './beurteilung/feldform.mjs'].map(f => import(f)));
    const feldform = feldformVon({}), auftraege = new Map(angebot().map(a => [a.name, a]));
    return {
      groups: [...auftraege.keys()],
      auftrag: (group) => ({ grad: auftraege.get(group).grad, kernidee: auftraege.get(group).kernidee }),
      make: (group, seed) => {
        const r = generiere({ ...auftraege.get(group), seed, feldform });
        return r.level ? { level: r.level, beurteilung: r.beurteilung } : { fail: r.grund };
      },
    };
  },
};
/**
 * Abnahmen, erst im Prozess des Generators geladen: eine Funktion Kandidat → { reason } (verworfen) oder { grade,
 * ideas, difficulty } (angenommen; jedes Feld darf fehlen). Liefert eine Abnahme den Grad, zählt die Messung die
 * angenommenen Level zusätzlich nach Grad, mit ideas (nötige Kernideen) auch je Grad und Kernidee, mit difficulty
 * (Schwierigkeit) ihre Quartile.
 * - alt: die Abnahme des alten Generators. Er prüft selbst und liefert nur Level, die sie bestehen.
 * - beurteilung: genau eine Lösung (solve im Modus unique) und die Beurteilung bestanden, mit dem Grad nach ihrer
 *   Schwierigkeit (grad.mjs): keiner der Gründe der Levelliste (levelliste.mjs: kein Ausschlussgrund, ab „mittel“ eine
 *   nötige Kernidee und der Mindest-Spielwert). Bringt der Kandidat seine Beurteilung mit (der neue Generator beurteilt
 *   jedes Level, das er liefert, und gibt die Beurteilung mit), gilt diese, statt dasselbe Level ein zweites Mal zu
 *   beurteilen; dass sie stimmt, prüft der Test des Generators. Sonst beurteilt die Abnahme das Level ohne Grad, also
 *   mit Füllteil und Zerfall wie ab „mittel“; ist es leicht und hat einen Ausschlussgrund, noch einmal mit „leicht“.
 */
const ACCEPTANCES = {
  alt: async () => (c) => (c.fail ? { reason: c.fail } : {}),
  beurteilung: async () => {
    const [{ beurteile }, { gradVon }, { GRUENDE }] = await Promise.all(
      ['./beurteilung/index.mjs', './beurteilung/grad.mjs', './levelliste.mjs'].map(f => import(f)));
    return (c) => {
      if (c.fail) return { reason: c.fail };
      const s = solve(c.level, { unique: true, collect: 0 });
      if (s.aborted || s.count !== 1) return { reason: 'Abnahme: nicht genau eine Lösung' };
      let b = c.beurteilung ?? beurteile(c.level, { grad: null });
      const grade = gradVon(b.schwierigkeit.wert);
      if (!c.beurteilung && grade === 'leicht' && b.ausschluesse.length) b = beurteile(c.level, { grad: grade });
      const ausschluss = [...new Set(b.ausschluesse.map(a => a.begriff))];
      if (ausschluss.length) return { reason: `Abnahme: ${ausschluss.join(', ')}` };
      const regel = Object.values(GRUENDE).find(r => r.gilt(b, grade));
      if (regel) return { reason: `Abnahme: ${regel.text}` };
      return { grade, ideas: [...new Set(b.kernideen.map(k => k.begriff))], difficulty: b.schwierigkeit.wert };
    };
  },
};
const BLOCK = 50;

const cpuNow = () => { const u = process.cpuUsage(); return u.user + u.system; }; // µs
const hash = (text) => createHash('sha1').update(text).digest('hex').slice(0, 16);

// ---- Prozess für den Generator: rechnet Blöcke von Seeds und meldet die CPU-Zeit seit der letzten Meldung. So
//      zählt jede Mikrosekunde des Prozesses genau einmal, auch über die groben Schritte von cpuUsage hinweg. Vorher
//      wärmt er sich 5 CPU-s mit Seeds ausserhalb der Messung auf (in seiner ersten Gruppe, „härten“ ausgenommen),
//      sonst trüge die erste Gruppe das Aufwärmen: Mit dem neuen Generator und der Beurteilung brauchen die ersten rund
//      250 Seeds je Prozess bis dreimal so lange wie später (Review Ticket 18, je 5000 Seeds: Mit 0,3 CPU-s kam die
//      erste Gruppe auf 0,63-mal den Wert, den sie als zweite erreichte, mit 2 CPU-s auf 0,78, mit 5 CPU-s auf 0,9).
if (process.env.BENCH_WORKER) {
  let gen = null, abnahme = null, last = null;
  process.on('message', async ({ generator, accept, group, from, to }) => {
    if (!gen) {
      [gen, abnahme] = await Promise.all([GENERATORS[generator](), ACCEPTANCES[accept]()]);
      const warm = gen.groups.includes(group) ? group : gen.groups[0], t = cpuNow();
      for (let seed = 1e9; cpuNow() - t < 5e6; seed++) abnahme(gen.make(warm, seed));
      last = cpuNow();
    }
    const accepted = [], reasons = {};
    for (let seed = from; seed < to; seed++) {
      const c = gen.make(group, seed);
      const v = abnahme(c);
      if (v.reason) reasons[v.reason] = (reasons[v.reason] || 0) + 1;
      else accepted.push([seed, hash(JSON.stringify(c.level)), v.grade ?? null, v.ideas ?? [], v.difficulty ?? null]);
    }
    const now = cpuNow();
    process.send({ group, cpu: now - last, accepted, reasons });
    last = now;
  });
} else {
  await main();
}

/** Angenommene Level je CPU-Stunde für jede Gruppe; auftrag(gruppe) wie im Generator (nur beim neuen). */
async function benchGenerator({ generator, accept, groups, start, seeds, jobs, auftrag }) {
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
          const r = out[m.group] = { ...(auftrag ? { auftrag: auftrag(m.group) } : {}), ...summarize(a, seeds) };
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
 * Angenommene Level je CPU-Stunde; grades: { Grad: { accepted, kernideen: { Kernidee: Anzahl } } } aus einer Abnahme
 * mit Grad (kernideen: Level, in denen die Kernidee nötig ist). cpu in µs. Gerechnet wird mit den gespeicherten, auf
 * 0,1 s gerundeten Sekunden, damit die Summe nach --save dieselben Werte ergibt.
 */
function rates(accepted, grades, cpu) {
  const cpuSeconds = +(cpu / 1e6).toFixed(1), perHour = (n) => (cpuSeconds ? Math.round(n / (cpuSeconds / 3600)) : null);
  const r = { accepted, cpuSeconds, perCpuHour: perHour(accepted) };
  const je = (zahlen) => Object.fromEntries(Object.entries(zahlen)
    .map(([k, n]) => [k, { accepted: n, perCpuHour: perHour(n) }]));
  if (Object.keys(grades).length) {
    r.grades = Object.fromEntries(Object.entries(grades).map(([k, g]) => [k, {
      accepted: g.accepted, perCpuHour: perHour(g.accepted),
      ...(Object.keys(g.kernideen).length ? { kernideen: je(g.kernideen) } : {}),
    }]));
  }
  return r;
}

/** Zählt einen angenommenen Grad (mit nötigen Kernideen) in grades wie bei rates. */
function zaehle(grades, grade, ideas, n = 1) {
  grades[grade] ??= { accepted: 0, kernideen: {} };
  grades[grade].accepted += n;
  for (const [k, m] of ideas) grades[grade].kernideen[k] = (grades[grade].kernideen[k] || 0) + m;
}

/** Quartile einer Liste von Zahlen, auf eine Stelle: { q25, median, q75 }, oder null ohne Zahlen. */
function quartile(werte) {
  if (!werte.length) return null;
  const s = [...werte].sort((a, b) => a - b), q = (p) => +s[Math.round(p * (s.length - 1))].toFixed(1);
  return { q25: q(0.25), median: q(0.5), q75: q(0.75) };
}

/**
 * Ergebnis einer Gruppe; der Fingerabdruck fasst Seeds und Inhalt aller angenommenen Level zusammen. difficulty: die
 * Quartile der Schwierigkeit, wenn die Abnahme sie liefert.
 */
function summarize(a, seeds) {
  const grades = {};
  for (const [, , grade, ideas] of a.accepted) if (grade !== null) zaehle(grades, grade, ideas.map(k => [k, 1]));
  const difficulty = quartile(a.accepted.map(x => x[4]).filter(w => w !== null));
  return {
    seeds, ...rates(a.accepted.length, grades, a.cpu), ...(difficulty ? { difficulty } : {}),
    fingerprint: hash(a.accepted.sort((x, y) => x[0] - y[0]).map(([seed, h]) => seed + ':' + h).join('\n')),
    reasons: Object.fromEntries(Object.entries(a.reasons).sort((x, y) => y[1] - x[1])),
  };
}

/** Summe über die Gruppen (auch nach dem Zusammenführen mit --save). */
function totalOf(groups) {
  const list = Object.values(groups), grades = {};
  for (const g of list) {
    for (const [k, v] of Object.entries(g.grades || {})) {
      zaehle(grades, k, Object.entries(v.kernideen || {}).map(([i, w]) => [i, w.accepted]), v.accepted);
    }
  }
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

/** Level je CPU-Stunde einer Gruppe (oder gesamt) in einem Grad; mit Kernidee nur die, in denen sie nötig ist. */
function rateFor(r, grad, kernidee) {
  return (kernidee ? r.grades?.[grad]?.kernideen?.[kernidee] : r.grades?.[grad])?.perCpuHour ?? null;
}

/**
 * Zeilen zum Vergleich zweier Generator-Messungen o (vorher) und c (jetzt). factor(vorher, jetzt) wie in compare.
 * - Gleicher Generator: Gruppen gleichen Namens, je Grad und gesamt. Ein Faktor nur unter gleichen Bedingungen; ≠
 *   meldet andere angenommene Level (Fingerabdruck), wenn nur --jobs abweicht.
 * - Generatorwechsel (alt nach Profilen, neu nach Aufträgen; gleich, welche Messung die frühere ist): je Gruppe des
 *   neuen Generators, deren Auftrag Grad und Kernidee nennt, gegen die angenommenen Level des alten mit diesem Grad
 *   (mit Kernidee: in denen sie nötig ist), über alle seine Gruppen (CPU-Zeit aller Gruppen) und in seiner besten
 *   Gruppe; der Faktor ist neu / alt. Die Seeds bedeuten hier je Generator etwas anderes und dürfen abweichen; einen
 *   Faktor gibt es nur bei gleicher Abnahme mit Grad und gleichem --jobs.
 */
function compareGenerator(o, c, factor) {
  const lines = [], diff = generatorDiff(o, c);
  if (o.generator === c.generator) {
    const sameLevels = diff.every(d => d === 'andere Prozesszahl (--jobs)'); // Fingerabdrücke vergleichbar
    lines.push(diff.length ? `Generator nicht vergleichbar (${diff.join(', ')}), Level je CPU-Stunde ohne Faktor:`
      : 'Generator, Level je CPU-Stunde (≠: andere angenommene Level):');
    const zeile = (name, was, now, other = '') =>
      `  ${name.padEnd(12)} ${was} → ${now}${diff.length ? '' : factor(was, now)}${other}`;
    const grade = (was, now) => Object.keys(now.grades || {}).filter(k => was.grades?.[k])
      .map(k => zeile(`  ${k}`, was.grades[k].perCpuHour, now.grades[k].perCpuHour));
    for (const [g, now] of Object.entries(c.groups)) {
      const was = o.groups[g];
      if (!was) continue;
      const other = sameLevels && was.fingerprint !== now.fingerprint ? '  ≠' : '';
      lines.push(zeile(g, was.perCpuHour, now.perCpuHour, other), ...grade(was, now));
    }
    lines.push(zeile('gesamt', o.total.perCpuHour, c.total.perCpuHour), ...grade(o.total, c.total));
    return lines;
  }
  // Die Messung mit Aufträgen ist die des neuen Generators, gleich ob vorher oder jetzt gemessen; Faktor neu / alt
  const [alt, neu] = Object.values(c.groups).some(g => g.auftrag) ? [o, c] : [c, o];
  const ohneFaktor = diff.filter(d => d !== 'anderer Generator' && d !== 'andere Seeds');
  if (!alt.total.grades || !neu.total.grades) ohneFaktor.push('Abnahme ohne Grad');
  const ohne = ohneFaktor.length ? ` (ohne Faktor: ${ohneFaktor.join(', ')})` : '';
  lines.push(`Generatorwechsel: ${neu.generator} (nach Aufträgen) gegen ${alt.generator}, Level je CPU-Stunde mit `
    + `demselben Grad und derselben nötigen Kernidee${ohne}:`);
  const f = (a, n) => (ohneFaktor.length ? '' : factor(a, n));
  for (const [g, r] of Object.entries(neu.groups)) {
    if (!r.auftrag) continue;
    const { grad, kernidee } = r.auftrag, n = rateFor(r, grad, kernidee) ?? 0;
    const alle = rateFor(alt.total, grad, kernidee) ?? 0;
    const [beste, best] = Object.entries(alt.groups).map(([name, a]) => [name, rateFor(a, grad, kernidee) ?? 0])
      .reduce((a, b) => (b[1] > a[1] ? b : a), ['–', 0]);
    lines.push(`  ${g} (${grad}${kernidee ? `, ${kernidee}` : ''}): ${neu.generator} ${n}`,
      `    gegen ${alt.generator} über alle ${Object.keys(alt.groups).length} Gruppen ${alle}${f(alle, n)}`,
      `    gegen ${alt.generator} in der besten Gruppe ${beste} ${best}${f(best, n)}`);
  }
  lines.push(`  gesamt, alle angenommenen Level gleich welchen Grads: ${alt.generator} ${alt.total.perCpuHour}, `
    + `${neu.generator} ${neu.total.perCpuHour}`);
  return lines;
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
  if (old.generator && cur.generator) lines.push(...compareGenerator(old.generator, cur.generator, factor));
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
    '[--generator alt|neu] [--accept alt|beurteilung] [--positions N] [--seed S] [--unique] [--save datei] ' +
    '[--compare datei]';
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
      '  LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator …\n' +
      '  sh tools/leise.sh node tools/bench.mjs trace solver …');
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
    const run = await benchGenerator({ generator, accept, groups: groups.length ? groups : gen.groups, ...num,
      auftrag: gen.auftrag });
    results.generator = { measured, ...run };
    console.log('Gruppe             Seeds  angenommen    CPU-s  Level/CPU-h  je Grad (Kernidee nötig) · Schwierigkeit');
    const ideen = (v) => Object.entries(v.kernideen || {}).map(([k, w]) => `${k} ${w.perCpuHour}`).join(', ');
    for (const [g, r] of Object.entries(run.groups).concat([['gesamt', run.total]])) {
      const grades = r.grades ? '  ' + Object.entries(r.grades)
        .map(([k, v]) => `${k} ${v.perCpuHour}${ideen(v) ? ` (${ideen(v)})` : ''}`).join(', ') : '';
      const d = r.difficulty ? ` · ${r.difficulty.q25}/${r.difficulty.median}/${r.difficulty.q75}` : '';
      console.log(`${g.padEnd(16)} ${String(r.seeds).padStart(7)} ${String(r.accepted).padStart(11)} ` +
        `${r.cpuSeconds.toFixed(1).padStart(8)} ${String(r.perCpuHour).padStart(12)}${grades}${d}`);
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
