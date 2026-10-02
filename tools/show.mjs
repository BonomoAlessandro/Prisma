// Zeigt Level als Textfeld: Startstellung und Lösung mit Strahlwegen.
// Aufruf: node tools/generate.mjs VI 3 | node tools/show.mjs     (JSON-Zeilen von generate.mjs)
//         node tools/show.mjs --level 9                             (Level aus index.html, 1-basiert)
import { readFileSync } from 'node:fs';
import { L, metrics } from './solver.mjs';

const SYM = { source: 'Q', mirror: 'M', prism: 'P', filter: 'F', combiner: 'K', blocker: '#', target: 'T' };
const COL = ' RGYBMCW';

export function draw(lvl, sol) {
  const els = lvl.elements.map(e => ({ ...e }));
  if (sol) for (const e of els) { const k = e.x + ',' + e.z; if (k in sol) { if (e.type === 'combiner') e.dir = sol[k]; else e.rot = sol[k]; } }
  const b = L.createBoard({ name: lvl.name, elements: els });
  const r = L.traceBeams(b);
  const g = Array.from({ length: b.size }, () => Array(b.size).fill(' .'));
  for (const s of r.segments) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(s.x1 - s.x0), Math.abs(s.z1 - s.z0))));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(s.x0 + (s.x1 - s.x0) * i / n), z = Math.round(s.z0 + (s.z1 - s.z0) * i / n);
      if (x >= 0 && z >= 0 && x < b.size && z < b.size) g[z][x] = ' ' + COL[s.color].toLowerCase();
    }
  }
  for (const e of b.elements) {
    const tag = e.type === 'target' || e.type === 'filter' ? COL[e.color]
      : e.type === 'source' ? e.dir : e.type === 'combiner' ? e.dir : e.type === 'blocker' ? '#' : e.rot % 4;
    g[e.z][e.x] = (e.fixed ? SYM[e.type].toLowerCase() : SYM[e.type]) + tag;
  }
  return g.map(row => row.join(' ')).join('\n') + `\n  gelöst: ${r.solved}`;
}

if (process.argv[1] && process.argv[1].endsWith('show.mjs')) {
  const i = process.argv.indexOf('--level');
  const items = i > 0
    ? [{ level: L.LEVELS[+process.argv[i + 1] - 1] }]
    : readFileSync(0, 'utf8').trim().split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));
  for (const it of items) {
    const m = it.metrics || metrics(it.level);
    console.log(`\n=== ${it.level.name || 'seed ' + it.seed}  drehbar ${m.rotatable} · Ziele ${m.targets} · Klicks ${m.clicks} · Suche ${m.search} · Rateschritte ${m.guesses} · Wertung ${m.score}`);
    const a = draw(it.level).split('\n'), bl = draw(it.level, m.solution).split('\n');
    console.log('   Start' + ' '.repeat(16) + '   Lösung');
    a.forEach((row, k) => console.log('   ' + row.padEnd(22) + '   ' + (bl[k] || '')));
  }
}
