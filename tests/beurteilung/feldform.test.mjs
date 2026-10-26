// Tests der Feldform (Spec „Feldform“): Zellen, Nachbarn, Richtungen, Drehachse, mögliche Stellungen und Wirkung eines
// Elements, Drehungen eines Levels.
// Auf main gibt es nur die flache Feldform. Die Tests kennen die Leveldaten (x, z), die Beurteilung nur die Feldform.
// Aufruf: node tests/beurteilung/feldform.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { L, setRot } from '../../tools/solver.mjs';
import { feldformVon } from '../../tools/beurteilung/feldform.mjs';
import { test, miniLevel } from './helfer.mjs';

console.log('Feldform (flach)');

const f7 = feldformVon({ name: 'leer', elements: [] });
const range = (n) => [...Array(n).keys()];
/** Ist das Level in seiner Lösung gelöst? Laut Strahlregel, mit den Stellungen aus level.solution. */
const geloest = (level) => {
  const brett = L.createBoard(level);
  for (const el of brett.elements) {
    const v = level.solution[el.x + ',' + el.z];
    if (L.isRotatable(el) && v !== undefined) setRot(el, v);
  }
  return L.traceBeams(brett).solved;
};

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

// Wirkung der Elemente: Licht kommt aus der Nachbarzelle in Gegenrichtung (ein Startstrahl der Feldform) in Richtung d
// auf das Element in der Mitte. Ziele stehen in den Nachbarzellen, in die es laut Feldform weiterläuft; zeigt die
// Wirkung zurück, steht das Ziel in der Zelle des Startstrahls. Die Strahlregel muss genau diese Ziele treffen.
const mitte = f7.zelle({ x: 3, z: 3 });
const gegen = (d) => f7.richtungen.find(g => f7.nachbar(f7.nachbar(mitte, d), g) === mitte);
const xz = (zelle) => { const [x, z] = zelle.split(',').map(Number); return { x, z }; }; // Zelle wie in der Lösung
function wirkung(element, ziele, d, farbe) {
  const elements = [{ ...element, ...xz(mitte) }, ...ziele.map(z => ({ type: 'target', ...xz(z) }))];
  const start = f7.startstrahl(f7.nachbar(mitte, gegen(d)), d, farbe);
  return L.traceBeams(L.createBoard({ name: 'Wirkung', elements }), [start]);
}

test('Spiegeln wie die Strahlregel: Licht läuft in der Richtung weiter, die spiegeln nennt, oder endet am Rand', () => {
  for (const s of range(8)) for (const d of f7.richtungen) {
    const spiegel = { type: 'mirror', rot: s }, neu = f7.spiegeln(spiegel, d, s), tag = `Stellung ${s}, Richtung ${d}`;
    const r = wirkung(spiegel, neu === null ? [] : [f7.nachbar(mitte, neu)], d, 7);
    if (neu === null) assert.deepEqual([r.events.at(-1).kind, r.events.at(-1).element], ['absorb', 0], tag);
    else assert.equal(r.hits.get(1), 7, `${tag} → ${neu}`);
  }
});

test('Brechen wie die Strahlregel: Jede Grundfarbe läuft in der Richtung, die brechen nennt, sonst schluckt es', () => {
  for (const s of range(8)) for (const d of f7.richtungen) {
    const prisma = { type: 'prism', rot: s }, aus = f7.brechen(prisma, d, 7, s), tag = `Stellung ${s}, Richtung ${d}`;
    const r = wirkung(prisma, aus.map(o => f7.nachbar(mitte, o.richtung)), d, 7);
    if (!aus.length) assert.deepEqual([r.events.at(-1).kind, r.events.at(-1).element], ['absorb', 0], tag);
    aus.forEach((o, i) => assert.equal(r.hits.get(i + 1), o.farbe, `${tag}: Farbe ${o.farbe} → ${o.richtung}`));
    for (const farbe of [1, 2, 4]) {
      assert.deepEqual(f7.brechen(prisma, d, farbe, s), aus.filter(o => o.farbe === farbe), tag);
    }
  }
});

test('Ausgang wie die Strahlregel: Kombinator und Quelle geben Licht in der Richtung ab, die ausgang nennt', () => {
  for (const s of range(8)) {
    const kombinator = { type: 'combiner', dir: s };
    const r = wirkung(kombinator, [f7.nachbar(mitte, f7.ausgang(kombinator, s))], 0, 1);
    assert.equal(r.hits.get(1), 1, `Kombinator, Stellung ${s}`);
    const quelle = { type: 'source', dir: s, ...xz(mitte) }, ziel = xz(f7.nachbar(mitte, f7.ausgang(quelle)));
    const q = L.traceBeams(L.createBoard({ name: 'Quelle', elements: [quelle, { type: 'target', ...ziel }] }));
    assert.equal(q.solved, true, `Quelle, Richtung ${s}`);
  }
});

test('Quelle statt eines Kombinators: leuchtet in seinen Ausgang, in der Farbe, die der Aufrufer setzt', () => {
  for (const s of range(8)) {
    const kombinator = { type: 'combiner', dir: 0, ...xz(mitte) };
    const ziel = xz(f7.nachbar(mitte, f7.ausgang(kombinator, s)));
    const elements = [{ ...f7.quelleStatt(kombinator, s), color: 'red' }, { type: 'target', color: 'red', ...ziel }];
    assert.equal(L.traceBeams(L.createBoard({ name: 'Quelle statt', elements })).solved, true, `Stellung ${s}`);
  }
});

test('Startstrahl: beginnt in seiner Zelle und läuft in seiner Richtung, in seiner Farbe', () => {
  for (const d of f7.richtungen) {
    const ziel = xz(f7.nachbar(f7.nachbar(mitte, d), d));
    const brett = L.createBoard({ name: 'Startstrahl', elements: [{ type: 'target', color: 'cyan', ...ziel }] });
    const r = L.traceBeams(brett, [f7.startstrahl(mitte, d, 6)]);
    assert.equal(r.solved, true, 'Richtung ' + d);
  }
});

test('Ohne Stellung wirkt ein Element in der Stellung, in der es steht', () => {
  for (const s of range(8)) for (const d of f7.richtungen) {
    assert.equal(f7.spiegeln({ type: 'mirror', rot: s }, d), f7.spiegeln({ type: 'mirror' }, d, s));
    assert.deepEqual(f7.brechen({ type: 'prism', rot: s }, d, 7), f7.brechen({ type: 'prism' }, d, 7, s));
  }
  for (const s of range(8)) assert.equal(f7.ausgang({ type: 'combiner', dir: s }), f7.ausgang({ type: 'combiner' }, s));
});

test('Ein Level mit anderem dim hat keine flache Feldform, auf dem Würfel-Branch dim 3 die Würfel-Feldform', () => {
  assert.equal(feldformVon({ name: 'flach', dim: 2, elements: [] }).zellen.length, 49);
  assert.equal(feldformVon({ name: 'Würfel', dim: 3, size: 5, elements: [] }).art, 'wuerfel');
  assert.throws(() => feldformVon({ name: 'Hyperwürfel', dim: 4, size: 5, elements: [] }), /Feldform/);
});

test('Drehungen um die Drehachse: vier, die erste ist das Level, viermal gedreht wieder das Level, jede gelöst (alle Level)', () => {
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

test('Drehungen: Quelle, Spiegel, Prisma und Kombinator ohne Richtung oder Stellung (Standard 0) drehen mit', () => {
  // Weiss nach Osten ins Prisma: Grün geradeaus, Rot über den Spiegel, Blau über den Kombinator nach Osten
  const level = miniLevel([
    { type: 'source', x: 0, z: 3 },
    { type: 'prism', x: 3, z: 3 },
    { type: 'mirror', x: 4, z: 2 },
    { type: 'combiner', x: 5, z: 5 },
    { type: 'target', x: 6, z: 3, color: 'green' },
    { type: 'target', x: 6, z: 4, color: 'red' },
    { type: 'target', x: 6, z: 5, color: 'blue' },
  ], 'ohne Angaben');
  const d = f7.drehungen(level);
  assert.equal(d.length, 4);
  for (const [i, g] of d.entries()) assert.ok(geloest(g), `${i} Vierteldrehungen`);
});

test('Nachbarn: dieselben wie der Schritt über die Koordinaten der Strahlregel, in jedem Feld bis 7 × 7', () => {
  for (const size of [3, 5, 7]) {
    const f = feldformVon({ name: 'leer', size, elements: [] });
    for (const zelle of f.zellen) {
      const [x, z] = zelle.split(',').map(Number);
      for (const d of f.richtungen) {
        const [dx, dz] = L.DIRS[d], nx = x + dx, nz = z + dz;
        const inside = nx >= 0 && nz >= 0 && nx < size && nz < size;
        assert.equal(f.nachbar(zelle, d), inside ? `${nx},${nz}` : null, `${size}: ${zelle} ${d}`);
      }
    }
  }
});

test('Für den Generator: element setzt ein Element in eine Zelle, rahmen legt das Feld in den Leveldaten fest', () => {
  for (const size of [5, 7]) {
    const f = feldformVon({ name: 'leer', size, elements: [] });
    assert.deepEqual(feldformVon({ name: 'neu', ...f.rahmen, elements: [] }).zellen, f.zellen);
    for (const zelle of f.zellen) {
      const el = f.element(zelle, { type: 'filter', color: 'red' });
      assert.equal(f.zelle(el), zelle);
      assert.deepEqual(Object.keys(el), ['type', 'x', 'z', 'color']);
    }
  }
  assert.deepEqual(f7.rahmen, {}, 'im Feld 7 × 7 keine Angabe, wie in LEVELS');
});

test('Für den Generator: Drehachsen (flach nur y), element mit y wie ohne Angabe, mit einer anderen nicht', () => {
  assert.deepEqual(f7.drehachsen, ['y']);
  for (const zelle of f7.zellen) {
    const el = f7.element(zelle, { type: 'mirror', fixed: true, drehachse: 'y' });
    assert.deepEqual(el, f7.element(zelle, { type: 'mirror', fixed: true }));
    assert.deepEqual(Object.keys(el), ['type', 'x', 'z', 'fixed'], 'die Drehachse steht nicht in den Leveldaten');
    assert.equal(f7.drehachse(el), 'y');
  }
  assert.throws(() => f7.element('3,3', { type: 'mirror', drehachse: 'x' }), /Drehachse/);
});

test('Eine Feldform je Grösse, eingefroren: Kein Aufrufer verändert sie für die übrigen Beurteilungen', () => {
  const f = feldformVon({ name: 'leer', size: 5, elements: [] });
  assert.equal(feldformVon({ name: 'anderes', size: 5, elements: [] }), f);
  for (const teil of [f, f.zellen, f.richtungen, f.drehachsen, f.rahmen]) assert.ok(Object.isFrozen(teil));
  assert.throws(() => { f.zellen.reverse(); }, TypeError);
  assert.throws(() => { f.rahmen.size = 7; }, TypeError);
});
