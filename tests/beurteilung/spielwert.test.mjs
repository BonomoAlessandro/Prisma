// Tests des Spielwerts (Glossar „Spielwert“, Spec „Beurteilung“): wie viel Spass ein Level macht, als Zahl von 0 bis
// 100 mit den Teilwerten Schliessen, Kernidee, Farblogik und Zusammenspiel, je von 0 bis 1. Schliessen und eine nötige
// Kernidee tragen zusammen etwa zwei Drittel, Farblogik und Zusammenspiel geben einen kleineren Bonus. Die Tests prüfen
// Vergleiche, die Formen der Teilwerte, die Übereinstimmung mit der Eichmenge (Ticket 13) und den Mindest-Spielwert,
// nicht die Gewichte selbst.
// Aufruf: node tests/beurteilung/spielwert.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { beurteile, TEILE } from '../../tools/beurteilung/index.mjs';
import { MINDEST_SPIELWERT } from '../../tools/beurteilung/spielwert.mjs';
import { eichmenge, rangkorrelation } from '../../tools/beurteilung/spielwert-eichmenge.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';
import { schliessbar, fastLoesungen, horizonte, siebenFallunterscheidungen } from './probieren-level.mjs';

console.log('Beurteilung: Spielwert');

const spielwert = (level) => beurteile(level).spielwert;
const TEILWERTE = ['farblogik', 'kernidee', 'schliessen', 'zusammenspiel'];
const quelle = (x, z, dir, color = 'white') => ({ type: 'source', x, z, dir, color });
const spiegel = (x, z, rot) => ({ type: 'mirror', x, z, rot });
const ziel = (x, z, color = 'white') => ({ type: 'target', x, z, color });

/**
 * Lässt sich durch Schliessen lösen und hat eine nötige Kernidee, gebaut wie die drei Testlevel für Probieren (5 × 5,
 * zwei weisse Quellen, vier drehbare Spiegel, zwei weisse Ziele; aus einer gezielten Suche): Quelle 2,0 bringt 3,3 über
 * den Spiegel 2,3 sofort zum Leuchten, doch die Lösung braucht ihr Licht für 0,3 und beliefert 3,3 von 0,2 über 3,1,
 * 4,1 und 4,2 (Abschalten). Keine Fallunterscheidung, keine weite Fast-Lösung.
 */
const beides = { ...miniLevel([
  quelle(0, 2, 0), quelle(2, 0, 2),
  spiegel(2, 3, 3), spiegel(3, 1, 3), spiegel(4, 2, 3), spiegel(4, 1, 1),
  ziel(0, 3), ziel(3, 3),
], 'Schliessen und Kernidee'), size: 5 };

/** Abschalten nötig (wie in abschalten.test.mjs): 3,0 leuchtet nach einem Zug aus 0,3, die Lösung beliefert es aus 6,2. */
const abschaltenNoetig = miniLevel([
  quelle(0, 3, 0), spiegel(3, 3, 1), ziel(3, 6), ziel(3, 0),
  quelle(6, 2, 4), spiegel(5, 2, 1), spiegel(5, 0, 1),
], 'Abschalten nötig');
/** Dasselbe, aber 6,1 erreicht 3,0 über einen drehbaren und einen festen Spiegel, ebenso kurz: keine Kernidee. */
const abschaltenOhne = miniLevel([
  quelle(0, 3, 0), spiegel(3, 3, 1), ziel(3, 6), ziel(3, 0),
  quelle(6, 1, 4), spiegel(4, 1, 1), { ...spiegel(4, 0, 1), fixed: true },
], 'Ebenso kurz');
/** Rot von 0,3 über den Spiegel 3,3 und Blau von 6,6 treffen sich auf dem magentafarbenen Ziel 3,6. */
const mischziel = miniLevel([quelle(0, 3, 0, 'red'), spiegel(3, 3, 1), quelle(6, 6, 4, 'blue'), ziel(3, 6, 'magenta')], 'Mischziel');

test('Die Beurteilung liefert den Spielwert als Zahl von 0 bis 100 mit den vier Teilwerten, je von 0 bis 1', () => {
  assert.equal(TEILE.spielwert, 'Spielwert');
  const b = beurteile(beides);
  assert.ok(!b.offen.includes('Spielwert'));
  assert.deepEqual(Object.keys(b.spielwert).sort(), ['teilwerte', 'wert']);
  assert.deepEqual(Object.keys(b.spielwert.teilwerte).sort(), TEILWERTE);
  for (const level of [beides, schliessbar, fastLoesungen, horizonte, abschaltenNoetig, abschaltenOhne, mischziel]) {
    const { wert, teilwerte } = spielwert(level);
    assert.ok(wert >= 0 && wert <= 100, `${level.name}: ${wert}`);
    for (const t of TEILWERTE) assert.ok(teilwerte[t] >= 0 && teilwerte[t] <= 1, `${level.name}: ${t} ${teilwerte[t]}`);
  }
});

test('Ohne die teuren Regeln (teuer: false) fehlt der Spielwert und steht in offen', () => {
  const b = beurteile(beides, { teuer: false });
  assert.equal(b.spielwert, null);
  assert.ok(b.offen.includes('Spielwert'));
});

test('Durch Schliessen lösbar mit nötiger Kernidee hat einen höheren Spielwert als ein sonst gleiches Level ohne diese Eigenschaften', () => {
  // Vier Level gleicher Bauart (5 × 5, zwei weisse Quellen, vier drehbare Spiegel, zwei weisse Ziele) mit gleicher
  // Farblogik und gleichem Zusammenspiel; sie unterscheiden sich nur im Schliessen und in der Kernidee.
  const a = spielwert(beides), nurSchliessen = spielwert(schliessbar), nurKernidee = spielwert(fastLoesungen), keins = spielwert(horizonte);
  for (const s of [nurSchliessen, nurKernidee, keins]) {
    assert.equal(s.teilwerte.farblogik, a.teilwerte.farblogik);
    assert.equal(s.teilwerte.zusammenspiel, a.teilwerte.zusammenspiel);
  }
  assert.equal(a.teilwerte.schliessen, 1);
  assert.ok(a.teilwerte.kernidee > 0);
  assert.deepEqual(beurteile(beides).kernideen.map(k => k.begriff), ['Abschalten']);
  // Durch Schliessen lösbar, aber ohne nötige Kernidee
  assert.ok(nurSchliessen.teilwerte.schliessen === 1 && nurSchliessen.teilwerte.kernidee === 0);
  // Eine nötige Kernidee (Abschalten), aber voller gleichwertiger Fast-Lösungen (103,4 ‰): kein Schliessen
  assert.ok(nurKernidee.teilwerte.schliessen === 0 && nurKernidee.teilwerte.kernidee > 0);
  // Weder noch: weite Fast-Lösungen (51,7 ‰) und keine Kernidee
  assert.ok(keins.teilwerte.schliessen < 0.5 && keins.teilwerte.kernidee === 0);
  assert.ok(a.wert > nurSchliessen.wert && a.wert > nurKernidee.wert && a.wert > keins.wert, JSON.stringify([a, nurSchliessen, nurKernidee, keins]));
  assert.ok(nurSchliessen.wert > keins.wert && nurKernidee.wert > keins.wert);
});

test('Raten nimmt das Schliessen: Mit einer Fallunterscheidung mehr, als Probieren erlaubt, ist es 0, trotz kaum weiter Fast-Lösungen', () => {
  // Seed 8004 aus den Pools des Härtens: 7 Fallunterscheidungen mit vollem Überblick, 1 ‰ weite Fast-Lösungen
  const b = beurteile(siebenFallunterscheidungen);
  assert.ok(b.schliessen.kInf === 7 && b.schliessen.fastLoesungen.promille < 2);
  assert.equal(b.spielwert.teilwerte.schliessen, 0);
});

test('Eine nötige Kernidee hebt den Spielwert: Abschalten nötig gegen dasselbe Feld mit ebenso kurzem Zulauf zu 3,0', () => {
  const mit = spielwert(abschaltenNoetig), ohne = spielwert(abschaltenOhne);
  assert.ok(mit.teilwerte.kernidee > 0 && ohne.teilwerte.kernidee === 0);
  for (const t of ['schliessen', 'farblogik', 'zusammenspiel']) assert.equal(mit.teilwerte[t], ohne.teilwerte[t], t);
  assert.ok(mit.wert > ohne.wert);
});

test('Schliessen und eine nötige Kernidee tragen etwa zwei Drittel, Farblogik und Zusammenspiel den kleineren Rest', () => {
  // Beide Level lassen sich durch Schliessen lösen und haben genau eine nötige Kernidee; das Mischziel hat dazu volle
  // Farblogik und volles Zusammenspiel, Abschalten nichts davon.
  const ohneBonus = spielwert(abschaltenNoetig), voll = spielwert(mischziel);
  for (const t of ['schliessen', 'kernidee']) assert.equal(ohneBonus.teilwerte[t], voll.teilwerte[t], t);
  assert.equal(ohneBonus.teilwerte.schliessen, 1);
  assert.deepEqual([ohneBonus.teilwerte.farblogik, ohneBonus.teilwerte.zusammenspiel, voll.teilwerte.farblogik, voll.teilwerte.zusammenspiel], [0, 0, 1, 1]);
  // Auf der Skala von 0 bis 100: Schliessen mit einer Kernidee etwa zwei Drittel, der volle Bonus weniger als ein Drittel
  assert.ok(ohneBonus.wert >= 60 && ohneBonus.wert <= 75, `${ohneBonus.wert}`);
  assert.ok(voll.wert - ohneBonus.wert <= 100 / 3 + 1e-9 && voll.wert - ohneBonus.wert < ohneBonus.wert, `${voll.wert}`);
});

test('Jede weitere nötige Kernidee hebt den Teilwert Kernidee, der höchstens 1 erreicht', () => {
  // Wie in haupt-kernidee.test.mjs: Das Prisma 3,3 sammelt Rot und Blau, die sich über zwei feste Spiegel auf 5,1
  // treffen: Sammelstelle und Mischziel aus zwei Quellen. Dagegen hat das Mischziel allein nur eine nötige Kernidee.
  const zwei = beurteile(miniLevel([
    quelle(0, 3, 0, 'red'), quelle(3, 6, 6, 'blue'), { type: 'prism', x: 3, z: 3, rot: 7 },
    { ...spiegel(3, 1, 3), fixed: true }, { ...spiegel(5, 3, 3), fixed: true }, ziel(5, 1, 'magenta'),
  ]));
  assert.equal(new Set(zwei.kernideen.map(k => k.begriff)).size, 2);
  const eine = spielwert(mischziel).teilwerte.kernidee;
  assert.ok(eine > 0 && zwei.spielwert.teilwerte.kernidee > eine && zwei.spielwert.teilwerte.kernidee < 1, `${eine} ${zwei.spielwert.teilwerte.kernidee}`);
});

test('Farblogik: Anteil der Ziele, die ein Mischziel sind oder beschnittenes Licht einer Quelle bekommen', () => {
  assert.equal(spielwert(mischziel).teilwerte.farblogik, 1);
  // Weiss + Rot = Weiss im Kombinator: keine Farblogik (eine Scheinmischung)
  assert.equal(spielwert(miniLevel([quelle(0, 3, 0), quelle(3, 6, 6, 'red'), { type: 'combiner', x: 3, z: 3, dir: 6 }, ziel(3, 0)])).teilwerte.farblogik, 0);
  // Nur Spiegel und weisses Licht: keine Farblogik
  assert.equal(spielwert(abschaltenNoetig).teilwerte.farblogik, 0);
  // Filtern: Weiss durch den Gelbfilter auf das gelbe Ziel
  assert.equal(spielwert(miniLevel([quelle(0, 3, 0), { type: 'filter', x: 2, z: 3, color: 'yellow' }, spiegel(4, 3, 1), ziel(4, 6, 'yellow')])).teilwerte.farblogik, 1);
  // Zerlegen: Das Prisma 4,4 schickt das Grün der weissen Quelle 0,4 auf das grüne Ziel; das weisse Ziel 1,2 bekommt
  // Weiss aus 0,0 über einen Spiegel. Eines von zwei Zielen braucht Farblogik.
  assert.equal(spielwert(miniLevel([
    quelle(0, 0, 0), spiegel(1, 0, 1), ziel(1, 2), quelle(0, 4, 0), { type: 'prism', x: 4, z: 4, rot: 0 }, ziel(6, 4, 'green'),
  ])).teilwerte.farblogik, 0.5);
});

test('Zusammenspiel: Stellen je drehbares Element; ein Spiegel für zwei Quellen und ein Kombinator mit zwei Eingängen zählen', () => {
  // Ohne Zusammenspiel: zwei getrennte Stränge
  assert.equal(spielwert(abschaltenNoetig).teilwerte.zusammenspiel, 0);
  // Der Spiegel 3,3 lenkt Rot von 0,3 nach Süden und Blau von 6,3 nach Norden
  assert.equal(spielwert(miniLevel([
    quelle(0, 3, 0, 'red'), quelle(6, 3, 4, 'blue'), spiegel(3, 3, 1), ziel(3, 6, 'red'), ziel(3, 0, 'blue'),
  ])).teilwerte.zusammenspiel, 1);
  // Weiss und Rot treffen sich im Kombinator 3,3 (ein drehbares Element, eine Stelle)
  assert.equal(spielwert(miniLevel([quelle(0, 3, 0), quelle(3, 6, 6, 'red'), { type: 'combiner', x: 3, z: 3, dir: 6 }, ziel(3, 0)])).teilwerte.zusammenspiel, 1);
});

test('Zusammenspiel: Ein gemeinsames Mischziel zählt, auch hinter einem Kombinator, und verglichen werden alle Quellen', () => {
  // Die erste Quelle 0,0 beliefert 3,2 für sich. Rot von der zweiten (0,4) und Blau von der dritten (4,6) mischen sich
  // im Kombinator 4,4 zu Magenta für 6,4. Zwei Stellen bei zwei drehbaren Elementen: der Kombinator mit zwei Eingängen
  // und das gemeinsame Mischziel, obwohl es nur einen Strahl bekommt. Wer nur die ersten beiden Quellen vergliche, fände
  // das Mischziel nicht (Fehler aus der Analyse).
  const b = beurteile(miniLevel([
    quelle(0, 0, 0), spiegel(3, 0, 1), ziel(3, 2),
    quelle(0, 4, 0, 'red'), quelle(4, 6, 6, 'blue'), { type: 'combiner', x: 4, z: 4, dir: 0 }, ziel(6, 4, 'magenta'),
  ]));
  assert.deepEqual(b.mischziele.map(m => [m.ziel, m.quellen]), [['6,4', ['0,4', '4,6']]]);
  assert.equal(b.spielwert.teilwerte.zusammenspiel, 1);
});

test('Zusammenspiel: Kreuzungen in Zellen ohne Element zählen', () => {
  // Der Strang von 2,0 über 2,5 nach 6,5 kreuzt den von 0,3 über 4,3 nach 4,6 in 2,3 und 4,5
  const mit = spielwert(miniLevel([quelle(0, 3, 0), spiegel(4, 3, 1), ziel(4, 6), quelle(2, 0, 2), spiegel(2, 5, 1), ziel(6, 5)]));
  // Derselbe zweite Strang weiter rechts, von 5,0 über 5,1 nach 6,1, kreuzt nichts
  const ohne = spielwert(miniLevel([quelle(0, 3, 0), spiegel(4, 3, 1), ziel(4, 6), quelle(5, 0, 2), spiegel(5, 1, 1), ziel(6, 1)]));
  assert.deepEqual([mit.teilwerte.zusammenspiel, ohne.teilwerte.zusammenspiel], [1, 0]);
  assert.ok(mit.wert > ohne.wert);
});

test('Mindest-Spielwert: Durch Schliessen lösbar mit nötiger Kernidee liegt darüber, ohne Kernidee und mit wenig Bonus darunter', () => {
  for (const level of [beides, abschaltenNoetig]) assert.ok(spielwert(level).wert >= MINDEST_SPIELWERT, level.name);
  for (const level of [schliessbar, abschaltenOhne]) assert.ok(spielwert(level).wert < MINDEST_SPIELWERT, level.name);
});

console.log('Spielwert auf den 150 heutigen Leveln und an der Eichmenge');
test('Jedes der 150 Level hat einen Spielwert von 0 bis 100 mit Teilwerten von 0 bis 1', () => {
  for (const h of heutigeLevel({ teuer: true })) {
    const { wert, teilwerte } = h.beurteilung.spielwert;
    assert.ok(wert >= 0 && wert <= 100, `${h.platz}: ${wert}`);
    for (const t of TEILWERTE) assert.ok(teilwerte[t] >= 0 && teilwerte[t] <= 1, `${h.platz}: ${t} ${teilwerte[t]}`);
  }
});

test('Unter dem Mindest-Spielwert liegen leicht 25, mittel 46, schwer 10, sehr schwer 1; ab „mittel“ fehlt 53 davon die Kernidee', () => {
  const unter = heutigeLevel({ teuer: true }).filter(h => h.beurteilung.spielwert.wert < MINDEST_SPIELWERT);
  const jeGrad = Object.fromEntries(['leicht', 'mittel', 'schwer', 'sehr schwer'].map(g => [g, unter.filter(h => h.grad === g).length]));
  assert.deepEqual(jeGrad, { leicht: 25, mittel: 46, schwer: 10, 'sehr schwer': 1 });
  assert.equal(unter.filter(h => h.grad !== 'leicht' && !h.beurteilung.kernideen.length).length, 53);
});

/** Die Eichmenge mit dem Spielwert und den Ausschlussgründen je Level, einmal je Lauf (die Kandidaten kosten rund 45 s). */
let geeicht = null;
const eichmengeBeurteilt = () => (geeicht ??= eichmenge().map((e) => {
  const b = e.platz ? heutigeLevel({ teuer: true })[e.platz - 1].beurteilung : beurteile(e.level);
  return { ...e, wert: b.spielwert.wert, ausschluss: b.ausschluesse.length > 0 };
}));

test('Die Eichmenge hat Urteile der KI-Tester zu mindestens 40 Leveln aus allen vier Graden, dazu die Reviews 4 und 6', () => {
  const ki = eichmengeBeurteilt().filter(e => e.urteile.kiTester !== null);
  assert.ok(ki.length >= 40, `${ki.length}`);
  assert.deepEqual([...new Set(ki.map(e => e.grad))].sort(), ['leicht', 'mittel', 'schwer', 'sehr schwer']);
  assert.equal(eichmengeBeurteilt().filter(e => e.urteile.review !== null).length, 72);
});

test('Der Spielwert folgt dem Spass der Eichmenge: Rangkorrelation mindestens 0,30 ohne Ausschlussgrund (63 Level), 0,27 über alle (109)', () => {
  const rho = (set) => Math.round(100 * rangkorrelation(set.map(e => e.wert), set.map(e => e.spass))) / 100;
  const alle = eichmengeBeurteilt(), ohne = alle.filter(e => !e.ausschluss);
  assert.ok(rho(ohne) >= 0.30 && rho(alle) >= 0.27, `${rho(ohne)} (${ohne.length}), ${rho(alle)} (${alle.length})`);
});
