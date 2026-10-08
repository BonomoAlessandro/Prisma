// Testet die reine Spiellogik aus index.html (Bereich zwischen LOGIC:BEGIN und LOGIC:END).
// Aufruf: node tests/logic.test.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const begin = html.indexOf('/* LOGIC:BEGIN');
const end = html.indexOf('/* LOGIC:END');
assert.ok(begin > 0 && end > begin, 'LOGIC-Marker nicht gefunden');
const code = html.slice(begin, end);
const L = new Function(code + '\nreturn { DIRS, COLORS, EDGE_RUN, MIRROR_HALF_WIDTH, COLOR_NAMES, MAX_BOUNCES, reflectOnMirror, mirrorFrontNormal, refractInPrism, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS, TUTORIAL_COUNT };')();

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
test('Geschlossene Schleife zwischen Spiegeln endet ohne Abbruch', () => {
  // Vier Spiegel bilden ein geschlossenes Rechteck. Mit Quellen allein ist so eine Schleife
  // nicht erreichbar (Spiegelabbildung ist umkehrbar, Quellen schlucken) – daher Strahl direkt einsetzen.
  const board = level([
    { type: 'mirror', x: 1, z: 1, rot: 3 }, // Nord → Ost
    { type: 'mirror', x: 5, z: 1, rot: 1 }, // Ost → Süd
    { type: 'mirror', x: 5, z: 5, rot: 3 }, // Süd → West
    { type: 'mirror', x: 1, z: 5, rot: 1 }, // West → Nord
  ]);
  const r = L.traceBeams(board, [{ x: 3, z: 1, dir: 0, color: 7 }]);
  // Ein Strahl, der schon unterwegs ist, wird nicht ein zweites Mal verfolgt – die Schleife ist exakt
  assert.equal(r.truncated, false);
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
// Löser aus tools/solver.mjs: folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen.
const S = await import('../tools/solver.mjs');
const Q = await import('../tools/quality.mjs');
test('Löser stimmt mit stumpfem Durchprobieren überein (Lösungen und Fast-Lösungen)', () => {
  for (const lvl of L.LEVELS) {
    const b = L.createBoard(lvl);
    const space = b.elements.filter(L.isRotatable).reduce((n, el) => n * S.period(el), 1);
    if (space > 1 << 14) continue; // grosse Level nur mit dem schlauen Löser
    const bf = S.bruteForce(lvl), full = S.solve(lvl, { prune: false }), cut = S.solve(lvl);
    assert.equal(full.count, bf.count, lvl.name);
    assert.equal(full.near, bf.near, lvl.name);
    assert.equal(cut.count, bf.count, lvl.name + ' (mit Abschneiden)');
  }
});
test('Löser stimmt auf 300 zufälligen kleinen Feldern mit dem Durchprobieren überein', () => {
  // Fester Seed: reproduzierbar. Alle Elementtypen, auch drehbare Kombinatoren (Rückkopplung).
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  let checked = 0;
  for (let n = 0; n < 300; n++) {
    const size = int(4, 6), used = new Set(), els = [];
    const free = () => { for (;;) { const x = int(0, size - 1), z = int(0, size - 1); if (!used.has(x + ',' + z)) { used.add(x + ',' + z); return [x, z]; } } };
    const add = (e) => { const [x, z] = free(); els.push({ ...e, x, z }); };
    for (let i = int(1, 2); i > 0; i--) add({ type: 'source', dir: int(0, 7), color: rnd() < 0.7 ? 'white' : colors[int(0, 6)] });
    for (let i = int(1, 4); i > 0; i--) add({ type: 'mirror', rot: int(0, 3), fixed: rnd() < 0.2 });
    if (rnd() < 0.5) add({ type: 'prism', rot: int(0, 7) });
    if (rnd() < 0.4) add({ type: 'filter', color: colors[int(0, 5)] });
    if (rnd() < 0.4) add({ type: 'combiner', dir: int(0, 7) });
    if (rnd() < 0.3) add({ type: 'blocker' });
    for (let i = int(1, 2); i > 0; i--) add({ type: 'target', color: colors[int(0, 6)] });
    const lvl = { name: 'zufall ' + n, size, elements: els };
    const space = L.createBoard(lvl).elements.filter(L.isRotatable).reduce((m, el) => m * S.period(el), 1);
    if (space > 4096) continue;
    const bf = S.bruteForce(lvl);
    assert.equal(S.solve(lvl).count, bf.count, lvl.name + ' (mit Abschneiden)');
    const full = S.solve(lvl, { prune: false });
    assert.equal(full.count, bf.count, lvl.name);
    assert.equal(full.near, bf.near, lvl.name + ' (Fast-Lösungen)');
    checked++;
  }
  assert.ok(checked > 200, 'zu wenige Felder geprüft: ' + checked);
});
test('Zusammenlaufende Strahlen sind kein Abbruch', () => {
  // Zwei Strahlen treffen dasselbe Prisma aus verschiedenen Richtungen; ihre Farbanteile verlassen es
  // in denselben Richtungen. Der zweite wird nicht doppelt verfolgt – kein Abbruch, das Ergebnis ist exakt.
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },  // nach Ost
    { type: 'source', x: 3, z: 0, dir: 2 },  // nach Süd
    { type: 'prism', x: 3, z: 3, rot: 0 },   // Fächer nach Ost – für beide Einfallsrichtungen gleich
    { type: 'target', x: 6, z: 3, color: 'green' },
  ]));
  assert.ok(r.events.filter(e => e.kind === 'refract').length === 2, 'beide Strahlen treffen das Prisma');
  assert.equal(r.truncated, false);
  assert.equal(r.solved, true, pathOf(r));
});
test('Löser zählt Elemente ohne Licht als frei (mehrere Lösungen)', () => {
  const lvl = { name: 'frei', elements: [
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'target', x: 6, z: 3, color: 'white' },
    { type: 'mirror', x: 3, z: 0, rot: 1 }, // liegt abseits des Strahls
  ] };
  const r = S.solve(lvl);
  assert.equal(r.count, 4);
  assert.equal(r.solutions[0].free, 1);
});
const { NAMES, PROFILE_LEVELS } = await import('../tools/profiles.mjs');
const MAIN = L.LEVELS.slice(L.TUTORIAL_COUNT);
test('Tutorial: steht am Anfang, 3–10 Level (eine Seite), jedes mit Hinweis', () => {
  assert.ok(L.TUTORIAL_COUNT >= 3 && L.TUTORIAL_COUNT <= 10, 'Tutorial-Level: ' + L.TUTORIAL_COUNT);
  L.LEVELS.forEach((l, i) => assert.equal(!!l.tutorial, i < L.TUTORIAL_COUNT, `Level ${i + 1} "${l.name}"`));
  for (const l of L.LEVELS.slice(0, L.TUTORIAL_COUNT)) assert.ok(typeof l.hint === 'string' && l.hint.length > 10, l.name + ': Hinweis fehlt');
});
test('Tutorial: führt alle Elementarten ein', () => {
  const kinds = new Set(L.LEVELS.slice(0, L.TUTORIAL_COUNT).flatMap(l => l.elements.map(e => e.type + (e.fixed ? ':fest' : ''))));
  for (const k of ['mirror', 'mirror:fest', 'blocker', 'prism', 'filter', 'combiner']) assert.ok(kinds.has(k), k);
  assert.ok(L.LEVELS.slice(0, L.TUTORIAL_COUNT).some(l => l.elements.some(e => e.type === 'source' && e.color && e.color !== 'white')), 'farbige Quelle');
});
test('Nach dem Tutorial folgen genau die Level mit den vorgesehenen Namen', () => {
  assert.equal(MAIN.length, NAMES.length);
  assert.deepEqual(MAIN.map(l => l.name), NAMES);
});
test('Namen: die 80 vorgesehenen Namen sind eindeutig und passen zum Speicherschlüssel', () => {
  assert.equal(NAMES.length, 80);
  assert.equal(new Set(NAMES).size, NAMES.length, 'doppelte Namen in NAMES');
  const tutorial = L.LEVELS.slice(0, L.TUTORIAL_COUNT).map(l => l.name);
  assert.deepEqual(NAMES.filter(n => tutorial.includes(n)), [], 'gleich einem Tutorial-Namen');
  // die Migration alter Spielstände entfernt ein Präfix "II:" o. Ä. – ein Name darf so nicht beginnen
  assert.deepEqual(NAMES.filter(n => /^[IVX]+:/.test(n)), []);
});
test('Tutorial-Hinweise: nur bekannte Platzhalter', () => {
  for (const l of L.LEVELS.filter(q => q.tutorial)) assert.deepEqual(l.hint.replace(/\{(Klick|Rechtsklick)\}/g, '').match(/[{}]/g), null, l.name);
});
const { PROFILES } = await import('../tools/profiles.mjs');
test('Profile: eindeutige IDs der Form <stufe>-<mischung>', () => {
  assert.equal(new Set(PROFILES.map(p => p.id)).size, PROFILES.length);
  for (const p of PROFILES) assert.match(p.id, /^[1-9]-[a-z]+$/);
});
test('Namen: alle Level eindeutig', () => {
  const names = L.LEVELS.map(l => l.name);
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], 'doppelte Namen');
});
const SCORES = MAIN.map(l => S.metrics(l).score);
test('Die Level werden schwerer: Mittel der Wertung steigt von Zehnergruppe zu Zehnergruppe', () => {
  // Die genaue Reihenfolge stammt aus dem Review (zwei Tester, abgeglichen): Die Wertung überschätzt Level,
  // die in unabhängige Teilrätsel zerfallen, und unterschätzt Farblogik – einzelne Rückschritte sind gewollt.
  const means = [];
  for (let a = 0; a < SCORES.length; a += 10) means.push(SCORES.slice(a, a + 10).reduce((s, v) => s + v, 0) / SCORES.slice(a, a + 10).length);
  for (let b = 1; b < means.length; b++) assert.ok(means[b] > means[b - 1], 'Mittelwerte ' + means.map(m => m.toFixed(1)).join(' '));
  assert.ok(means.at(-1) - means[0] >= 15, 'zu wenig Spannweite: ' + means.map(m => m.toFixed(1)).join(' '));
});
test('Die Level ab 51 (tools/harden.mjs) sind alle schwerer als jedes der ersten 50', () => {
  const max = Math.max(...SCORES.slice(0, PROFILE_LEVELS));
  const easier = SCORES.map((v, i) => [MAIN[i].name, v]).slice(PROFILE_LEVELS).filter(([, v]) => v <= max);
  assert.deepEqual(easier, [], 'schwerstes der ersten 50: Wertung ' + max);
});
const { accepted } = await import('../tools/harden.mjs');
test('Die Level ab 51 bestehen die Abnahme von tools/harden.mjs (Quellen gekoppelt, Feld nicht zu dicht)', () => {
  const failed = MAIN.slice(PROFILE_LEVELS).filter(l => !accepted(l)).map(l => `${l.name} ${JSON.stringify(Q.density(l))}`);
  assert.deepEqual(failed, []);
});
test('Kein Filter gibt in der Lösung eine fremde Farbe ab (z. B. Cyan durch Gelbfilter → Grün)', () => {
  const odd = L.LEVELS.flatMap(l => Q.oddFilters(l).map(t => `${l.name}: ${t}`));
  assert.deepEqual(odd, []);
});
test('Die Level entsprechen der geprüften Auswahl (tools/selection.jsonl, gleiche Reihenfolge)', () => {
  const sel = readFileSync(new URL('../tools/selection.jsonl', import.meta.url), 'utf8').trim().split(/\r?\n/).map(l => JSON.parse(l));
  assert.equal(sel.length, MAIN.length);
  const sig = (els) => els.map(e => JSON.stringify([e.type, e.x, e.z, e.dir, e.rot, e.color === 'white' && e.type === 'source' ? undefined : e.color, !!e.fixed])).sort().join('|');
  MAIN.forEach((l, i) => assert.equal(sig(l.elements), sig(sel[i].level.elements), `Level ${i + 1} "${l.name}"`));
});
L.LEVELS.forEach((lvl, i) => {
  const tag = `Level ${i + 1} "${lvl.name}"`;
  test(`${tag}: Startstellung ist nicht gelöst`, () => {
    assert.equal(L.traceBeams(L.createBoard(lvl)).solved, false);
  });
  test(`${tag}: notierte Lösung löst das Level`, () => {
    const b = L.createBoard(lvl);
    const rot = b.elements.filter(L.isRotatable);
    assert.deepEqual(rot.map(el => el.x + ',' + el.z).sort(), Object.keys(lvl.solution).sort(), 'Lösung nennt nicht genau die drehbaren Elemente');
    for (const el of rot) S.setRot(el, lvl.solution[el.x + ',' + el.z]);
    const r = L.traceBeams(b);
    assert.equal(r.solved, true, pathOf(r));
  });
  test(`${tag}: Lösung ist eindeutig`, () => {
    const r = S.solve(lvl);
    assert.equal(r.aborted, false, 'Suche abgebrochen');
    assert.equal(r.count, 1, `${r.count} Lösungen`);
    const norm = (sol) => Object.fromEntries(Object.entries(sol).map(([k, v]) => {
      const el = L.createBoard(lvl).elements.find(e => e.x + ',' + e.z === k);
      return [k, v % S.period(el)];
    }));
    assert.deepEqual(norm(r.solutions[0].set), norm(lvl.solution));
  });
});

console.log('Offline');
{
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const swCode = readFileSync(join(root, 'sw.js'), 'utf8');
  const swList = swCode.match(/const FILES = \[([\s\S]*?)\];/);
  const swFiles = swList ? [...swList[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  // alles, was die Seite lädt: <script src>, <link href> (auch das per Skript eingefügte Manifest), CSS url(),
  // dazu die Icons aus dem Manifest
  const refs = new Set([
    ...[...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(m => m[1]),
    ...[...html.matchAll(/url\(\s*["']?([^"')]+)/g)].map(m => m[1]).filter(u => !u.startsWith('#') && !u.startsWith('data:')),
    ...JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8')).icons.map(i => i.src),
  ]);
  // existiert genau so geschrieben? (Windows ignoriert Gross-/Kleinschreibung, der Webserver nicht)
  const existsExactly = (path) => path.split('/').every((part, i, parts) => {
    const dir = join(root, ...parts.slice(0, i));
    return existsSync(dir) && readdirSync(dir).includes(part);
  });
  test('Offline: index.html lädt nichts von fremden Servern (keine http(s)-Adresse, auch nicht per Skript)', () => {
    assert.deepEqual(html.match(/https?:\/\/\S*/g) ?? [], []);
  });
  test('Offline: sw.js speichert alles, was index.html und das Manifest laden', () => {
    assert.ok(swFiles.length > 0, 'Liste FILES in sw.js nicht gefunden');
    assert.deepEqual([...refs].filter(r => !swFiles.includes(r)), []);
  });
  test('Offline: jede Datei aus sw.js existiert genau so geschrieben, keine doppelt', () => {
    assert.deepEqual(swFiles.filter(f => !existsExactly(f)), []);
    assert.deepEqual(swFiles.filter((f, i) => swFiles.indexOf(f) !== i), []);
  });
}

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}.`);
