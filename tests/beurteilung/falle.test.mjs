// Tests der Kernidee „Falle“ (Glossar „Kernideen“, Spec „Beurteilung“): eine naheliegende Stellung eines Prismas oder
// Spiegels, die in die Irre führt.
// - Naheliegend wie beim Abschalten: Eine Quelle erfüllt ein Ziel allein über einen kurzen Strang, kürzer als in der
//   Lösung, ohne falsches Licht, und ein Spiegel oder Prisma darin steht in der Lösung anders.
// - Abgrenzung: Bringt die Lösung dasselbe Licht derselben Quelle auf anderem Weg hin, ist es eine Falle; nimmt sie es
//   dem Ziel weg, ist es Abschalten. Für einen Zwischenstand gilt nie beides.
// - Nötig: Die Stellung führt in einen Holzweg (eine weite Fast-Lösung enthält sie), und das Spielermodell mit
//   Horizont 2 widerlegt sie nicht auf den ersten Blick. Sonst ist die Falle bloss dekorativ.
// Aufruf: node tests/beurteilung/falle.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Falle');

const BEGRIFF = 'Falle';
const funde = (level) => beurteile(level).kernideen.filter(k => k.begriff === BEGRIFF);

/**
 * Die weisse Quelle 0,4 trifft das Prisma 2,4. In der Lösung (rot 7) läuft Blau geradeaus auf das blaue Ziel, Rot über
 * den Spiegel 2,2 auf das rote Ziel 0,2, und der Spiegel 4,2 lenkt die rote Quelle 6,2 auf das rote Ziel 4,6.
 * Naheliegend ist rot 6: Das Rot fällt direkt auf 0,2.
 */
const prismenfalle = (blau) => miniLevel([
  { type: 'source', x: 0, z: 4, dir: 0 },
  { type: 'prism', x: 2, z: 4, rot: 7 },
  { type: 'mirror', x: 2, z: 2, rot: 1 },
  { type: 'mirror', x: 4, z: 2, rot: 3 },
  { type: 'source', x: 6, z: 2, dir: 4, color: 'red' },
  { type: 'target', x: 0, z: 2, color: 'red' },
  { type: 'target', x: blau, z: 4, color: 'blue' },
  { type: 'target', x: 4, z: 6, color: 'red' },
]);

test('Nötig: Rot direkt aus dem Prisma auf 0,2 liegt nahe; dann kann 4,2 nicht Blau und die rote Quelle zugleich lenken', () => {
  // Mit rot 6 läuft Blau zum Spiegel 4,2, und gedreht auf rot 0 brächte er es auf das blaue Ziel 6,4. Dann schluckt er aber
  // das Rot von 6,2, und 4,6 bleibt dunkel: ein Holzweg mit 3 Elementen anders als in der Lösung.
  const f = funde(prismenfalle(6));
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, {
    begriff: BEGRIFF, ziel: '0,2', farbe: 'red', quelle: '0,4', stellung: { '2,4': 6 }, falsch: ['2,4'],
    holzweg: { ziel: '4,6', abstand: 3 },
  });
  for (const teil of ['0,2', '0,4', '2,4', '2,2', '4,6', 'Rot', 'Prisma']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Dekorativ: Steht das blaue Ziel auf 5,4, verrät die naheliegende Stellung sich sofort und führt in keinen Holzweg', () => {
  // Mit rot 6 kann kein Blau mehr auf 5,4 kommen; das sieht das Spielermodell auf den ersten Blick, und die Fast-Lösungen
  // mit dieser Stellung liegen nur 2 Elemente von der Lösung entfernt.
  const level = prismenfalle(5);
  assert.deepEqual(funde(level), []);
  assert.deepEqual(beurteile(level).kernideen, []);
});

test('Abgrenzung: Nimmt die Lösung dem Ziel das Licht des Zwischenstands weg, ist es Abschalten und keine Falle', () => {
  // Das Mini-Level „nötig“ aus abschalten.test.mjs
  const b = beurteile(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6, color: 'white' },
    { type: 'target', x: 3, z: 0, color: 'white' },
    { type: 'source', x: 6, z: 2, dir: 4 },
    { type: 'mirror', x: 5, z: 2, rot: 1 },
    { type: 'mirror', x: 5, z: 0, rot: 1 },
  ]));
  assert.deepEqual(b.kernideen.map(k => [k.begriff, k.ziel]), [['Abschalten', '3,0']]);
});

test('Ohne die teuren Regeln (teuer: false) steht Falle in offen', () => {
  const b = beurteile(prismenfalle(6), { teuer: false });
  assert.ok(b.offen.includes(BEGRIFF));
  assert.ok(!b.kernideen.some(k => k.begriff === BEGRIFF));
});

console.log('Falle auf den 150 heutigen Leveln');
test('10 Level; je Grad nach heutigem Platz: leicht 0, mittel 2, schwer 6, sehr schwer 2; nie mit Abschalten am selben Zwischenstand', () => {
  const all = heutigeLevel({ teuer: true });
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  assert.deepEqual(mit.map(h => h.platz), [76, 79, 101, 114, 119, 124, 134, 138, 147, 150]);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 0, mittel: 2, schwer: 6, 'sehr schwer': 2 });
  for (const h of all) {
    const ab = h.beurteilung.kernideen.filter(k => k.begriff === 'Abschalten');
    for (const f of h.beurteilung.kernideen.filter(k => k.begriff === BEGRIFF)) {
      assert.ok(!ab.some(a => a.ziel === f.ziel && a.quelle === f.quelle), `${h.platz}: ${f.ziel} von ${f.quelle}`);
    }
  }
});

test('Review 4 zu 134 Kristallpalast: Die „Falle“ über S(3,2)/S(5,4) nimmt die Lösung dem Ziel 6,3 weg, also Abschalten', () => {
  const k = heutigeLevel({ teuer: true })[133].beurteilung.kernideen;
  assert.deepEqual(k.filter(f => f.begriff === 'Abschalten' && f.ziel === '6,3').map(f => f.zwischenstand), [{ '3,2': 0, '5,4': 0, '0,5': 0 }]);
  assert.deepEqual(k.filter(f => f.begriff === BEGRIFF).map(f => f.ziel), ['1,1']);
});

test('Auf den ersten Blick widerlegt: In 135 Pulsar führt der Zwischenstand für 1,3 in einen Holzweg, ist aber keine Falle', () => {
  // Der Zwischenstand über 3,4, 2,3 und 2,5 steckt in 192 weiten Fast-Lösungen, aber mit ihm kann ein Ziel sein Licht
  // sichtbar nicht mehr bekommen.
  const h = heutigeLevel({ teuer: true })[134];
  assert.deepEqual(h.beurteilung.kernideen.filter(k => k.begriff === BEGRIFF), []);
});
