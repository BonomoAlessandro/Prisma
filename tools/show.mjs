// Zeigt Level als Textfeld: Startstellung und Lösung mit Strahlwegen, dazu Grad, drehbare Elemente, Ziele und Klicks
// und, wo sie vorliegt, die Beurteilung (Schwierigkeit, Spielwert, Kernideen; tools/beurteilung).
// Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs leicht --anzahl 3 | node tools/show.mjs
//                                  JSON-Zeilen von generiere.mjs, mit der Beurteilung des Generators
//         node tools/show.mjs --level 15        Level aus index.html: Platz in LEVELS ab 1, das Tutorial mitgezählt,
//                                               oder der Name des Levels
//         … --beurteilen                        beurteilt Level ohne mitgegebene Beurteilung (alle Regeln, mit ihrem
//                                               Grad; je Level bis einige Sekunden) und zeigt dazu die Ausschlussgründe
import { readFileSync } from 'node:fs';
import { L, clicksTo } from './solver.mjs';

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

/** Die Angaben der Beurteilung wie in den JSON-Zeilen von generiere.mjs, dazu die Ausschlussgründe. */
function angabenVon(b) {
  return {
    schwierigkeit: +b.schwierigkeit.wert.toFixed(1), spielwert: +b.spielwert.wert.toFixed(1),
    kernideen: [...new Set(b.kernideen.map(k => k.begriff))], hauptKernidee: b.hauptKernidee.begriff,
    ausschluesse: [...new Set(b.ausschluesse.map(a => a.begriff))],
  };
}

if (process.argv[1] && process.argv[1].endsWith('show.mjs')) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--level');
  const beurteilen = args.includes('--beurteilen');
  let items;
  if (i >= 0) {
    const was = args[i + 1];
    const level = /^\d+$/.test(was ?? '') ? L.LEVELS[+was - 1] : L.LEVELS.find(l => l.name === was);
    if (!level) {
      console.error(`Kein Level „${was}“: Platz 1–${L.LEVELS.length} in LEVELS (das Tutorial mitgezählt) oder Name`);
      process.exit(1);
    }
    items = [{ level }];
  } else items = readFileSync(0, 'utf8').trim().split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));
  const { beurteile, GRADE } = await import('./beurteilung/index.mjs');
  const zahl = (x) => String(x).replace('.', ',');
  for (const it of items) {
    const { level } = it;
    let angaben = 'schwierigkeit' in it ? it : null;
    if (!angaben && beurteilen) {
      angaben = angabenVon(beurteile(level, { grad: GRADE.includes(level.grad) ? level.grad : null, teuer: true }));
    }
    const brett = L.createBoard(level);
    const teile = [
      level.grad ? `Grad ${level.grad}` : level.tutorial ? 'Tutorial' : null,
      `drehbar ${brett.elements.filter(L.isRotatable).length}`,
      `Ziele ${brett.elements.filter(e => e.type === 'target').length}`,
      `Klicks ${clicksTo(level, level.solution)}`,
    ];
    if (angaben) {
      const ideen = angaben.kernideen.filter(k => k !== angaben.hauptKernidee);
      teile.push(`Schwierigkeit ${zahl(angaben.schwierigkeit)}`, `Spielwert ${zahl(angaben.spielwert)}`,
        `Haupt-Kernidee ${angaben.hauptKernidee ?? '–'}${ideen.length ? ` (dazu ${ideen.join(', ')})` : ''}`);
      if (angaben.ausschluesse?.length) teile.push(`Ausschluss: ${angaben.ausschluesse.join(', ')}`);
    }
    console.log(`\n=== ${level.name || 'Seed ' + it.seed}  ${teile.filter(Boolean).join(' · ')}`);
    const a = draw(level).split('\n'), bl = draw(level, level.solution).split('\n');
    console.log('   Start' + ' '.repeat(16) + '   Lösung');
    a.forEach((row, k) => console.log('   ' + row.padEnd(22) + '   ' + (bl[k] || '')));
  }
}
