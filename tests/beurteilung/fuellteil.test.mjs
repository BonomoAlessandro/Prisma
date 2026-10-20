// Tests des Ausschlussgrunds Füllteil (Glossar „Füllteil“, Spec „Beurteilung“): ein kurzer Strang (eine Quelle, höchstens
// drei Spiegel, eigenes Ziel), dessen Stellungen für keinen fremden Strahl eine Rolle spielen. Gilt erst ab „mittel“;
// ohne vorgegebenen Grad wie ab „mittel“.
// Aufruf: node tests/beurteilung/fuellteil.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Füllteil');

/** Füllteile eines Mini-Levels (Elemente in Lösungsstellung), beurteilt im Grad grad. */
const fuellteile = (elements, grad) => beurteile(miniLevel(elements), { grad }).ausschluesse.filter(a => a.begriff === 'Füllteil');

// Ein Strang über einen Spiegel: Die weisse Quelle 0,1 strahlt nach Osten, der Spiegel 3,1 lenkt nach Süden auf 3,4.
const strang = [
  { type: 'source', x: 0, z: 1, dir: 0 },
  { type: 'mirror', x: 3, z: 1, rot: 1 },
  { type: 'target', x: 3, z: 4, color: 'white' },
];
// Ein Teil abseits: Rot und Blau treffen sich auf dem magentafarbenen Ziel 5,3. Keiner der beiden Strahlen hat ein
// eigenes Ziel, also ist keiner ein Strang.
const abseits = [
  { type: 'source', x: 0, z: 6, dir: 0, color: 'red' },
  { type: 'mirror', x: 5, z: 6, rot: 3 },
  { type: 'source', x: 6, z: 3, dir: 4, color: 'blue' },
  { type: 'target', x: 5, z: 3, color: 'magenta' },
];

test('Ein isolierter Strang ist in „leicht“ erlaubt', () => {
  assert.deepEqual(fuellteile([...strang, ...abseits], 'leicht'), []);
});

test('Derselbe Strang ab „mittel“ ist ein Füllteil; die Begründung nennt den Strang', () => {
  for (const grad of ['mittel', 'schwer', 'sehr schwer']) {
    const funde = fuellteile([...strang, ...abseits], grad);
    assert.equal(funde.length, 1, grad);
    assert.deepEqual(funde[0].strang, { quelle: '0,1', spiegel: ['3,1'], ziel: '3,4' }, grad);
    for (const zelle of ['0,1', '3,1', '3,4']) assert.ok(funde[0].begruendung.includes(zelle), `${grad}: ${funde[0].begruendung}`);
  }
});

test('Ohne vorgegebenen Grad gilt Füllteil wie ab „mittel“, und die Begründung sagt es', () => {
  for (const funde of [fuellteile([...strang, ...abseits], null), beurteile(miniLevel([...strang, ...abseits])).ausschluesse]) {
    assert.deepEqual(funde.map(f => [f.begriff, f.strang.ziel]), [['Füllteil', '3,4']]);
    assert.match(funde[0].begruendung, /ab „mittel“.*nicht vorgegeben/);
  }
  assert.doesNotMatch(fuellteile([...strang, ...abseits], 'mittel')[0].begruendung, /nicht vorgegeben/);
});

test('Ein Strang, den ein fremder Strahl an seinem Spiegel kreuzt, ist kein Füllteil', () => {
  // Der rote Strahl der Quelle 6,1 trifft den Spiegel 3,1 des weissen Strangs von der anderen Seite und läuft nach Norden
  // auf sein Ziel 3,0. Dreht man den Spiegel, verliert 3,0 sein Rot: Die Stellung spielt für den fremden Strahl eine
  // Rolle. Ebenso spielt sie für den weissen Strahl eine Rolle, wenn man den roten als Strang ansieht.
  assert.deepEqual(fuellteile([
    ...strang,
    { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
    { type: 'target', x: 3, z: 0, color: 'red' },
  ], 'mittel'), []);
});

test('Kreuzt ein fremder Strahl nur den Weg des Strangs, nicht einen seiner Spiegel, bleibt es ein Füllteil', () => {
  // Grenzfall: Das Rot läuft durch die leere Zelle 3,3 des Strangs auf das Ziel 5,3. Keine Stellung des Spiegels 3,1
  // erreicht es; ein Kreuzen in einer leeren Zelle schafft keine Abhängigkeit, erst ein fremder Strahl an einem Spiegel.
  const funde = fuellteile([
    ...strang,
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 6, z: 3, dir: 4, color: 'blue' },
    { type: 'target', x: 5, z: 3, color: 'magenta' },
  ], 'mittel');
  assert.deepEqual(funde.map(f => f.strang), [{ quelle: '0,1', spiegel: ['3,1'], ziel: '3,4' }]);
});

test('Ändert eine Stellung fremdes Licht nur auf dem eigenen Ziel des Strangs, bleibt es ein Füllteil', () => {
  // Grenzfall: Das Rot der Quelle 6,1 trifft den Spiegel 3,1 und läuft in der Lösung nach Norden aus dem Feld. Gedreht
  // lenkt der Spiegel es nach Süden auf das Ziel 3,4 des Strangs, sonst auf kein Ziel.
  const funde = fuellteile([...strang, { type: 'source', x: 6, z: 1, dir: 4, color: 'red' }], 'mittel');
  assert.deepEqual(funde.map(f => f.strang), [{ quelle: '0,1', spiegel: ['3,1'], ziel: '3,4' }]);
});

test('Lenkt eine Stellung nur das eigene Licht des Strangs auf ein anderes Ziel, bleibt es ein Füllteil', () => {
  // Es zählt nur fremdes Licht: Mit Stellung 3 lenkt der Spiegel 3,1 das Weiss nach Norden auf das rote Ziel 3,0, das
  // sein Rot von der Quelle 6,0 bekommt (ein Strang ohne Spiegel).
  const funde = fuellteile([
    ...strang,
    { type: 'source', x: 6, z: 0, dir: 4, color: 'red' },
    { type: 'target', x: 3, z: 0, color: 'red' },
  ], 'mittel');
  assert.deepEqual(funde.map(f => f.strang), [
    { quelle: '0,1', spiegel: ['3,1'], ziel: '3,4' },
    { quelle: '6,0', spiegel: [], ziel: '3,0' },
  ]);
});

test('Ein Strang darf über einen Filter laufen, nicht über ein Prisma', () => {
  // Der Rotfilter 2,1 lässt vom Weiss nur Rot durch, der Spiegel 3,1 lenkt es auf das rote Ziel 3,4.
  assert.deepEqual(fuellteile([strang[0], { type: 'filter', x: 2, z: 1, color: 'red' }, strang[1], { ...strang[2], color: 'red' }],
    'mittel').map(f => f.strang), [{ quelle: '0,1', spiegel: ['3,1'], ziel: '3,4' }]);
  // Das feste Prisma 2,1 lässt das Rot der Quelle 0,1 geradeaus auf das Ziel 5,1 durch: kein Strang.
  assert.deepEqual(fuellteile([
    { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
    { type: 'prism', x: 2, z: 1, rot: 1, fixed: true },
    { type: 'target', x: 5, z: 1, color: 'red' },
  ], 'mittel'), []);
});

test('Ein Strang mit höchstens 3 Spiegeln ist ein Füllteil, auch ganz ohne Spiegel; einer mit 4 Spiegeln nicht, auch wenn einer fest ist', () => {
  assert.deepEqual(fuellteile([
    { type: 'source', x: 0, z: 1, dir: 0 },
    { type: 'target', x: 4, z: 1, color: 'white' },
  ], 'mittel').map(f => f.strang), [{ quelle: '0,1', spiegel: [], ziel: '4,1' }]);
  // Die weisse Quelle 0,0 strahlt nach Osten; die Spiegel lenken abwechselnd nach Süden und nach Osten.
  const zickzack = [
    { type: 'source', x: 0, z: 0, dir: 0 },
    { type: 'mirror', x: 2, z: 0, rot: 1 },
    { type: 'mirror', x: 2, z: 2, rot: 1 },
    { type: 'mirror', x: 4, z: 2, rot: 1 },
  ];
  assert.deepEqual(fuellteile([...zickzack, { type: 'target', x: 4, z: 5, color: 'white' }], 'mittel').map(f => f.strang),
    [{ quelle: '0,0', spiegel: ['2,0', '2,2', '4,2'], ziel: '4,5' }]);
  assert.deepEqual(fuellteile([
    ...zickzack,
    { type: 'mirror', x: 4, z: 4, rot: 1, fixed: true },
    { type: 'target', x: 6, z: 4, color: 'white' },
  ], 'mittel'), []);
});

console.log('Füllteil auf den 150 heutigen Leveln');
test('Neuzählung der Spec: ab „mittel“ haben 6 Level einen Füllteil', () => {
  const mit = heutigeLevel().filter(h => h.beurteilung.ausschluesse.some(a => a.begriff === 'Füllteil'));
  assert.deepEqual(mit.map(h => `${h.platz} ${h.level.name}`),
    ['36 Einklang', '40 Geflecht', '43 Glasmurmel', '67 Weichensteller', '77 Mosaik', '131 Korona']);
});
