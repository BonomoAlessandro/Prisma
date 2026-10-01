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
const L = new Function(code + '\nreturn { DIRS, COLORS, COLOR_NAMES, MAX_BOUNCES, reflectOnMirror, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS };')();

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
test('Strahl ohne Hindernis endet an der Feldkante', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'target', x: 0, z: 0 }]));
  assert.equal(r.segments[0].x1, 6.5);
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
test('Parallel stehender Spiegel wird durchquert', () => {
  const r = L.traceBeams(level([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 0 },
    { type: 'target', x: 6, z: 3 },
  ]));
  assert.equal(r.solved, true, pathOf(r));
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
test('Diagonaler Strahl endet in der Feldecke', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 0, dir: 1 }]));
  assert.deepEqual([r.segments[0].x1, r.segments[0].z1], [6.5, 6.5]);
});
test('Quelle am Rand, die nach aussen zeigt', () => {
  const r = L.traceBeams(level([{ type: 'source', x: 0, z: 3, dir: 4 }]));
  assert.equal(r.segments.length, 1);
  assert.equal(r.segments[0].x1, -0.5);
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

console.log('Level');
L.LEVELS.forEach((lvl, i) => {
  test(`Level ${i + 1} "${lvl.name}" ist im notierten Lösungszustand gelöst`, () => {
    const r = L.traceBeams(L.createBoard(lvl));
    assert.equal(r.solved, true, pathOf(r));
  });
});

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}.`);
