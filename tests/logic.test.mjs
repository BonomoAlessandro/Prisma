// Testet die reine Spiellogik aus index.html (Bereich zwischen LOGIC:BEGIN und LOGIC:END).
// Aufruf: node tests/logic.test.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const begin = html.indexOf('/* LOGIC:BEGIN');
const end = html.indexOf('/* LOGIC:END');
assert.ok(begin > 0 && end > begin, 'LOGIC-Marker nicht gefunden');
const code = html.slice(begin, end);
const L = new Function(code + '\nreturn { DIRS, COLORS, EDGE_RUN, MIRROR_HALF_WIDTH, COLOR_NAMES, MAX_BOUNCES, reflectOnMirror, mirrorFrontNormal, refractInPrism, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS };')();

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}

const level = (elements, name = 'test') => L.createBoard({ name, elements });
const pathOf = (res) => res.segments.map(s => `${s.x0},${s.z0}>${s.x1},${s.z1}`).join(' | ');

console.log('Spiegel');
test('Diagonaler Spiegel lenkt Ost nach Süd', () => assert.equal(L.reflectOnMirror(0, 1), 2));
test('Gegendiagonale lenkt Ost nach Nord', () => assert.equal(L.reflectOnMirror(0, 3), 6));
test('Senkrechter Einfall wirft zurück', () => assert.equal(L.reflectOnMirror(2, 0), 6));
test('Parallel: keine Ablenkung', () => assert.equal(L.reflectOnMirror(0, 0), 0));
test('rot und rot+4 sind gleichwertig', () => {
  for (let d = 0; d < 8; d++) for (let r = 0; r < 4; r++) assert.equal(L.reflectOnMirror(d, r), L.reflectOnMirror(d, r + 4));
});
test('Diagonaler Strahl an waagrechtem Spiegel', () => assert.equal(L.reflectOnMirror(1, 0), 7));

console.log('Strahlverfolgung');
test('Gerader Strahl trifft Ziel', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'target', x: 5, z: 3 }]));
  assert.equal(r.segments.length, 1);
  assert.equal(r.solved, true);
  assert.deepEqual([r.segments[0].x1, r.segments[0].z1], [5, 3]);
});
test('Strahl ohne Hindernis läuft hinter der Feldkante aus', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'target', x: 0, z: 0 }]));
  assert.equal(r.segments[0].x1, 6.5 + L.EDGE_RUN);
  assert.equal(r.events.at(-1).kind, 'edge');
  assert.equal(r.solved, false);
});
test('Spiegel lenkt um 90° auf das Ziel', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6 },
  ]));
  assert.equal(r.solved, true, pathOf(r));
  assert.equal(r.segments.length, 2);
  assert.equal(r.events[0].kind, 'reflect');
  assert.equal(r.segments[1].dist0, 3);
});
test('Parallel stehender Spiegel schluckt das Licht an der Kante', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 0 },
    { type: 'target', x: 6, z: 3 },
  ]));
  assert.equal(r.solved, false, pathOf(r));
  assert.equal(r.events.at(-1).kind, 'absorb');
  assert.ok(Math.abs(r.segments.at(-1).x1 - (3 - L.MIRROR_HALF_WIDTH)) < 1e-9, pathOf(r));
});
test('Diagonaler Strahl parallel zum Diagonalspiegel endet an der Rahmenkante', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 0, dir: 1 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
  ]));
  const last = r.events.at(-1), seg = r.segments.at(-1);
  assert.equal(last.kind, 'absorb', pathOf(r));
  assert.equal(last.element, 1);
  const end = 3 - L.MIRROR_HALF_WIDTH / Math.SQRT2;
  assert.ok(Math.abs(seg.x1 - end) < 1e-9 && Math.abs(seg.z1 - end) < 1e-9, pathOf(r));
  assert.equal(seg.fade, undefined);
});
test('Nur Strahlen über die Feldkante laufen aus', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'target', x: 5, z: 3 }]));
  assert.equal(r.solved, true);
  assert.ok(r.segments.every(s => s.fade === undefined));
});
test('Quelle schluckt auftreffendes Licht', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 4, z: 3, rot: 2 }, // wirft zurück
  ]));
  assert.equal(r.events.at(-1).kind, 'absorb');
  assert.ok(r.segments.length <= 3);
});
test('Endlosschleife zwischen Spiegeln wird abgebrochen', () => {
  // Vier Spiegel bilden ein geschlossenes Rechteck. Mit Quellen allein ist so eine Schleife
  // nicht erreichbar (Spiegelabbildung ist umkehrbar, Quellen schlucken) – daher Strahl direkt einsetzen.
  const board = level([
    { type: 'mirror', x: 1, z: 1, rot: 3 }, // Nord → Ost
    { type: 'mirror', x: 5, z: 1, rot: 1 }, // Ost → Süd
    { type: 'mirror', x: 5, z: 5, rot: 3 }, // Süd → West
    { type: 'mirror', x: 1, z: 5, rot: 1 }, // West → Nord
  ]);
  const r = L.traceBeams(board, [{ x: 3, z: 1, dir: 0, color: 7 }]);
  assert.equal(r.truncated, true);
  assert.ok(r.segments.length >= 4 && r.segments.length <= 6, 'Segmente: ' + r.segments.length);
  assert.ok(r.events.every(e => e.kind === 'reflect'), 'Strahl hat die Schleife verlassen: ' + pathOf(r));
});
test('Diagonaler Strahl läuft über die Feldecke hinaus aus', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 0, dir: 1 }]));
  const run = 6.5 + L.EDGE_RUN / Math.SQRT2;
  assert.ok(Math.abs(r.segments[0].x1 - run) < 1e-9 && Math.abs(r.segments[0].z1 - run) < 1e-9);
});
test('Quelle am Rand, die nach aussen zeigt', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 4 }]));
  assert.equal(r.segments.length, 1);
  assert.equal(r.segments[0].x1, -0.5 - L.EDGE_RUN); // läuft über die Kante hinaus aus
  assert.equal(r.segments[0].fade, L.EDGE_RUN);
});
test('Diagonaler Treffer auf ein Ziel', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 6, dir: 7 }, { type: 'target', x: 4, z: 2 }]));
  assert.equal(r.solved, true);
});
test('Ziel verdeckt dahinterliegenden Spiegel', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'target', x: 2, z: 3 },
    { type: 'mirror', x: 4, z: 3, rot: 1 },
  ]));
  assert.equal(r.segments.length, 1);
  assert.ok(!r.events.some(e => e.kind === 'reflect'));
});
test('Diagonaler Strahl an Spiegel rot 1 (parallel) und rot 3 (Rückwurf)', () => {
  assert.equal(L.reflectOnMirror(1, 1), 1);
  assert.equal(L.reflectOnMirror(1, 3), 5);
});
test('Mischfarbe am Ziel: Rot + Blau = Magenta', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
    { type: 'target', x: 3, z: 3, color: 'magenta' },
  ]));
  assert.equal(r.hits.get(2), 5);
  assert.equal(r.solved, true);
});
test('Zusätzlicher falscher Strahl verdirbt das Ziel', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
    { type: 'target', x: 3, z: 3, color: 'red' },
  ]));
  assert.equal(r.solved, false);
});
test('Level ohne Ziele ist nie gelöst', () => {
  assert.equal(L.traceBeams(level([{ type: 'source', x: 0, z: 0 }])).solved, false);
});
test('fixed-Spiegel ist nicht drehbar, Ziele und Quellen nie', () => {
  const b = level([
    { type: 'mirror', x: 0, z: 0 }, { type: 'mirror', x: 1, z: 0, fixed: true },
    { type: 'source', x: 2, z: 0 }, { type: 'target', x: 3, z: 0 },
  ]);
  assert.deepEqual(b.elements.map(L.isRotatable), [true, false, false, false]);
});
test('Koordinaten ausserhalb und unbekannte Typen/Farben werfen Fehler', () => {
  assert.throws(() => level([{ type: 'mirror', x: 7, z: 0 }]));
  assert.throws(() => level([{ type: 'portal', x: 1, z: 1 }]));
  assert.throws(() => level([{ type: 'target', x: 1, z: 1, color: 'pink' }]));
});
test('dirToRotationY passt zu den Rasterrichtungen', () => {
  // three.js: Rotation um Y bildet (1,0,0) auf (cos θ, 0, −sin θ) ab
  for (let d = 0; d < 8; d++) {
    const th = L.dirToRotationY(d);
    const [dx, dz] = L.DIRS[d];
    const n = Math.hypot(dx, dz);
    assert.ok(Math.abs(Math.cos(th) - dx / n) < 1e-9 && Math.abs(-Math.sin(th) - dz / n) < 1e-9, 'Richtung ' + d);
  }
});
test('Weglänge ist über Reflexionen fortlaufend', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 0, dir: 1 },
    { type: 'mirror', x: 3, z: 3, rot: 2 },
    { type: 'target', x: 6, z: 6 },
  ]));
  for (let i = 1; i < r.segments.length; i++) {
    const p = r.segments[i - 1];
    assert.ok(Math.abs(p.dist0 + p.length - r.segments[i].dist0) < 1e-9);
  }
});
test('Doppelt belegte Zelle wirft Fehler', () => {
  assert.throws(() => level([{ type: 'source', x: 1, z: 1 }, { type: 'target', x: 1, z: 1 }]));
});
test('Ziel mit falscher Farbe zählt nicht', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0, color: 'red' }, { type: 'target', x: 5, z: 3, color: 'blue' }]));
  assert.equal(r.solved, false);
  assert.equal(r.hits.get(1), L.COLORS.red);
});

console.log('Schnittnormalen');
test('Spiegelnormale zeigt zum einfallenden Strahl', () => {
  for (let r = 0; r < 8; r++) for (let d = 0; d < 8; d++) {
    if (L.reflectOnMirror(d, r) === d) continue; // parallel: kein Treffer
    const [nx, nz] = L.mirrorFrontNormal(r, d);
    const [dx, dz] = L.DIRS[d];
    assert.ok(nx * dx + nz * dz < 0, `rot ${r}, dir ${d}`);
    // reflektierter Strahl verlässt auf derselben Seite
    const [ox, oz] = L.DIRS[L.reflectOnMirror(d, r)];
    assert.ok(nx * ox + nz * oz > 0, `ausgang rot ${r}, dir ${d}`);
  }
});
test('Segmente tragen Schnittnormalen (Spiegel: Fläche, sonst senkrecht)', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6 },
  ]));
  const [a, b] = r.segments;
  assert.deepEqual(a.n0, [1, 0]);                       // Quelle: nach vorn
  assert.deepEqual(a.n1.map(v => +v.toFixed(3)), [-0.707, 0.707]); // Spiegelfläche, Einfallsseite
  assert.deepEqual(b.n0, a.n1);
  assert.deepEqual(b.n1.map(v => +v.toFixed(3) + 0), [0, -1]);  // Ziel: senkrecht zum Strahl
  assert.deepEqual(r.events[0].normal, a.n1);
});

console.log('Prisma, Filter, Kombinator, Blocker');
const colorsAt = (r, kind) => r.events.filter(e => e.kind === kind).map(e => e.color).sort();
test('Prisma: jede Stellung nach vorn bewirkt etwas anderes', () => {
  // Licht von Westen (dir 0); rot = Fächerrichtung, Rot links (−1), Blau rechts (+1)
  assert.deepEqual(L.refractInPrism(0, 7, 0), [{ dir: 7, color: 1 }, { dir: 0, color: 2 }, { dir: 1, color: 4 }]);
  assert.deepEqual(L.refractInPrism(0, 7, 1), [{ dir: 0, color: 1 }, { dir: 1, color: 2 }, { dir: 2, color: 4 }]);
  assert.deepEqual(L.refractInPrism(0, 7, 2), [{ dir: 1, color: 1 }, { dir: 2, color: 2 }, { dir: 3, color: 4 }]);
  assert.deepEqual(L.refractInPrism(0, 7, 7), [{ dir: 6, color: 1 }, { dir: 7, color: 2 }, { dir: 0, color: 4 }]);
  assert.deepEqual(L.refractInPrism(0, 7, 6), [{ dir: 5, color: 1 }, { dir: 6, color: 2 }, { dir: 7, color: 4 }]);
  const all = [0, 1, 2, 6, 7].map(r => JSON.stringify(L.refractInPrism(0, 7, r)));
  assert.equal(new Set(all).size, 5);
});
test('Prisma bei schrägem Einfall', () => {
  // Licht nach Südost (dir 1)
  assert.deepEqual(L.refractInPrism(1, 7, 3), [{ dir: 2, color: 1 }, { dir: 3, color: 2 }, { dir: 4, color: 4 }]); // +90°
  assert.deepEqual(L.refractInPrism(1, 7, 7), [{ dir: 6, color: 1 }, { dir: 7, color: 2 }, { dir: 0, color: 4 }]); // −90°
  assert.deepEqual(L.refractInPrism(1, 7, 5), []); // nach hinten
});
test('Prisma nach hinten gedreht: kein Austritt', () => {
  for (const r of [3, 4, 5]) assert.deepEqual(L.refractInPrism(0, 7, r), []);
});
test('Grundfarbe läuft auf ihrer Fächerbahn, Mischfarbe zerfällt', () => {
  assert.deepEqual(L.refractInPrism(0, 1, 1), [{ dir: 0, color: 1 }]);
  assert.deepEqual(L.refractInPrism(0, 3, 0), [{ dir: 7, color: 1 }, { dir: 0, color: 2 }]);
});
test('Prisma ohne Austritt schluckt das Licht im Feld', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 4 },
  ]));
  assert.equal(r.segments.length, 1);
  assert.equal(r.events.at(-1).kind, 'absorb');
});
test('Prisma im Feld: drei farbige Ziele', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'target', x: 5, z: 0, color: 'red' },
    { type: 'target', x: 6, z: 3, color: 'green' },
    { type: 'target', x: 5, z: 6, color: 'blue' },
  ]));
  assert.equal(r.solved, true, pathOf(r));
  assert.equal(r.events.filter(e => e.kind === 'refract').length, 1);
});
test('Filter lässt nur seine Farbe durch', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'filter', x: 2, z: 3, color: 'yellow' },
    { type: 'target', x: 5, z: 3, color: 'yellow' },
  ]));
  assert.equal(r.solved, true);
  assert.equal(r.segments.at(-1).color, 3);
});
test('Filter ohne passende Farbe schluckt das Licht', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'filter', x: 2, z: 3, color: 'blue' },
    { type: 'target', x: 5, z: 3, color: 'red' },
  ]));
  assert.equal(r.solved, false);
  assert.equal(r.segments.length, 1);
  assert.equal(r.events.at(-1).kind, 'absorb');
});
test('Kombinator mischt additiv und strahlt in seine Richtung ab', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'target', x: 3, z: 0, color: 'magenta' },
  ]));
  assert.equal(r.solved, true, pathOf(r));
  assert.equal(r.mixes.get(2), 5);
  // Ausgang setzt die Weglänge des spätesten Eingangs fort
  const out = r.segments.find(s => s.x0 === 3 && s.z0 === 3);
  assert.equal(out.dist0, 3);
});
test('Kombinator-Kette: zweiter Kombinator bekommt die Mischung des ersten', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
    { type: 'source', x: 2, z: 6, dir: 6, color: 'green' },
    { type: 'combiner', x: 2, z: 1, dir: 2 },  // Rot (+ später Grün von unten?) → Süd
    { type: 'combiner', x: 2, z: 4, dir: 0 },  // erhält Grün von unten und die Ausgabe des ersten
    { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
    { type: 'target', x: 6, z: 4, color: 'white' },
  ]));
  // Kombinator 1: Rot + Blau = Magenta → Süd → Kombinator 2: + Grün = Weiss → Ost → Ziel
  assert.equal(r.mixes.get(2), 5);
  assert.equal(r.mixes.get(3), 7);
  assert.equal(r.solved, true, pathOf(r));
});
test('Rückkopplung über Spiegel endet im Fixpunkt', () => {
  // Ausgabe des Kombinators läuft über zwei Spiegel in ihn zurück
  const r = L.traceBeams(level([
    { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'mirror', x: 3, z: 1, rot: 1 },   // Nord → West
    { type: 'mirror', x: 1, z: 1, rot: 3 },   // West → Süd
    { type: 'mirror', x: 1, z: 3, rot: 1 },   // Süd → Ost → zurück in den Kombinator
  ]));
  assert.equal(r.mixes.get(1), 1);
  assert.ok(r.segments.length < 20);
});
test('Zwei Kombinatoren speisen sich gegenseitig ohne Quelle: kein Licht', () => {
  const r = L.traceBeams(level([
    { type: 'combiner', x: 1, z: 3, dir: 0 },
    { type: 'combiner', x: 5, z: 3, dir: 4 },
  ]));
  assert.equal(r.mixes.size, 0);
  assert.equal(r.segments.length, 0);
});
test('Lange Kombinator-Kette (> 8) wird vollständig durchgerechnet', () => {
  const els = [{ type: 'source', x: 0, z: 0, dir: 0, color: 'red' }];
  // Schlangenlinie durch das Feld: 12 Kombinatoren
  const path = [[1, 0, 2], [1, 1, 0], [2, 1, 0], [3, 1, 0], [4, 1, 2], [4, 2, 4], [3, 2, 4], [2, 2, 4], [1, 2, 2], [1, 3, 0], [2, 3, 0], [3, 3, 0]];
  for (const [x, z, dir] of path) els.push({ type: 'combiner', x, z, dir });
  els.push({ type: 'target', x: 6, z: 3, color: 'red' });
  const r = L.traceBeams(level(els));
  assert.equal(r.solved, true, pathOf(r));
  assert.equal(r.truncated, false);
  assert.equal(r.mixes.size, 12);
});
test('Rückkopplung verzögert den Kombinator-Ausgang nicht', () => {
  // Rot und Blau kommen bei 3 an; die Ausgabe läuft über drei Spiegel zurück in den Kombinator
  const r = L.traceBeams(level([
    { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'mirror', x: 3, z: 1, rot: 1 },   // Nord → West
    { type: 'mirror', x: 1, z: 1, rot: 3 },   // West → Süd
    { type: 'mirror', x: 1, z: 3, rot: 1 },   // Süd → Ost → zurück
  ]));
  assert.equal(r.mixes.get(2), 5, pathOf(r));
  const out = r.segments.find(s => s.x0 === 3 && s.z0 === 3);
  assert.equal(out.dist0, 3);
});
test('Filter: Weiss → Magenta, Cyan durch Gelb → Grün', () => {
  const a = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'filter', x: 2, z: 3, color: 'magenta' }]));
  assert.equal(a.segments.at(-1).color, 5);
  const b = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' }, { type: 'filter', x: 2, z: 3, color: 'yellow' }]));
  assert.equal(b.segments.at(-1).color, 2);
});
test('Prisma-Ausgänge: Feldkante, zweites Prisma, Blocker', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 1, dir: 0 },
    { type: 'prism', x: 1, z: 1, rot: 0 },      // Fächer geradeaus: Rot NO → Kante, Grün O, Blau SO
    { type: 'prism', x: 4, z: 1, rot: 0 },      // Grün läuft in Fächerrichtung weiter
    { type: 'blocker', x: 3, z: 3 },            // Blau SO über (2,2) auf (3,3)
  ]));
  assert.ok(r.events.some(e => e.kind === 'edge'));
  assert.equal(r.events.filter(e => e.kind === 'refract').length, 2);
  assert.ok(r.events.some(e => e.kind === 'absorb' && e.color === 4), pathOf(r));
});
test('Kombinator-Ausgang zurück zur Quelle wird dort geschluckt', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'green' },
    { type: 'combiner', x: 4, z: 3, dir: 4 },
  ]));
  assert.equal(r.mixes.get(1), 2);
  assert.equal(r.events.at(-1).kind, 'absorb');
});
test('Blocker schluckt das Licht', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'blocker', x: 3, z: 3 },
    { type: 'target', x: 6, z: 3 },
  ]));
  assert.equal(r.solved, false);
  assert.equal(r.events.at(-1).kind, 'absorb');
});
test('Prisma und Kombinator sind drehbar, Filter und Blocker nicht', () => {
  const b = level([
    { type: 'prism', x: 0, z: 0 }, { type: 'combiner', x: 1, z: 0 },
    { type: 'filter', x: 2, z: 0, color: 'red' }, { type: 'blocker', x: 3, z: 0 },
  ]);
  assert.deepEqual(b.elements.map(L.isRotatable), [true, true, false, false]);
});

console.log('Level');
L.LEVELS.forEach((lvl, i) => {
  test(`Level ${i + 1} "${lvl.name}" ist im notierten Lösungszustand gelöst`, () => {
    const r = L.traceBeams(L.createBoard(lvl));
    assert.equal(r.solved, true, pathOf(r));
  });
});

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}.`);
