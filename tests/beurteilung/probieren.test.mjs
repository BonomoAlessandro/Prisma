// Tests des Ausschlussgrunds Probieren (Glossar „Probieren“, Spec „Beurteilung“, Tabelle der Ausschlussgründe), in allen
// Graden: Weite Fast-Lösungen machen mehr als 60 ‰ aller Strahlbilder der Suche ohne Abschneiden aus, oder Raten: Das
// Spielermodell braucht mit vollem Überblick mehr als 6 Fallunterscheidungen oder eine Kette von mehr als 38
// Folgerungen. Die Schwellen sind strikt: genau 6 und 38 bestehen (144 und 135 der heutigen Level), 7 und 39 fallen.
// Aufruf: node tests/beurteilung/probieren.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, GRADE } from '../../tools/beurteilung/index.mjs';
import { test, heutigeLevel } from './helfer.mjs';
import { schliessbar, fastLoesungen, horizonte, siebenFallunterscheidungen, langeKette } from './probieren-level.mjs';

console.log('Beurteilung: Probieren');

const nurProbieren = (ausschluesse) => ausschluesse.filter(f => f.begriff === 'Probieren');
const probieren = (level, grad = null) => nurProbieren(beurteile(level, { grad }).ausschluesse);

test('Ein Level, das sich durch Schliessen lösen lässt, fällt nicht wegen Probieren', () => {
  assert.deepEqual(probieren(schliessbar), []);
});

test('Ein Level voller gleichwertiger Fast-Lösungen fällt wegen Probieren, in allen Graden', () => {
  for (const grad of [null, ...GRADE]) {
    const funde = probieren(fastLoesungen, grad);
    assert.deepEqual(funde.map(f => f.fall), ['Fast-Lösungen'], String(grad));
    assert.match(funde[0].begruendung, /6 von 58 Strahlbildern/);
    assert.match(funde[0].begruendung, /103,4 ‰/);
  }
});

test('Dasselbe Feld mit einem anderen Zielplatz hat weniger weite Fast-Lösungen (51,7 ‰) und besteht', () => {
  assert.deepEqual(probieren(horizonte), []);
});

test('Raten: 7 Fallunterscheidungen mit vollem Überblick fallen; die Kette von 36 allein liesse das Level bestehen', () => {
  const funde = probieren(siebenFallunterscheidungen);
  assert.deepEqual(funde.map(f => f.fall), ['Raten']);
  assert.match(funde[0].begruendung, /7 Fallunterscheidungen \(mehr als 6\)/);
  assert.doesNotMatch(funde[0].begruendung, /Kette/);
});

test('Raten: eine Kette von 39 Folgerungen fällt', () => {
  const funde = probieren(langeKette);
  assert.deepEqual(funde.map(f => f.fall), ['Raten']);
  assert.match(funde[0].begruendung, /Kette von 39 Folgerungen \(mehr als 38\)/);
  assert.doesNotMatch(funde[0].begruendung, /Fallunterscheidungen/);
});

console.log('Probieren auf den 150 heutigen Leveln');
const alle = () => heutigeLevel({ teuer: true });
const werte = (platz) => { const s = alle()[platz - 1].beurteilung.schliessen; return [s.kInf, s.kette]; };

test('Weite Fast-Lösungen: Keines der 150 Level fällt, das Maximum hat 74 Lichtnetz mit 66 von 1190 (55,5 ‰)', () => {
  const all = alle();
  assert.ok(all.every(h => !nurProbieren(h.beurteilung.ausschluesse).some(f => f.fall === 'Fast-Lösungen')));
  const promille = (h) => h.beurteilung.schliessen.fastLoesungen.promille;
  const max = all.reduce((a, h) => (promille(h) > promille(a) ? h : a));
  assert.equal(max.platz, 74);
  assert.deepEqual(max.beurteilung.schliessen.fastLoesungen, { alle: 164, weite: 66, strahlbilder: 1190, promille: 66000 / 1190, abgebrochen: false });
  assert.ok(all.every(h => !h.beurteilung.schliessen.fastLoesungen.abgebrochen));
});

test('Raten: Die Höchstwerte liegen genau auf den Schwellen und bestehen, 144 mit 6 Fallunterscheidungen, 135 mit Kette 38', () => {
  const all = alle();
  assert.deepEqual([Math.max(...all.map(h => werte(h.platz)[0])), Math.max(...all.map(h => werte(h.platz)[1]))], [6, 38]);
  assert.deepEqual([144, 135].map(werte), [[6, 7], [1, 38]]);
  for (const platz of [144, 135]) assert.deepEqual(nurProbieren(all[platz - 1].beurteilung.ausschluesse), [], String(platz));
});

test('Auf den 150 fällt keines wegen Probieren; die Grenzfälle der Neuzählung 135, 140, 148 und 149 bestehen', () => {
  // Die Neuzählung der Spec rechnete in der Reihenfolge der Elemente in tools/selection.jsonl. Dort lagen 135 (Kette 28),
  // 140, 148 und 149 (je kInf 4) genau auf den alten Schwellen 4 und 28. Die Beurteilung geht die Elemente in der
  // Reihenfolge der Zellen durch und hängt nicht von den Leveldaten ab (Ticket 09, Entscheid vom 16.10.2026).
  assert.deepEqual(alle().filter(h => nurProbieren(h.beurteilung.ausschluesse).length).map(h => h.platz), []);
  assert.deepEqual([135, 140, 148, 149].map(werte), [[1, 38], [3, 18], [4, 9], [1, 14]]);
});
