// Qualitätskriterien für generierte Level (neben der Schwierigkeit aus solver.mjs).
// Misst, ob ein Level das Feld nutzt, ob seine Teile zusammenspielen und ob es sich von anderen
// unterscheidet. tools/curate.mjs filtert damit den Pool, bevor es nach Schwierigkeit auswählt.
import { L, solve, litCells, keyOf, setRot } from './solver.mjs';

const SIZE = 7;
const MID = (SIZE - 1) / 2;

/** Zellen, die ein Strahlabschnitt durchläuft (ohne Start/Ende), mit Richtung. */
function passCells(s) {
  const dx = Math.sign(Math.round((s.x1 - s.x0) * 1000)), dz = Math.sign(Math.round((s.z1 - s.z0) * 1000));
  const out = [];
  let x = s.x0 + dx, z = s.z0 + dz;
  while (x >= 0 && z >= 0 && x < SIZE && z < SIZE &&
    (Math.abs(x - s.x0) < Math.abs(s.x1 - s.x0) - 0.6 || Math.abs(z - s.z0) < Math.abs(s.z1 - s.z0) - 0.6)) {
    out.push({ k: x + ',' + z, dir: dx * 3 + dz });
    x += dx; z += dz;
  }
  return out;
}

/** Board in Lösungsstellung (optional nur mit bestimmten Quellen). */
function solvedBoard(level, onlySource = null) {
  const els = level.elements.filter(e => e.type !== 'source' || !onlySource || (e.x === onlySource.x && e.z === onlySource.z));
  const b = L.createBoard({ name: level.name, elements: els.map(e => ({ ...e })) });
  for (const el of b.elements.filter(L.isRotatable)) if (keyOf(el) in level.solution) setRot(el, level.solution[keyOf(el)]);
  return b;
}

/**
 * Kennzahlen:
 *   area       Fläche der Bounding-Box aller Elemente (Zellen)
 *   quadrants  Anzahl Quadranten mit Elementen (Mittelzeile/-spalte zählt zu beiden Seiten)
 *   edgeShare  Anteil der Elemente (ohne Quellen) am Feldrand
 *   crossings  Zellen, durch die die Lösung in zwei verschiedenen Richtungen läuft
 *   multiHit   Spiegel, die in der Lösung mehrfach getroffen werden (zwei Seiten oder zweimal)
 *   shared     drehbare Elemente, die in der Lösung Licht von mehr als einer Quelle bekommen
 *   coupled    alle Quellen hängen über gemeinsam erreichbare drehbare Elemente zusammen
 *              (über alle Stellungen; bei einer Quelle immer wahr)
 *   decoysRead feste Spiegel/Blocker abseits der Lösung, die in ≥ 10 % der Strahlbilder Licht bekommen
 *   interaction crossings + multiHit + shared
 */
export function quality(level) {
  const els = level.elements;
  const xs = els.map(e => e.x), zs = els.map(e => e.z);
  const area = (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...zs) - Math.min(...zs) + 1);
  const quads = new Set();
  for (const e of els) for (const qx of (e.x === MID ? [0, 1] : [e.x > MID ? 1 : 0])) for (const qz of (e.z === MID ? [0, 1] : [e.z > MID ? 1 : 0])) quads.add(qx + ',' + qz);
  // Quellen stehen immer am Rand (Generator) – sie zählen hier nicht mit
  const inner = els.filter(e => e.type !== 'source');
  const edgeShare = inner.filter(e => e.x === 0 || e.z === 0 || e.x === SIZE - 1 || e.z === SIZE - 1).length / Math.max(1, inner.length);
  const { crossings, multiHit, shared, r, b } = interplay(level);
  const sources = els.filter(e => e.type === 'source');
  const rotKeys = new Set(els.filter(e => L.isRotatable({ ...e, fixed: !!e.fixed })).map(e => e.x + ',' + e.z));
  let coupled = true;
  if (sources.length > 1) {
    const reach = sources.map(src => {
      const set = new Set();
      const lvl = { name: '', elements: els.filter(e => e.type !== 'source' || (e.x === src.x && e.z === src.z)) };
      const res = solve(lvl, { prune: false, maxNodes: 2e5, collect: 0, onLeaf: (rr, bb) => { for (const k of litCells(rr, bb)) if (rotKeys.has(k)) set.add(k); } });
      if (res.aborted) for (const k of rotKeys) set.add(k); // zu gross zum Prüfen: als gekoppelt werten
      return set;
    });
    // zusammenhängend über gemeinsame Elemente?
    const seen = new Set([0]), stack = [0];
    while (stack.length) {
      const i = stack.pop();
      reach.forEach((set, j) => { if (!seen.has(j) && [...set].some(k => reach[i].has(k))) { seen.add(j); stack.push(j); } });
    }
    coupled = seen.size === sources.length;
  }

  // Lockvögel: feste Elemente abseits der Lösung, die beim Probieren oft Licht bekommen
  const solLit = litCells(r, b);
  const decoys = els.filter(e => (e.type === 'blocker' || e.fixed) && !solLit.has(e.x + ',' + e.z));
  let decoysRead = 0;
  if (decoys.length) {
    const hits = new Map(decoys.map(e => [e.x + ',' + e.z, 0]));
    let leaves = 0;
    solve(level, { prune: false, maxNodes: 2e5, collect: 0, onLeaf: (rr, bb) => { leaves++; for (const k of litCells(rr, bb)) if (hits.has(k)) hits.set(k, hits.get(k) + 1); } });
    decoysRead = [...hits.values()].filter(n => n >= 0.1 * Math.max(1, leaves)).length;
  }
  return { area, quadrants: quads.size, edgeShare: +edgeShare.toFixed(2), crossings, multiHit, shared, coupled, decoysRead,
    interaction: crossings + multiHit + shared, oddFilters: oddFilters(level).length };
}

/**
 * Zusammenspiel in der Lösung – nur Strahlverfolgung, daher billig (tools/harden.mjs ruft es bei jedem Schritt):
 * Kreuzungen, Mehrfachtreffer und geteilte Elemente (siehe quality), dazu das gelöste Strahlbild r auf dem Board b.
 */
export function interplay(level) {
  const els = level.elements;
  // Lösung: Kreuzungen und Mehrfachtreffer
  const b = solvedBoard(level);
  const r = L.traceBeams(b);
  const dirsAt = new Map();
  for (const s of r.segments) for (const c of passCells(s)) { if (!dirsAt.has(c.k)) dirsAt.set(c.k, new Set()); dirsAt.get(c.k).add(c.dir); }
  const occupied = new Set(els.map(e => e.x + ',' + e.z));
  const crossings = [...dirsAt].filter(([k, d]) => !occupied.has(k) && new Set([...d].map(v => Math.abs(v))).size >= 2).length;
  const reflectCount = new Map();
  for (const e of r.events) if (e.kind === 'reflect') { const k = Math.round(e.x) + ',' + Math.round(e.z); reflectCount.set(k, (reflectCount.get(k) || 0) + 1); }
  const multiHit = [...reflectCount.values()].filter(n => n >= 2).length;

  // Quellen einzeln: welche drehbaren Elemente erreicht jede in der Lösung?
  const rotKeys = new Set(els.filter(e => L.isRotatable({ ...e, fixed: !!e.fixed })).map(e => e.x + ',' + e.z));
  const litBySource = els.filter(e => e.type === 'source').map(src => {
    const bs = solvedBoard(level, src);
    return new Set([...litCells(L.traceBeams(bs), bs)].filter(k => rotKeys.has(k)));
  });
  const shared = [...rotKeys].filter(k => litBySource.filter(set => set.has(k)).length >= 2).length;
  // Gruppen von Quellen, die über gemeinsam beleuchtete drehbare Elemente zusammenhängen (1 = alle gekoppelt)
  const group = litBySource.map((_, i) => i);
  const root = (i) => (group[i] === i ? i : (group[i] = root(group[i])));
  litBySource.forEach((a, i) => litBySource.forEach((c, j) => { if (j > i && [...a].some(k => c.has(k))) group[root(j)] = root(i); }));
  const groups = new Set(group.map((_, i) => root(i))).size;
  return { crossings, multiHit, shared, groups, r, b };
}

/**
 * Dichte in der Lösung: adjacent = Paare benachbarter drehbarer Elemente (auch diagonal) je drehbarem Element,
 * short = Anteil der Strahlabschnitte im Feld, die nur ein Feld weit laufen. Die ursprünglichen 50 Level liegen bei höchstens
 * 1.29 bzw. 0.9 (90 % bei höchstens 1.0 bzw. 0.67) – dichter wirkt das Feld wie ein Knäuel.
 */
export function density(level) {
  const rot = level.elements.filter(e => L.isRotatable({ ...e, fixed: !!e.fixed }));
  let adj = 0;
  for (let i = 0; i < rot.length; i++) for (let j = i + 1; j < rot.length; j++) {
    if (Math.max(Math.abs(rot[i].x - rot[j].x), Math.abs(rot[i].z - rot[j].z)) === 1) adj++;
  }
  const len = L.traceBeams(solvedBoard(level)).segments.filter(s => !s.fade).map(s => Math.max(Math.abs(s.x1 - s.x0), Math.abs(s.z1 - s.z0)));
  return { adjacent: +(adj / Math.max(1, rot.length)).toFixed(2), short: +(len.filter(l => l <= 1.01).length / Math.max(1, len.length)).toFixed(2) };
}

/**
 * Filter, die in der Lösung eine "fremde" Farbe abgeben – weder ihre eigene noch die eintreffende,
 * z. B. Cyan durch einen Gelbfilter → Grün. Physikalisch richtig, wirkt im Spiel aber falsch.
 * Die eintreffende Farbe: gleiche Stellung, der Filter durchlässig (weiss).
 */
export function oddFilters(level) {
  const trace = (open) => {
    const els = level.elements.map(e => (e === open ? { ...e, color: 'white' } : { ...e }));
    return L.traceBeams(solvedBoard({ ...level, elements: els }));
  };
  const out = [];
  for (const f of level.elements.filter(e => e.type === 'filter')) {
    const at = (r) => r.events.filter(e => e.kind === 'filter' && Math.round(e.x) === f.x && Math.round(e.z) === f.z).map(e => e.color);
    const fc = L.COLORS[f.color];
    for (const c of at(trace(f))) {
      const p = c & fc;
      if (p && p !== fc && p !== c) out.push(`${f.color}-Filter (${f.x},${f.z}): ${L.COLOR_NAMES[c]} → ${L.COLOR_NAMES[p]}`);
    }
  }
  return out;
}

/** Vorgaben für alle generierten Level (am Pool des früheren Kapitels II geprüft). */
export const QUALITY_RULES = {
  minArea: 25, minQuadrants: 3, maxEdgeShare: 0.6, edgeRuleBelowArea: 36, minInteractionOrDecoy: 1,
};
export function passes(q, rules = QUALITY_RULES) {
  const why = [];
  if (q.area < rules.minArea) why.push('zu klein');
  if (q.quadrants < rules.minQuadrants) why.push('zu wenige Quadranten');
  // randlastig ist nur bei kleinen Leveln ein Problem (dann klebt alles an einer Seite)
  if (q.edgeShare > rules.maxEdgeShare && q.area < rules.edgeRuleBelowArea) why.push('zu viel am Rand');
  if (!q.coupled) why.push('Quellen unabhängig');
  if (q.oddFilters) why.push('Filter gibt fremde Farbe ab');
  if (q.interaction + q.decoysRead < rules.minInteractionOrDecoy) why.push('kein Zusammenspiel');
  return why;
}

/** Überlappung zweier Level über alle 8 Spiegelungen/Drehungen des Felds (erkennt gleiche Grundmuster). */
const SYM = [
  (x, z) => [x, z], (x, z) => [SIZE - 1 - x, z], (x, z) => [x, SIZE - 1 - z], (x, z) => [SIZE - 1 - x, SIZE - 1 - z],
  (x, z) => [z, x], (x, z) => [SIZE - 1 - z, x], (x, z) => [z, SIZE - 1 - x], (x, z) => [SIZE - 1 - z, SIZE - 1 - x],
];
export function symOverlap(a, b) {
  const B = new Set(b.elements.map(e => e.type + ':' + e.x + ',' + e.z));
  let best = 0;
  for (const f of SYM) {
    let n = 0;
    for (const e of a.elements) { const [x, z] = f(e.x, e.z); if (B.has(e.type + ':' + x + ',' + z)) n++; }
    best = Math.max(best, n / Math.min(a.elements.length, b.elements.length));
  }
  return best;
}
