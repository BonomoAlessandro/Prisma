// Tests der Haupt-Kernidee (Spec „Beurteilung“: nötige Kernideen, eine davon als Haupt-Kernidee): Unter den nötigen
// Kernideen eines Levels ist es die, die dem Schliessen am meisten abverlangt, nach einer festen Rangfolge: Falle,
// Abschalten, Farben abzählen, Sammelstelle, Lockvogel, Mischziel aus zwei Quellen. Ohne nötige Kernidee gibt es keine.
// Aufruf: node tests/beurteilung/haupt-kernidee.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, TEILE } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel, vorausBeurteilen } from './helfer.mjs';

console.log('Beurteilung: Haupt-Kernidee');
await vorausBeurteilen(['teuer']);

const haupt = (level) => beurteile(level).hauptKernidee;

test('Die Beurteilung liefert die Haupt-Kernidee als eigenen Teil mit dem Glossarbegriff „Kernidee“', () => {
  assert.equal(TEILE.hauptKernidee, 'Kernidee');
  const b = beurteile(miniLevel([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'mirror', x: 3, z: 3, rot: 1 }, { type: 'target', x: 3, z: 6 }]));
  assert.ok(!b.offen.includes('Kernidee'));
  assert.deepEqual(Object.keys(b.hauptKernidee).sort(), ['begriff', 'begruendung', 'fund', 'weitere']);
});

test('Ohne nötige Kernidee gibt es keine Haupt-Kernidee', () => {
  // Das Prisma sammelt Licht aus zwei Richtungen, aber nur das Rot zählt (dekorative Sammelstelle)
  const h = haupt(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'target', x: 3, z: 0, color: 'red' },
  ]));
  assert.deepEqual([h.begriff, h.fund, h.weitere], [null, null, []]);
  assert.ok(h.begruendung.includes('keine'), h.begruendung);
});

test('Sammelstelle vor Mischziel aus zwei Quellen: Das Prisma 3,3 sammelt Rot und Blau, die sich auf dem Ziel 5,1 treffen', () => {
  // Rot von 0,3 bricht nach Norden und kommt über den festen Spiegel 3,1 auf 5,1, Blau von 3,6 nach Osten und über den
  // festen Spiegel 5,3 ebenso: Magenta aus zwei Quellen, gesammelt in einem Prisma.
  const level = miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
    { type: 'mirror', x: 5, z: 3, rot: 3, fixed: true },
    { type: 'target', x: 5, z: 1, color: 'magenta' },
  ]);
  const b = beurteile(level);
  assert.deepEqual(b.kernideen.map(k => k.begriff), ['Mischziel aus zwei Quellen', 'Sammelstelle']);
  const h = b.hauptKernidee;
  assert.equal(h.begriff, 'Sammelstelle');
  assert.deepEqual(h.fund, b.kernideen.find(k => k.begriff === 'Sammelstelle'));
  assert.deepEqual(h.weitere, ['Mischziel aus zwei Quellen']);
  for (const teil of ['Sammelstelle', 'Mischziel aus zwei Quellen', '3,3']) assert.ok(h.begruendung.includes(teil), `${teil} fehlt: ${h.begruendung}`);
});

test('Ohne die teuren Regeln (teuer: false) steht die Haupt-Kernidee in offen: Falle und Lockvogel fehlen dann', () => {
  const b = beurteile(miniLevel([{ type: 'source', x: 0, z: 3, dir: 0 }, { type: 'mirror', x: 3, z: 3, rot: 1 }, { type: 'target', x: 3, z: 6 }]), { teuer: false });
  assert.equal(b.hauptKernidee, null);
  assert.ok(b.offen.includes('Kernidee'));
});

console.log('Haupt-Kernidee auf den 150 heutigen Leveln');
test('Verteilung auf 64 Level: Mischziel aus zwei Quellen 20, Abschalten 17, Falle 10, Farben abzählen 9, Sammelstelle 4, Lockvogel 4', () => {
  const all = heutigeLevel({ teuer: true });
  const zahl = {};
  for (const h of all) if (h.beurteilung.hauptKernidee.begriff) zahl[h.beurteilung.hauptKernidee.begriff] = (zahl[h.beurteilung.hauptKernidee.begriff] || 0) + 1;
  assert.deepEqual(zahl, { 'Mischziel aus zwei Quellen': 20, Abschalten: 17, Falle: 10, 'Farben abzählen': 9, Sammelstelle: 4, Lockvogel: 4 });
  // Jedes Level mit einer nötigen Kernidee hat eine Haupt-Kernidee, und sie ist eine seiner nötigen
  for (const h of all) {
    const { begriff, fund } = h.beurteilung.hauptKernidee;
    assert.equal(begriff !== null, h.beurteilung.kernideen.length > 0, `${h.platz}`);
    if (begriff) assert.ok(h.beurteilung.kernideen.some(k => JSON.stringify(k) === JSON.stringify(fund)), `${h.platz}`);
  }
});

test('Ab „mittel“ bleiben 57 Level ohne nötige Kernidee, also ohne Haupt-Kernidee: mittel 50, schwer 7, sehr schwer 0', () => {
  const ohne = heutigeLevel({ teuer: true }).filter(h => h.grad !== 'leicht' && !h.beurteilung.hauptKernidee.begriff);
  const jeGrad = Object.fromEntries(['mittel', 'schwer', 'sehr schwer'].map(g => [g, ohne.filter(h => h.grad === g).length]));
  // Grad aus den Leveldaten (Ticket 15): 31 Lichtbündel und 32 Streulicht sind leicht, 102 Smaragd, 103 Silberstreif
  // und 106 Polarlicht mittel, 98 Rangierbahnhof schwer geworden
  assert.deepEqual([ohne.length, jeGrad], [57, { mittel: 50, schwer: 7, 'sehr schwer': 0 }]);
});

test('Rangfolge: 141 Morgenröte Abschalten, 134 Kristallpalast Falle, 138 Lichtgeschwindigkeit Falle vor Sammelstelle und Lockvogel', () => {
  const all = heutigeLevel({ teuer: true });
  // Review 6 zu Morgenröte: „Das erfüllte Ziel muss man zerstören (stärkstes Aha)“, dazu nötig: Mischziel aus zwei
  // Quellen, Farben abzählen und zwei Sammelstellen
  assert.deepEqual([all[140].beurteilung.hauptKernidee.begriff, all[140].beurteilung.hauptKernidee.weitere],
    ['Abschalten', ['Farben abzählen', 'Sammelstelle', 'Mischziel aus zwei Quellen']]);
  assert.equal(all[133].beurteilung.hauptKernidee.begriff, 'Falle');
  assert.deepEqual([all[137].beurteilung.hauptKernidee.begriff, all[137].beurteilung.hauptKernidee.weitere], ['Falle', ['Sammelstelle', 'Lockvogel']]);
});
