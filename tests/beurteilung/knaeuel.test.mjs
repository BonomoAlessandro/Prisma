// Tests des Knäuels (Glossar „Knäuel“, Spec „Beurteilung“, Tabelle der Ausschlussgründe): so viele Elemente so dicht
// beieinander, dass das Feld unübersichtlich wird. Ein Knäuel liegt vor, wenn benachbarte drehbare Elemente den Wert
// 1,30 überschreiten oder der Anteil kurzer Strahlabschnitte 0,85 überschreitet; der Anteil zählt nur bei Leveln mit
// mindestens 12 Abschnitten. Gilt in allen Schwierigkeitsgraden; gemessen wird in der Lösungsstellung.
// Aufruf: node tests/beurteilung/knaeuel.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, GRADE } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Knäuel');

const funde = (elements, grad = null) =>
  beurteile(miniLevel(elements), { grad }).ausschluesse.filter(f => f.begriff === 'Knäuel');
/** Je Fund der Fall und der Wert. */
const faelle = (elements) => funde(elements).map(({ fall, wert }) => ({ fall, wert }));

/** Drehbare Elemente auf den Zellen [x, z], abwechselnd Spiegel, Prisma und Kombinator. */
const drehbar = (zellen) => zellen.map(([x, z], i) => ({ type: ['mirror', 'prism', 'combiner'][i % 3], x, z, rot: 0, dir: 0 }));
// 10 drehbare Elemente mit 13 benachbarten Paaren (auch schräg): eine volle Zeile, darunter drei einzelne.
const ZEHN = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 1], [3, 1], [6, 1]];
// Dazu 3 Elemente mit 4 weiteren Paaren: 13 Elemente, 17 Paare.
const DREIZEHN = [...ZEHN, [4, 2], [5, 2], [6, 3]];

/**
 * Quellen, die je auf ein Ziel im Osten strahlen, Zeile für Zeile: kurz (Ziel in der Nachbarzelle) oder lang (eine
 * Zelle dazwischen). Jedes Paar gibt einen Strahlabschnitt; drehbare Elemente gibt es keine.
 */
function paare(kurz, lang = 0) {
  const elements = [];
  let x = 0, z = 0;
  for (const abstand of [...Array(lang).fill(2), ...Array(kurz).fill(1)]) {
    if (x + abstand > 6) { x = 0; z++; }
    elements.push({ type: 'source', x, z, dir: 0 }, { type: 'target', x: x + abstand, z });
    x += abstand + 1;
  }
  return elements;
}

test('Benachbarte drehbare Elemente: genau 1,30 besteht, 1,31 nicht', () => {
  assert.deepEqual(faelle(drehbar(ZEHN)), []);
  assert.deepEqual(faelle(drehbar(DREIZEHN)), [{ fall: 'benachbart', wert: 1.31 }]);
});

test('Feste Elemente zählen bei den benachbarten nicht mit', () => {
  // Drehbar wären es 12 Elemente mit 22 Paaren.
  assert.deepEqual(faelle([...drehbar(ZEHN), { type: 'mirror', x: 1, z: 1, fixed: true }, { type: 'prism', x: 2, z: 1, fixed: true }]), []);
});

test('Anteil kurzer Strahlabschnitte über 0,85 bei mindestens 12 Abschnitten; 11 Abschnitte, alle kurz, bestehen', () => {
  assert.deepEqual(faelle(paare(12)), [{ fall: 'kurz', wert: 1 }]);
  assert.deepEqual(faelle(paare(11)), []);
});

test('Anteil kurzer Strahlabschnitte: genau 0,85 besteht, 0,86 nicht', () => {
  assert.deepEqual(faelle(paare(17, 3)), []);
  assert.deepEqual(faelle(paare(12, 2)), [{ fall: 'kurz', wert: 0.86 }]);
});

test('Kurz ist auch ein Schritt schräg in die Nachbarzelle', () => {
  // Je zwei Quellen strahlen schräg über Kreuz auf die beiden Ziele darunter: 12 kurze Abschnitte.
  const elements = [];
  for (let i = 0; i < 6; i++) {
    const x = 2 * (i % 3), z = 2 * Math.floor(i / 3);
    elements.push({ type: 'source', x, z, dir: 1 }, { type: 'source', x: x + 1, z, dir: 3 },
      { type: 'target', x, z: z + 1 }, { type: 'target', x: x + 1, z: z + 1 });
  }
  assert.deepEqual(faelle(elements), [{ fall: 'kurz', wert: 1 }]);
});

test('Licht, das über die Feldkante ausläuft, ist kein Abschnitt im Feld', () => {
  // 11 kurze Abschnitte, dazu eine Quelle am Rand, die nach Westen aus dem Feld strahlt.
  assert.deepEqual(faelle([...paare(11), { type: 'source', x: 0, z: 5, dir: 4 }]), []);
});

test('Die Begründung nennt den Fall mit Wert und Schwelle', () => {
  const [benachbart] = funde(drehbar(DREIZEHN)), [kurz] = funde(paare(12, 2));
  assert.match(benachbart.begruendung, /benachbart.*1,31.*1,30/i);
  assert.match(kurz.begruendung, /kurz.*0,86.*0,85.*14 Abschnitte/i);
});

test('Gilt in allen Schwierigkeitsgraden', () => {
  for (const grad of [null, ...GRADE]) assert.equal(funde(drehbar(DREIZEHN), grad).length, 1, grad);
});

console.log('Knäuel auf den 150 heutigen Leveln');
test('Neuzählung der Spec: 3 Level mit Knäuel (136, 140, 146); die Grenzfälle 122 und 150 genau bei 1,30 bestehen', () => {
  const mit = heutigeLevel().filter(h => h.beurteilung.ausschluesse.some(f => f.begriff === 'Knäuel'));
  assert.deepEqual(mit.map(h => h.platz), [136, 140, 146]);
});
