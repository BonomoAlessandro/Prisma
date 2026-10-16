// Tests der Kernidee „Sammelstelle“ (Glossar „Kernideen“, Spec „Beurteilung“): ein Prisma, das Licht aus mehreren
// Richtungen sammelt und neu verteilt.
// - Muster: In der Lösung fällt aus mindestens zwei Richtungen Licht in das Prisma, das es bricht.
// - Nötig: Ohne den Zulauf aus einer dieser Richtungen verliert ein Ziel seine Farbe, und das gilt für mindestens zwei
//   Richtungen. Zählt nur der Zulauf aus einer Richtung, ist das Sammeln bloss dekorativ.
// Aufruf: node tests/beurteilung/sammelstelle.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Sammelstelle');

const BEGRIFF = 'Sammelstelle';
const funde = (level) => beurteile(level, { teuer: false }).kernideen.filter(k => k.begriff === BEGRIFF);

test('Nötig: Das Prisma 3,3 sammelt Rot von Westen und Blau von Süden und verteilt sie auf zwei Ziele', () => {
  // Prisma rot 7: Rot (von 0,3) bricht nach Norden auf 3,0, Blau (von 3,6) nach Osten auf 6,3
  const f = funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'target', x: 3, z: 0, color: 'red' },
    { type: 'target', x: 6, z: 3, color: 'blue' },
  ]));
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, {
    begriff: BEGRIFF, element: '3,3',
    zulauf: [{ von: '0,3', farbe: 'red', ziele: ['3,0'] }, { von: '3,6', farbe: 'blue', ziele: ['6,3'] }],
  });
  for (const teil of ['3,3', '0,3', '3,6', '3,0', '6,3', 'Rot', 'Blau']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Dekorativ: Das Prisma bekommt Licht aus zwei Richtungen, aber sein Blau läuft ins Leere', () => {
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'target', x: 3, z: 0, color: 'red' },
  ])), []);
});

test('Dekorativ: Rot aus zwei Richtungen verlässt das Prisma auf derselben Bahn; jeder Zulauf allein genügt', () => {
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'target', x: 3, z: 0, color: 'red' },
  ])), []);
});

test('Licht, das an der Rückseite des Prismas verschwindet, sammelt es nicht', () => {
  // Prisma rot 1: Rot von Westen bricht nach Osten auf 6,3; Blau von Süden fiele 135° ab und verschwindet
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 6, z: 3, color: 'red' },
  ])), []);
});

console.log('Sammelstelle auf den 150 heutigen Leveln');
test('9 Level; je Grad: leicht 0, mittel 0, schwer 4, sehr schwer 5; 148 Sternenstaub sammelt Rot und Blau', () => {
  const all = heutigeLevel();
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  assert.deepEqual(mit.map(h => h.platz), [111, 124, 127, 138, 141, 142, 143, 147, 148]);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 0, mittel: 0, schwer: 4, 'sehr schwer': 5 });
  // Review 6: „Ein Prisma sammelt R, G und B aus drei Richtungen und fächert sie neu auf. Das blaue Ziel ist nur so
  // erreichbar.“ Nötig sind Blau und Rot; das Grün von 2,5 bekäme sein Ziel auch so.
  const sternenstaub = all[147].beurteilung.kernideen.filter(k => k.begriff === BEGRIFF);
  assert.deepEqual(sternenstaub.map(k => [k.element, k.zulauf.map(z => [z.von, z.farbe])]), [['2,4', [['4,4', 'blue'], ['1,5', 'red']]]]);
});
