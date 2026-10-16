// Tests der Feldform (Spec „Feldform“): Zellen, Nachbarn, Richtungen, Drehachse und mögliche Stellungen eines Elements,
// Drehungen eines Levels.
// Auf main gibt es nur die flache Feldform. Die Tests kennen die Leveldaten (x, z), die Beurteilung nur die Feldform.
// Aufruf: node tests/beurteilung/feldform.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { L, setRot } from '../../tools/solver.mjs';
import { feldformVon } from '../../tools/beurteilung/feldform.mjs';
import { test } from './helfer.mjs';

console.log('Feldform (flach)');

const f7 = feldformVon({ name: 'leer', elements: [] });
const range = (n) => [...Array(n).keys()];

test('Zellen: quadratisches Feld, 7 × 7 ohne Grössenangabe, sonst nach size', () => {
  assert.equal(f7.zellen.length, 49);
  assert.equal(new Set(f7.zellen).size, 49);
  assert.equal(feldformVon({ name: '5 × 5', size: 5, elements: [] }).zellen.length, 25);
});

test('Zelle eines Elements: im Feld, und die drehbaren Elemente stehen in den Zellen der Lösung (alle Level)', () => {
  for (const level of L.LEVELS) {
    const f = feldformVon(level);
    assert.ok(level.elements.every(e => f.zellen.includes(f.zelle(e))), level.name);
    const rotatable = level.elements.filter(e => f.stellungen(e).length).map(f.zelle);
    assert.deepEqual(rotatable.sort(), Object.keys(level.solution).sort(), level.name);
  }
});

test('Nachbarn: innen 8, am Rand 5, in der Ecke 3, und gegenseitig', () => {
  const degrees = f7.zellen.map(z => f7.nachbarn(z).length);
  assert.deepEqual([3, 5, 8].map(n => degrees.filter(d => d === n).length), [4, 20, 25]);
  for (const a of f7.zellen) for (const b of f7.nachbarn(a)) assert.ok(f7.nachbarn(b).includes(a), `${a} – ${b}`);
});

test('Richtungen: acht, jede führt zu einem anderen Nachbarn, über den Rand hinaus zu keinem', () => {
  assert.equal(f7.richtungen.length, 8);
  const mitte = f7.zelle({ x: 3, z: 3 });
  const steps = f7.richtungen.map(d => f7.nachbar(mitte, d));
  assert.deepEqual([...steps].sort(), [...f7.nachbarn(mitte)].sort());
  assert.equal(new Set(steps).size, 8);
  const ecke = f7.zelle({ x: 0, z: 0 });
  assert.equal(f7.richtungen.filter(d => f7.nachbar(ecke, d) === null).length, 5);
});

test('Die Richtungen sind die der Strahlregel: Licht einer Quelle mit Richtung d läuft von Nachbar zu Nachbar in Richtung d', () => {
  const mitte = f7.zelle({ x: 3, z: 3 });
  for (const d of f7.richtungen) {
    const [x, z] = f7.nachbar(f7.nachbar(mitte, d), d).split(',').map(Number); // Zelle wie in der Lösung: „x,z“
    const r = L.traceBeams(L.createBoard({ name: 'Richtung ' + d, elements: [
      { type: 'source', x: 3, z: 3, dir: d },
      { type: 'target', x, z },
    ] }));
    assert.equal(r.solved, true, 'Richtung ' + d);
  }
});

test('Zelle eines Punkts im Strahlbild: Ereignisse an Elementen liegen in deren Zelle, Licht hinter der Feldkante in keiner', () => {
  const r = L.traceBeams(L.createBoard({ name: 'Strahlbild', elements: [
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },   // lenkt nach Süden auf den Blocker
    { type: 'blocker', x: 3, z: 6 },
    { type: 'source', x: 6, z: 0, dir: 0 },   // läuft über die Feldkante aus
    { type: 'source', x: 0, z: 1, dir: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0 },   // parallel: schluckt an der Kante
  ] }));
  const seen = r.events.map(e => `${e.kind} ${f7.zelleBei(e)}`).sort();
  assert.deepEqual(seen, ['absorb 3,6', 'absorb 4,1', 'edge null', 'reflect 3,3']);
  for (const s of r.segments) assert.ok(['0,3', '3,3', '6,0', '0,1'].includes(f7.zelleBei({ x: s.x0, z: s.z0 })), JSON.stringify(s));
});

test('Durchlauf eines Strahlabschnitts: die Zellen zwischen Anfang und Ende samt Achse, gleich für beide Laufrichtungen, auch diagonal', () => {
  const durchlaufen = (elements) => L.traceBeams(L.createBoard({ name: 'Durchlauf', elements })).segments
    .flatMap(s => f7.durchlauf(s).map(({ zelle, achse }) => `${zelle} ${achse}`)).sort();
  assert.deepEqual(durchlaufen([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },   // lenkt nach Süden auf den Blocker
    { type: 'blocker', x: 3, z: 6 },
    { type: 'source', x: 6, z: 5, dir: 4 },   // läuft nach Westen über die Feldkante aus und kreuzt in 3,5
  ]), ['0,5 0', '1,3 0', '1,5 0', '2,3 0', '2,5 0', '3,4 2', '3,5 0', '3,5 2', '4,5 0', '5,5 0']);
  // Nach Südosten und nach Nordwesten auf je einen Blocker: dieselbe Achse
  assert.deepEqual(durchlaufen([
    { type: 'source', x: 0, z: 0, dir: 1 }, { type: 'blocker', x: 3, z: 3 },
    { type: 'source', x: 6, z: 6, dir: 5 }, { type: 'blocker', x: 4, z: 4 },
  ]), ['1,1 1', '2,2 1', '5,5 1']);
});

test('Drehachse: in flachen Leveln immer senkrecht, die Achse y (alle Level)', () => {
  for (const level of L.LEVELS) {
    const f = feldformVon(level);
    for (const e of level.elements) assert.equal(f.drehachse(e), 'y', level.name);
  }
});

test('Mögliche Stellungen: drehbarer Spiegel 4 (rot und rot + 4 wirken gleich), Prisma und Kombinator 8, sonst keine', () => {
  assert.deepEqual(f7.stellungen({ type: 'mirror', x: 0, z: 0, rot: 5 }), range(4));
  assert.deepEqual(f7.stellungen({ type: 'prism', x: 0, z: 0 }), range(8));
  assert.deepEqual(f7.stellungen({ type: 'combiner', x: 0, z: 0, dir: 3 }), range(8));
  for (const e of [
    { type: 'mirror', fixed: true }, { type: 'prism', fixed: true }, { type: 'combiner', fixed: true },
    { type: 'source' }, { type: 'target' }, { type: 'filter', color: 'red' }, { type: 'blocker' },
  ]) assert.deepEqual(f7.stellungen({ x: 0, z: 0, ...e }), [], JSON.stringify(e));
});

test('Jede Stellung einer Lösung ist eine mögliche Stellung ihres Elements (alle Level)', () => {
  for (const level of L.LEVELS) {
    const f = feldformVon(level);
    for (const e of level.elements) {
      const s = f.stellungen(e);
      if (s.length) assert.ok(s.includes(level.solution[f.zelle(e)] % s.length), `${level.name}: ${f.zelle(e)}`);
    }
  }
});

test('Ein Level mit anderer Dimension (dim) hat auf main keine Feldform', () => {
  assert.equal(feldformVon({ name: 'flach', dim: 2, elements: [] }).zellen.length, 49);
  assert.throws(() => feldformVon({ name: 'Würfel', dim: 3, size: 5, elements: [] }), /Feldform/);
});

test('Drehungen um die Drehachse: vier, die erste ist das Level, viermal gedreht wieder das Level, jede gelöst (alle Level)', () => {
  const geloest = (level) => {
    const brett = L.createBoard(level);
    for (const el of brett.elements) {
      const v = level.solution[el.x + ',' + el.z];
      if (L.isRotatable(el) && v !== undefined) setRot(el, v);
    }
    return L.traceBeams(brett).solved;
  };
  for (const level of L.LEVELS) {
    const f = feldformVon(level), d = f.drehungen(level);
    assert.equal(d.length, 4, level.name);
    assert.equal(d[0], level, level.name);
    assert.deepEqual(f.drehungen(d[3])[1], level, level.name);
    for (const [i, g] of d.entries()) assert.ok(geloest(g), `${level.name}, ${i} Vierteldrehungen`);
  }
  // Ost wird Süd: Die Quelle auf 0,3 nach Osten steht gedreht auf 3,0 und leuchtet nach Süden
  const [, q] = f7.drehungen({ name: 'Quelle', elements: [{ type: 'source', x: 0, z: 3, dir: 0 }], solution: {} });
  assert.deepEqual(q.elements, [{ type: 'source', x: 3, z: 0, dir: 2 }]);
});
