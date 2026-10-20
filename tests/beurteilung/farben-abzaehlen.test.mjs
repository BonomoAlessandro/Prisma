// Tests der Kernidee „Farben abzählen“ (Glossar „Kernideen“, Spec „Beurteilung“): Aus den Zielfarben folgern, welche
// Grundfarbe von welcher Quelle wohin muss.
// - Knapp ist eine Grundfarbe, wenn genau so viele Quellen sie an ein Ziel bringen können, wie Ziele sie brauchen (mindestens
//   zwei): Dann muss jede dieser Quellen sie an ein eigenes Ziel bringen.
// - Nötig ist das Abzählen, wenn sich der Verlust dieser Grundfarbe bei einer Quelle an keinem Ziel zeigt: Jedes Ziel
//   könnte sie noch aus einer anderen Quelle bekommen, auch wenn man Ziele mit nur einem möglichen Lieferanten diesem
//   zuteilt. Erst das Abzählen zeigt, dass es nicht aufgeht.
// Aufruf: node tests/beurteilung/farben-abzaehlen.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Farben abzählen');

const BEGRIFF = 'Farben abzählen';
const funde = (level) => beurteile(level).kernideen.filter(k => k.begriff === BEGRIFF);

test('Nötig: drei blaue Quellen für drei blaue Ziele; geht das Blau von 4,2 verloren, zeigt das kein einzelnes Ziel', () => {
  const f = funde(miniLevel([
    { type: 'source', x: 1, z: 4, dir: 6, color: 'blue' },
    { type: 'source', x: 4, z: 3, dir: 4, color: 'blue' },
    { type: 'source', x: 4, z: 2, dir: 4, color: 'blue' },
    { type: 'target', x: 3, z: 1, color: 'blue' },
    { type: 'target', x: 0, z: 0, color: 'blue' },
    { type: 'target', x: 2, z: 3, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 3 },   // Blau von 4,3 nach Westen auf 2,3
    { type: 'prism', x: 1, z: 1, rot: 4 },   // Blau von 1,4 nach Nordwesten auf 0,0
    { type: 'prism', x: 2, z: 2, rot: 6 },   // Blau von 4,2 nach Nordosten auf 3,1
  ]));
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, {
    begriff: BEGRIFF, farbe: 'blue', quellen: ['1,4', '4,3', '4,2'], ziele: ['3,1', '0,0', '2,3'],
    zuordnung: { '1,4': '0,0', '4,3': '2,3', '4,2': '3,1' }, unsichtbar: ['4,2'],
  });
  for (const teil of ['Blau', '1,4', '4,3', '4,2', '3,1', '0,0', '2,3']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Dekorativ: drei blaue Quellen für drei blaue Ziele, aber jede Quelle erreicht nur ihr eigenes Ziel', () => {
  // Geht ein Blau verloren, bleibt sein Ziel dunkel: Das sieht man am Ziel, ohne abzuzählen.
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
    { type: 'mirror', x: 2, z: 0, rot: 1 },   // nach Süden auf 2,2
    { type: 'target', x: 2, z: 2, color: 'blue' },
    { type: 'source', x: 6, z: 3, dir: 4, color: 'blue' },
    { type: 'mirror', x: 4, z: 3, rot: 1 },   // nach Norden auf 4,1
    { type: 'target', x: 4, z: 1, color: 'blue' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'mirror', x: 3, z: 5, rot: 1 },   // nach Westen auf 1,5
    { type: 'target', x: 1, z: 5, color: 'blue' },
  ])), []);
});

test('Nicht knapp: Eine Grundfarbe mit mehr Quellen als Zielen lässt sich nicht abzählen', () => {
  // Wie „nötig“, dazu eine vierte blaue Quelle, die 2,3 über das Prisma erreichen kann
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 1, z: 4, dir: 6, color: 'blue' },
    { type: 'source', x: 4, z: 3, dir: 4, color: 'blue' },
    { type: 'source', x: 4, z: 2, dir: 4, color: 'blue' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'target', x: 3, z: 1, color: 'blue' },
    { type: 'target', x: 0, z: 0, color: 'blue' },
    { type: 'target', x: 2, z: 3, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 3 },
    { type: 'prism', x: 1, z: 1, rot: 4 },
    { type: 'prism', x: 2, z: 2, rot: 6 },
  ])), []);
});

test('Nur ein möglicher Verlust zählt: Das Blau von 2,0 fällt direkt auf 2,1, und der Verlust der beiden anderen zeigt sich an einem Ziel', () => {
  // Die Quellen 1,4 und 2,4 erreichen über die Prismen jedes der drei Ziele. Ginge das Blau von 2,0 verloren, zeigte das
  // kein einzelnes Ziel, aber es kann nicht verloren gehen.
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 1, z: 4, dir: 6, color: 'blue' },
    { type: 'source', x: 2, z: 4, dir: 6, color: 'blue' },
    { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
    { type: 'target', x: 2, z: 1, color: 'blue' },
    { type: 'target', x: 3, z: 3, color: 'blue' },
    { type: 'target', x: 4, z: 3, color: 'blue' },
    { type: 'prism', x: 2, z: 3, rot: 7 },   // Blau von 2,4 nach Osten auf 3,3
    { type: 'prism', x: 3, z: 2, rot: 0 },   // Blau von 1,4 nach Südosten auf 4,3
    { type: 'prism', x: 1, z: 3, rot: 5 },
    { type: 'prism', x: 1, z: 2, rot: 7 },
  ])), []);
});

console.log('Farben abzählen auf den 150 heutigen Leveln');
test('18 Level; je Grad: leicht 0, mittel 3, schwer 9, sehr schwer 6; dabei 149 Zenit mit Blau', () => {
  const all = heutigeLevel();
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  assert.equal(mit.length, 18);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 0, mittel: 3, schwer: 9, 'sehr schwer': 6 });
  // Review 6 zu Zenit: „Farben abzählen: drei Quellen, drei Blau“
  assert.deepEqual(all[148].beurteilung.kernideen.filter(k => k.begriff === BEGRIFF).map(k => k.farbe), ['blue']);
});
