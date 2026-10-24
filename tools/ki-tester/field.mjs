// Das Feld eines Levels als Text für die KI-Tester: Raster, Elemente und Licht in der Startstellung, so wie ein
// Spieler es vor dem ersten Klick sieht. Ohne Lösung und ohne Namen (er verriete den Platz); an seiner Stelle steht die
// Kennung aus dem Auftrag. Ein Würfel-Level (dim: 3) Ebene für Ebene, mit Drehachsen und drei Koordinaten (cubeText);
// die flache Ausgabe hängt davon nicht ab.
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

/** Das Feld als Markdown; label ersetzt den Namen (zum Beispiel „L2“ oder „A3“). Ein Würfel-Level siehe cubeText. */
export function fieldText(level, label) {
  if (level.dim === 3) return cubeText(level, label);
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
  for (const t of targets) out.push(`- ${cell(t)} ${COLOR[t.color]}: ${targetState(t, r)}`);
  return out.join('\n') + '\n';
}

/** Was ein Ziel in der Startstellung bekommt (r: Strahlbild). */
function targetState(t, r) {
  const got = r.hits.get(t.id) || 0;
  if (!got) return 'bekommt kein Licht';
  return `bekommt ${COLOR[got]}, ${r.satisfied.has(t.id) ? 'erfüllt' : got & ~t.color ? 'falsche Farbe'
    : 'noch nicht genug'}`;
}

// Würfel (dim: 3): Koordinaten (x,y,z) mit y = Ebene (0 unten), Drehachse und Drehebene je Element, die 18 Richtungen
// als Wörter (Himmelsrichtung, oben oder unten, oder beides) und die Enden auf der Plattform (floor) und am Rand
// (edge). Die Richtungen der Elemente kommen aus planeDir wie in der Strahlregel. Pfeile gibt es hier nicht: ↑ heisst
// im flachen Feld Nord.
const AXIS = { y: 'Achse y (senkrecht)', x: 'Achse x (West–Ost)', z: 'Achse z (Nord–Süd)' };
const PLANE = { y: 'waagrecht, Ost/West und Nord/Süd', x: 'senkrecht, Nord/Süd und oben/unten',
  z: 'senkrecht, Ost/West und oben/unten' };
const AXIS_LINE = { y: 'unten–oben', x: 'West–Ost', z: 'Nord–Süd' };
const cell3 = (e) => `(${e.x},${e.y},${e.z})`;
const level3 = (y, top) => `Ebene y=${y}${y === 0 ? ' (auf der Plattform)' : y === top ? ' (oben)' : ''}`;

/** Himmelsrichtung, oben oder unten, oder beides: [1, 1, 0] heisst „Ost und oben“. */
function place(d) {
  const h = DIR.findIndex((_, i) => L.DIRS[i][0] === d[0] && L.DIRS[i][1] === d[2]);
  const v = d[1] > 0 ? 'oben' : d[1] < 0 ? 'unten' : '';
  return h < 0 ? v : v ? `${DIR[h]} und ${v}` : DIR[h];
}
const toward3 = (d) => `nach ${place(d)}`;
/** Eine Linie durch ±d, das Ende im Westen (sonst im Norden, sonst unten) zuerst: „West oben–Ost unten“. */
function line3(d) {
  const first = d[0] < 0 || (d[0] === 0 && (d[2] < 0 || (d[2] === 0 && d[1] < 0))) ? d : d.map(c => -c);
  const end = (p) => place(p).replace(' und ', ' ');
  return `${end(first)}–${end(first.map(c => -c))}`;
}

function code3(e) {
  const star = L.isRotatable(e) ? '*' : '';
  switch (e.type) {
    case 'source': return `Q${LETTER[e.color]}${e.axis}`;
    case 'mirror': return `S${e.axis}${star}`;
    case 'prism': return `P${e.axis}${star}`;
    case 'combiner': return `K${e.axis}${star}`;
    default: return code(e);
  }
}

/** Ein Element im Würfel: Art, drehbar oder fest, Drehachse und Stellung als Richtungen. */
function describe3(e) {
  const at = (k) => L.planeDir(e.axis, k), how = `${turn(e)}, ${AXIS[e.axis]}`;
  switch (e.type) {
    case 'source': return `Quelle ${COLOR[e.color]}, ${AXIS[e.axis]}, strahlt ${toward3(at(e.dir))}`;
    case 'mirror': return `Spiegel, ${how}, Fläche durch die Achse (${AXIS_LINE[e.axis]}) und ${line3(at(e.rot))}`;
    case 'prism': return `Prisma, ${how}, Farbfächer ${toward3(at(e.rot))} (weisses Licht: `
      + `Rot ${toward3(at(e.rot - 1))}, Grün ${toward3(at(e.rot))}, Blau ${toward3(at(e.rot + 1))})`;
    case 'combiner': return `Kombinator, ${how}, Ausgang ${toward3(at(e.dir))}`;
    default: return describe(e);
  }
}

/**
 * Ende eines Strahlabschnitts im Würfel (wie ending), mit dem Trenner davor; last: bei floor und edge die letzte Zelle
 * im Würfel („, endet auf der Plattform“, wenn der Abschnitt in ihr beginnt).
 */
function ending3(ev, el, from, last) {
  const bis = last.join() === from.join() ? ', ' : ` bis (${last.join(',')}), `;
  if (ev.kind === 'floor') return `${bis}endet auf der Plattform`;
  if (ev.kind === 'edge') return `${bis}verlässt den Würfel`;
  const text = ending(ev, el).replace(cell(el), cell3(el));
  // im Würfel schluckt ein Prisma auch Licht, das schräg zu seiner Drehebene läuft
  return ' ' + (ev.kind === 'absorb' && el.type === 'prism'
    ? text.replace('von hinten', 'von hinten oder schräg zur Drehebene') : text);
}

/**
 * Ein Würfel-Level als Markdown: Achsen und Koordinaten, Ebene für Ebene ein Raster (eine leere Ebene in einer Zeile),
 * jedes Element mit Zelle, Drehachse und Stellung, das Licht in der Startstellung in drei Koordinaten und die Ziele.
 */
function cubeText(level, label) {
  const board = L.createBoard({ name: label, dim: 3, size: level.size, elements: level.elements });
  const r = L.traceBeams(board);
  const n = board.size, top = n - 1;
  const els = [...board.elements].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
  const count = (f) => board.elements.filter(f).length;
  const targets = els.filter(e => e.type === 'target');
  const out = [`# Level ${label}`, '',
    `Würfel ${n} × ${n} × ${n} auf einer Plattform. Jede Zelle hat drei Koordinaten (x,y,z): Spalte x = 0 … `
    + `${top} von links nach rechts, Ebene y = 0 … ${top} von unten nach oben (Ebene 0 liegt auf der Plattform), `
    + `Zeile z = 0 … ${top} von hinten nach vorne (Zeile ${top} beim Spieler). Ost heisst nach rechts (+x), West `
    + 'nach links, Süd nach vorne (+z), Nord nach hinten, oben eine Ebene höher (+y), unten eine tiefer.', '',
    'Licht läuft von Zelle zu Zelle in 18 Richtungen: in den acht Richtungen einer Ebene (etwa „nach Ost“, '
    + '„nach Südost“), senkrecht („nach oben“, „nach unten“) und schräg zwischen den Ebenen, je Schritt eine Zelle '
    + 'in einer Himmelsrichtung und eine Ebene höher oder tiefer („nach Ost und oben“). Raumdiagonalen gibt es '
    + 'nicht. Licht, das unten aus dem Würfel läuft, endet auf der Plattform; seitlich oder oben verlässt es den '
    + 'Würfel.', '',
    'Drehachse: Spiegel, Prismen, Kombinatoren und Quellen haben eine feste Achse und wirken in der Ebene senkrecht '
    + 'dazu (Drehebene) wie im flachen Spiel; ein Klick dreht um 45° in der Drehebene. '
    + ['y', 'x', 'z'].map(a => `${AXIS[a]}: Drehebene ${PLANE[a]}.`).join(' ') + ' Ein Spiegel lenkt den Anteil '
    + 'des Lichts in seiner Drehebene um wie ein flacher Spiegel, der Anteil längs der Achse bleibt; läuft das '
    + 'Licht längs der Fläche, trifft es die Kante und wird geschluckt. Ein Prisma nimmt nur Licht aus seiner '
    + 'Drehebene an, das höchstens 90° von seinem Farbfächer abweicht. Ein Kombinator nimmt Licht aus jeder '
    + 'Richtung an.', '',
    `Drehbare Elemente: ${count(L.isRotatable)} · Quellen: ${count(e => e.type === 'source')} · `
    + `Ziele: ${targets.length} · in der Startstellung erfüllt: ${targets.filter(t => r.satisfied.has(t.id)).length} `
    + `von ${targets.length}`, '',
    '## Startstellung, Ebene für Ebene', ''];
  const head = '      ' + Array.from({ length: n }, (_, x) => `x=${x}`.padEnd(5)).join('').trimEnd();
  for (let y = 0; y < n; y++) {
    if (!els.some(e => e.y === y)) { out.push(`${level3(y, top)}: leer`, ''); continue; }
    out.push(`${level3(y, top)}:`, '', '```', head);
    for (let z = 0; z < n; z++) {
      out.push(`z=${z}   ` + Array.from({ length: n }, (_, x) => {
        const e = board.grid[(y * n + z) * n + x];
        return (e ? code3(e) : '·').padEnd(5);
      }).join('').trimEnd());
    }
    out.push('```', '');
  }
  out.push('Q Quelle (Farbe, Achse) · S Spiegel, P Prisma, K Kombinator (je mit Achse y, x oder z) · F Filter · '
    + 'Z Ziel · ## Block · * drehbar, ohne Stern fest. Farben: r rot, g grün, b blau, y gelb, m magenta, c cyan, '
    + 'w weiss. Richtungen und Stellungen stehen unter „Elemente“.', '', '## Elemente', '');
  for (const e of els) out.push(`- ${cell3(e)} ${describe3(e)}`);

  out.push('', '## Licht in der Startstellung', '');
  const used = new Set();
  const inside = (p) => p.every(c => c >= 0 && c < n);
  for (const s of r.segments) {
    const k = r.events.findIndex((ev, i) => !used.has(i) && ev.x === s.x1 && ev.y === s.y1 && ev.z === s.z1);
    used.add(k);
    const ev = r.events[k], out3 = ev.kind === 'edge' || ev.kind === 'floor';
    const d = [s.x1 - s.x0, s.y1 - s.y0, s.z1 - s.z0].map(Math.sign), from = [s.x0, s.y0, s.z0];
    // die letzte Zelle im Würfel: so weit, wie der nächste Schritt noch darin liegt (dazwischen ist alles leer)
    let last = from;
    while (out3 && inside(last.map((c, i) => c + d[i]))) last = last.map((c, i) => c + d[i]);
    const el = out3 ? null : board.grid[(Math.round(ev.y) * n + Math.round(ev.z)) * n + Math.round(ev.x)];
    out.push(`- ${COLOR[s.color]} von (${from.join(',')}) ${toward3(d)}${ending3(ev, el, from, last)}`);
  }
  if (!r.segments.length) out.push('- kein Licht');
  out.push('', 'Ziele:');
  for (const t of targets) out.push(`- ${cell3(t)} ${COLOR[t.color]}: ${targetState(t, r)}`);
  return out.join('\n') + '\n';
}
