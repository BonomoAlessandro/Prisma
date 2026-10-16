// Tests der Scheinmischung (Glossar „Scheinmischung“, Spec „Beurteilung“, Tabelle der Ausschlussgründe): eine Mischung,
// die nichts bewirkt. (a) Ein Kombinator gibt einen Eingang unverändert aus oder hat nur einen beleuchteten Eingang.
// (b) Eine Mischung läuft direkt in ein Prisma, das genau die eingehenden Strahlen wieder trennt, gezählt nach
// Strahlen. (c) Eine Mischung läuft in einen Filter, der nur einen Eingang durchlässt. Trägt nur eine Quelle die
// Mischung, ist das kein Ausschluss. Gilt in allen Schwierigkeitsgraden; gemessen wird in der Lösungsstellung.
// Aufruf: node tests/beurteilung/scheinmischung.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, GRADE } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Scheinmischung');

const funde = (elements, grad = null) =>
  beurteile(miniLevel(elements), { grad }).ausschluesse.filter(f => f.begriff === 'Scheinmischung');
/** Je Fund der Kombinator und der Fall. */
const faelle = (elements) => funde(elements).map(({ element, fall }) => ({ element, fall }));

// Rot von Westen und Blau von Süden treffen sich im Kombinator auf 3,3; er gibt Magenta nach Norden ab.
const ROT_UND_BLAU = [
  { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
  { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
  { type: 'combiner', x: 3, z: 3, dir: 6 },
];
// Wie oben, nur trennt ein Prisma auf 3,1 das Magenta gleich wieder in Rot und Blau (Fall b).
const IN_DAS_PRISMA = [
  ...ROT_UND_BLAU,
  { type: 'prism', x: 3, z: 1, rot: 6 },
  { type: 'target', x: 2, z: 0, color: 'red' },
  { type: 'target', x: 4, z: 0, color: 'blue' },
];
// Weiss von Westen und Rot von Süden: Weiss + Rot = Weiss (Fall a).
const WEISS_UND_ROT = [
  { type: 'source', x: 0, z: 3, dir: 0 },
  { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
  { type: 'combiner', x: 3, z: 3, dir: 6 },
  { type: 'target', x: 3, z: 0, color: 'white' },
];
// Das Magenta läuft in einen Rotfilter, der nur den Eingang Rot durchlässt (Fall c).
const IN_DEN_FILTER = [
  ...ROT_UND_BLAU,
  { type: 'filter', x: 3, z: 1, color: 'red' },
  { type: 'target', x: 3, z: 0, color: 'red' },
];

test('Eine echte Mischung ist keine Scheinmischung: Rot und Blau werden im Kombinator zu Magenta für das Ziel', () => {
  assert.deepEqual(faelle([...ROT_UND_BLAU, { type: 'target', x: 3, z: 0, color: 'magenta' }]), []);
});

test('(a) Ein Kombinator gibt einen Eingang unverändert aus: Weiss + Rot = Weiss', () => {
  assert.deepEqual(faelle(WEISS_UND_ROT), [{ element: '3,3', fall: 'a' }]);
});

test('(a) Ein Kombinator hat nur einen beleuchteten Eingang; einer ganz ohne Licht ist keine Scheinmischung', () => {
  assert.deepEqual(faelle([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'target', x: 3, z: 0, color: 'red' },
    { type: 'combiner', x: 6, z: 6, dir: 4 },
  ]), [{ element: '3,3', fall: 'a' }]);
});

test('Trägt nur eine Quelle die Mischung, ist das kein Ausschluss: Rot, Grün und Blau einer weissen Quelle werden wieder Weiss', () => {
  // Das Prisma fächert Weiss auf; Rot und Blau laufen über feste Spiegel, Grün geradeaus in den Kombinator auf 6,3.
  assert.deepEqual(faelle([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 1, rot: 0, fixed: true },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'combiner', x: 6, z: 3, dir: 6 },
    { type: 'target', x: 6, z: 0, color: 'white' },
  ]), []);
});

test('(b) Die Mischung läuft direkt in ein Prisma, das sie wieder in die eingehenden Strahlen Rot und Blau trennt', () => {
  assert.deepEqual(faelle(IN_DAS_PRISMA), [{ element: '3,3', fall: 'b' }]);
});

test('(b) Fall Zenit: Rot, Grün und Blau als einzelne Strahlen, zwei davon aus derselben Quelle; gezählt nach Strahlen', () => {
  // Ein Prisma zerlegt Cyan aus einer Quelle in Grün und Blau, Rot kommt aus einer zweiten Quelle. Nach Quellen kämen
  // zwei Eingänge in drei Farben heraus; nach Strahlen trennt das zweite Prisma genau die drei eingehenden Strahlen.
  assert.deepEqual(faelle([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
    { type: 'prism', x: 2, z: 3, rot: 0 },
    { type: 'mirror', x: 4, z: 5, rot: 0, fixed: true },
    { type: 'source', x: 6, z: 6, dir: 6, color: 'red' },
    { type: 'combiner', x: 6, z: 3, dir: 6 },
    { type: 'prism', x: 6, z: 1, rot: 5 },
    { type: 'target', x: 5, z: 1, color: 'red' },
    { type: 'target', x: 5, z: 0, color: 'green' },
    { type: 'target', x: 6, z: 0, color: 'blue' },
  ]), [{ element: '6,3', fall: 'b' }]);
});

test('Eine Mischung, die über einen Spiegel ins Prisma läuft, also nicht direkt, besteht', () => {
  // Der Spiegel auf 3,1 lenkt das Magenta nach Westen in das Prisma auf 1,1.
  assert.deepEqual(faelle([
    ...ROT_UND_BLAU,
    { type: 'mirror', x: 3, z: 1, rot: 1 },
    { type: 'prism', x: 1, z: 1, rot: 4 },
    { type: 'target', x: 0, z: 2, color: 'red' },
    { type: 'target', x: 0, z: 0, color: 'blue' },
  ]), []);
});

test('Ein Prisma, das mehr zerlegt, als hineinkam, besteht: Gelb + Blau = Weiss zerfällt in Rot, Grün und Blau', () => {
  assert.deepEqual(faelle([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 6 },
    { type: 'prism', x: 3, z: 1, rot: 6 },
    { type: 'target', x: 2, z: 0, color: 'red' },
    { type: 'target', x: 3, z: 0, color: 'green' },
    { type: 'target', x: 4, z: 0, color: 'blue' },
  ]), []);
});

test('(c) Die Mischung läuft in einen Filter, der nur einen Eingang durchlässt, auch über einen Spiegel', () => {
  assert.deepEqual(faelle(IN_DEN_FILTER), [{ element: '3,3', fall: 'c' }]);
  // Der Spiegel auf 3,1 lenkt das Magenta nach Westen in den Rotfilter auf 1,1.
  assert.deepEqual(faelle([
    ...ROT_UND_BLAU,
    { type: 'mirror', x: 3, z: 1, rot: 1 },
    { type: 'filter', x: 1, z: 1, color: 'red' },
    { type: 'target', x: 0, z: 1, color: 'red' },
  ]), [{ element: '3,3', fall: 'c' }]);
});

test('Ein Filter, der die ganze Mischung durchlässt, besteht', () => {
  assert.deepEqual(faelle([
    ...ROT_UND_BLAU,
    { type: 'filter', x: 3, z: 1, color: 'magenta' },
    { type: 'target', x: 3, z: 0, color: 'magenta' },
  ]), []);
});

test('Gemessen wird in der Lösungsstellung: Der Kombinator zeigt zu Beginn in einen Rotfilter, gelöst ins Prisma', () => {
  // In der Startstellung liefe das Magenta nach Osten in den Rotfilter auf 5,3 (Fall c); gelöst zeigt der Kombinator
  // nach Norden in das Prisma auf 3,1 (Fall b).
  const level = miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'combiner', x: 3, z: 3, dir: 0 },
    { type: 'filter', x: 5, z: 3, color: 'red' },
    { type: 'prism', x: 3, z: 1, rot: 6 },
    { type: 'target', x: 2, z: 0, color: 'red' },
    { type: 'target', x: 4, z: 0, color: 'blue' },
  ]);
  level.solution['3,3'] = 6;
  const gefunden = beurteile(level).ausschluesse.filter(f => f.begriff === 'Scheinmischung');
  assert.deepEqual(gefunden.map(({ element, fall }) => ({ element, fall })), [{ element: '3,3', fall: 'b' }]);
});

test('Die Begründung nennt den Kombinator, das Element, in das die Mischung läuft, und den Fall', () => {
  const [a] = funde(WEISS_UND_ROT), [b] = funde(IN_DAS_PRISMA), [c] = funde(IN_DEN_FILTER);
  assert.match(a.begruendung, /Kombinator 3,3.*Fall a/);
  assert.match(b.begruendung, /Kombinator 3,3.*Prisma 3,1.*Fall b/);
  assert.match(c.begruendung, /Kombinator 3,3.*Filter 3,1.*Fall c/);
});

test('Gilt in allen Schwierigkeitsgraden', () => {
  for (const grad of [null, ...GRADE]) assert.equal(funde(WEISS_UND_ROT, grad).length, 1, grad);
});

console.log('Scheinmischung auf den 150 heutigen Leveln');
test('Neuzählung der Spec: 30 Level mit Scheinmischung, 26 Kombinatoren im Fall a, 6 im Fall b, 1 im Fall c', () => {
  const jeLevel = heutigeLevel().map(h => h.beurteilung.ausschluesse.filter(f => f.begriff === 'Scheinmischung'));
  const jeFall = ['a', 'b', 'c'].map(fall => jeLevel.flat().filter(f => f.fall === fall).length);
  assert.deepEqual([jeLevel.filter(f => f.length).length, ...jeFall], [30, 26, 6, 1]);
});

test('Grenzfälle der Spec: 149 Zenit fällt im Fall b; 76, 100 und 117 (zerlegt mehr) und 118 (über Spiegel) bestehen', () => {
  const fallB = heutigeLevel()
    .filter(h => h.beurteilung.ausschluesse.some(f => f.begriff === 'Scheinmischung' && f.fall === 'b')).map(h => h.platz);
  assert.ok(fallB.includes(149), String(fallB));
  for (const platz of [76, 100, 117, 118]) assert.ok(!fallB.includes(platz), String(platz));
});
