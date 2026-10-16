// Tests der Teilwerte zum Schliessen (Glossar „Schliessen“, Spec „Beurteilung“, Spielermodell): Das Spielermodell
// liefert die Horizonte k2 und kInf (Zahl der Fallunterscheidungen), die Ketten und die Fallunterscheidungen selbst,
// die Suche ohne Abschneiden die weiten Fast-Lösungen. Das Spielermodell wird nur über die Beurteilung getestet.
// Aufruf: node tests/beurteilung/schliessen.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, TEILE } from '../../tools/beurteilung/index.mjs';
import { test, heutigeLevel } from './helfer.mjs';
import { schliessbar, fastLoesungen, horizonte, siebenFallunterscheidungen as sieben } from './probieren-level.mjs';

console.log('Beurteilung: Schliessen');

const schliessen = (level) => beurteile(level).schliessen;

test('Die Beurteilung liefert die Teilwerte zum Schliessen als eigenen Teil mit dem Glossarbegriff', () => {
  assert.equal(TEILE.schliessen, 'Schliessen');
  const b = beurteile(schliessbar);
  assert.ok(!b.offen.includes('Schliessen'));
  assert.deepEqual(Object.keys(b.schliessen).sort(), ['fallunterscheidungen', 'fastLoesungen', 'geloest', 'k2', 'kInf', 'kette', 'steckt']);
});

test('Ohne die teuren Regeln (teuer: false) fehlen Schliessen und Probieren und stehen in offen', () => {
  const b = beurteile(fastLoesungen, { teuer: false });
  assert.equal(b.schliessen, null);
  assert.ok(b.offen.includes('Schliessen') && b.offen.includes('Probieren'));
  assert.ok(!b.ausschluesse.some(f => f.begriff === 'Probieren'));
  assert.deepEqual(b.mischziele, beurteile(fastLoesungen).mischziele);
});

test('Durch Schliessen lösbar: keine Fallunterscheidung, weder mit Horizont 2 noch mit vollem Überblick', () => {
  const { fastLoesungen: _, ...s } = schliessen(schliessbar);
  assert.deepEqual(s, { k2: 0, steckt: false, kInf: 0, kette: 0, geloest: true, fallunterscheidungen: { k2: [], kInf: [] } });
});

test('Horizont 2 braucht eine Fallunterscheidung, voller Überblick keine; sie nennt Element, Fälle, Widerlegtes und Ketten', () => {
  const s = schliessen(horizonte);
  assert.equal(s.k2, 1);
  assert.equal(s.kInf, 0);
  assert.equal(s.kette, 0);
  assert.deepEqual(s.fallunterscheidungen, { k2: [{ element: '3,1', faelle: 2, widerlegt: [0], ketten: [2] }], kInf: [] });
});

test('Fast-Lösungen: alle mit genau einem falschen Ziel, die weiten (mindestens 3 Elemente anders als die Lösung) und ihr Anteil in ‰', () => {
  assert.deepEqual(schliessen(fastLoesungen).fastLoesungen, { alle: 19, weite: 6, strahlbilder: 58, promille: 6000 / 58, abgebrochen: false });
  assert.deepEqual(schliessen(horizonte).fastLoesungen, { alle: 16, weite: 3, strahlbilder: 58, promille: 3000 / 58, abgebrochen: false });
  assert.equal(schliessen(schliessbar).fastLoesungen.weite, 0);
});

test('k2 und kInf zählen die Fallunterscheidungen, die Kette ist die längste mit vollem Überblick', () => {
  const s = schliessen(sieben);
  assert.equal(s.k2, s.fallunterscheidungen.k2.length);
  assert.equal(s.kInf, s.fallunterscheidungen.kInf.length);
  assert.equal(s.kette, Math.max(...s.fallunterscheidungen.kInf.flatMap(f => f.ketten)));
  assert.deepEqual([s.k2, s.kInf, s.kette], [8, 7, 36]);
  for (const f of [...s.fallunterscheidungen.k2, ...s.fallunterscheidungen.kInf]) {
    assert.ok(f.element in sieben.solution, f.element);
    assert.equal(f.ketten.length, f.widerlegt.length);
    assert.ok(f.widerlegt.length < f.faelle && !f.widerlegt.includes(sieben.solution[f.element]), JSON.stringify(f));
  }
});

test('Die Reihenfolge der Elemente in den Leveldaten ändert die Teilwerte nicht', () => {
  const s = schliessen(sieben);
  const ART = ['source', 'mirror', 'prism', 'filter', 'combiner', 'blocker', 'target'];
  for (const elements of [
    sieben.elements.slice().reverse(),
    sieben.elements.slice().sort((a, b) => ART.indexOf(a.type) - ART.indexOf(b.type) || a.z - b.z || a.x - b.x), // wie in index.html
  ]) assert.deepEqual(schliessen({ ...sieben, elements }), s);
});

console.log('Schliessen auf den 150 heutigen Leveln');
test('Jedes der 150 Level hat Teilwerte; mit vollem Überblick löst das Spielermodell alle, mit Horizont 2 steckt es in sechs fest', () => {
  const all = heutigeLevel({ teuer: true });
  assert.ok(all.every(h => h.beurteilung.schliessen && h.beurteilung.schliessen.geloest), 'nicht gelöst');
  assert.deepEqual(all.filter(h => h.beurteilung.schliessen.steckt).map(h => h.platz), [116, 138, 139, 140, 147, 150]);
  assert.deepEqual([all.filter(h => h.beurteilung.schliessen.k2 > 0).length, all.filter(h => h.beurteilung.schliessen.kInf > 0).length], [60, 32]);
});
