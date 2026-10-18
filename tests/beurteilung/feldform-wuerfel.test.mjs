// Tests der Würfel-Feldform (Ticket 14, nur auf dem Branch feature/3d-wuerfel): Zellen, Nachbarn, Richtungen,
// Drehachse, mögliche Stellungen und Wirkung eines Elements, Drehungen eines Levels. Wie in feldform.test.mjs kennen
// die Tests die Leveldaten (x, y, z) und die Strahlregel, die Beurteilung nur die Feldform.
// Aufruf: node tests/beurteilung/feldform-wuerfel.test.mjs (alle Tests: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { L, setRot } from '../../tools/solver.mjs';
import { feldformVon } from '../../tools/beurteilung/feldform.mjs';
import { test, miniLevel } from './helfer.mjs';

console.log('Feldform (Würfel)');

const f5 = feldformVon({ name: 'leer', dim: 3, elements: [] });
const range = (n) => [...Array(n).keys()];
/** Leveldaten einer Zelle („x,y,z“ wie in der Lösung). */
const xyz = (zelle) => { const [x, y, z] = zelle.split(',').map(Number); return { x, y, z }; };
const cube = (elements, name = 'Würfel', size = 5) => ({ ...miniLevel(elements, name), dim: 3, size });
/** Die 18 Richtungen der Strahlregel im Würfel als Vektoren: −1, 0, 1 je Koordinate, ohne Raumdiagonalen. */
const VEKTOREN = [];
for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
  if ([1, 2].includes(dx * dx + dy * dy + dz * dz)) VEKTOREN.push([dx, dy, dz]);
}
const mitte = f5.zelle({ x: 2, y: 2, z: 2 });
/** Vektor einer Richtung der Feldform: der Schritt aus der Mitte in die Nachbarzelle. */
const vektor = (d) => {
  const a = xyz(mitte), b = xyz(f5.nachbar(mitte, d));
  return [b.x - a.x, b.y - a.y, b.z - a.z];
};
const gegen = (d) => f5.richtungen.find(g => f5.nachbar(f5.nachbar(mitte, d), g) === mitte);

test('Zellen: Würfel mit 5 × 5 × 5 ohne Grössenangabe, sonst nach size, Schlüssel wie in der Lösung', () => {
  assert.equal(f5.art, 'wuerfel');
  assert.equal(f5.zellen.length, 125);
  assert.equal(new Set(f5.zellen).size, 125);
  assert.equal(feldformVon({ name: '3 × 3 × 3', dim: 3, size: 3, elements: [] }).zellen.length, 27);
  for (const level of L.LEVELS_3D) {
    const f = feldformVon(level);
    assert.ok(level.elements.every(e => f.zellen.includes(f.zelle(e))), level.name);
    const drehbar = level.elements.filter(e => f.stellungen(e).length).map(f.zelle);
    assert.deepEqual(drehbar.sort(), Object.keys(level.solution).sort(), level.name);
  }
});

test('Richtungen: die 18 der Strahlregel, die ersten acht wie im flachen Feld in der Ebene', () => {
  assert.equal(f5.richtungen.length, 18);
  assert.deepEqual(f5.richtungen.map(vektor).map(String).sort(), VEKTOREN.map(String).sort());
  const flach = feldformVon({ name: 'flach', size: 5, elements: [] });
  for (const d of range(8)) assert.equal(f5.nachbar('2,0,2', d), flach.nachbar('2,2', d).replace(',', ',0,'), `${d}`);
});

test('Nachbarn: innen 18 ohne Raumdiagonalen, in der Ecke 6, und gegenseitig', () => {
  assert.equal(f5.nachbarn(mitte).length, 18);
  assert.ok(!f5.nachbarn(mitte).includes('3,3,3'), 'Raumdiagonale');
  assert.deepEqual(f5.nachbarn('0,0,0').sort(), ['0,0,1', '0,1,0', '0,1,1', '1,0,0', '1,0,1', '1,1,0']);
  for (const a of f5.zellen) for (const b of f5.nachbarn(a)) assert.ok(f5.nachbarn(b).includes(a), `${a} – ${b}`);
});

test('Die Richtungen sind die der Strahlregel: Ein Startstrahl in Richtung d läuft von Nachbar zu Nachbar', () => {
  for (const d of f5.richtungen) {
    const ziel = xyz(f5.nachbar(f5.nachbar(mitte, d), d));
    const brett = L.createBoard(cube([{ type: 'target', color: 'cyan', ...ziel }]));
    assert.equal(L.traceBeams(brett, [f5.startstrahl(mitte, d, 6)]).solved, true, 'Richtung ' + d);
  }
});

test('Drehachse aus den Leveldaten (Standard y), Stellungen wie im flachen Feld', () => {
  assert.equal(f5.drehachse({ type: 'mirror' }), 'y');
  for (const axis of ['x', 'y', 'z']) assert.equal(f5.drehachse({ type: 'prism', axis }), axis);
  assert.deepEqual(f5.stellungen({ type: 'mirror', axis: 'x' }), range(4));
  assert.deepEqual(f5.stellungen({ type: 'combiner', axis: 'z' }), range(8));
  assert.deepEqual(f5.stellungen({ type: 'prism', axis: 'z', fixed: true }), []);
});

// Wirkung der Elemente wie in feldform.test.mjs, für jede Achse: Licht kommt aus der Nachbarzelle in Gegenrichtung (ein
// Startstrahl) in Richtung d auf das Element in der Mitte; Ziele stehen dort, wohin es laut Feldform weiterläuft.
function wirkung(element, ziele, d, farbe) {
  const elements = [{ ...element, ...xyz(mitte) }, ...ziele.map(z => ({ type: 'target', ...xyz(z) }))];
  const start = f5.startstrahl(f5.nachbar(mitte, gegen(d)), d, farbe);
  return L.traceBeams(L.createBoard(cube(elements, 'Wirkung')), [start]);
}
const geschluckt = (r) => [r.events.at(-1).kind, r.events.at(-1).element];

test('Spiegeln wie die Strahlregel, für jede Achse, Stellung und Richtung', () => {
  for (const axis of ['x', 'y', 'z']) for (const s of range(8)) for (const d of f5.richtungen) {
    const spiegel = { type: 'mirror', axis, rot: s }, neu = f5.spiegeln(spiegel, d, s), tag = `${axis} ${s} ${d}`;
    const r = wirkung(spiegel, neu === null ? [] : [f5.nachbar(mitte, neu)], d, 7);
    if (neu === null) assert.deepEqual(geschluckt(r), ['absorb', 0], tag);
    else assert.equal(r.hits.get(1), 7, `${tag} → ${neu}`);
    assert.equal(f5.spiegeln(spiegel, d), neu, tag + ' ohne Stellung');
  }
});

test('Brechen wie die Strahlregel, für jede Achse, Stellung und Richtung; schräg zur Ebene tritt nichts aus', () => {
  let schraeg = 0;
  for (const axis of ['x', 'y', 'z']) for (const s of range(8)) for (const d of f5.richtungen) {
    const prisma = { type: 'prism', axis, rot: s }, aus = f5.brechen(prisma, d, 7, s), tag = `${axis} ${s} ${d}`;
    const r = wirkung(prisma, aus.map(o => f5.nachbar(mitte, o.richtung)), d, 7);
    if (!aus.length) assert.deepEqual(geschluckt(r), ['absorb', 0], tag);
    aus.forEach((o, i) => assert.equal(r.hits.get(i + 1), o.farbe, `${tag}: Farbe ${o.farbe} → ${o.richtung}`));
    assert.deepEqual(f5.brechen(prisma, d, 7), aus, tag + ' ohne Stellung');
    if (L.planeIndex(axis, vektor(d)) < 0) { assert.deepEqual(aus, [], tag); schraeg++; }
  }
  assert.equal(schraeg, 3 * 8 * 10);
});

test('Ausgang wie die Strahlregel: Kombinator und Quelle jeder Achse leuchten dorthin, wohin ausgang zeigt', () => {
  for (const axis of ['x', 'y', 'z']) for (const s of range(8)) {
    const kombinator = { type: 'combiner', axis, dir: s };
    const r = wirkung(kombinator, [f5.nachbar(mitte, f5.ausgang(kombinator, s))], 0, 1);
    assert.equal(r.hits.get(1), 1, `Kombinator ${axis} ${s}`);
    const quelle = { ...f5.quelleStatt({ type: 'combiner', axis, ...xyz(mitte) }, s), color: 'red' };
    assert.equal(f5.ausgang(quelle), f5.ausgang(kombinator, s));
    const ziel = { type: 'target', color: 'red', ...xyz(f5.nachbar(mitte, f5.ausgang(quelle))) };
    assert.equal(L.traceBeams(L.createBoard(cube([quelle, ziel]))).solved, true, `Quelle ${axis} ${s}`);
  }
});

test('Zelle eines Ereignisses, Anfang und Ende eines Abschnitts, Durchlauf, auch senkrecht und schräg', () => {
  // Rot läuft von 2,0,2 hinauf auf den Spiegel in 2,3,2 (Achse z), der es nach Westen auf das Ziel in 0,3,2 lenkt.
  const r = L.traceBeams(L.createBoard(cube([
    { type: 'source', x: 2, y: 0, z: 2, axis: 'z', dir: 6, color: 'red' }, // Achse z: Stellung 6 zeigt hinauf
    { type: 'mirror', x: 2, y: 3, z: 2, axis: 'z', rot: 1 },
    { type: 'target', x: 0, y: 3, z: 2, color: 'red' },
  ])));
  assert.equal(r.solved, true);
  assert.deepEqual(r.events.map(e => `${e.kind} ${f5.zelleBei(e)}`), ['reflect 2,3,2', 'hit 0,3,2']);
  assert.deepEqual(r.segments.map(f5.abschnitt), [{ von: '2,0,2', bis: '2,3,2' }, { von: '2,3,2', bis: '0,3,2' }]);
  const [hinauf, west] = r.segments.map(f5.durchlauf);
  assert.deepEqual(hinauf.map(c => c.zelle), ['2,1,2', '2,2,2']);
  assert.deepEqual(west.map(c => c.zelle), ['1,3,2']);
  assert.ok(hinauf[0].achse !== west[0].achse, 'verschiedene Linien, verschiedene Achsen');
  // Schräg nach oben und zurück: dieselbe Linie, dieselbe Achse
  const linie = (von, d) => f5.durchlauf({
    x0: von.x, y0: von.y, z0: von.z, x1: von.x + 3 * d[0], y1: von.y + 3 * d[1], z1: von.z + 3 * d[2],
  });
  const vor = linie({ x: 0, y: 0, z: 1 }, [1, 1, 0]), zurueck = linie({ x: 3, y: 3, z: 1 }, [-1, -1, 0]);
  assert.deepEqual(vor.map(c => c.zelle), ['1,1,1', '2,2,1']);
  assert.deepEqual(zurueck.map(c => c.zelle), ['2,2,1', '1,1,1']);
  assert.equal(new Set([...vor, ...zurueck].map(c => c.achse)).size, 1);
});

// Drehungen: Zu jeder Drehung, die die Feldform liefert, muss die Strahlregel dasselbe Strahlbild gedreht ergeben, in
// Start- und Lösungsstellung. Gedreht wird um die senkrechte Achse durch die Würfelmitte wie im flachen Feld: x' =
// size − 1 − z, z' = x; ein Vektor [dx, dy, dz] wird [−dz, dy, dx]. Wie oft gedreht ist, zeigt das erste Element (es
// steht nie auf der Mittelachse).
const dreheVektor = (v, n) => { for (let i = 0; i < n; i++) v = [-v[2], v[1], v[0]]; return v; };
const drehePunkt = (size, p, n) => {
  let { x, z } = p;
  for (let i = 0; i < n; i++) [x, z] = [size - 1 - z, x];
  return { x, y: p.y, z };
};
function vierteldrehungen(level, gedreht) {
  const size = level.size || 5, e = level.elements[0], g = gedreht.elements[0];
  const n = [0, 1, 2, 3].filter(k => { const p = drehePunkt(size, e, k); return p.x === g.x && p.z === g.z; });
  assert.equal(n.length, 1, 'erstes Element auf der Mittelachse');
  return n[0];
}
function inStellung(level, loesung) {
  const brett = L.createBoard(level);
  for (const el of loesung ? brett.elements : []) {
    const v = level.solution[`${el.x},${el.y},${el.z}`];
    if (v !== undefined) setRot(el, v);
  }
  return L.traceBeams(brett);
}
const nahe = (a, b, tag) => assert.ok(Math.abs(a - b) <= 1e-9, `${tag}: ${a} gegen ${b}`);
const bild = (r) => [r.solved, [...r.hits], [...r.mixes], [...r.satisfied]];
function gleichGedreht(level, gedreht, tag) {
  const size = level.size || 5, n = vierteldrehungen(level, gedreht);
  for (const loesung of [false, true]) {
    const a = inStellung(level, loesung), b = inStellung(gedreht, loesung);
    const t = `${tag}, ${n} Vierteldrehungen, ${loesung ? 'Lösung' : 'Start'}`;
    assert.deepEqual(bild(b), bild(a), t);
    assert.equal(b.events.length, a.events.length, t);
    a.events.forEach((e, i) => {
      const f = b.events[i], p = drehePunkt(size, e, n);
      assert.deepEqual([f.kind, f.color, f.element, f.target], [e.kind, e.color, e.element, e.target], `${t}, ${i}`);
      for (const k of ['x', 'y', 'z']) nahe(f[k], p[k], `${t}, Ereignis ${i}.${k}`);
      if (e.normal) dreheVektor(e.normal, n).forEach((c, j) => nahe(f.normal[j], c, `${t}, Normale ${i}`));
    });
    assert.equal(b.segments.length, a.segments.length, t);
    a.segments.forEach((s, i) => {
      const g = b.segments[i], p0 = drehePunkt(size, { x: s.x0, y: s.y0, z: s.z0 }, n);
      const p1 = drehePunkt(size, { x: s.x1, y: s.y1, z: s.z1 }, n);
      assert.equal(g.color, s.color, `${t}, Abschnitt ${i}`);
      const soll = { x0: p0.x, y0: p0.y, z0: p0.z, x1: p1.x, y1: p1.y, z1: p1.z };
      for (const [k, v] of Object.entries(soll)) nahe(g[k], v, `${t}, Abschnitt ${i}.${k}`);
    });
  }
}

/** Zufällige Würfel 4 × 4 × 4 mit allen Elementtypen und Achsen; das erste Element, eine Quelle, steht in der Ecke. */
function* zufallsWuerfel(seed, count, prismenAchsen) {
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'], axes = ['x', 'y', 'z'];
  const achse = () => axes[int(0, 2)];
  for (let k = 0; k < count; k++) {
    const used = new Set(['0,0,0']), elements = [{ type: 'source', x: 0, y: 0, z: 0, axis: achse(), dir: int(0, 7) }];
    const add = (e) => {
      for (;;) {
        const x = int(0, 3), y = int(0, 3), z = int(0, 3), zelle = `${x},${y},${z}`;
        if (!used.has(zelle)) { used.add(zelle); elements.push({ ...e, x, y, z }); return; }
      }
    };
    add({ type: 'source', axis: achse(), dir: int(0, 7), color: colors[int(0, 6)] });
    for (let i = int(2, 5); i > 0; i--) add({ type: 'mirror', axis: achse(), rot: int(0, 3), fixed: rnd() < 0.3 });
    for (let i = int(1, 2); i > 0; i--) {
      add({ type: 'prism', axis: prismenAchsen[int(0, prismenAchsen.length - 1)], rot: int(0, 7) });
    }
    for (let i = int(0, 2); i > 0; i--) add({ type: 'combiner', axis: achse(), dir: int(0, 7), fixed: rnd() < 0.3 });
    if (rnd() < 0.5) add({ type: 'filter', color: colors[int(0, 5)] });
    for (let i = int(2, 4); i > 0; i--) add({ type: 'target', color: colors[int(0, 6)] });
    yield cube(elements, 'zufall ' + k, 4);
  }
}

test('Drehungen ohne Prisma mit waagrechter Achse: vier, viermal gedreht wieder das Level, gleiches Strahlbild', () => {
  for (const level of zufallsWuerfel(4242, 60, ['y'])) {
    const f = feldformVon(level), d = f.drehungen(level);
    assert.equal(d.length, 4, level.name);
    assert.equal(d[0], level, level.name);
    assert.deepEqual(f.drehungen(d[3])[1], level, level.name);
    for (const g of d.slice(1)) gleichGedreht(level, g, level.name);
  }
});

test('Drehungen: Aufzug (Prisma mit Achse x) und Kern (Achse z) haben je zwei, mit gleichem Strahlbild', () => {
  const zahl = {};
  for (const level of L.LEVELS_3D) {
    const d = feldformVon(level).drehungen(level);
    zahl[level.name] = d.map(g => vierteldrehungen(level, g));
    for (const g of d.slice(1)) gleichGedreht(level, g, level.name);
  }
  assert.deepEqual(zahl, { Aufzug: [0, 1], Kern: [0, 3] });
  let weniger = 0;
  for (const level of zufallsWuerfel(777, 60, ['x', 'y', 'z'])) {
    const d = feldformVon(level).drehungen(level);
    if (d.length < 4) weniger++;
    for (const g of d.slice(1)) gleichGedreht(level, g, level.name);
  }
  assert.ok(weniger > 10, 'zu wenige Würfel mit weniger Drehungen: ' + weniger);
});

test('Drehungen: Elemente ohne Achse, Richtung und Stellung (Standard y und 0) drehen mit, gleiches Strahlbild', () => {
  // Weiss nach Osten ins Prisma: Grün geradeaus, Rot über den Spiegel, Blau über den Kombinator nach Osten
  const level = cube([
    { type: 'source', x: 0, y: 1, z: 3 },
    { type: 'prism', x: 3, y: 1, z: 3 },
    { type: 'mirror', x: 4, y: 1, z: 2 },
    { type: 'combiner', x: 5, y: 1, z: 5 },
    { type: 'target', x: 6, y: 1, z: 3, color: 'green' },
    { type: 'target', x: 6, y: 1, z: 4, color: 'red' },
    { type: 'target', x: 6, y: 1, z: 5, color: 'blue' },
  ], 'ohne Angaben', 7);
  const d = feldformVon(level).drehungen(level);
  assert.equal(d.length, 4);
  assert.equal(inStellung(level, true).solved, true);
  for (const g of d.slice(1)) gleichGedreht(level, g, level.name);
});

test('Ein Prisma mit waagrechter Achse lässt sich nicht darstellen, wenn eine Drehung seine Achse umkehrt', () => {
  // Gesucht ist eine Achse und Stellung, die Licht aus jeder der 18 Richtungen so bricht wie das gedrehte Prisma. Es
  // gibt sie genau dann, wenn die gedrehte Achse in Richtung einer Achse der Strahlregel zeigt (AXES, rechtshändig).
  const text = (aus, n) => aus.map(o => `${o.color}:${dreheVektor(o.d, n)}`).sort().join(' ');
  const gedreht = (d, axis, rot, n) => text(L.refractInPrism3(dreheVektor(d, 4 - n), 7, axis, rot), n);
  const darstellbar = (axis, rot, n) => ['x', 'y', 'z'].some(a => range(8).some(r => VEKTOREN.every(d =>
    text(L.refractInPrism3(d, 7, a, r), 0) === gedreht(d, axis, rot, n))));
  const erwartet = { x: [true, true, false, false], y: [true, true, true, true], z: [true, false, false, true] };
  for (const axis of ['x', 'y', 'z']) for (const rot of range(8)) {
    assert.deepEqual(range(4).map(n => darstellbar(axis, rot, n)), erwartet[axis], `Achse ${axis}, Stellung ${rot}`);
  }
});

test('Ein Level mit dim 3 hat auf dem Würfel-Branch die Würfel-Feldform', () => {
  for (const level of L.LEVELS_3D) assert.equal(feldformVon(level).art, 'wuerfel', level.name);
  assert.equal(feldformVon(L.LEVELS[0]).art, 'flach');
});

// Für den Generator (Ticket 22): dieselben Teile wie in der flachen Feldform (element, rahmen, Nachbartabelle, eine
// Feldform je Grösse), dazu die drei Drehachsen
test('Für den Generator: element mit jeder Drehachse (y ohne axis), rahmen legt den Würfel fest', () => {
  assert.deepEqual(f5.drehachsen, ['y', 'x', 'z']);
  for (const size of [3, 4, 5]) {
    const f = feldformVon({ name: 'leer', dim: 3, size, elements: [] });
    assert.deepEqual(f.rahmen, { dim: 3, size });
    assert.equal(feldformVon({ name: 'neu', ...f.rahmen, elements: [] }), f);
    for (const zelle of f.zellen) for (const drehachse of f.drehachsen) {
      const el = f.element(zelle, { type: 'mirror', drehachse, fixed: true });
      assert.equal(f.zelle(el), zelle);
      assert.equal(f.drehachse(el), drehachse);
      assert.deepEqual(Object.keys(el), ['type', 'x', 'y', 'z', ...(drehachse === 'y' ? [] : ['axis']), 'fixed']);
    }
  }
  assert.deepEqual(f5.element('1,2,3', { type: 'prism' }), { type: 'prism', x: 1, y: 2, z: 3 });
  assert.throws(() => f5.element('1,2,3', { type: 'prism', drehachse: 'w' }), /Drehachse/);
  // Mit element und quelleStatt entsteht eine Quelle in jeder der 18 Richtungen, mit einer passenden Drehachse
  for (const d of f5.richtungen) {
    const quellen = f5.drehachsen.flatMap((drehachse) => {
      const k = f5.element(mitte, { type: 'combiner', drehachse });
      return f5.stellungen(k).filter(v => f5.ausgang(k, v) === d).map(v => f5.quelleStatt(k, v));
    });
    assert.ok(quellen.length > 0, `Richtung ${d}`);
    for (const q of quellen) assert.equal(f5.ausgang(q), d, `Richtung ${d}`);
  }
});

test('Nachbarn aus der Tabelle: dieselben wie der Schritt über die Koordinaten der Strahlregel', () => {
  for (const size of [3, 5]) {
    const f = feldformVon({ name: 'leer', dim: 3, size, elements: [] });
    for (const zelle of f.zellen) {
      const a = xyz(zelle);
      for (const d of f.richtungen) {
        const [dx, dy, dz] = vektor(d), n = [a.x + dx, a.y + dy, a.z + dz];
        const innen = n.every(c => c >= 0 && c < size);
        assert.equal(f.nachbar(zelle, d), innen ? n.join(',') : null, `${size}: ${zelle} ${d}`);
      }
    }
  }
});

test('Eine Würfel-Feldform je Grösse, eingefroren wie die flache', () => {
  const f = feldformVon({ name: 'leer', dim: 3, size: 4, elements: [] });
  assert.equal(feldformVon({ name: 'anderes', dim: 3, size: 4, elements: [] }), f);
  for (const teil of [f, f.zellen, f.richtungen, f.drehachsen, f.rahmen]) assert.ok(Object.isFrozen(teil));
  assert.throws(() => { f.zellen.reverse(); }, TypeError);
  assert.throws(() => { f.rahmen.size = 5; }, TypeError);
});
