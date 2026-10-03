// Kuratiert die 50 Level: liest alle Pools (tools/pools/*.jsonl, erzeugt mit tools/pools.mjs) und die
// gespeicherten Kandidaten (tools/candidates.jsonl: handgebaute Level und das frühere Kapitel II),
// wählt 50 Level gleichmässig über die Schwierigkeit (Wertung aus solver.mjs), möglichst verschieden,
// sortiert sie allein nach der Wertung, vergibt Namen (profiles.mjs) und Lösungskommentare und schreibt
// sie in index.html zwischen die Markierungen /* LEVELS:BEGIN */ … /* LEVELS:END */.
//
// Aufruf: node tools/curate.mjs [--dry] [--from W] [--to W] [--save datei] [--order datei]
//   --dry    nur anzeigen (Textfelder und Kennzahlen), index.html nicht ändern
//   --from   niedrigste Zielwertung (Standard: leichtester Kandidat ≥ 9)
//   --to     höchste Zielwertung (Standard: schwerster Kandidat)
//   --save   Auswahl als JSON-Zeilen speichern (z. B. für ein Review)
//   --order  Auswahl und Reihenfolge aus einer Datei übernehmen (JSON-Zeilen wie bei --save, in der
//            gewünschten Reihenfolge) – so lässt sich eine von Hand bzw. im Review korrigierte Reihenfolge schreiben
// Rückgabewert 2: zu wenige Kandidaten im Wertungsbereich.
// Die endgültige Auswahl liegt versioniert in tools/selection.jsonl (tools/pools/ ist nicht versioniert):
//   node tools/curate.mjs --order tools/selection.jsonl   stellt die Level in index.html wieder her.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAMES } from './profiles.mjs';
import { draw } from './show.mjs';
import { quality, passes, symOverlap } from './quality.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = join(here, '..', 'index.html');
const COUNT = NAMES.length; // 50
const die = (msg, code = 1) => { console.error(msg); process.exit(code); };

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  if (i < 0) return def;
  const v = args[i + 1];
  if (v === undefined || v.startsWith('--')) die(`${name} braucht einen Wert`);
  args.splice(i, 2);
  return v;
};
const dry = args.includes('--dry') ? (args.splice(args.indexOf('--dry'), 1), true) : false;
const fromArg = flag('--from', null), toArg = flag('--to', null);
const savePath = flag('--save', null), orderPath = flag('--order', null);
if (args.length) die('Unbekannte Argumente: ' + args.join(' '));
const readLines = (file) => readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));

/** Mischung eines Levels: Elementarten neben Spiegeln und farbige Quellen. */
function flavour(level) {
  const kinds = new Set(level.elements.map(e => e.type));
  const parts = ['prism', 'filter', 'combiner'].filter(k => kinds.has(k));
  if (level.elements.some(e => e.type === 'source' && e.color && e.color !== 'white')) parts.push('farbig');
  return parts.join('+') || 'spiegel';
}

let chosen;
if (orderPath) {
  chosen = readLines(orderPath);
  if (chosen.length !== COUNT) die(`--order: ${chosen.length} statt ${COUNT} Level`);
  console.error(`Reihenfolge aus ${orderPath} übernommen`);
} else {
  // ---- Kandidaten: alle Pools und die gespeicherten Kandidaten
  const poolDir = join(here, 'pools');
  const files = existsSync(poolDir) ? readdirSync(poolDir).filter(f => f.endsWith('.jsonl')).map(f => join(poolDir, f)) : [];
  const extra = join(here, 'candidates.jsonl');
  if (existsSync(extra)) files.push(extra);
  const pool = files.flatMap(f => readLines(f).map(g => ({ ...g, from: f.replace(/^.*[\\/]/, '') })));
  if (!pool.length) die('Keine Kandidaten – zuerst node tools/pools.mjs ausführen');
  for (const g of pool) g.quality = g.quality || quality(g.level);
  // handgebaute Level sind von Hand geprüft und dürfen die Qualitätsregeln verfehlen
  const good = pool.filter(g => g.handmade || !passes(g.quality).length);
  console.error(`${pool.length} Kandidaten aus ${files.length} Dateien, ${good.length} bestehen die Qualitätskriterien`);

  // ---- Zielwerte: gleichmässig von leicht bis schwer
  const scores = good.map(g => g.metrics.score).sort((a, b) => a - b);
  const lo = fromArg !== null ? Number(fromArg) : Math.max(9, scores[0]);
  const hi = toArg !== null ? Number(toArg) : scores.at(-1);
  const inRange = good.filter(g => g.metrics.score >= lo - 0.5 && g.metrics.score <= hi + 0.5);
  if (inRange.length < COUNT) die(`Nur ${inRange.length} Kandidaten zwischen ${lo} und ${hi}`, 2);
  const step = (hi - lo) / (COUNT - 1);
  console.error(`Zielwertungen ${lo}–${hi} (Schritt ${step.toFixed(2)}), ${inRange.length} Kandidaten`);

  // ---- Auswahl: je Zielwert der passendste Kandidat. Kosten: Abstand zum Zielwert, gleiche Mischung wie
  //      die zwei vorigen Level (Abwechslung), häufige Mischung insgesamt (Ausgewogenheit), wenig Zusammenspiel;
  //      Bonus für handgebaute Level.
  //      Gleiches Grundmuster (Überlappung auch unter Drehung/Spiegelung) ist ausgeschlossen.
  const LIMITS = [0.5, 0.65, 0.8, 1.01];
  chosen = [];
  for (let k = 0; k < COUNT; k++) {
    const goal = lo + step * k;
    const prev = chosen.slice(-2).map(c => flavour(c.level));
    const used = new Map();
    for (const c of chosen) used.set(flavour(c.level), (used.get(flavour(c.level)) || 0) + 1);
    const cost = (g) => {
      const f = flavour(g.level);
      const play = Math.min(4, g.quality.interaction + g.quality.decoysRead);
      return Math.abs(g.metrics.score - goal) / Math.max(step, 0.3)
        + (prev[1] === f ? 0.8 : 0) + (prev[0] === f ? 0.4 : 0) + 0.12 * (used.get(f) || 0)
        - 0.15 * play - (g.handmade ? 0.6 : 0);
    };
    const ranked = inRange.filter(g => !chosen.includes(g)).sort((a, b) => cost(a) - cost(b));
    let pick, limit;
    for (limit of LIMITS) { pick = ranked.find(g => chosen.every(c => symOverlap(g.level, c.level) < limit)); if (pick) break; }
    if (limit > LIMITS[0]) console.error(`Hinweis: Level ${k + 1} nur mit gelockerter Verschiedenheit (Überlappung < ${limit})`);
    if (Math.abs(pick.metrics.score - goal) > 2 * step) console.error(`Hinweis: Level ${k + 1} liegt weit vom Zielwert ${goal.toFixed(1)} (Wertung ${pick.metrics.score})`);
    chosen.push(pick);
  }
  chosen.sort((a, b) => a.metrics.score - b.metrics.score);
}

// ---- Ausgabe als Level-Code
const TYPE_DE = { mirror: 'Spiegel', prism: 'Prisma', combiner: 'Kombinator' };
const ORDER = ['source', 'mirror', 'prism', 'filter', 'combiner', 'blocker', 'target'];
const str = (v) => `'${String(v).replace(/['\\]/g, '\\$&')}'`; // JS-String in einfachen Anführungszeichen
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function elementCode(e) {
  const parts = [`type: ${str(e.type)}`, `x: ${e.x}`, `z: ${e.z}`];
  if (e.dir !== undefined) parts.push(`dir: ${e.dir}`);
  if (e.rot !== undefined) parts.push(`rot: ${e.rot}`);
  if (e.color !== undefined && !(e.type === 'source' && e.color === 'white')) parts.push(`color: ${str(e.color)}`);
  if (e.fixed) parts.push('fixed: true');
  return `{ ${parts.join(', ')} }`;
}
function levelCode(g, name) {
  const m = g.metrics, els = g.level.elements;
  const sol = Object.entries(g.level.solution).map(([k, v]) => {
    const e = els.find(q => q.x + ',' + q.z === k);
    return `${TYPE_DE[e.type]} (${k}) ${e.type === 'combiner' ? 'dir' : 'rot'} ${v}`;
  });
  // Lösungskommentar auf ~100 Zeichen umbrechen
  const lines = [];
  let cur = '// Lösung:';
  for (const part of sol) { if ((cur + ' ' + part).length > 100) { lines.push(cur); cur = '//  '; } cur += ' ' + part + ' ·'; }
  lines.push(cur.replace(/ ·$/, ''));
  const origin = typeof g.seed === 'number' ? `Profil ${g.from?.replace('.jsonl', '') ?? '?'}, Seed ${g.seed}` : g.seed;
  lines.push(`// Wertung ${m.score} · ${m.rotatable} drehbar · ${plural(m.targets, 'Ziel', 'Ziele')} · Rateschritte ${m.guesses} · ${origin}`);
  const sorted = [...els].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.z - b.z || a.x - b.x);
  return [
    '  {',
    ...lines.map(l => '    ' + l),
    `    name: ${str(name)},`,
    '    elements: [',
    ...sorted.map(e => `      ${elementCode(e)},`),
    '    ],',
    `    solution: { ${Object.entries(g.level.solution).map(([k, v]) => `${str(k)}: ${v}`).join(', ')} },`,
    '  },',
  ].join('\n');
}

const tally = new Map();
chosen.forEach((g, i) => {
  const m = g.metrics, q = g.quality || quality(g.level), f = flavour(g.level);
  tally.set(f, (tally.get(f) || 0) + 1);
  console.log(`\n=== ${i + 1}. ${NAMES[i]}  Wertung ${m.score} · ${f} · drehbar ${m.rotatable} · ${plural(m.targets, 'Ziel', 'Ziele')} · Klicks ${m.clicks} · Rateschritte ${m.guesses} · ${g.from || ''} ${g.seed}`);
  console.log(`    Fläche ${q.area} · Kreuzungen ${q.crossings} · Mehrfachtreffer ${q.multiHit} · geteilt ${q.shared} · Lockvögel ${q.decoysRead}`);
  const a = draw(g.level).split('\n'), b = draw(g.level, g.level.solution).split('\n');
  a.forEach((row, k) => console.log('   ' + row.padEnd(22) + '   ' + (b[k] || '')));
});
console.error('\nMischungen: ' + [...tally].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.error('Wertungen: ' + chosen.map(g => g.metrics.score).join(' '));
if (savePath) { writeFileSync(savePath, chosen.map(g => JSON.stringify(g)).join('\n') + '\n'); console.error('Auswahl gespeichert: ' + savePath); }

if (dry) { console.error('\n--dry: index.html unverändert'); process.exit(0); }
const html = readFileSync(indexPath, 'utf8');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const code = chosen.map((g, i) => levelCode(g, NAMES[i])).join('\n').replace(/\n/g, eol);
const begin = '/* LEVELS:BEGIN */', end = '/* LEVELS:END */';
const a = html.indexOf(begin), b = html.indexOf(end);
if (a < 0 || b < a) die('Markierungen LEVELS:BEGIN/END fehlen in index.html');
writeFileSync(indexPath, html.slice(0, a + begin.length) + eol + code + eol + '  ' + html.slice(b));
console.error(`\n${chosen.length} Level in index.html geschrieben.`);
