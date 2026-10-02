// Kuratiert ein Kapitel: erzeugt einen Pool mit dem Generator (oder liest einen gespeicherten), wählt
// 10 Level im Wertungsfenster des Kapitels (aufsteigend, möglichst verschieden), vergibt Namen und
// Lösungskommentare und schreibt das Kapitel in index.html zwischen die Markierungen
// /* KAPITEL:<id>:BEGIN */ … /* KAPITEL:<id>:END */.
//
// Aufruf: node tools/curate.mjs <kapitel> [poolgrösse=60] [--jobs N] [--seed S] [--save datei] [--pool datei] [--dry]
//   --save  erzeugten Pool als JSON-Zeilen speichern (z. B. zuerst mit --dry ansehen, dann mit --pool schreiben)
//   --pool  gespeicherten Pool verwenden statt neu zu erzeugen – die Auswahl ist dann reproduzierbar
//           (die parallele Erzeugung ist es nicht: welche Seeds zuerst fertig werden, hängt vom Zeitablauf ab)
//   --dry   nur anzeigen (Textfelder und Kennzahlen), index.html nicht ändern
// Rückgabewert 2: zu wenige Kandidaten im Fenster (grösseren Pool wählen oder chapters.mjs anpassen).
// Kapitel X ist langsam (grosse Suchräume): Pool 35–40 und ein grosszügiges Zeitlimit einplanen.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { CHAPTERS } from './chapters.mjs';
import { draw } from './show.mjs';
import { quality, passes, symOverlap } from './quality.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = join(here, '..', 'index.html');
const PER_CHAPTER = 10;
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
const jobs = Number(flag('--jobs', Math.max(1, Math.min(6, os.cpus().length - 2))));
const seed = Number(flag('--seed', 1));
const savePath = flag('--save', null);
const poolPath = flag('--pool', null);
const [chapterId, poolArg = '60'] = args;
const poolSize = Number(poolArg);
if (!Number.isInteger(jobs) || jobs < 1) die('--jobs braucht eine ganze Zahl ≥ 1');
if (!Number.isInteger(seed)) die('--seed braucht eine ganze Zahl');
if (!Number.isInteger(poolSize) || poolSize < PER_CHAPTER) die(`Poolgrösse muss eine ganze Zahl ≥ ${PER_CHAPTER} sein`);
const spec = CHAPTERS.find(c => c.id === chapterId && !c.handmade);
if (!spec) die('Kapitel unbekannt: ' + chapterId + ' – verfügbar: ' + CHAPTERS.filter(c => !c.handmade).map(c => c.id).join(', '));

// ---- Pool: gespeichert oder neu erzeugt (parallel über die Generator-CLI)
let pool;
if (poolPath) {
  pool = readFileSync(poolPath, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  console.error(`Kapitel ${chapterId} "${spec.title}": ${pool.length} Kandidaten aus ${poolPath}`);
} else {
  console.error(`Kapitel ${chapterId} "${spec.title}": erzeuge ${poolSize} Kandidaten mit ${jobs} Prozessen …`);
  const gen = spawnSync(process.execPath, [join(here, 'generate.mjs'), chapterId, String(poolSize), String(seed), '200000', '--jobs', String(jobs)],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (gen.error) die('Generator konnte nicht gestartet werden: ' + gen.error.message);
  process.stderr.write(gen.stderr || '');
  if (gen.status !== 0) die('Generator mit Fehler beendet (Status ' + gen.status + ')');
  pool = gen.stdout.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  if (pool.length < poolSize) console.error(`Achtung: nur ${pool.length} statt ${poolSize} Kandidaten erzeugt`);
  if (savePath) { writeFileSync(savePath, pool.map(g => JSON.stringify(g)).join('\n') + '\n'); console.error('Pool gespeichert: ' + savePath); }
}

// ---- Auswahl: 10 Zielwerte gleichmässig über die Kandidaten im Fenster (von der leichtesten bis zur
//      schwersten vorhandenen), je der nächstgelegene, ausreichend andere Kandidat
const [lo, hi] = spec.window;
// Qualität (auch für ältere Pools ohne gespeicherte Kennzahlen neu berechnen)
const rejected = new Map();
for (const g of pool) {
  g.quality = quality(g.level);
  for (const w of passes(g.quality)) rejected.set(w, (rejected.get(w) || 0) + 1);
}
const good = pool.filter(g => !passes(g.quality).length);
if (rejected.size) console.error(`${good.length} von ${pool.length} bestehen die Qualitätskriterien · ` + [...rejected].map(([k, v]) => `${k} ${v}`).join(', '));
const inWindow = good.filter(g => g.metrics.score >= lo && g.metrics.score <= hi);
console.error(`${inWindow.length} davon im Wertungsfenster ${lo}–${hi}`);
if (inWindow.length < PER_CHAPTER) {
  console.error('Wertungen im Pool: ' + pool.map(g => g.metrics.score).sort((a, b) => a - b).join(' '));
  die('Zu wenige Kandidaten im Fenster – grösseren Pool wählen oder die Vorgaben in chapters.mjs anpassen.', 2);
}
const scores = inWindow.map(g => g.metrics.score);
const sLo = Math.min(...scores), sHi = Math.max(...scores);
const step = (sHi - sLo) / (PER_CHAPTER - 1);
// Verschiedenheit: Überlappung gleicher Elemente auch unter Spiegelung/Drehung des Felds (gleiches Grundmuster)
const overlap = (a, b) => symOverlap(a.level, b.level);
const LIMITS = [0.5, 0.65, 0.8, 1.01]; // erst streng verschieden, dann lockerer (1.01: alles erlaubt)
const chosen = [];
for (let k = 0; k < PER_CHAPTER; k++) {
  const goal = sLo + step * k;
  const ranked = inWindow.filter(g => !chosen.includes(g)).sort((a, b) => Math.abs(a.metrics.score - goal) - Math.abs(b.metrics.score - goal));
  let pick, limit;
  for (limit of LIMITS) { pick = ranked.find(g => chosen.every(c => overlap(g, c) < limit)); if (pick) break; }
  if (limit > LIMITS[0]) console.error(`Hinweis: Level ${k + 1} nur mit gelockerter Verschiedenheit (Überlappung < ${limit})`);
  if (step && Math.abs(pick.metrics.score - goal) > step) console.error(`Hinweis: Level ${k + 1} liegt weit vom Zielwert ${goal.toFixed(1)} (Wertung ${pick.metrics.score}) – Pool dünn`);
  chosen.push(pick);
}
chosen.sort((a, b) => a.metrics.score - b.metrics.score);

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
  lines.push(`// Wertung ${m.score} · ${m.rotatable} drehbar · ${plural(m.targets, 'Ziel', 'Ziele')} · Rateschritte ${m.guesses} · Generator-Seed ${g.seed}`);
  const sorted = [...els].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.z - b.z || a.x - b.x);
  return [
    '  {',
    ...lines.map(l => '    ' + l),
    `    name: ${str(name)}, chapter: ${str(chapterId)},`,
    '    elements: [',
    ...sorted.map(e => `      ${elementCode(e)},`),
    '    ],',
    `    solution: { ${Object.entries(g.level.solution).map(([k, v]) => `${str(k)}: ${v}`).join(', ')} },`,
    '  },',
  ].join('\n');
}

chosen.forEach((g, i) => {
  const m = g.metrics;
  const q = g.quality;
  console.log(`\n=== ${i + 1}. ${spec.names[i]}  Wertung ${m.score} · drehbar ${m.rotatable} · ${plural(m.targets, 'Ziel', 'Ziele')} · Klicks ${m.clicks} · Rateschritte ${m.guesses} · Seed ${g.seed}`);
  console.log(`    Fläche ${q.area} · Quadranten ${q.quadrants} · Kreuzungen ${q.crossings} · Mehrfachtreffer ${q.multiHit} · geteilt ${q.shared} · Lockvögel ${q.decoysRead}`);
  const a = draw(g.level).split('\n'), b = draw(g.level, g.level.solution).split('\n');
  a.forEach((row, k) => console.log('   ' + row.padEnd(22) + '   ' + (b[k] || '')));
});

if (dry) { console.error('\n--dry: index.html unverändert'); process.exit(0); }
const html = readFileSync(indexPath, 'utf8');
const eol = html.includes('\r\n') ? '\r\n' : '\n'; // Zeilenenden der Datei übernehmen (core.autocrlf)
const code = chosen.map((g, i) => levelCode(g, spec.names[i])).join('\n').replace(/\n/g, eol);
const begin = `/* KAPITEL:${chapterId}:BEGIN */`, end = `/* KAPITEL:${chapterId}:END */`;
const a = html.indexOf(begin), b = html.indexOf(end);
if (a < 0 || b < a) die('Markierungen für Kapitel ' + chapterId + ' fehlen in index.html');
writeFileSync(indexPath, html.slice(0, a + begin.length) + eol + code + eol + '  ' + html.slice(b));
console.error(`\nKapitel ${chapterId} mit ${chosen.length} Leveln in index.html geschrieben.`);
