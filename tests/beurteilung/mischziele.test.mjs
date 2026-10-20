// Tests der Mischziele (Glossar „Mischziel“, Spec „Beurteilung“): Ein Mischziel ist ein Ziel, dessen Farbe erst im Level
// gemischt wird, durch einen Kombinator oder durch mehrere Strahlen auf dem Ziel. Weiss direkt aus einer weissen Quelle
// zählt nicht. Ein Mischziel aus zwei Quellen ist gekennzeichnet. Gemessen wird in der Lösungsstellung.
// Aufruf: node tests/beurteilung/mischziele.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Mischziele');

const mischziele = (elements) => beurteile(miniLevel(elements)).mischziele;

test('Mischung im Kombinator: Rot und Blau aus zwei Quellen werden zu Magenta, Mischziel aus zwei Quellen', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'target', x: 3, z: 0, color: 'magenta' },
  ]), [{ ziel: '3,0', farbe: 'magenta', quellen: ['0,3', '3,6'], ausZweiQuellen: true }]);
});

test('Mischung auf dem Ziel: Rot und Blau treffen sich auf dem Ziel, Mischziel aus zwei Quellen', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
    { type: 'target', x: 3, z: 3, color: 'magenta' },
  ]), [{ ziel: '3,3', farbe: 'magenta', quellen: ['0,3', '3,0'], ausZweiQuellen: true }]);
});

test('Weiss direkt aus einer weissen Quelle ist kein Mischziel', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6, color: 'white' },
  ]), []);
});

test('Zwei Strahlen derselben Quelle auf einem Ziel: Mischziel, aber nicht aus zwei Quellen', () => {
  // Das Prisma fächert Weiss auf: Rot und Blau laufen über die festen Spiegel auf das magentafarbene Ziel, Grün geradeaus.
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'target', x: 4, z: 3, color: 'green' },
    { type: 'target', x: 6, z: 3, color: 'magenta' },
  ]), [{ ziel: '6,3', farbe: 'magenta', quellen: ['0,3'], ausZweiQuellen: false }]);
});

test('Eine Quelle, deren Licht eine andere Quelle schluckt, bringt kein Licht aufs Ziel, auch wenn diese dunkel ist', () => {
  // Wie oben, dazu strahlt eine rote Quelle von hinten in die weisse. Allein durch das Feld liefe ihr Rot über das Prisma
  // auf das magentafarbene Ziel.
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 1, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'target', x: 4, z: 3, color: 'green' },
    { type: 'target', x: 6, z: 3, color: 'magenta' },
  ]), [{ ziel: '6,3', farbe: 'magenta', quellen: ['1,3'], ausZweiQuellen: false }]);
});

test('Ein Kombinator, der schon gemischtes Licht bekommt und ohne es selbst mischt, liefert ein Mischziel', () => {
  // Der erste Kombinator mischt Magenta und gibt es an den zweiten. Der bekommt dazu Rot und Blau direkt und gibt
  // Magenta ab, das er schon als Eingang hat; ohne den ersten mischt er es selbst.
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 0 },
    { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
    { type: 'source', x: 5, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 5, z: 3, dir: 0 },
    { type: 'target', x: 6, z: 3, color: 'magenta' },
  ]), [{ ziel: '6,3', farbe: 'magenta', quellen: ['0,3', '3,6', '5,0', '5,6'], ausZweiQuellen: true }]);
});

test('Weiss aus einer weissen Quelle über einen Kombinator, der nichts mischt (Weiss + Rot = Weiss): kein Mischziel', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'target', x: 3, z: 0, color: 'white' },
  ]), []);
});

test('Weiss, das im Kombinator aus Rot, Grün und Blau einer weissen Quelle entsteht, ist ein Mischziel', () => {
  // Nicht direkt aus der Quelle: Das Prisma zerlegt das Weiss, der Kombinator mischt es neu.
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'combiner', x: 6, z: 3, dir: 6 },
    { type: 'target', x: 6, z: 0, color: 'white' },
  ]), [{ ziel: '6,0', farbe: 'white', quellen: ['0,3'], ausZweiQuellen: false }]);
});

test('Gelb aus einem Gelbfilter ist kein Mischziel: gefiltert, nicht gemischt', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'filter', x: 2, z: 3, color: 'yellow' },
    { type: 'target', x: 5, z: 3, color: 'yellow' },
  ]), []);
});

test('Ein Ziel in einer Grundfarbe ist kein Mischziel: weder mit zwei Strahlen noch mit Licht aus einer zerlegten Mischung', () => {
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
    { type: 'target', x: 3, z: 3, color: 'red' },
  ]), []);
  // Der Kombinator mischt Magenta, das Prisma zerlegt es wieder in Rot und Blau für die beiden Ziele.
  assert.deepEqual(mischziele([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'prism', x: 3, z: 1, rot: 6 },
    { type: 'target', x: 2, z: 0, color: 'red' },
    { type: 'target', x: 4, z: 0, color: 'blue' },
  ]), []);
});

test('Gemessen wird in der Lösungsstellung, nicht in der Startstellung', () => {
  // Zu Beginn lenkt der Spiegel das Blau nach Norden aus dem Feld, in der Lösung (rot 3) nach Süden auf das Ziel.
  const level = { name: 'Lösungsstellung', solution: { '3,0': 3 }, elements: [
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 6, z: 0, dir: 4, color: 'blue' },
    { type: 'mirror', x: 3, z: 0, rot: 1 },
    { type: 'target', x: 3, z: 3, color: 'magenta' },
  ] };
  assert.deepEqual(beurteile(level).mischziele, [{ ziel: '3,3', farbe: 'magenta', quellen: ['0,3', '6,0'], ausZweiQuellen: true }]);
});

console.log('Mischziele auf den 150 heutigen Leveln');
test('Neuzählung der Spec: 71 Level haben ein Mischziel, 38 eines aus zwei Quellen', () => {
  const all = heutigeLevel();
  const mit = all.filter(h => h.beurteilung.mischziele.length);
  const zwei = all.filter(h => h.beurteilung.mischziele.some(m => m.ausZweiQuellen));
  assert.deepEqual([mit.length, zwei.length], [71, 38]);
});
