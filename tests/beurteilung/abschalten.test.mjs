// Tests der Kernidee „Abschalten“ (Glossar „Kernideen“, Spec „Beurteilung“): Ein naheliegender Zwischenstand gibt einem
// Ziel Licht, das es in der Lösung nicht bekommt, und die Lösung verlangt, dieses Licht wegzunehmen.
// - Naheliegend: Eine Quelle bringt das Ziel allein zum Leuchten, über einen kurzen Strang (höchstens drei drehbare
//   Elemente) mit weniger drehbaren Elementen, als die Lösung für dieses Ziel braucht, und ohne dass dabei ein Ziel
//   falsches Licht bekommt, auch nicht von einer anderen Quelle.
// - Nötig: In der Lösung erfüllt diese Quelle das Ziel nicht mehr; ihr Licht muss also weg. Führt die Lösung dasselbe
//   Licht nur auf anderem Weg zum Ziel, ist der Zwischenstand bloss dekorativ.
// Aufruf: node tests/beurteilung/abschalten.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Abschalten');

const BEGRIFF = 'Abschalten';
const funde = (level) => beurteile(level).kernideen.filter(k => k.begriff === BEGRIFF);

test('Nötig: 3,0 leuchtet nach einem Zug aus Quelle 0,3, doch die Lösung braucht deren Licht für 3,6 und beliefert 3,0 aus 6,2', () => {
  const f = funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },   // in der Lösung nach Süden; nach Norden (rot 3) leuchtet 3,0
    { type: 'target', x: 3, z: 6, color: 'white' },
    { type: 'target', x: 3, z: 0, color: 'white' },
    { type: 'source', x: 6, z: 2, dir: 4 },
    { type: 'mirror', x: 5, z: 2, rot: 1 },   // nach Norden
    { type: 'mirror', x: 5, z: 0, rot: 1 },   // nach Westen auf 3,0
  ]));
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, { begriff: BEGRIFF, ziel: '3,0', farbe: 'white', quelle: '0,3', zwischenstand: { '3,3': 3 }, licht: 'white' });
  for (const teil of ['3,0', '0,3', '3,3', '3,6', '6,2', 'Weiss']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Nimmt die Lösung nur einen Teil des Lichts weg, nennt der Fund diesen Teil (148 Sternenstaub, Ziel 1,3)', () => {
  // Im Zwischenstand bringt 0,5 Magenta auf 1,3, in der Lösung nur noch Rot: Weg muss das Blau.
  const fund = heutigeLevel()[147].beurteilung.kernideen.find(k => k.begriff === BEGRIFF && k.ziel === '1,3');
  assert.deepEqual([fund.quelle, fund.farbe, fund.licht], ['0,5', 'magenta', 'blue']);
});

test('Dekorativ: Das rote Ziel leuchtet nach einem Zug am Prisma, die Lösung führt dasselbe Rot nur auf anderem Weg hin', () => {
  // Zwischenstand: Prisma rot 1 schickt Rot geradeaus auf 4,3 (Grün läuft in den Spiegel, Blau stirbt im Grünfilter).
  // Lösung: Prisma rot 2 schickt Grün durch den Filter auf 2,6 und Rot über den Spiegel auf 4,3.
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 2 },
    { type: 'filter', x: 2, z: 4, color: 'green' },
    { type: 'target', x: 2, z: 6, color: 'green' },
    { type: 'mirror', x: 3, z: 4, rot: 0 },
    { type: 'target', x: 4, z: 3, color: 'red' },
  ])), []);
});

test('Kein Abschalten, wenn die Lösung das Ziel ebenso kurz beliefert wie der Zwischenstand', () => {
  // Wie oben „nötig“, aber 6,2 erreicht 3,0 über einen Spiegel: Der Zwischenstand ist nicht kürzer als die Lösung.
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6, color: 'white' },
    { type: 'target', x: 3, z: 0, color: 'white' },
    { type: 'source', x: 6, z: 1, dir: 4 },
    { type: 'mirror', x: 4, z: 1, rot: 1 },   // nach Norden auf 4,0
    { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },   // fest: nach Westen auf 3,0
  ])), []);
});

test('Kein Abschalten, wenn der Zwischenstand Licht einer anderen Quelle falsch auf ein Ziel lenkt', () => {
  // Prisma rot 7 schickt das Rot von 0,2 nach Norden auf 2,0, lenkt aber zugleich das Blau von 2,4 auf das rote Ziel 4,2.
  // In der Lösung (rot 1) geht das Rot auf 4,2, und das Blau stirbt an der Rückseite des Prismas.
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
    { type: 'prism', x: 2, z: 2, rot: 1 },
    { type: 'target', x: 4, z: 2, color: 'red' },
    { type: 'target', x: 2, z: 0, color: 'red' },
    { type: 'source', x: 2, z: 4, dir: 6, color: 'blue' },
    { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
    { type: 'mirror', x: 5, z: 3, rot: 1 },   // nach Norden
    { type: 'mirror', x: 5, z: 0, rot: 1 },   // nach Westen auf 2,0
  ])), []);
});

console.log('Abschalten auf den 150 heutigen Leveln');
test('24 Level; je Grad nach heutigem Platz: leicht 0, mittel 8, schwer 11, sehr schwer 5; dabei 141 Morgenröte mit 6,4', () => {
  const all = heutigeLevel();
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  assert.equal(mit.length, 24);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 0, mittel: 8, schwer: 11, 'sehr schwer': 5 });
  // Review 6 zu Morgenröte: „Das erfüllte Ziel muss man zerstören“
  const morgenroete = all[140].beurteilung.kernideen.filter(k => k.begriff === BEGRIFF);
  assert.deepEqual(morgenroete.map(k => [k.ziel, k.quelle, k.zwischenstand]), [['6,4', '5,6', { '5,4': 3 }]]);
});
