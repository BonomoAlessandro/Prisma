// Tests der Kernidee „Mischziel aus zwei Quellen“ (Glossar „Kernideen“, Spec „Beurteilung“): Ein Ziel, dessen Farbe nur
// entsteht, wenn sich Strahlen aus zwei verschiedenen Quellen darauf treffen. Vorauswahl sind die Mischziele, auf die
// mindestens zwei Quellen Licht bringen. Die Kernidee zählt nur, wenn die Lösung von ihr abhängt: Mit dem Licht nur
// einer Quelle bekommt das Ziel seine Farbe nicht.
// Aufruf: node tests/beurteilung/mischziel-zwei-quellen.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Kernidee Mischziel aus zwei Quellen');

const BEGRIFF = 'Mischziel aus zwei Quellen';
const funde = (level) => beurteile(level).kernideen.filter(k => k.begriff === BEGRIFF);

test('Nötig: Rot aus einer Quelle und Blau aus einer anderen treffen sich auf dem magentafarbenen Ziel', () => {
  const f = funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'mirror', x: 3, z: 3, rot: 1 },   // lenkt das Rot nach Süden
    { type: 'source', x: 6, z: 6, dir: 4, color: 'blue' },
    { type: 'target', x: 3, z: 6, color: 'magenta' },
  ]));
  assert.equal(f.length, 1);
  const { begruendung, ...rest } = f[0];
  assert.deepEqual(rest, { begriff: BEGRIFF, ziel: '3,6', farbe: 'magenta', quellen: ['0,3', '6,6'], licht: { '0,3': 'red', '6,6': 'blue' } });
  for (const teil of ['3,6', '0,3', '6,6', 'Rot', 'Blau', 'Magenta']) assert.ok(begruendung.includes(teil), `${teil} fehlt: ${begruendung}`);
});

test('Nötig: Auch eine Mischung im Kombinator aus zwei Quellen zählt', () => {
  const f = funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'target', x: 3, z: 0, color: 'magenta' },
  ]));
  assert.deepEqual(f.map(({ ziel, quellen, licht }) => ({ ziel, quellen, licht })),
    [{ ziel: '3,0', quellen: ['0,3', '3,6'], licht: { '0,3': 'red', '3,6': 'blue' } }]);
});

test('Dekorativ: Die weisse Quelle liefert Magenta allein (Rot und Blau aus ihrem Prisma), das Rot der zweiten Quelle zählt nicht', () => {
  const level = miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },   // Rot nach Nordosten, Grün geradeaus, Blau nach Südosten
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'target', x: 4, z: 3, color: 'green' },
    { type: 'target', x: 6, z: 3, color: 'magenta' },
    { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
  ]);
  // Das Muster ist da: ein Mischziel, auf das zwei Quellen Licht bringen
  assert.deepEqual(beurteile(level).mischziele, [{ ziel: '6,3', farbe: 'magenta', quellen: ['0,3', '6,0'], ausZweiQuellen: true }]);
  assert.deepEqual(funde(level), []);
});

test('Zwei Strahlen derselben Quelle auf einem Ziel sind kein Mischziel aus zwei Quellen', () => {
  assert.deepEqual(funde(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'target', x: 4, z: 3, color: 'green' },
    { type: 'target', x: 6, z: 3, color: 'magenta' },
  ])), []);
});

console.log('Mischziel aus zwei Quellen auf den 150 heutigen Leveln');
test('37 Level mit 44 Zielen; je Grad: leicht 2, mittel 10, schwer 13, sehr schwer 12', () => {
  const all = heutigeLevel();
  const mit = all.filter(h => h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF));
  const ziele = all.flatMap(h => h.beurteilung.kernideen.filter(k => k.begriff === BEGRIFF));
  assert.deepEqual([mit.length, ziele.length], [37, 44]);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, mit.filter(h => h.grad === g).length]));
  // Grad aus den Leveldaten (Ticket 15): 131 Korona, 136 Quasar und 137 Ereignishorizont sind sehr schwer geworden,
  // 145 Lichtbrücke schwer; Ticket 16: 110 Farbknoten und 112 Bernstein mittel
  assert.deepEqual(jeGrad, { leicht: 2, mittel: 10, schwer: 13, 'sehr schwer': 12 });
});

test('Gegenüber der Vorauswahl fallen nur die Ziele weg, die eine Quelle allein erfüllt: 114 Gordischer Knoten (3,0) und 125 Halo (0,4)', () => {
  const weg = heutigeLevel().flatMap(h => h.beurteilung.mischziele
    .filter(m => m.ausZweiQuellen && !h.beurteilung.kernideen.some(k => k.begriff === BEGRIFF && k.ziel === m.ziel))
    .map(m => `${h.platz} ${h.level.name} ${m.ziel}`));
  assert.deepEqual(weg, ['114 Gordischer Knoten 3,0', '125 Halo 0,4']);
});
