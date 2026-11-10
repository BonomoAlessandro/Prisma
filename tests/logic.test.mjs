// Testet die reine Spiellogik aus index.html (Bereich zwischen LOGIC:BEGIN und LOGIC:END).
// Die Level, an denen sie die Strahlregel und den Löser prüft (Lösung, Eindeutigkeit, Würfel, Vergleiche), kommen aus
// Spiel und Vorrat (ALLE im gemeinsamen Lader tools/lader.mjs, Spec .scratch/noa-geschichte/); das Tutorial aus dem
// Spiel.
// Aufruf: node tests/logic.test.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { loadSkies, checkSkies, layerTypes, boardTypes, codeSkies, orphans, runCode } from '../tools/sky-schema.mjs';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const begin = html.indexOf('/* LOGIC:BEGIN');
const end = html.indexOf('/* LOGIC:END');
assert.ok(begin > 0 && end > begin, 'LOGIC-Marker nicht gefunden');
const code = html.slice(begin, end);
const L = new Function(code + '\nreturn { DIRS, COLORS, EDGE_RUN, MIRROR_HALF_WIDTH, COLOR_NAMES, MAX_BOUNCES, reflectOnMirror, mirrorFrontNormal, refractInPrism, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS, TUTORIAL_COUNT, LEVELS_3D, AXES, MIRROR_HALF_HEIGHT, planeDir, reflect3, refractInPrism3, mirrorFrontNormal3, pickTapped, mod8, SCHRITTE_MAX, SCHRITT_WEITER, SCHRITT_PLATZHALTER, NEBENBEI, geraeteText, schrittErfuellt, schrittGeste, strahlTrifft, inLoesung, fingerzeigZiel };')();

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

console.log('Antippen (Weigerung)');
{
  // Kandidaten wie in pickElement: hit = Abstand des Strahls zum Trefferzylinder (oder null), px = Abstand der Mitte
  const spiegel = { type: 'mirror', x: 3, z: 3 }, prisma = { type: 'prism', x: 4, z: 3 };
  const quelle = { type: 'source', x: 3, z: 4 }, festerSpiegel = { type: 'mirror', x: 2, z: 3, fixed: true };
  const c = (el, hit, px = Infinity) => ({ el, hit, px });
  test('Festes Element allein getroffen: es ist gemeint', () => {
    assert.equal(L.pickTapped([c(quelle, 5)]), quelle);
    assert.equal(L.pickTapped([c(festerSpiegel, 5)], 26), festerSpiegel);
  });
  test('Drehbares getroffen gewinnt gegen ein festes davor', () => {
    assert.equal(L.pickTapped([c(quelle, 4), c(spiegel, 6)]), spiegel);
    assert.equal(L.pickTapped([c(festerSpiegel, 4), c(spiegel, 6)], 26), spiegel);
  });
  test('Drehbares im Toleranzbereich gewinnt gegen ein getroffenes festes (Handy, touchSlop)', () => {
    assert.equal(L.pickTapped([c(quelle, 5), c(quelle, null, 3), c(spiegel, null, 20)], 26), spiegel);
  });
  test('Drehbares ausserhalb des Toleranzbereichs: das feste ist gemeint', () => {
    assert.equal(L.pickTapped([c(quelle, 5), c(quelle, null, 3), c(spiegel, null, 30)], 26), quelle);
    assert.equal(L.pickTapped([c(quelle, 5), c(spiegel, null, 20)], 0), quelle); // Maus: ohne Toleranz
  });
  test('Unter Drehbaren: das vorderste getroffene, sonst das nächste', () => {
    assert.equal(L.pickTapped([c(spiegel, 7), c(prisma, 5)]), prisma);
    assert.equal(L.pickTapped([c(spiegel, 7), c(prisma, null, 2)], 26), spiegel);
    assert.equal(L.pickTapped([c(spiegel, null, 12), c(prisma, null, 9)], 26), prisma);
  });
  test('Nichts in Reichweite: keines', () => {
    assert.equal(L.pickTapped([]), null);
    assert.equal(L.pickTapped([c(quelle, null, 40), c(spiegel, null, 30)], 26), null);
  });
}

console.log('Level');
// Löser aus tools/solver.mjs: folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen.
const S = await import('../tools/solver.mjs');
// Alle Level aus Spiel und Vorrat (siehe Kopf)
const { ALLE } = await import('../tools/lader.mjs');
// Modus unique (nur die Eindeutigkeit gefragt): Bei höchstens einer Lösung liefert er dasselbe wie dieselbe Suche ohne
// ihn (ref), sonst hält er bei der zweiten Lösung an: mit den ersten Lösungen von ref und höchstens so vielen Knoten.
// Rückgabe: gesparte Knoten.
function checkUnique(lvl, bf, ref, opts, name) {
  const u = S.solve(lvl, { ...opts, unique: true });
  if (bf.count <= 1) { assert.deepEqual(u, ref, name); return 0; }
  assert.deepEqual(u.solutions, ref.solutions.slice(0, ref.solutions[0].free ? 1 : 2), name);
  assert.ok(u.count >= 2 && u.count <= bf.count && u.nodes <= ref.nodes && !u.aborted, `${name}: ${u.count} Lösungen, ${u.nodes} Knoten`);
  return ref.nodes - u.nodes;
}
// Der Löser lässt die Verfolgung am offenen Element weitermachen, statt von vorn zu beginnen. Jedes Blatt muss genau das
// Strahlbild liefern, das eine Verfolgung von vorn auf derselben Stellung ergibt.
const sameAsFresh = (name) => (r, board) => assert.deepStrictEqual(r, L.traceBeams(board), name + ' (Blatt wie von vorn)');
/** Anzahl Gesamtstellungen der drehbaren Elemente. */
const spaceOf = (lvl) => L.createBoard(lvl).elements.filter(L.isRotatable).reduce((m, el) => m * S.period(el), 1);
test('Löser stimmt mit stumpfem Durchprobieren überein (Lösungen und Fast-Lösungen, auch im Modus unique)', () => {
  for (const lvl of ALLE.LEVELS) {
    if (spaceOf(lvl) > 1 << 14) continue; // grosse Level nur mit dem schlauen Löser
    const bf = S.bruteForce(lvl), full = S.solve(lvl, { prune: false, onLeaf: sameAsFresh(lvl.name) }), cut = S.solve(lvl);
    assert.equal(full.count, bf.count, lvl.name);
    assert.equal(full.near, bf.near, lvl.name);
    assert.equal(cut.count, bf.count, lvl.name + ' (mit Abschneiden)');
    checkUnique(lvl, bf, cut, {}, lvl.name + ' (Modus unique)');
    checkUnique(lvl, bf, full, { prune: false }, lvl.name + ' (Modus unique ohne Abschneiden)');
  }
});
/**
 * Zufällige kleine Felder mit allen Elementtypen, auch drehbaren Kombinatoren (Rückkopplung); fester Seed.
 * combiners: [min, max] zusätzliche Kombinatoren, drehbar oder fest (mehrere Durchläufe der Verfolgung).
 */
function* randomFields(seed, count, combiners = null) {
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  for (let n = 0; n < count; n++) {
    const size = int(4, 6), used = new Set(), els = [];
    const free = () => { for (;;) { const x = int(0, size - 1), z = int(0, size - 1); if (!used.has(x + ',' + z)) { used.add(x + ',' + z); return [x, z]; } } };
    const add = (e) => { const [x, z] = free(); els.push({ ...e, x, z }); };
    for (let i = int(1, 2); i > 0; i--) add({ type: 'source', dir: int(0, 7), color: rnd() < 0.7 ? 'white' : colors[int(0, 6)] });
    for (let i = int(1, 4); i > 0; i--) add({ type: 'mirror', rot: int(0, 3), fixed: rnd() < 0.2 });
    if (rnd() < 0.5) add({ type: 'prism', rot: int(0, 7) });
    if (rnd() < 0.4) add({ type: 'filter', color: colors[int(0, 5)] });
    if (rnd() < 0.4) add({ type: 'combiner', dir: int(0, 7) });
    for (let i = combiners ? int(...combiners) : 0; i > 0; i--) add({ type: 'combiner', dir: int(0, 7), fixed: rnd() < 0.5 });
    if (rnd() < 0.3) add({ type: 'blocker' });
    for (let i = int(1, 2); i > 0; i--) add({ type: 'target', color: colors[int(0, 6)] });
    yield { name: 'zufall ' + n, size, elements: els };
  }
}
/** Löser (mit und ohne Abschneiden, auch im Modus unique) gegen das Durchprobieren; Rückgabe: Lösungen, gesparte Knoten. */
function compareWithBruteForce(lvl) {
  const bf = S.bruteForce(lvl);
  const cut = S.solve(lvl);
  assert.equal(cut.count, bf.count, lvl.name + ' (mit Abschneiden)');
  const full = S.solve(lvl, { prune: false, onLeaf: sameAsFresh(lvl.name) });
  assert.equal(full.count, bf.count, lvl.name);
  assert.equal(full.near, bf.near, lvl.name + ' (Fast-Lösungen)');
  const saved = checkUnique(lvl, bf, cut, {}, lvl.name + ' (Modus unique)')
    + checkUnique(lvl, bf, full, { prune: false }, lvl.name + ' (Modus unique ohne Abschneiden)');
  return { count: bf.count, saved };
}
test('Löser stimmt auf 300 zufälligen kleinen Feldern mit dem Durchprobieren überein (auch im Modus unique)', () => {
  let checked = 0;
  for (const lvl of randomFields(12345, 300)) {
    if (spaceOf(lvl) > 4096) continue;
    compareWithBruteForce(lvl);
    checked++;
  }
  assert.ok(checked > 200, 'zu wenige Felder geprüft: ' + checked);
});
test('Löser stimmt auf Zufallsfeldern mit mehreren Kombinatoren mit dem Durchprobieren überein, Blätter wie von vorn', () => {
  // Mehrere Kombinatoren, drehbar und fest: Die Verfolgung hält auch beim Abschicken der Startstrahlen und in späteren
  // Durchläufen an und macht dort weiter.
  let checked = 0;
  for (const lvl of randomFields(2468, 300, [2, 3])) {
    if (spaceOf(lvl) > 4096) continue;
    compareWithBruteForce(lvl);
    checked++;
  }
  assert.ok(checked > 100, 'zu wenige Felder geprüft: ' + checked);
});
test('Löser: Weitermachen, wenn ein Kombinator vor und nach dem Anhalten Licht bekommt', () => {
  // Rot erreicht den Kombinator, bevor Grün am offenen Spiegel (3,5) anhält; mit Stellung 1 lenkt der Spiegel Grün in
  // denselben Kombinator. Die Geschwister mit Stellung 2 und 3 dürfen davon nichts sehen. Im zweiten Durchlauf hält die
  // Verfolgung beim Abschicken am drehbaren Kombinator an. Nach Norden läuft sein Ausgang über drei feste Spiegel in ihn
  // zurück: Eine verfälschte Mischung hielte sich dort, statt im nächsten Durchlauf zu verschwinden.
  const lvl = { name: 'Kombinator vor und nach dem Anhalten', elements: [
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
    { type: 'combiner', x: 3, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 5, rot: 0 },
    { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
    { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
    { type: 'mirror', x: 5, z: 3, rot: 3, fixed: true },
  ] };
  const r = S.solve(lvl, { prune: false, onLeaf: sameAsFresh(lvl.name) });
  assert.equal(r.leaves, 32);
});
test('Löser stimmt auf zufälligen lösbaren Feldern mit dem Durchprobieren überein (auch im Modus unique)', () => {
  // Fast alle Zufallsfelder oben sind unlösbar. Hier bekommen die Ziele die Farbe, die in der zufälligen Startstellung
  // ankommt (Ziele ohne Licht fallen weg): Diese Stellung löst das Feld. Drehbare Elemente ohne Licht vervielfachen die
  // Lösungen; ein Feld mit solchen wird auch ohne sie geprüft (dann meist nur eine Lösung).
  let one = 0, several = 0, saved = 0;
  for (const field of randomFields(54321, 300)) {
    const b = L.createBoard(field), start = L.traceBeams(b), lit = S.litCells(start, b);
    const dark = (e, i) => L.isRotatable(b.elements[i]) && !lit.has(e.x + ',' + e.z);
    for (const withDark of field.elements.some(dark) ? [true, false] : [true]) {
      const elements = [];
      field.elements.forEach((e, i) => {
        if (!withDark && dark(e, i)) return;
        if (e.type !== 'target') elements.push(e);
        else if (start.hits.get(i)) elements.push({ ...e, color: L.COLOR_NAMES[start.hits.get(i)] });
      });
      const lvl = { ...field, elements };
      if (!elements.some(e => e.type === 'target') || spaceOf(lvl) > 4096) continue;
      const r = compareWithBruteForce(lvl);
      saved += r.saved;
      if (r.count === 1) one++;
      if (r.count > 1) several++;
    }
  }
  assert.ok(one > 20 && several > 20 && saved > 0, `${one} Felder mit einer Lösung, ${several} mit mehreren, ${saved} Knoten gespart`);
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
test('Tutorial: steht am Anfang, 3–10 Level (eine Seite), jedes mit Schritten statt Hinweis', () => {
  assert.ok(L.TUTORIAL_COUNT >= 3 && L.TUTORIAL_COUNT <= 10, 'Tutorial-Level: ' + L.TUTORIAL_COUNT);
  L.LEVELS.forEach((l, i) => assert.equal(!!l.tutorial, i < L.TUTORIAL_COUNT, `Level ${i + 1} "${l.name}"`));
  // seit Ticket 03 der Führung: jede Übung hat Schritte, keine einen Hinweis
  for (const l of L.LEVELS.slice(0, L.TUTORIAL_COUNT)) {
    assert.ok(l.hint === undefined && l.schritte?.length > 0, l.name + ': Schritte statt Hinweis');
  }
});
test('Tutorial: führt alle Elementarten ein', () => {
  const kinds = new Set(L.LEVELS.slice(0, L.TUTORIAL_COUNT).flatMap(l => l.elements.map(e => e.type + (e.fixed ? ':fest' : ''))));
  for (const k of ['mirror', 'mirror:fest', 'blocker', 'prism', 'filter', 'combiner']) assert.ok(kinds.has(k), k);
  assert.ok(L.LEVELS.slice(0, L.TUTORIAL_COUNT).some(l => l.elements.some(e => e.type === 'source' && e.color && e.color !== 'white')), 'farbige Quelle');
});
test('Tutorial-Schritte: nur bekannte Platzhalter', () => {
  // die Befehlsform aus SCHRITT_PLATZHALTER
  const schritt = new RegExp(Object.keys(L.SCHRITT_PLATZHALTER).map(p => p.replace(/[{}]/g, '\\$&')).join('|'), 'g');
  for (const l of L.LEVELS.filter(q => q.tutorial)) {
    for (const t of l.schritte.map(s => s.text.replace(schritt, ''))) assert.deepEqual(t.match(/[{}]/g), null, `${l.name}: «${t}»`);
  }
});

console.log('Führung im Dorf (Schritte)');
{
  const gefuehrt = L.LEVELS.slice(0, L.TUTORIAL_COUNT).filter(l => l.schritte);
  const wort = (t) => t.split(/\s+/).filter(Boolean).length;
  const am = (l, z) => l.elements.find(e => `${e.x},${e.z}` === z);
  test('Schritte: alle Übungen geführt', () => assert.equal(gefuehrt.length, L.TUTORIAL_COUNT));
  test('Schritte: höchstens drei, je ein Satz von etwa zwölf Wörtern, auf beiden Geräten', () => {
    for (const l of gefuehrt) {
      assert.ok(l.schritte.length >= 1 && l.schritte.length <= L.SCHRITTE_MAX, `${l.name}: ${l.schritte.length} Schritte`);
      for (const s of l.schritte) for (const touch of [true, false]) {
        const t = L.geraeteText(s.text, touch);
        assert.ok(wort(t) >= 3 && wort(t) <= 14 && t.length <= 90, `${l.name}: «${t}» (${wort(t)} Wörter)`);
        assert.ok(/[.!?]$/.test(t) && !/[.!?] \S/.test(t), `${l.name}: ein Satz «${t}»`);
      }
    }
  });
  test('Schritte: was weiterschaltet ist bekannt, das Element dazu steht auf dem Brett', () => {
    for (const l of gefuehrt) for (const s of l.schritte) {
      assert.ok(L.SCHRITT_WEITER.includes(s.weiter), `${l.name}: weiter «${s.weiter}»`);
      const zellen = s.bei === undefined ? [] : [].concat(s.bei);
      if (s.weiter !== 'erklaerung') assert.ok(zellen.length > 0, `${l.name}: «${s.text}» ohne Element`);
      for (const z of zellen) assert.ok(am(l, z), `${l.name}: kein Element bei ${z}`);
      if (s.weiter === 'drehen') for (const z of zellen) assert.ok(L.isRotatable(am(l, z)), `${l.name}: ${z} nicht drehbar`);
      // richtung: bei «drehen» die Richtung, bei «strahl» mit trifft nur die Geste der Hand
      if (s.richtung !== undefined) {
        assert.ok((s.weiter === 'drehen' || s.trifft) && [1, -1].includes(s.richtung), `${l.name}: richtung`);
      }
      // trifft: nur bei «strahl», eine Zelle auf dem Brett; bei ist dann das drehbare Element, das dafür zu drehen ist
      if (s.trifft !== undefined) {
        assert.ok(s.weiter === 'strahl' && typeof s.trifft === 'string' && am(l, s.trifft), `${l.name}: trifft ${s.trifft}`);
        for (const z of zellen) assert.ok(L.isRotatable(am(l, z)), `${l.name}: ${z} nicht drehbar`);
      }
      // farbe: nur bei «strahl», eine Farbe aus COLORS (Ticket 04: «Mischung» wartet auf Magenta im Kombinator)
      if (s.farbe !== undefined) {
        assert.ok(s.weiter === 'strahl' && s.farbe in L.COLORS, `${l.name}: farbe ${s.farbe}`);
        // lichtBei kennt Farben nur am Kombinator (Mischung) und am Ziel (Treffer); sonst schaltete der Schritt nie
        for (const z of s.trifft === undefined ? zellen : [s.trifft]) {
          assert.ok(['combiner', 'target'].includes(am(l, z).type), `${l.name}: farbe an ${z} (${am(l, z).type})`);
        }
      }
    }
  });
  test('Schritte: ein festes Element zum Antippen hat kein drehbares im Nachbarfeld (Handy: das drehbare gewönne)', () => {
    for (const l of gefuehrt) for (const s of l.schritte.filter(q => q.weiter === 'antippen')) {
      for (const z of [].concat(s.bei)) {
        const f = am(l, z);
        if (!f.fixed) continue;
        const nah = l.elements.filter(e => e !== f && !e.fixed && ['mirror', 'prism', 'combiner'].includes(e.type)
          && Math.max(Math.abs(e.x - f.x), Math.abs(e.z - f.z)) <= 1);
        assert.deepEqual(nah.map(e => `${e.x},${e.z}`), [], `${l.name}: neben ${z}`);
      }
    }
  });
  test('Schritte: die Inhalte je Übung (Spec «Inhalte je Übung», Ticket 03)', () => {
    const u = (n) => L.LEVELS.slice(0, L.TUTORIAL_COUNT).find(q => q.name === n);
    const art = (n) => u(n).schritte.map(s => s.weiter + (s.richtung === -1 ? '-zurück' : '')).join(' ');
    assert.deepEqual(L.LEVELS.slice(0, L.TUTORIAL_COUNT).map(q => q.name), ['Erstes Licht', 'Umweg', 'Sperre',
      'Brechung', 'Schatten', 'Farbenlehre', 'Farbiges Licht', 'Treffpunkt', 'Mischung']);
    // Erstes Licht: das Ziel vor dem ersten Tippen (ein Tippen löst die Übung schon)
    assert.equal(art('Erstes Licht'), 'erklaerung drehen');
    assert.equal(u('Erstes Licht').schritte[0].bei, '4,0');
    // Umweg: festen Spiegel antippen, «Rund lässt sich drehen, eckig nicht», zurückdrehen; beide runden Spiegel stehen
    // eine Stufe zu weit (je einmal zurück ist die Lösung), der letzte Schritt nennt beide (Ticket 04)
    const w = u('Umweg');
    assert.equal(art('Umweg'), 'antippen erklaerung drehen-zurück');
    assert.ok(am(w, w.schritte[0].bei).fixed && w.schritte[1].text === 'Rund lässt sich drehen, eckig nicht.');
    assert.deepEqual([].concat(w.schritte[2].bei).sort(), Object.keys(w.solution).sort(), 'alle runden Spiegel');
    for (const z of Object.keys(w.solution)) {
      assert.equal(L.mod8(am(w, z).rot - 1) % 4, w.solution[z] % 4, `${z}: eine Stufe zu weit`);
    }
    // Schatten: Spiegel längs und Prisma von der falschen Seite in getrennten Schritten
    const sch = u('Schatten');
    assert.ok(am(sch, sch.schritte[0].bei).type === 'mirror' && am(sch, sch.schritte[1].bei).type === 'prism');
    // Hinweise nebenbei: Kamera in «Sperre», Neustart in «Brechung», sonst keine
    assert.deepEqual(Object.fromEntries(L.LEVELS.slice(0, L.TUTORIAL_COUNT).filter(q => q.nebenbei).map(q => [q.name, q.nebenbei])),
      { Sperre: ['kamera'], Brechung: ['neustart'] });
    // die Elemente der Lehrinhalte stehen im Satz eines Schritts mit Umriss
    const umrandet = (n, typ) => u(n).schritte.some(s => [].concat(s.bei ?? []).some(z => am(u(n), z).type === typ));
    for (const [n, typ] of [['Sperre', 'blocker'], ['Brechung', 'prism'], ['Farbenlehre', 'filter'],
      ['Farbiges Licht', 'source'], ['Farbiges Licht', 'target'], ['Treffpunkt', 'target'], ['Mischung', 'combiner']]) {
      assert.ok(umrandet(n, typ), `${n}: ${typ}`);
    }
  });
  test('Schritte: wer jedem Schritt mit der kürzesten Handlung folgt, löst keine Übung vor ihrem letzten Schritt', () => {
    // wie fuehrung: nach jeder Drehung zuerst gelöst, dann der Schritt (Drehung oder Strahl), Strahl-Schritte, die
    // schon erfüllt sind, entfallen; Erklärungen mit «Weiter»
    const kopie = (b) => {
      const elements = b.elements.map(e => ({ ...e })), grid = new Array(b.size * b.size).fill(null);
      for (const e of elements) grid[e.z * b.size + e.x] = e;
      return { ...b, elements, grid };
    };
    for (const l of gefuehrt) {
      const s = l.schritte;
      let b = L.createBoard(l), k = 0;
      const ueberspringe = () => {
        const r = L.traceBeams(b);
        while (k < s.length && s[k].weiter === 'strahl' && L.schrittErfuellt(s[k], { art: 'strahl', board: b, result: r })) k++;
      };
      ueberspringe();
      while (k < s.length) {
        if (s[k].weiter === 'erklaerung') { k++; ueberspringe(); continue; }
        // Breitensuche über Drehungen (und Antippen fester Elemente) bis zum Weiterschalten
        const seen = new Set(), q = [[b, 0]];
        let weiter = null;
        while (q.length && !weiter) {
          const [bb, n] = q.shift();
          for (const [i, el] of bb.elements.entries()) {
            for (const d of L.isRotatable(el) ? [1, -1] : el.fixed && s[k].weiter === 'antippen' ? [0] : []) {
              const nb = kopie(bb), ne = nb.elements[i];
              if (d) { if (ne.type === 'combiner') ne.dir = L.mod8(ne.dir + d); else ne.rot = L.mod8(ne.rot + d); }
              const r = L.traceBeams(nb);
              const e = d ? { art: 'gedreht', el: ne, delta: d } : { art: 'angetippt', el: ne };
              if (d && r.solved) { weiter = { nb, geloest: true }; break; }
              if (L.schrittErfuellt(s[k], e) || L.schrittErfuellt(s[k], { art: 'strahl', board: nb, result: r })) {
                weiter = { nb, geloest: false }; break;
              }
              const key = nb.elements.map(x => x.rot + ':' + x.dir).join();
              if (d && n < 6 && !seen.has(key)) { seen.add(key); q.push([nb, n + 1]); }
            }
            if (weiter) break;
          }
        }
        assert.ok(weiter, `${l.name}: Schritt ${k + 1} nicht erfüllbar`);
        assert.ok(!weiter.geloest || k === s.length - 1, `${l.name}: gelöst schon in Schritt ${k + 1}`);
        b = weiter.nb;
        if (weiter.geloest) break;
        k++;
        ueberspringe();
      }
    }
  });
  test('Schritte: Hinweise nebenbei nur aus NEBENBEI, einmal je Übung', () => {
    for (const l of gefuehrt) {
      const n = l.nebenbei ?? [];
      assert.ok(n.every(k => k in L.NEBENBEI) && new Set(n).size === n.length, `${l.name}: ${n}`);
    }
    for (const [k, { text }] of Object.entries(L.NEBENBEI)) {
      for (const t of text) assert.ok(wort(t) <= 14 && !/[{}]/.test(t), `${k}: «${t}»`);
    }
  });
  test('Text je Gerät: Befehlsform für Schritte', () => {
    assert.equal(L.geraeteText('{Tippe} den Spiegel an.', true), 'Tippe den Spiegel an.');
    assert.equal(L.geraeteText('{Tippe} den Spiegel an.', false), 'Klicke den Spiegel an.');
    assert.equal(L.geraeteText('{Drücke lang} auf den Spiegel.', true), 'Drücke lang auf den Spiegel.');
    assert.equal(L.geraeteText('{Drücke lang} auf den Spiegel.', false), 'Rechtsklicke auf den Spiegel.');
  });
  test('Was weiterschaltet: Erklärung nur «Weiter», antippen auch fest, drehen mit Richtung, Strahl', () => {
    const l = L.LEVELS.find(q => q.name === 'Umweg'), b = L.createBoard(l);
    const fest = b.elements.find(e => e.fixed), dreh = b.elements.find(e => L.isRotatable(e));
    const zelle = (e) => `${e.x},${e.z}`;
    assert.ok(L.schrittErfuellt({ weiter: 'erklaerung' }, { art: 'weiter' }));
    assert.ok(!L.schrittErfuellt({ weiter: 'erklaerung' }, { art: 'gedreht', el: dreh, delta: 1 }), 'Drehung schaltet keine Erklärung');
    assert.ok(L.schrittErfuellt({ weiter: 'antippen', bei: zelle(fest) }, { art: 'angetippt', el: fest }), 'Weigerung');
    assert.ok(!L.schrittErfuellt({ weiter: 'antippen', bei: zelle(fest) }, { art: 'angetippt', el: b.elements[0] }), 'anderes Element');
    assert.ok(L.schrittErfuellt({ weiter: 'antippen', bei: zelle(dreh) }, { art: 'gedreht', el: dreh, delta: 1 }), 'drehbares antippen');
    assert.ok(L.schrittErfuellt({ weiter: 'drehen', bei: [zelle(dreh)] }, { art: 'gedreht', el: dreh, delta: -1 }));
    assert.ok(!L.schrittErfuellt({ weiter: 'drehen', bei: zelle(dreh), richtung: -1 }, { art: 'gedreht', el: dreh, delta: 1 }), 'falsche Richtung');
    assert.ok(L.schrittErfuellt({ weiter: 'drehen', bei: zelle(dreh), richtung: -1 }, { art: 'gedreht', el: dreh, delta: -1 }));
    assert.equal(L.schrittGeste({ weiter: 'drehen', richtung: -1 }), 'zurueck');
    assert.equal(L.schrittGeste({ weiter: 'antippen' }), 'tippen');
    assert.equal(L.schrittGeste({ weiter: 'erklaerung' }), null);
    // Strahl: Die Quelle von «Erstes Licht» trifft den Spiegel, das Ziel erst gelöst
    const e = L.LEVELS[0], eb = L.createBoard(e), ziel = eb.elements.find(q => q.type === 'target');
    const sp = eb.elements.find(q => q.type === 'mirror');
    let r = L.traceBeams(eb);
    assert.ok(L.strahlTrifft(r, sp) && !L.strahlTrifft(r, ziel));
    assert.ok(!L.schrittErfuellt({ weiter: 'strahl', bei: zelle(ziel) }, { art: 'strahl', board: eb, result: r }));
    sp.rot = e.solution[zelle(sp)];
    r = L.traceBeams(eb);
    assert.ok(L.schrittErfuellt({ weiter: 'strahl', bei: zelle(ziel) }, { art: 'strahl', board: eb, result: r }));
    // Strahl mit trifft: Umriss und Hand am Spiegel, weiter erst, wenn das Licht das Ziel trifft
    const mit = { weiter: 'strahl', bei: zelle(sp), trifft: zelle(ziel), richtung: -1 };
    assert.ok(L.schrittErfuellt(mit, { art: 'strahl', board: eb, result: r }));
    sp.rot = 2;
    assert.ok(!L.schrittErfuellt(mit, { art: 'strahl', board: eb, result: L.traceBeams(eb) }), 'trifft nur den Spiegel');
    assert.equal(L.schrittGeste(mit), 'zurueck');
    assert.equal(L.schrittGeste({ weiter: 'strahl', bei: zelle(sp), trifft: zelle(ziel) }), 'tippen');
    assert.equal(L.schrittGeste({ weiter: 'strahl', bei: zelle(ziel) }), null);
    // Strahl mit farbe («Mischung»): Grün allein im Kombinator schaltet nicht, erst Rot und Blau (Magenta)
    const m = L.LEVELS.find(q => q.name === 'Mischung'), mb = L.createBoard(m), s1 = m.schritte[0];
    const kombi = mb.elements.find(q => q.type === 'combiner'), prisma = mb.elements.find(q => q.type === 'prism');
    let mr = L.traceBeams(mb);
    assert.ok(L.strahlTrifft(mr, kombi) && mr.mixes.get(kombi.id) === L.COLORS.green, 'Start: Grün im Kombinator');
    assert.ok(!L.schrittErfuellt(s1, { art: 'strahl', board: mb, result: mr }), 'Grün schaltet nicht');
    assert.ok(L.schrittErfuellt({ ...s1, farbe: undefined }, { art: 'strahl', board: mb, result: mr }), 'ohne farbe schon');
    prisma.rot = L.mod8(prisma.rot - 1); // zurück: nur Blau
    assert.ok(!L.schrittErfuellt(s1, { art: 'strahl', board: mb, result: L.traceBeams(mb) }), 'zurück schaltet nicht');
    prisma.rot = L.mod8(prisma.rot + 2); // ein Tippen vom Start: Rot und Blau
    mr = L.traceBeams(mb);
    assert.ok(mr.mixes.get(kombi.id) === L.COLORS.magenta && L.schrittErfuellt(s1, { art: 'strahl', board: mb, result: mr }));
  });
  test('Später Fingerzeig: nächstes Element ausserhalb der Lösung, kürzerer Weg, Spiegel halbe Runde gleich', () => {
    const l = L.LEVELS[0], b = L.createBoard(l), sp = b.elements.find(q => q.type === 'mirror');
    assert.deepEqual([L.fingerzeigZiel(l, b).el, L.fingerzeigZiel(l, b).geste], [sp, 'tippen']); // 2 → 3
    sp.rot = 4; // 3 + 1: zurück ist kürzer
    assert.equal(L.fingerzeigZiel(l, b).geste, 'zurueck');
    sp.rot = 7; // 3 + 4: gleich wie die Lösung
    assert.ok(L.inLoesung(l, sp) && L.fingerzeigZiel(l, b) === null);
  });
}
test('Namen: alle Level eindeutig', () => {
  const names = ALLE.LEVELS.map(l => l.name);
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], 'doppelte Namen');
});
// Lösung und Eindeutigkeit jedes Levels. Die Tests der Reihenfolge, der Grade, der Duldungsliste und der Namen
// (Nahtstelle 3) stehen in tests/levelliste.test.mjs; sie ersetzen seit Ticket 15 die Tests zu Markierung, gehärteten
// Leveln, Härte-Abnahme und Auswahlliste, seit Ticket 21 auch die Tests der vorgesehenen Namen (NAMES in profiles.mjs)
// und der fremden Filterfarbe (oddFilters in quality.mjs).
ALLE.LEVELS.forEach((lvl, i) => {
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

console.log('Würfel (dim: 3)');
{
  const cube = (elements, size = 5) => L.createBoard({ name: 'test3', dim: 3, size, elements });
  const vec = (d) => JSON.stringify(d);
  test('Achse y verhält sich wie die 2D-Ebene (Spiegel und Prisma)', () => {
    for (let rot = 0; rot < 8; rot++) for (let dir = 0; dir < 8; dir++) {
      const nd = L.reflectOnMirror(dir, rot);
      assert.equal(vec(L.reflect3(L.planeDir('y', dir), 'y', rot)), vec(nd === dir ? null : L.planeDir('y', nd)));
      const outs = L.refractInPrism3(L.planeDir('y', dir), 7, 'y', rot).map(o => vec(o.d));
      assert.deepEqual(outs, L.refractInPrism(dir, 7, rot).map(o => vec(L.planeDir('y', o.dir))));
    }
  });
  test('Spiegelungen bleiben in den 18 Richtungen (keine Raumdiagonalen)', () => {
    const all = [];
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
      const n = dx * dx + dy * dy + dz * dz;
      if (n === 1 || n === 2) all.push([dx, dy, dz]);
    }
    assert.equal(all.length, 18);
    const ok = new Set(all.map(vec));
    for (const axis of Object.keys(L.AXES)) for (let rot = 0; rot < 8; rot++) for (const d of all) {
      const r = L.reflect3(d, axis, rot);
      if (r) assert.ok(ok.has(vec(r)), `${axis} ${rot} ${vec(d)} → ${vec(r)}`);
    }
  });
  test('Spiegel im Würfel: Regel der Drehebene (reflectOnMirror) gleich der Vektorformel d − 2 (d·n) / (n·n) · n', () => {
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (const axis of Object.keys(L.AXES)) for (let rot = 0; rot < 8; rot++) {
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
        const d = [dx, dy, dz], q = dot(d, d);
        if (q !== 1 && q !== 2) continue;
        const n = L.planeDir(axis, rot + 2), k = dot(d, n), f = 2 * k / dot(n, n);
        const expected = k === 0 ? null : d.map((c, i) => c - f * n[i]);
        assert.equal(vec(L.reflect3(d, axis, rot)), vec(expected), `${axis} ${rot} ${vec(d)}`);
      }
    }
  });
  test('Spiegel mit Achse z lenkt Ost nach oben', () => assert.equal(vec(L.reflect3([1, 0, 0], 'z', 3)), vec([0, 1, 0])));
  test('Strahl längs der Drehachse endet am Spiegelrand', () => {
    const r = L.traceBeams(cube([{ type: 'source', x: 2, y: 0, z: 2, axis: 'z', dir: 6 }, { type: 'mirror', x: 2, y: 3, z: 2, rot: 1 }]));
    assert.equal(r.events.at(-1).kind, 'absorb');
    assert.ok(Math.abs(r.segments[0].y1 - (3 - L.MIRROR_HALF_HEIGHT)) < 1e-9);
  });
  test('Strahl nach unten endet auf der Plattform, nach oben läuft er aus (PLAN 2.2)', () => {
    for (let dir = 0; dir < 8; dir++) {
      const [dx, dy, dz] = L.planeDir('z', dir), tag = `${dir} ${vec([dx, dy, dz])}`;
      const r = L.traceBeams(cube([{ type: 'source', x: 2, y: 2, z: 2, axis: 'z', dir }]));
      const last = r.events.at(-1), s = r.segments.at(-1);
      if (dy < 0) {
        assert.deepEqual([last.kind, last.x, last.y, last.z], ['floor', 2 + dx * 2.5, -0.5, 2 + dz * 2.5], tag);
        assert.deepEqual([s.x1, s.y1, s.z1, s.fade], [last.x, last.y, last.z, undefined], tag);
      } else assert.equal(last.kind, 'edge', tag);
    }
  });
  test('Quader 7 × 7 × 5 (height): Brett, Rand oben nach height, ohne height ein Würfel', () => {
    const quader = (elements) => L.createBoard({ name: 'quader', dim: 3, size: 7, height: 5, elements });
    assert.deepEqual([cube([]).size, cube([]).height], [5, 5]);
    const b = quader([{ type: 'source', x: 3, y: 0, z: 3, axis: 'z', dir: 6 }]);
    assert.deepEqual([b.size, b.height, b.grid.length], [7, 5, 7 * 7 * 5]);
    assert.throws(() => quader([{ type: 'target', x: 3, y: 5, z: 3 }]), /ausserhalb/);
    assert.doesNotThrow(() => quader([{ type: 'target', x: 6, y: 4, z: 6 }]));
    // nach oben (Achse z, dir 6) läuft der Strahl über der Ebene 4 aus, nicht erst über 6
    const r = L.traceBeams(b), last = r.events.at(-1);
    assert.equal(last.kind, 'edge');
    assert.ok(last.y > 4 && r.segments.every(s => Math.min(s.y0, s.y1) < 5), JSON.stringify(last));
    // ein Ziel ganz oben wird getroffen
    const t = L.traceBeams(quader([{ type: 'source', x: 3, y: 0, z: 3, axis: 'z', dir: 6 }, { type: 'target', x: 3, y: 4, z: 3 }]));
    assert.equal(t.solved, true);
  });
  test('Diagonale in der Spiegelfläche endet an der ersten Rahmenkante', () => {
    // Achse z, rot 0: Fläche x-z; Strahl (1, 0, 1) läuft in ihr und erreicht zuerst die Ober-/Unterkante (in z)
    const r = L.traceBeams(cube([{ type: 'source', x: 0, y: 2, z: 0, dir: 1 }, { type: 'mirror', x: 2, y: 2, z: 2, axis: 'z', rot: 0 }]));
    assert.equal(r.events.at(-1).kind, 'absorb');
    const s = r.segments[0];
    assert.ok(Math.abs(Math.hypot(2 - s.x1, 2 - s.z1) - L.MIRROR_HALF_HEIGHT * Math.SQRT2) < 1e-9);
  });
  test('Spiegelnormale zeigt zum einfallenden Strahl und steht senkrecht zur Achse (alle Achsen)', () => {
    for (const axis of Object.keys(L.AXES)) for (let rot = 0; rot < 8; rot++) for (let k = 0; k < 8; k++) {
      const d = L.planeDir(axis, k), n = L.mirrorFrontNormal3(axis, rot, d);
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      assert.ok(Math.abs(dot(n, L.AXES[axis].a)) < 1e-12);
      assert.ok(dot(n, d) <= 1e-12, `${axis} ${rot} ${k}`);
    }
  });
  test('Verfolgung im Würfel: Spiegelnormale wie mirrorFrontNormal3, auch für Strahlen mit Anteil längs der Achse', () => {
    let checked = 0;
    for (const axis of Object.keys(L.AXES)) for (let rot = 0; rot < 8; rot++) {
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
        const d = [dx, dy, dz], q = dx * dx + dy * dy + dz * dz, tag = `${axis} ${rot} ${vec(d)}`;
        if (q !== 1 && q !== 2) continue;
        const b = cube([{ type: 'mirror', x: 2, y: 2, z: 2, axis, rot }]);
        const r = L.traceBeams(b, [{ x: 2 - dx, y: 2 - dy, z: 2 - dz, d, color: 7 }]);
        if (L.reflect3(d, axis, rot) === null) { assert.equal(r.events[0].kind, 'absorb', tag); continue; }
        assert.equal(r.events[0].kind, 'reflect', tag);
        const n = L.mirrorFrontNormal3(axis, rot, d);
        assert.deepEqual(r.events[0].normal, n, tag);
        assert.deepEqual([r.segments[0].n1, r.segments[1].n0], [n, n], tag);
        checked++;
      }
    }
    assert.equal(checked, 288);
  });
  test('Würfel: Richtung ausserhalb der 18 (Raumdiagonale, Nullvektor) wird gemeldet', () => {
    const b = cube([{ type: 'target', x: 4, y: 4, z: 4 }]);
    for (const d of [[1, 1, 1], [0, 0, 0], [2, 0, 0]]) {
      assert.throws(() => L.traceBeams(b, [{ x: 0, y: 0, z: 0, d, color: 7 }]), /Startstrahl mit ungültiger Richtung/);
      assert.throws(() => L.reflect3(d, 'x', 1), /Spiegelung mit ungültiger Richtung/);
      assert.throws(() => L.mirrorFrontNormal3('z', 1, d), /Spiegelnormale mit ungültiger Richtung/);
    }
  });
  test('Prisma mit Achse z fächert senkrecht (Ebene x-y): Rot schräg hinauf, Blau schräg hinab', () => {
    const outs = L.refractInPrism3([1, 0, 0], 7, 'z', 0).map(o => [o.color, vec(o.d)]);
    assert.deepEqual(outs, [[1, vec([1, 1, 0])], [2, vec([1, 0, 0])], [4, vec([1, -1, 0])]]);
  });
  test('Prisma: Licht schräg zur Drehebene tritt nicht aus', () => {
    const r = L.traceBeams(cube([{ type: 'source', x: 0, y: 2, z: 2, dir: 0 }, { type: 'prism', x: 2, y: 2, z: 2, axis: 'x' }]));
    assert.equal(r.events.at(-1).kind, 'absorb');
  });
  test('Würfel: Zelle ausserhalb und doppelt belegt werden gemeldet', () => {
    assert.throws(() => cube([{ type: 'target', x: 0, y: 5, z: 0 }]), /ausserhalb/);
    assert.throws(() => cube([{ type: 'target', x: 1, y: 1, z: 1 }, { type: 'blocker', x: 1, y: 1, z: 1 }]), /doppelt/);
    assert.throws(() => cube([{ type: 'mirror', x: 1, y: 1, z: 1, axis: 'w' }]), /Achse/);
  });
  ALLE.LEVELS_3D.forEach((lvl) => {
    const tag = `Würfel "${lvl.name}"`;
    test(`${tag}: Start ungelöst, notierte Lösung löst, Lösung eindeutig`, () => {
      assert.equal(L.traceBeams(L.createBoard(lvl)).solved, false);
      const b = L.createBoard(lvl);
      const rot = b.elements.filter(L.isRotatable);
      assert.deepEqual(rot.map(S.keyOf).sort(), Object.keys(lvl.solution).sort(), 'Lösung nennt nicht genau die drehbaren Elemente');
      for (const el of rot) S.setRot(el, lvl.solution[S.keyOf(el)]);
      assert.equal(L.traceBeams(b).solved, true);
      const r = S.solve(lvl);
      assert.equal(r.aborted, false, 'Suche abgebrochen');
      assert.equal(r.count, 1, `${r.count} Lösungen`);
      const period = Object.fromEntries(rot.map(el => [S.keyOf(el), S.period(el)]));
      const norm = (sol) => Object.fromEntries(Object.entries(sol).map(([k, v]) => [k, v % period[k]]));
      assert.deepEqual(norm(r.solutions[0].set), norm(lvl.solution));
    });
  });
  test('Würfel-Level: Löser stimmt mit dem Durchprobieren überein, Blätter wie von vorn', () => {
    for (const lvl of ALLE.LEVELS_3D) {
      if (spaceOf(lvl) <= 1 << 14) compareWithBruteForce(lvl); // grosse Level nur mit dem schlauen Löser
    }
  });
  test('Löser auf zufälligen Würfeln mit Kombinatoren wie das Durchprobieren, Blätter wie von vorn', () => {
    // Alle drei Achsen, drehbare und feste Kombinatoren: Die Verfolgung hält im Würfel wie im flachen Feld beim
    // Abschicken der Startstrahlen und im Strahl an und macht dort weiter.
    let seed = 1357, checked = 0;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    for (let n = 0; n < 200; n++) {
      const size = int(3, 4), used = new Set(), elements = [];
      const add = (e) => {
        for (;;) {
          const x = int(0, size - 1), y = int(0, size - 1), z = int(0, size - 1), key = x + ',' + y + ',' + z;
          if (!used.has(key)) { used.add(key); elements.push({ ...e, x, y, z, axis: 'xyz'[int(0, 2)] }); return; }
        }
      };
      for (let i = int(1, 2); i > 0; i--) add({ type: 'source', dir: int(0, 7), color: colors[int(0, 6)] });
      for (let i = int(1, 3); i > 0; i--) add({ type: 'mirror', rot: int(0, 3), fixed: rnd() < 0.2 });
      if (rnd() < 0.5) add({ type: 'prism', rot: int(0, 7) });
      for (let i = int(1, 2); i > 0; i--) add({ type: 'combiner', dir: int(0, 7), fixed: rnd() < 0.5 });
      for (let i = int(1, 2); i > 0; i--) add({ type: 'target', color: colors[int(0, 6)] });
      const lvl = { name: 'würfel ' + n, dim: 3, size, elements };
      if (spaceOf(lvl) > 4096) continue;
      compareWithBruteForce(lvl);
      checked++;
    }
    assert.ok(checked > 100, 'zu wenige Felder geprüft: ' + checked);
  });
  // Ein flaches Level als Würfel mit einer Ebene (y = 0, Drehachse überall y): Beide laufen durch denselben Durchlauf
  // (tracePass, ADR 0003), der Würfel über die Tabellen der Drehebene und mit y in der Ausgabe. Kommazahlen dürfen um
  // Rundungsreste abweichen, alles andere nicht.
  const asCube = (lvl) => ({
    ...lvl, dim: 3, size: lvl.size || 7, elements: lvl.elements.map(e => ({ ...e, y: 0 })),
    solution: Object.fromEntries(Object.entries(lvl.solution || {}).map(([k, v]) => [k.replace(',', ',0,'), v])),
  });
  // Würfel-Ergebnis flach lesen: y, y0 und y1 fallen weg, wenn sie 0 sind, Normalen [nx, 0, nz] werden [nx, nz]
  const NORMALS = ['n0', 'n1', 'normal'];
  const flatten = (v, key) => {
    if (v instanceof Map || v instanceof Set) return [...v].map(x => flatten(x));
    if (NORMALS.includes(key) && v.length === 3 && v[1] === 0) return [v[0], v[2]];
    if (Array.isArray(v)) return v.map(x => flatten(x));
    if (!v || typeof v !== 'object') return v;
    const out = {};
    for (const [k, x] of Object.entries(v)) if (!(['y', 'y0', 'y1'].includes(k) && x === 0)) out[k] = flatten(x, k);
    return out;
  };
  const FLOAT = new Set(['x', 'z', 'x0', 'z0', 'x1', 'z1', 'n0', 'n1', 'normal', 'length', 'fade', 'dist', 'dist0']);
  const near = (a, b, path, float = false) => {
    if (float && typeof a === 'number' && typeof b === 'number') {
      return assert.ok(Math.abs(a - b) <= 1e-9, `${path}: ${a} gegen ${b}`);
    }
    if (!a || !b || typeof a !== 'object') return assert.equal(b, a, path);
    assert.deepEqual(Object.keys(b), Object.keys(a), path);
    for (const k of Object.keys(a)) near(a[k], b[k], path + '.' + k, float || FLOAT.has(k));
  };
  test('Flaches Level als Würfel mit einer Ebene: gleiche Strahlbilder in Start- und Lösungsstellung', () => {
    for (const lvl of ALLE.LEVELS) {
      const cube = asCube(lvl);
      for (const solved of [false, true]) {
        const b2 = L.createBoard(lvl), b3 = L.createBoard(cube);
        if (solved) {
          for (const el of b2.elements) if (S.keyOf(el) in lvl.solution) S.setRot(el, lvl.solution[S.keyOf(el)]);
          for (const el of b3.elements) if (S.keyOf(el) in cube.solution) S.setRot(el, cube.solution[S.keyOf(el)]);
        }
        near(flatten(L.traceBeams(b2)), flatten(L.traceBeams(b3)), `${lvl.name}${solved ? ' (gelöst)' : ''}`);
      }
    }
  });
  test('Flaches Level als Würfel mit einer Ebene: gleicher Löser, Blätter wie von vorn', () => {
    let checked = 0;
    for (const lvl of ALLE.LEVELS) {
      if (spaceOf(lvl) > 1 << 14) continue;
      const cube = asCube(lvl);
      for (const opts of [{}, { prune: false }]) {
        const r2 = S.solve(lvl, opts), r3 = S.solve(cube, { ...opts, onLeaf: sameAsFresh(cube.name) });
        const flatKeys = (set) => Object.fromEntries(Object.entries(set).map(([k, v]) => [k.replace(',0,', ','), v]));
        for (const sol of r3.solutions) sol.set = flatKeys(sol.set);
        assert.deepEqual(r3, r2, lvl.name + ' ' + JSON.stringify(opts));
      }
      checked++;
    }
    assert.ok(checked > 50, 'zu wenige Level geprüft: ' + checked);
  });
  test('Würfel-Level haben eigene Namen (Fortschritt wird nach Namen gespeichert)', () => {
    const names = ALLE.LEVELS.concat(ALLE.LEVELS_3D).map(l => l.name);
    assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), []);
  });
}

console.log('Offline');
{
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  // sw.js so ausführen, wie der Browser es tut (mit dem Register der Skyboxen per importScripts), dann die Listen lesen
  const sw = vm.createContext({ URL, location: new URL('http://prisma.test/sw.js'), addEventListener() {} });
  sw.self = sw;
  sw.importScripts = (...files) => files.forEach((f) => vm.runInContext(readFileSync(join(root, f), 'utf8'), sw));
  vm.runInContext(readFileSync(join(root, 'sw.js'), 'utf8'), sw);
  const { swFiles, swLazy } = vm.runInContext('({ swFiles: FILES, swLazy: LAZY })', sw);
  const skies = loadSkies(root);
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
    const all = [...swFiles, ...swLazy];
    assert.deepEqual(all.filter(f => !existsExactly(f)), []);
    assert.deepEqual(all.filter((f, i) => all.indexOf(f) !== i), []);
  });
  test('Skyboxen: Register backgrounds/skies.js gültig, Teile vorhanden, Budget eingehalten (tools/sky-schema.mjs)', () => {
    assert.ok(skies.length > 0, 'keine Skybox im Register');
    assert.ok(codeSkies(html).length >= 2, 'Hintergründe aus dem Code (SKY_ENTRIES) nicht gefunden: Format geändert?');
    assert.deepEqual(checkSkies(skies, { root, types: layerTypes(html), boards: boardTypes(html), reserved: codeSkies(html) }), []);
  });
  // Brett je Himmel (Spec .scratch/brett-je-himmel/): Arten im Spielcode, Brett-Angabe im Register
  test('Bretter: Arten im Spielcode gefunden (BOARD_TYPES in index.html), darunter das Steinbrett', () => {
    assert.ok(boardTypes(html).includes('stone'), 'Zeile const BOARD_TYPES = { … }; nicht gefunden oder ohne stone: Format geändert?');
  });
  test('Bretter: die fünf Himmel aus Blender haben eine gültige Brett-Angabe, im Register wie in skybox.json', () => {
    for (const id of ['beach', 'desert', 'forest', 'village', 'volcano']) {
      const sky = skies.find((s) => s.id === id) ?? assert.fail(`Skybox ${id} fehlt im Register`);
      assert.ok(boardTypes(html).includes(sky.board?.type), `${id}: Brett-Angabe fehlt oder Art unbekannt`);
      const author = JSON.parse(readFileSync(join(root, 'tools', 'blender', 'szenen', id, 'skybox.json'), 'utf8'));
      // das Register läuft in einem eigenen Kontext (runCode): über JSON vergleichen, nicht seine Objekte
      assert.deepEqual(JSON.parse(JSON.stringify(sky.board)), author.board,
        `${id}: Brett im Register nicht wie in skybox.json (node tools/blender/pack.mjs --brett ${id})`);
    }
  });
  test('Bretter: feste Bretter, keiner der fünf Blender-Himmel hat das Steinbrett, Milchstrasse und Sonnensystem schon', () => {
    const arten = ['beach', 'desert', 'forest', 'village', 'volcano'].map((id) => skies.find((s) => s.id === id)?.board?.type);
    for (const art of arten) assert.notEqual(art ?? 'stone', 'stone', `ein Blender-Himmel mit dem Steinbrett: ${arten}`);
    assert.equal(new Set(arten).size, arten.length, `zwei Himmel mit derselben Art: ${arten}`);
    // die Hintergründe aus dem Code haben keine Brett-Angabe (Rückfall Steinbrett)
    assert.deepEqual(codeSkies(html).map((s) => s.id).sort(), ['milky', 'solar']);
    const code = html.match(/^const SKY_ENTRIES = \(\(\) => \{\s*const code = \[([\s\S]*?)\];/m)?.[1];
    assert.ok(code?.includes("id: 'milky'"), 'SKY_ENTRIES: Liste code nicht gefunden, Format geändert?');
    assert.ok(!/\bboard\s*:/.test(code), 'Milchstrasse oder Sonnensystem mit Brett-Angabe');
  });
  test('Bretter: Prüfung lehnt eine unbekannte Art und unbekannte Werte ab', () => {
    const beach = skies.find((s) => s.id === 'beach') ?? assert.fail('Skybox beach fehlt im Register');
    const errorsWith = (board) => checkSkies([{ ...beach, board }], { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({ type: 'stone' }), []);
    assert.deepEqual(errorsWith(undefined), [], 'ohne Brett-Angabe (Steinbrett)');
    assert.ok(errorsWith({ type: 'treibholz' }).some((e) => /treibholz/.test(e)), 'unbekannte Art');
    assert.ok(errorsWith({ type: 'stone', farbe: [0.8, 0.7, 0.5] }).some((e) => /farbe/.test(e)), 'unbekannter Wert');
    assert.ok(errorsWith({}).some((e) => /board/.test(e)), 'ohne Art');
    assert.ok(errorsWith('stone').some((e) => /board/.test(e)), 'kein Objekt');
  });
  test('Bretter: Prüfung lehnt ungültige Werte des Gezeitenbeckens ab (Farben, Lage der Rinne, fehlende Werte)', () => {
    const beach = skies.find((s) => s.id === 'beach') ?? assert.fail('Skybox beach fehlt im Register');
    assert.equal(beach.board?.type, 'tidePool', 'der Strand hat das Gezeitenbecken');
    const errorsWith = (change) => checkSkies([{ ...beach, board: { ...beach.board, ...change } }],
      { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    const fehler = (change, wert, was) => assert.ok(errorsWith(change).some((e) => e.includes(`tidePool: ${wert}`)), was);
    fehler({ stone: [[0.82, 0.7, 0.56]] }, 'stone', 'nur eine Farbe');
    fehler({ water: [[0.33, 0.6, 0.58], [1.2, 0.7, 0.64]] }, 'water', 'Kanal über 1 (sRGB)');
    fehler({ rock: [[0.62, 0.46], [0.48, 0.38, 0.38]] }, 'rock', 'Farbe mit zwei Kanälen');
    fehler({ channel: [4.1, 4.7] }, 'channel', 'Rinne im 7×7-Feld');
    fehler({ channel: [4.4, 4.45] }, 'channel', 'Rinne schmaler als 10 cm');
    fehler({ channel: [4.32, 4.88] }, 'channel', 'keine Felslippe mehr');
    fehler({ channel: [4.77, 4.32] }, 'channel', 'innen und aussen vertauscht');
    fehler({ water: undefined }, 'water', 'fehlender Wert');
    fehler({ glanz: 0.5 }, 'Wert glanz unbekannt', 'unbekannter Wert');
  });
  test('Bretter: Wüste mit der Lehmterrasse (clay); die Prüfung lehnt ungültige und fehlende Farben ab', () => {
    const desert = skies.find((s) => s.id === 'desert') ?? assert.fail('Skybox desert fehlt im Register');
    const board = JSON.parse(JSON.stringify(desert.board));
    assert.equal(board.type, 'clay', 'die Wüste hat die Lehmterrasse');
    const errorsWith = (change) => checkSkies([{ ...desert, board: { ...board, ...change } }],
      { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    assert.ok(errorsWith({ sand: [1.2, 0.8, 0.5] }).some((e) => /sand/.test(e)), 'Farbe über 1 (sRGB)');
    assert.ok(errorsWith({ inlay: [0.9, 0.8] }).some((e) => /inlay/.test(e)), 'Farbe mit zwei Werten');
    assert.ok(errorsWith({ wood: [0.5, -0.1, 0.3] }).some((e) => /wood/.test(e)), 'Farbe unter 0');
    assert.ok(errorsWith({ plaster: [0.83, 0.6, 0.42] }).some((e) => /plaster/.test(e)), 'Putz ohne zwei Töne');
    assert.ok(errorsWith({ brick: [board.brick[0], board.brick[1], board.brick[0]] }).some((e) => /brick/.test(e)),
      'Ziegel mit drei Tönen');
    assert.ok(errorsWith({ egg: undefined }).some((e) => /egg/.test(e)), 'fehlende Farbe');
    assert.ok(errorsWith({ dach: [0.8, 0.7, 0.5] }).some((e) => /dach/.test(e)), 'unbekannter Wert');
  });
  test('Bretter: Dorf mit dem Hochbeet (raisedBed); die Prüfung lehnt ungültige und fehlende Farben ab', () => {
    const village = skies.find((s) => s.id === 'village') ?? assert.fail('Skybox village fehlt im Register');
    const board = JSON.parse(JSON.stringify(village.board));
    assert.equal(board.type, 'raisedBed', 'das Dorf hat das Hochbeet');
    const errorsWith = (change) => checkSkies([{ ...village, board: { ...board, ...change } }],
      { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    assert.ok(errorsWith({ cord: [1.2, 0.8, 0.7] }).some((e) => /cord/.test(e)), 'Farbe über 1 (sRGB)');
    assert.ok(errorsWith({ pebble: [0.7, 0.6] }).some((e) => /pebble/.test(e)), 'Farbe mit zwei Werten');
    assert.ok(errorsWith({ firefly: [0.9, -0.1, 0.6] }).some((e) => /firefly/.test(e)), 'Farbe unter 0');
    assert.ok(errorsWith({ soil: [0.17, 0.12, 0.085] }).some((e) => /soil/.test(e)), 'Erde ohne zwei Töne');
    assert.ok(errorsWith({ larch: [board.larch[0], board.larch[1], board.larch[0]] }).some((e) => /larch/.test(e)),
      'Bohlen mit drei Tönen');
    assert.ok(errorsWith({ sprout: undefined }).some((e) => /sprout/.test(e)), 'fehlende Farbe');
    assert.ok(errorsWith({ tomate: [0.8, 0.2, 0.1] }).some((e) => /tomate/.test(e)), 'unbekannter Wert');
  });
  test('Bretter: Bergwald mit dem Moospolster (moss); die Prüfung lehnt ungültige und fehlende Farben ab', () => {
    const forest = skies.find((s) => s.id === 'forest') ?? assert.fail('Skybox forest fehlt im Register');
    const board = JSON.parse(JSON.stringify(forest.board));
    assert.equal(board.type, 'moss', 'der Bergwald hat das Moospolster');
    const errorsWith = (change) => checkSkies([{ ...forest, board: { ...board, ...change } }],
      { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    assert.ok(errorsWith({ glow: [1.2, 0.8, 0.6] }).some((e) => /glow/.test(e)), 'Farbe über 1 (sRGB)');
    assert.ok(errorsWith({ cap: [0.8, 0.85] }).some((e) => /cap/.test(e)), 'Farbe mit zwei Werten');
    assert.ok(errorsWith({ pebble: [0.4, -0.1, 0.4] }).some((e) => /pebble/.test(e)), 'Farbe unter 0');
    assert.ok(errorsWith({ moss: [0.24, 0.36, 0.17] }).some((e) => /moss: moss/.test(e)), 'Moos ohne zwei Töne');
    assert.ok(errorsWith({ fern: [board.fern[0], board.fern[1], board.fern[0]] }).some((e) => /fern/.test(e)),
      'Farn mit drei Tönen');
    assert.ok(errorsWith({ flower: undefined }).some((e) => /flower/.test(e)), 'fehlende Farbe');
    assert.ok(errorsWith({ pilz: [0.8, 0.7, 0.5] }).some((e) => /pilz/.test(e)), 'unbekannter Wert');
    assert.ok(errorsWith({ moonRim: undefined }).some((e) => /moss: moonRim /.test(e)), 'Mondkante fehlt');
    assert.ok(errorsWith({ moon: [0.3, 0.36] }).some((e) => /moss: moon /.test(e)), 'Mondlicht mit zwei Werten');
  });
  test('Bretter: Das Mondlicht des Moospolsters kommt aus der Richtung des Monds im Wald (MOSS.moonDir = light.dir)', () => {
    const forest = skies.find((s) => s.id === 'forest') ?? assert.fail('Skybox forest fehlt im Register');
    const m = html.match(/moonDir: \[([-\d., ]+)\]/) ?? assert.fail('MOSS.moonDir in index.html nicht gefunden');
    const dir = m[1].split(',').map(Number), unit = (v) => v.map((x) => x / Math.hypot(...v));
    const a = unit(dir), b = unit(forest.light.dir);
    assert.ok(a.every((x, i) => Math.abs(x - b[i]) < 1e-3), `MOSS.moonDir ${dir} weicht von light.dir des Walds ab`);
  });
  test('Bretter: Vulkan mit den Basaltsäulen (basalt); die Prüfung lehnt ungültige und fehlende Farben ab', () => {
    const volcano = skies.find((s) => s.id === 'volcano') ?? assert.fail('Skybox volcano fehlt im Register');
    const board = JSON.parse(JSON.stringify(volcano.board));
    assert.equal(board.type, 'basalt', 'der Vulkan hat die Basaltsäulen');
    const errorsWith = (change) => checkSkies([{ ...volcano, board: { ...board, ...change } }],
      { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    const fehler = (change, wert, was) => assert.ok(errorsWith(change).some((e) => e.includes(`basalt: ${wert}`)), was);
    fehler({ glow: [1.4, 0.665, 0.349] }, 'glow', 'Glut über 1 (sRGB)');
    fehler({ joint: [0.035, -0.01, 0.03] }, 'joint', 'Farbe unter 0');
    fehler({ line: [0.63, 0.62] }, 'line', 'Farbe mit zwei Werten');
    fehler({ basalt: [0.2, 0.19, 0.18] }, 'basalt', 'Säulen des Felds ohne zwei Töne');
    fehler({ column: [board.column[0], board.column[1], board.column[0]] }, 'column', 'Säulen mit drei Tönen');
    fehler({ rise: undefined }, 'rise', 'fehlende Farbe');
    fehler({ lava: [1, 0.4, 0.1] }, 'Wert lava unbekannt', 'unbekannter Wert');
  });
  test('Version: APP_VERSION in sw.js und index.html gleich (Messwerkzeug, .scratch/leistung/ Ticket 01)', () => {
    const seite = html.match(/^const APP_VERSION = '([^']+)';$/m)?.[1];
    assert.ok(seite, 'APP_VERSION in index.html nicht gefunden');
    assert.equal(vm.runInContext('APP_VERSION', sw), seite);
  });
  test('Skyboxen: sw.js nennt den Stand des Registers (pack.mjs; ein neues Register löst so in jedem Browser ein Update aus)', () => {
    const registry = readFileSync(join(root, 'backgrounds', 'skies.js'));
    assert.equal(vm.runInContext('SKIES', sw), createHash('sha256').update(registry).digest('hex').slice(0, 8));
  });
  test('Skyboxen: sw.js speichert jeden Teil (vorab oder beim ersten Gebrauch)', () => {
    for (const s of skies) for (const p of s.parts) {
      assert.ok((p.precache ? swFiles : swLazy).includes(`backgrounds/${p.file}`), `${p.file} fehlt in sw.js`);
    }
  });
  test('Skyboxen: nichts Verwaistes in backgrounds/ (alte Stände räumt pack.mjs weg)', () => {
    assert.deepEqual(orphans(root, skies), []);
  });
  test('Skyboxen: Ebenen des Vulkans – Prüfung lehnt grelle Lava, zu breiten Rand, fehlende Blasen und falsche Bereiche ab', () => {
    const volcano = skies.find((s) => s.id === 'volcano');
    assert.ok(volcano, 'Skybox volcano fehlt im Register');
    const pool = volcano.layers.find((l) => l.type === 'lavaPool') ?? assert.fail('volcano ohne Ebene lavaPool');
    assert.ok(volcano.layers.some((l) => l.type === 'bakedMesh'), 'volcano ohne Felsbrocken (bakedMesh)');
    const errorsWith = (change) => checkSkies([{ ...volcano, layers: [{ ...pool, ...change }] }], { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    assert.ok(errorsWith({ heat: [[1.2, 0.8, 0.2], pool.heat[1], pool.heat[2]] }).some((e) => /heat/.test(e)), 'Bloom See');
    assert.ok(errorsWith({ spatter: { ...pool.spatter, color: [1.0, 0.9, 0.5] } }).some((e) => /spatter/.test(e)), 'Bloom Spritzer');
    assert.ok(errorsWith({ fade: pool.radius }).some((e) => /fade/.test(e)), 'Rand');
    assert.ok(errorsWith({ bursts: undefined }).some((e) => /bursts/.test(e)), 'Blasen');
    assert.ok(errorsWith({ plates: { ...pool.plates, crack: 0.7 } }).some((e) => /plates/.test(e)), 'Risse');
    assert.ok(errorsWith({ bursts: { ...pool.bursts, ring: [20, 10] } }).some((e) => /bursts/.test(e)), 'Blasenring');
    // Sterne erst über dem Kraterrand (die obere Wand liegt weiter weg als die Sterne)
    assert.ok(volcano.sky.starsFrom > 0 && volcano.sky.starsAboveHorizon, 'volcano: Sterne ab einer Höhe über dem Rand');
    const skyErrors = (sky) => checkSkies([{ ...volcano, sky: { ...volcano.sky, ...sky } }], { types: layerTypes(html) });
    assert.ok(skyErrors({ starsFrom: 75 }).some((e) => /starsFrom/.test(e)), 'starsFrom zu hoch');
    assert.ok(skyErrors({ starsAboveHorizon: false }).some((e) => /starsFrom/.test(e)), 'starsFrom ohne starsAboveHorizon');
  });
  test('Skyboxen: Strand – die Kamera hält vor den Palmen (camera.stops), die Felsen gehen am Rand ins Panorama über (bakedMesh ground [0, 0])', () => {
    const beach = skies.find((s) => s.id === 'beach') ?? assert.fail('Skybox beach fehlt im Register');
    assert.ok(beach.camera?.stops?.some(([dx, dz, weit]) => dx === 0 && dz < 0 && weit > 9 && weit < 15),
      'beach: Halt zum Land hin (−z), vor den Palmen');
    const rocks = beach.layers.find((l) => l.type === 'bakedMesh') ?? assert.fail('beach ohne nahe Felsen (bakedMesh)');
    assert.deepEqual([...rocks.ground ?? []], [0, 0], 'Felsen: Farbe des Panoramas genau an der Stelle');
    const errorsWith = (change) => checkSkies([{ ...beach, ...change }], { types: layerTypes(html), boards: boardTypes(html) });
    assert.deepEqual(errorsWith({}), []);
    assert.ok(errorsWith({ camera: { stops: [[0, 0, 13]] } }).some((e) => /camera/.test(e)), 'Richtung 0');
    assert.ok(errorsWith({ camera: { stops: [[0, -1, -2]] } }).some((e) => /camera/.test(e)), 'weit nicht positiv');
    assert.ok(errorsWith({ camera: { stops: [] } }).some((e) => /camera/.test(e)), 'keine Grenze');
    assert.ok(errorsWith({ camera: { halt: 13 } }).some((e) => /camera/.test(e)), 'unbekanntes Feld');
  });
  test('Kamera: Halt vor dem Land (cameraStop) rückt nur heran, wo sie über die Grenze käme', () => {
    const src = html.match(/function cameraStop\([\s\S]*?\n\}\r?\n/)?.[0] ?? assert.fail('function cameraStop nicht gefunden');
    const cameraStop = new Function(`${src}; return cameraStop;`)();
    const t = { x: 0, z: 0.35 }, dir = (theta, phi) => ({ x: Math.sin(phi) * Math.sin(theta), z: Math.sin(phi) * Math.cos(theta) });
    const stops = [[0, -1, 13]];
    assert.equal(cameraStop(stops, t, dir(0, 1.4), 30), 1, 'zum Meer hin frei');
    assert.equal(cameraStop(undefined, t, dir(Math.PI, 1.4), 30), 1, 'ohne Grenzen frei');
    const d = dir(Math.PI, 1.4), k = cameraStop(stops, t, d, 30);
    assert.ok(Math.abs(-(t.z + d.z * 30 * k) - 13) < 1e-9, `zum Land hin genau an der Grenze (k ${k})`);
    assert.equal(cameraStop(stops, t, d, 10), 1, 'nah genug: frei');
    const s = dir(-Math.PI / 2, 1.4), zwei = cameraStop([[0, -1, 13], [-1, 0, 5]], t, s, 30);
    assert.ok(Math.abs(-(s.x * 30 * zwei) - 5) < 1e-9, `mehrere Grenzen: die engste (k ${zwei})`);
  });
  test('Skyboxen: index.html lädt Hintergründe nur über das Register', () => {
    const named = [...html.matchAll(/["'`](backgrounds\/[^"'`$]*)["'`]/g)].map(m => m[1]);
    assert.deepEqual(named.filter(f => f !== 'backgrounds/skies.js'), []);
  });
}

console.log('Fische');
{
  // Schwarmsimulation aus index.html (ohne three.js) mit der echten Wasserkarte jeder Skybox, die Fische hat
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const fn = (name) => html.match(new RegExp(`^function ${name}\\([\\s\\S]*?^\\}`, 'm'))[0];
  const { fishField, createFishSim } = new Function(['mulberry32', 'fishField', 'createFishSim'].map(fn).join('\n')
    + '\nreturn { fishField, createFishSim };')();
  const { PLATE } = new Function(['GRID', 'CELL', 'BOARD', 'PLATE'].map((k) => html.match(new RegExp(`^const ${k} = [^;]+;`, 'm'))[0])
    .join('\n') + '\nreturn { PLATE };')();
  // PNG (8 Bit, ohne Interlace) zu Bytes je Pixel – wie das Spiel die Karte über ein Canvas liest
  const readPng = (buf) => {
    let p = 8, w, h, ch, idat = [];
    while (p < buf.length) {
      const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
      if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[d[9]]; assert.ok(d[8] === 8 && !d[12], 'nur 8 Bit ohne Interlace'); }
      if (type === 'IDAT') idat.push(d);
      p += 12 + len;
    }
    const raw = inflateSync(Buffer.concat(idat)), st = w * ch, out = new Uint8Array(w * h * ch);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (st + 1)];
      for (let x = 0; x < st; x++) {
        const a = x >= ch ? out[y * st + x - ch] : 0, b = y ? out[(y - 1) * st + x] : 0, c = x >= ch && y ? out[(y - 1) * st + x - ch] : 0;
        let v = raw[y * (st + 1) + 1 + x];
        if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
        else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        out[y * st + x] = v & 255;
      }
    }
    return { w, h, ch, px: out };
  };
  for (const sky of loadSkies(root)) for (const layer of (sky.layers ?? []).filter((l) => l.type === 'fishSchools')) {
    const base = sky.parts.find((p) => p.role === 'base');
    const w = runCode(readFileSync(join(root, 'backgrounds', base.file), 'utf8'), base.file).PRISMA_SKY_PARTS[`${sky.id}/base`].data[layer.data];
    const img = readPng(Buffer.from(w.map.split(',')[1], 'base64')), m = img.w * img.h, [d0, d1] = w.depthRange;
    const depth = new Float32Array(m), rock = new Float32Array(m);
    for (let i = 0; i < m; i++) {
      depth[i] = d0 + ((d1 - d0) * (img.px[i * img.ch] * 256 + img.px[i * img.ch + 1])) / 65535;
      rock[i] = img.px[i * img.ch + 2] / 255;
    }
    const field = fishField(depth, rock, img.w, w.extent, layer.minDepth);
    // wie fishSchools in index.html
    const newSim = (f = field) => { const s = createFishSim({ ...layer, keepOut: PLATE / 2 + 0.3 }); s.setField(f); return s; };
    const all = (sim, t) => {
      const a = sim.advance(t), o = new Float64Array(10);
      return Array.from({ length: sim.count }, (_, k) => [...sim.sample(k, a, o)]);
    };
    test(`Fische (${sky.id}): zwei Minuten nie flacher als minDepth, nie unter dem Brett`, () => {
      const sim = newSim();
      let shallowest = Infinity, under = 0;
      for (let t = 0; t <= 120; t += 1 / 15) {
        for (const [x, z] of all(sim, t)) {
          shallowest = Math.min(shallowest, field.depth(x, z));
          if (Math.abs(x) < PLATE / 2 && Math.abs(z) < PLATE / 2) under++;
        }
      }
      // Toleranz: depth liest bilinear, das Abstandsfeld je Zelle
      assert.ok(shallowest >= layer.minDepth - 0.05, `flachste Stelle ${shallowest.toFixed(2)} m`);
      assert.equal(under, 0, 'Fische unter dem Brett');
    });
    test(`Fische (${sky.id}): Ergebnis hängt nur von t ab (?t= bleibt pixelgleich)`, () => {
      const a = newSim(), b = newSim(), fresh = all(a, 47.3);
      assert.deepEqual(all(b, 47.3), fresh);
      all(b, 60); // Zeit zurück: neu begonnen
      assert.deepEqual(all(b, 47.3), fresh);
      // beim Aufbau vorweggenommen (warm, in Häppchen): dasselbe erste Bild
      const c = newSim();
      for (const _ of c.warm(47.3));
      assert.deepEqual(all(c, 47.3), fresh);
    });
    test(`Fische (${sky.id}): nach einer Pause vom letzten Stand weiter, wenige Schritte je Bild (Ticket 09)`, () => {
      let n = 0;
      const counted = { sdf: (x, z) => { n++; return field.sdf(x, z); }, depth: field.depth };
      const sim = newSim(counted);
      for (const _ of sim.warm(10));
      const before = all(sim, 10);
      n = 0;
      sim.advance(10 + 1 / 30);
      const one = n;
      n = 0;
      const after = all(sim, 70); // eine Minute ausgeblendet
      assert.ok(n <= 10 * one, `${n} Abfragen nach der Pause, ${one} für einen Schritt`);
      // weiter vom letzten Stand: kein Fisch springt
      const jump = Math.max(...after.map((f, k) => Math.hypot(f[0] - before[k][0], f[1] - before[k][1])));
      assert.ok(jump < 2, `Sprung ${jump.toFixed(2)} m`);
    });
    test(`Fische (${sky.id}): erstes Bild etwas vor dem Ende von warm: kein Neubeginn`, () => {
      // warm nach der Uhr, das erste Bild nach dem Zeitstempel des Bilds (Ticket 17), der bis zu einem Bild früher liegt
      let n = 0;
      const counted = { sdf: (x, z) => { n++; return field.sdf(x, z); }, depth: field.depth };
      const sim = newSim(counted);
      for (const _ of sim.warm(10));
      n = 0;
      assert.equal(sim.advance(10 - 0.05), 0);
      assert.equal(n, 0, `${n} Abfragen: neu eingeschwommen`);
    });
    test(`Fische (${sky.id}): Abstandsfeld in Häppchen gleich wie in einem Stück`, () => {
      const steps = fishField(depth, rock, img.w, w.extent, layer.minDepth, true);
      let r, yields = 0;
      while (!(r = steps.next()).done) yields++;
      assert.ok(yields >= img.w, `${yields} Häppchen`);
      for (const [x, z] of [[0, 0], [7.3, -4.1], [-12.5, 9.9], [20, 3]]) {
        assert.equal(r.value.sdf(x, z), field.sdf(x, z));
        assert.equal(r.value.depth(x, z), field.depth(x, z));
      }
    });
    test(`Fische (${sky.id}): erstes Bild rechnet gleich viel, egal wie spät der Strand gewählt wird`, () => {
      // vorher wurde ab Sekunde 0 nachgerechnet: nach 2 Minuten 3600 Schritte in einem Bild
      const cost = (t) => {
        let n = 0;
        const counted = { sdf: (x, z) => { n++; return field.sdf(x, z); }, depth: field.depth };
        newSim(counted).advance(t);
        return n;
      };
      assert.ok(cost(119) <= 1.5 * cost(6), `${cost(119)} statt etwa ${cost(6)} Abfragen`);
    });
  }
}

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}.`);
