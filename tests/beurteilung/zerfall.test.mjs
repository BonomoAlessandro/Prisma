// Tests des Ausschlussgrunds Zerfall (Glossar „Zerfall“, Spec „Beurteilung“): Das Level zerfällt in mehr als eine Gruppe
// von Zielen, und die zweite Gruppe hat mindestens 3 drehbare Elemente. Ein gemeinsames Mischziel verbindet Gruppen. Gilt
// erst ab „mittel“; ohne vorgegebenen Grad wie ab „mittel“.
// Aufruf: node tests/beurteilung/zerfall.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Zerfall');

/** Zerfall-Funde eines Mini-Levels (Elemente in Lösungsstellung), beurteilt im Grad grad. */
const zerfall = (elements, grad) => beurteile(miniLevel(elements), { grad }).ausschluesse.filter(a => a.begriff === 'Zerfall');

// Links zerlegt das feste Prisma 1,3 das Weiss der Quelle 0,3: Grün läuft über die drehbaren Spiegel 4,3, 4,1 und 5,1
// auf das grüne Ziel 5,0, Rot nach Nordosten aus dem Feld, Blau nach Südosten.
const gruen = (letzterFest = false) => [
  { type: 'source', x: 0, z: 3, dir: 0 },
  { type: 'prism', x: 1, z: 3, rot: 0, fixed: true },
  { type: 'mirror', x: 4, z: 3, rot: 3 },
  { type: 'mirror', x: 4, z: 1, rot: 3 },
  { type: 'mirror', x: 5, z: 1, rot: 3, fixed: letzterFest },
  { type: 'target', x: 5, z: 0, color: 'green' },
];
// Rechts läuft das Rot der Quelle 6,4 über die drehbaren Spiegel 6,6, 4,6 und 4,5 auf das Ziel 3,5.
const rot = [
  { type: 'source', x: 6, z: 4, dir: 2, color: 'red' },
  { type: 'mirror', x: 6, z: 6, rot: 3 },
  { type: 'mirror', x: 4, z: 6, rot: 1 },
  { type: 'mirror', x: 4, z: 5, rot: 1 },
];
// Getrennt: Das Blau des Prismas endet im Blocker 2,4, das Ziel 3,5 ist rot.
const getrennt = (letzterFest) => [...gruen(letzterFest), ...rot, { type: 'blocker', x: 2, z: 4 }, { type: 'target', x: 3, z: 5, color: 'red' }];

test('Zwei Gruppen mit je 3 drehbaren Elementen ab „mittel“: Zerfall; die Begründung nennt die Gruppen', () => {
  for (const grad of ['mittel', 'schwer', 'sehr schwer']) {
    const funde = zerfall(getrennt(), grad);
    assert.equal(funde.length, 1, grad);
    assert.deepEqual(funde[0].gruppen, [
      { ziele: ['5,0'], elemente: ['4,3', '4,1', '5,1'] },
      { ziele: ['3,5'], elemente: ['6,6', '4,6', '4,5'] },
    ], grad);
    for (const zelle of ['5,0', '3,5']) assert.ok(funde[0].begruendung.includes(zelle), `${grad}: ${funde[0].begruendung}`);
  }
});

test('Derselbe Zerfall ist in „leicht“ erlaubt', () => {
  assert.deepEqual(zerfall(getrennt(), 'leicht'), []);
});

test('Ohne vorgegebenen Grad gilt Zerfall wie ab „mittel“, und die Begründung sagt es', () => {
  for (const funde of [zerfall(getrennt(), null), beurteile(miniLevel(getrennt())).ausschluesse.filter(a => a.begriff === 'Zerfall')]) {
    assert.equal(funde.length, 1);
    assert.match(funde[0].begruendung, /ab „mittel“.*nicht vorgegeben/);
  }
  assert.doesNotMatch(zerfall(getrennt(), 'mittel')[0].begruendung, /nicht vorgegeben/);
});

test('Eine zweite Gruppe mit 2 drehbaren Elementen ist kein Zerfall', () => {
  // Wie oben, aber der Spiegel 5,1 ist fest: Die grüne Gruppe hat nur noch 2 drehbare Elemente.
  assert.deepEqual(zerfall(getrennt(true), 'mittel'), []);
});

test('Zwei Gruppen mit gemeinsamem Mischziel sind kein Zerfall', () => {
  // Wie oben, aber das Blau des Prismas läuft auf das Ziel 3,5, das nun magenta ist: Rot von rechts und Blau von links
  // mischen sich darauf. Von den drehbaren Spiegeln hängt das Ziel nur rechts ab; die Quelle 0,3 der grünen Gruppe
  // bringt aber ihr Blau darauf.
  assert.deepEqual(zerfall([...gruen(), ...rot, { type: 'target', x: 3, z: 5, color: 'magenta' }], 'mittel'), []);
});

console.log('Zerfall auf den 150 heutigen Leveln');
test('Neuzählung der Spec: ab „mittel“ haben 6 Level einen Zerfall', () => {
  const mit = heutigeLevel().filter(h => h.beurteilung.ausschluesse.some(a => a.begriff === 'Zerfall'));
  assert.deepEqual(mit.map(h => `${h.platz} ${h.level.name}`),
    ['40 Geflecht', '86 Laterne', '131 Korona', '133 Sternbild', '134 Kristallpalast', '139 Singularität']);
});
