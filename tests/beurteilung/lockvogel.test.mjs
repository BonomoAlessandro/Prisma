// Tests der Kernidee „Lockvogel“ (Glossar „Kernideen“, Spec „Beurteilung“): ein festes Teil abseits der Lösung, das beim
// Probieren Licht bekommt.
// - Muster: Ein festes Teil (Blocker, Filter, fester Spiegel, festes Prisma oder fester Kombinator) bekommt in der
//   Lösung kein Licht, aber in mindestens 10 % der Strahlbilder der Suche ohne Abschneiden (Anteil wie bisher in
//   quality.mjs).
// - Nötig, wenn beides gilt:
//   - Es führt beim Probieren in die Irre: Es bekommt in mindestens 10 % der Holzwege (weite Fast-Lösungen) Licht,
//     mindestens in einem.
//   - Ohne das Teil (durchsichtig, ein weisser Filter an seiner Stelle) hätte das Level eine zweite Lösung.
//   Ein Blocker, der nur eine zweite Lösung verhindert, zählt nicht; ein Teil, ohne das die Lösung eindeutig bliebe,
//   lockt zwar, aber die Lösung hängt nicht von ihm ab.
// Aufruf: node tests/beurteilung/lockvogel.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Lockvogel');

const BEGRIFF = 'Lockvogel';
const funde = (level) => beurteile(level).kernideen.filter(k => k.begriff === BEGRIFF);

/**
 * Aus 26 Labyrinth verkleinert (der drehbare Spiegel 5,4 ist hier fest). Die weisse Quelle 0,4 trifft das Prisma 1,4: In
 * der Lösung (rot 6) kommt das Rot über den Spiegel 0,3 in den Kombinator 1,2 und von dort auf das rote Ziel 0,1, das Blau
 * über den Spiegel 3,2 und den festen Spiegel 5,4 auf das blaue Ziel 6,3. Mit dem Prisma auf 7 und drei weiteren
 * Elementen anders bekommt das blaue Ziel sein Blau auf einem anderen Weg, und das Rot läuft über 0,3 in den Blocker 0,2.
 */
const labyrinth = miniLevel([
  { type: 'source', x: 0, z: 4, dir: 0 },
  { type: 'prism', x: 1, z: 4, rot: 6 },
  { type: 'mirror', x: 0, z: 3, rot: 2 },
  { type: 'mirror', x: 1, z: 3, rot: 1, fixed: true },
  { type: 'combiner', x: 1, z: 2, dir: 5 },
  { type: 'target', x: 0, z: 1, color: 'red' },
  { type: 'blocker', x: 0, z: 2 },
  { type: 'mirror', x: 3, z: 2, rot: 0 },
  { type: 'mirror', x: 3, z: 4, rot: 3, fixed: true },
  { type: 'mirror', x: 5, z: 4, rot: 0, fixed: true },
  { type: 'target', x: 6, z: 3, color: 'blue' },
], 'Labyrinth, verkleinert');

/**
 * Ein drehbarer Spiegel 2,3 schickt das Licht nach Süden über den festen Spiegel 2,5 auf das Ziel 5,5 (Lösung) oder nach
 * Norden über die festen Spiegel 2,1 und 5,1 zurück nach Süden, wo der Blocker 5,3 es schluckt. Ohne den Blocker
 * erreichte auch dieser Weg das Ziel.
 */
const umweg = miniLevel([
  { type: 'source', x: 0, z: 3, dir: 0 },
  { type: 'mirror', x: 2, z: 3, rot: 1 },
  { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
  { type: 'target', x: 5, z: 5, color: 'white' },
  { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
  { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
  { type: 'blocker', x: 5, z: 3 },
]);

test('Nötig: Der Blocker 0,2 liegt auf einem Holzweg, und ohne ihn wäre dieser Holzweg eine zweite Lösung', () => {
  // Der Holzweg: alle Ziele ausser 0,1, vier Elemente anders als in der Lösung; einer von 4 Holzwegen
  const f = funde(labyrinth);
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, {
    begriff: BEGRIFF, element: '0,2', strahlbilder: { licht: 24, alle: 120 }, holzwege: { licht: 1, alle: 4 },
    zweiteLoesung: { '1,4': 7, '0,3': 1, '1,2': 2, '3,2': 1 },
  });
  for (const teil of ['Blocker', '0,2', '1,4', '24 von 120', '1 von 4 Holzwegen']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Kein Lockvogel: Der Blocker 5,3 verhindert nur eine zweite Lösung, ohne in einem Holzweg Licht zu bekommen', () => {
  // So repariert der heutige Generator mehrdeutige Level. Der Umweg steht nur ein Element von der Lösung entfernt.
  assert.deepEqual(funde(umweg), []);
});

test('Dekorativ: Der feste Spiegel 3,6 bekommt beim Probieren Licht, doch ohne ihn bliebe die Lösung eindeutig', () => {
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 3 },
    { type: 'target', x: 3, z: 0, color: 'white' },
    { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
  ])), []);
});

test('Ohne die teuren Regeln (teuer: false) steht Lockvogel in offen', () => {
  const b = beurteile(labyrinth, { teuer: false });
  assert.ok(b.offen.includes(BEGRIFF));
  assert.ok(!b.kernideen.some(k => k.begriff === BEGRIFF));
});

console.log('Lockvogel auf den 150 heutigen Leveln');
test('7 Level, alle mit einem Blocker; je Grad nach heutigem Platz: leicht 1, mittel 2, schwer 4, sehr schwer 0', () => {
  const all = heutigeLevel({ teuer: true });
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  assert.deepEqual(mit.map(h => h.platz), [26, 60, 74, 125, 132, 135, 138]);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 1, mittel: 2, schwer: 4, 'sehr schwer': 0 });
  const typ = (h, z) => h.level.elements.find(e => `${e.x},${e.z}` === z).type;
  for (const h of mit) for (const k of h.beurteilung.kernideen.filter(k => k.begriff === BEGRIFF)) assert.equal(typ(h, k.element), 'blocker', `${h.platz} ${k.element}`);
});

test('Review 4 zu 125 Halo: Lockvögel wirken; nötig ist der Blocker 1,2, der feste Spiegel 1,6 lockt nur', () => {
  const halo = heutigeLevel({ teuer: true })[124].beurteilung.kernideen.filter(k => k.begriff === BEGRIFF);
  assert.deepEqual(halo.map(k => k.element), ['1,2']);
});

test('Blocker, die nur eine zweite Lösung verhindern, zählen nicht: 72, 75 und 111 ohne Holzweg, 131 und 147 unter 10 %', () => {
  const all = heutigeLevel({ teuer: true });
  for (const platz of [72, 75, 111, 131, 147]) {
    assert.deepEqual(all[platz - 1].beurteilung.kernideen.filter(k => k.begriff === BEGRIFF), [], `${platz}`);
  }
});
