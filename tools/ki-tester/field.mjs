// Das Feld eines Levels als Text für die KI-Tester: Raster, Elemente und Licht in der Startstellung, so wie ein
// Spieler es vor dem ersten Klick sieht. Ohne Lösung und ohne Namen (er verriete den Platz); an seiner Stelle steht die
// Kennung aus dem Auftrag.
import { L } from '../solver.mjs';

const COLOR = ['', 'rot', 'grün', 'gelb', 'blau', 'magenta', 'cyan', 'weiss'];
const LETTER = ' rgybmcw';
const ARROW = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
const DIR = ['Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest', 'Nord', 'Nordost'];
const LINE = ['-', '\\', '|', '/']; // Spiegelfläche je Stellung (rot und rot + 4 wirken gleich)
const SURFACE = ['waagrecht (West–Ost)', 'diagonal \\ (Nordwest–Südost)', 'senkrecht (Nord–Süd)',
  'diagonal / (Südwest–Nordost)'];

const cell = (e) => `(${e.x},${e.z})`;
const primaries = (c) => [1, 2, 4].filter(p => c & p).map(p => COLOR[p][0].toUpperCase() + COLOR[p].slice(1));
const and = (list) => (list.length > 1 ? list.slice(0, -1).join(', ') + ' und ' + list.at(-1) : list[0]);
const toward = (d) => `nach ${DIR[d]} ${ARROW[d]}`;
const turn = (e) => (L.isRotatable(e) ? 'drehbar' : 'fest');

function code(e) {
  const star = L.isRotatable(e) ? '*' : '';
  switch (e.type) {
    case 'source': return `Q${LETTER[e.color]}${ARROW[e.dir]}`;
    case 'mirror': return `S${LINE[e.rot % 4]}${star}`;
    case 'prism': return `P${ARROW[e.rot]}${star}`;
    case 'combiner': return `K${ARROW[e.dir]}${star}`;
    case 'filter': return `F${LETTER[e.color]}`;
    case 'target': return `Z${LETTER[e.color]}`;
    default: return '##';
  }
}

function describe(e) {
  switch (e.type) {
    case 'source': return `Quelle ${COLOR[e.color]}, strahlt ${toward(e.dir)}`;
    case 'mirror': return `Spiegel, ${turn(e)}, steht ${SURFACE[e.rot % 4]}`;
    case 'prism': return `Prisma, ${turn(e)}, Farbfächer ${toward(e.rot)}`;
    case 'combiner': return `Kombinator, ${turn(e)}, Ausgang ${toward(e.dir)}`;
    case 'filter': return `Filter ${COLOR[e.color]}, lässt ${primaries(e.color).length > 1 ? '' : 'nur '}${and(primaries(e.color))} durch`;
    case 'target': return `Ziel ${COLOR[e.color]}, braucht ${primaries(e.color).length > 1 ? 'genau ' : 'nur '}${and(primaries(e.color))}`;
    default: return 'Block, schluckt Licht';
  }
}

/** Was am Ende eines Strahlabschnitts geschieht (Ereignis der Strahlregel an derselben Stelle). */
function ending(ev, el) {
  const at = el ? cell(el) : '';
  switch (ev.kind) {
    case 'reflect': return `bis ${at}, Spiegel lenkt um`;
    case 'refract': return `bis ${at}, Prisma ${primaries(ev.color).length > 1 ? 'fächert auf' : 'lenkt um'}`;
    case 'filter': return `bis ${at}, Filter lässt ${COLOR[ev.color]} durch`;
    case 'merge': return `bis ${at}, in den Kombinator`;
    case 'hit': return `bis ${at}, trifft das Ziel`;
    case 'edge': return 'verlässt das Feld';
    default: return `bis ${at}, ${{
      mirror: 'streift den Spiegel längs und wird geschluckt', prism: 'trifft das Prisma von hinten und wird geschluckt',
      filter: 'Filter lässt nichts durch', source: 'Quelle schluckt es', blocker: 'Block schluckt es',
    }[el.type]}`;
  }
}

/** Das Feld als Markdown; label ersetzt den Namen (zum Beispiel „L2“ oder „A3“). */
export function fieldText(level, label) {
  const board = L.createBoard({ name: label, size: level.size, elements: level.elements });
  const r = L.traceBeams(board);
  const n = board.size, els = [...board.elements].sort((a, b) => a.z - b.z || a.x - b.x);
  const count = (f) => board.elements.filter(f).length;
  const targets = els.filter(e => e.type === 'target');
  const out = [`# Level ${label}`, '',
    `Feld ${n} × ${n}. Spalte x = 0 … ${n - 1} von links nach rechts, Zeile z = 0 … ${n - 1} von hinten nach vorne: Zeile 0 ` +
    `liegt im Bild oben, Zeile ${n - 1} unten beim Spieler. Nord ↑ heisst nach hinten (im Bild nach oben), Süd ↓ nach ` +
    'vorne, Ost → nach rechts, West ← nach links.', '',
    `Drehbare Elemente: ${count(L.isRotatable)} · Quellen: ${count(e => e.type === 'source')} · Ziele: ${targets.length} · ` +
    `in der Startstellung erfüllt: ${targets.filter(t => r.satisfied.has(t.id)).length} von ${targets.length}`, '',
    '## Startstellung', '', '```',
    '      ' + Array.from({ length: n }, (_, x) => `x=${x}`.padEnd(5)).join('').trimEnd()];
  for (let z = 0; z < n; z++) {
    out.push(`z=${z}   ` + Array.from({ length: n }, (_, x) => {
      const e = board.grid[z * n + x];
      return (e ? code(e) : '·').padEnd(5);
    }).join('').trimEnd());
  }
  out.push('```', '',
    'Q Quelle (Farbe, Richtung) · S Spiegel (Lage der Fläche) · P Prisma (Richtung des Farbfächers) · K Kombinator ' +
    '(Richtung des Ausgangs) · F Filter · Z Ziel · ## Block · * drehbar, ohne Stern fest. Farben: r rot, g grün, b blau, ' +
    'y gelb, m magenta, c cyan, w weiss.', '', '## Elemente', '');
  for (const e of els) out.push(`- ${cell(e)} ${describe(e)}`);

  out.push('', '## Licht in der Startstellung', '');
  const used = new Set();
  for (const s of r.segments) {
    const k = r.events.findIndex((ev, i) => !used.has(i) && ev.x === s.x1 && ev.z === s.z1);
    used.add(k);
    const ev = r.events[k];
    const el = ev.kind === 'edge' ? null : board.grid[Math.round(ev.z) * n + Math.round(ev.x)];
    const d = DIR.findIndex((_, i) => Math.sign(s.x1 - s.x0) === Math.sign(L.DIRS[i][0]) && Math.sign(s.z1 - s.z0) === Math.sign(L.DIRS[i][1]));
    out.push(`- ${COLOR[s.color]} von (${s.x0},${s.z0}) ${toward(d)} ${ending(ev, el)}`);
  }
  if (!r.segments.length) out.push('- kein Licht');
  out.push('', 'Ziele:');
  for (const t of targets) {
    const got = r.hits.get(t.id) || 0;
    out.push(`- ${cell(t)} ${COLOR[t.color]}: ` + (!got ? 'bekommt kein Licht'
      : `bekommt ${COLOR[got]}, ${r.satisfied.has(t.id) ? 'erfüllt' : got & ~t.color ? 'falsche Farbe' : 'noch nicht genug'}`));
  }
  return out.join('\n') + '\n';
}
