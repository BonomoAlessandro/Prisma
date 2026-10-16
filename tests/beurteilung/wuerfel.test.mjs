// Tests der Beurteilung mit Würfel-Leveln (Ticket 14, nur auf dem Branch feature/3d-wuerfel). Die Beurteilung kennt das
// Feld nur über die Feldform; hier über die Würfel-Feldform (feldform-wuerfel.mjs):
// - die beiden Würfel-Level Aufzug und Kern ganz beurteilt, mit plausiblen Werten (begründet in Ticket 14);
// - Mini-Würfel für Mischziel, Scheinmischung und Knäuel, mit Licht zwischen den Ebenen; beim Knäuel zählen die 18
//   Nachbarn im Raum (ohne Raumdiagonalen);
// - flache Level als Würfel mit einer Ebene: Die Würfel-Feldform muss sie genau wie die flache beurteilen.
// Aufruf: node tests/beurteilung/wuerfel.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { L } from '../../tools/solver.mjs';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { beurteileAlle } from '../../tools/beurteilung/parallel.mjs';
import { MINDEST_SPIELWERT } from '../../tools/beurteilung/spielwert.mjs';
import { test, miniLevel } from './helfer.mjs';

console.log('Beurteilung: Würfel-Level');

const cube = (elements, size = 3, name = 'Mini-Würfel') => ({ ...miniLevel(elements, name), dim: 3, size });
const level = (name) => L.LEVELS_3D.find(l => l.name === name);

test('Aufzug und Kern: Die Beurteilung läuft ganz durch, ohne offenen Teil und ohne Ausschlussgrund', () => {
  for (const l of L.LEVELS_3D) {
    const b = beurteile(l);
    assert.deepEqual(b.offen, [], l.name);
    assert.deepEqual(b.ausschluesse, [], l.name);
    assert.ok(b.schwierigkeit.wert > 0 && b.spielwert.wert >= 0 && b.spielwert.wert <= 100, l.name);
    assert.equal(b.schliessen.geloest, true, l.name + ': das Spielermodell löst es');
  }
});

test('Aufzug: leicht, ohne Mischung und Kernidee, darum unter dem Mindest-Spielwert; das Prisma zerlegt nötig', () => {
  const b = beurteile(level('Aufzug'));
  assert.deepEqual(b.mischziele, []);
  assert.equal(b.hauptKernidee.begriff, null);
  assert.ok(b.spielwert.wert < MINDEST_SPIELWERT, `Spielwert ${b.spielwert.wert}`);
  const { denkarbeit, zusammenspiel } = b.schwierigkeit.teilwerte, { farblogik } = denkarbeit;
  assert.deepEqual([farblogik.mischen, farblogik.filtern, farblogik.zerlegen], [0, 0, 1]);
  // Alle drei drehbaren Elemente folgen rückwärts aus den Zielen, ohne Fallunterscheidung
  assert.deepEqual([denkarbeit.spielermodell.rueckschluesse, denkarbeit.spielermodell.fallunterscheidungen], [3, 0]);
  assert.equal(zusammenspiel.stellen, 0);
});

test('Kern: Mischziel aus zwei Quellen in der Würfelmitte ist die Haupt-Kernidee, schwerer als Aufzug', () => {
  const b = beurteile(level('Kern'));
  const mischziel = { ziel: '2,2,2', farbe: 'magenta', quellen: ['0,0,0', '4,4,4'], ausZweiQuellen: true };
  assert.deepEqual(b.mischziele, [mischziel]);
  assert.equal(b.hauptKernidee.begriff, 'Mischziel aus zwei Quellen');
  assert.equal(b.hauptKernidee.fund.ziel, '2,2,2');
  assert.ok(b.spielwert.wert >= MINDEST_SPIELWERT, `Spielwert ${b.spielwert.wert}`);
  assert.ok(b.schwierigkeit.wert > beurteile(level('Aufzug')).schwierigkeit.wert);
  const { farblogik } = b.schwierigkeit.teilwerte.denkarbeit;
  assert.deepEqual([farblogik.mischen, farblogik.zerlegen], [1, 1]);
  // Zusammenspiel: das gemeinsame Mischziel und die Kreuzung von Grün und Blau in der leeren Zelle 2,3,4
  assert.equal(b.schwierigkeit.teilwerte.zusammenspiel.stellen, 2);
});

test('Mischziel zwischen den Ebenen: Rot kommt von unten, Blau aus der Ebene, Mischziel aus zwei Quellen', () => {
  // Der Spiegel mit Achse z lenkt Rot hinauf auf das Ziel in der obersten Ebene, Blau läuft dort von Westen darauf.
  const b = beurteile(cube([
    { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'red' },
    { type: 'mirror', x: 1, y: 0, z: 1, axis: 'z', rot: 3 },
    { type: 'source', x: 0, y: 2, z: 1, dir: 0, color: 'blue' },
    { type: 'target', x: 1, y: 2, z: 1, color: 'magenta' },
  ]));
  const mischziel = { ziel: '1,2,1', farbe: 'magenta', quellen: ['0,0,1', '0,2,1'], ausZweiQuellen: true };
  assert.deepEqual(b.mischziele, [mischziel]);
  assert.deepEqual(b.kernideen.map(k => k.begriff), ['Mischziel aus zwei Quellen']);
});

test('Weiss aus einer weissen Quelle, über die Ebenen gelenkt, ist kein Mischziel', () => {
  const b = beurteile(cube([
    { type: 'source', x: 0, y: 0, z: 1, dir: 0 },
    { type: 'mirror', x: 1, y: 0, z: 1, axis: 'z', rot: 3 },
    { type: 'target', x: 1, y: 2, z: 1, color: 'white' },
  ]));
  assert.deepEqual(b.mischziele, []);
});

// Rot von unten (Quelle mit Achse z, Stellung 6 zeigt hinauf) und Licht von Westen treffen sich im Kombinator 1,1,1.
const VON_UNTEN_UND_WESTEN = (westen) => [
  { type: 'source', x: 1, y: 0, z: 1, axis: 'z', dir: 6, color: 'red' },
  { type: 'source', x: 0, y: 1, z: 1, dir: 0, color: westen },
];
const scheinmischungen = (lvl) => beurteile(lvl).ausschluesse.filter(f => f.begriff === 'Scheinmischung')
  .map(({ element, fall }) => ({ element, fall }));

test('Scheinmischung (a) zwischen den Ebenen: Weiss von Westen und Rot von unten ergeben Weiss', () => {
  assert.deepEqual(scheinmischungen(cube([
    ...VON_UNTEN_UND_WESTEN('white'),
    { type: 'combiner', x: 1, y: 1, z: 1, dir: 0 },
    { type: 'target', x: 2, y: 1, z: 1, color: 'white' },
  ])), [{ element: '1,1,1', fall: 'a' }]);
});

test('Scheinmischung (b) senkrecht: Das Magenta läuft hinauf in ein Prisma, das es in Rot und Blau trennt', () => {
  const kombinator = { type: 'combiner', x: 1, y: 1, z: 1, axis: 'z', dir: 6 }; // gibt hinauf ab
  assert.deepEqual(scheinmischungen(cube([
    ...VON_UNTEN_UND_WESTEN('blue'), kombinator,
    { type: 'prism', x: 1, y: 2, z: 1, axis: 'z', rot: 6 }, // fächert hinauf: Rot nach oben-West, Blau nach oben-Ost
    { type: 'target', x: 0, y: 3, z: 1, color: 'red' },
    { type: 'target', x: 2, y: 3, z: 1, color: 'blue' },
  ], 4)), [{ element: '1,1,1', fall: 'b' }]);
  // Dieselbe Mischung auf ein magentafarbenes Ziel ist echt
  const ziel = { type: 'target', x: 1, y: 3, z: 1, color: 'magenta' };
  const echt = cube([...VON_UNTEN_UND_WESTEN('blue'), kombinator, ziel], 4);
  assert.deepEqual(scheinmischungen(echt), []);
  assert.equal(beurteile(echt).mischziele[0].ziel, '1,3,1');
});

/** Drehbare Elemente auf den Zellen [x, y, z], abwechselnd Spiegel, Prisma und Kombinator (Achse y). */
const drehbar = (zellen) => zellen.map(([x, y, z], i) => ({
  type: ['mirror', 'prism', 'combiner'][i % 3], x, y, z, rot: 0, dir: 0,
}));
const knaeuel = (zellen, size = 3) => beurteile(cube(drehbar(zellen), size)).ausschluesse
  .filter(f => f.begriff === 'Knäuel').map(({ fall, wert }) => ({ fall, wert }));

test('Knäuel im Raum: übereinander zählt wie nebeneinander, eine Ebene dazwischen trennt', () => {
  // Ein senkrechtes Quadrat: je zwei der vier Elemente sind Nachbarn, auch schräg in der Ebene x-y (6 Paare, 1,50)
  assert.deepEqual(knaeuel([[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]), [{ fall: 'benachbart', wert: 1.5 }]);
  // Dieselben vier mit einer leeren Ebene dazwischen: nur noch die beiden Paare nebeneinander (0,50)
  assert.deepEqual(knaeuel([[0, 0, 1], [1, 0, 1], [0, 2, 1], [1, 2, 1]]), []);
});

test('Knäuel im Raum: Es zählen die 18 Nachbarn ohne Raumdiagonalen', () => {
  // Ein Block aus 2 × 2 × 2 drehbaren Elementen: je 3 Nachbarn längs der Achsen und 3 über eine Flächendiagonale,
  // 24 Paare auf 8 Elemente (3,00); mit den Raumdiagonalen wären es 28 Paare (3,50).
  const block = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  assert.deepEqual(knaeuel(block), [{ fall: 'benachbart', wert: 3 }]);
  // 16 Elemente im Würfel 4 × 4 × 4, alle Koordinaten gerade oder alle ungerade: nur über Raumdiagonalen benachbart.
  // Mit ihnen wären es 27 Paare (1,69, ein Knäuel), ohne sie keines.
  const schachbrett = [];
  for (const x of [0, 1, 2, 3]) for (const y of [0, 1, 2, 3]) for (const z of [0, 1, 2, 3]) {
    if (x % 2 === y % 2 && y % 2 === z % 2) schachbrett.push([x, y, z]);
  }
  assert.equal(schachbrett.length, 16);
  assert.deepEqual(knaeuel(schachbrett, 4), []);
});

// Ein flaches Level als Würfel mit einer Ebene (y = 0, Drehachse überall y): Die Würfel-Feldform muss es genau wie die
// flache beurteilen, bis auf die Schreibweise der Zellen („x,0,z“ statt „x,z“). Geprüft mit allen Regeln an jedem
// 10. der 150 heutigen Level (alle 150 mit und ohne die teuren Regeln in Ticket 14), vorab auf mehreren Threads.
const asCube = (lvl) => ({
  ...lvl, dim: 3, size: lvl.size || 7, elements: lvl.elements.map(e => ({ ...e, y: 0 })),
  solution: Object.fromEntries(Object.entries(lvl.solution).map(([k, v]) => [k.replace(',', ',0,'), v])),
});
const flach = (b) => JSON.parse(JSON.stringify(b).replace(/(\d+),0,(\d+)/g, '$1,$2'));
const AUSWAHL = L.LEVELS.slice(L.TUTORIAL_COUNT).filter((_, i) => i % 10 === 0);
let vergleich;
try {
  const opts = { grad: 'mittel', teuer: true };
  const auftraege = [...AUSWAHL, ...AUSWAHL.map(asCube)].map(l => ({ level: l, opts }));
  vergleich = await beurteileAlle(auftraege);
} catch (e) { vergleich = e; }

test(`Flache Level als Würfel mit einer Ebene: gleiche Beurteilung mit allen Regeln (${AUSWAHL.length} Level)`, () => {
  if (vergleich instanceof Error) throw vergleich;
  AUSWAHL.forEach((l, i) => {
    assert.deepStrictEqual(flach(vergleich[AUSWAHL.length + i]), JSON.parse(JSON.stringify(vergleich[i])), l.name);
  });
});
