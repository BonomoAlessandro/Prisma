// Tests der Schwierigkeit (Glossar „Schwierigkeit“, Spec „Beurteilung“, ADR 0001): wie viel Denkarbeit ein Level
// verlangt, als Zahl mit Teilwerten. Sie besteht vor allem aus Denkarbeit (Spielermodell, Farblogik, Kernideen), dazu
// dem Zusammenspiel, der Weglänge (im Mittel höchstens ein Viertel) und der Grösse (drehbare Elemente) mit kleinem,
// nach oben begrenztem Anteil. Geeicht ist sie an der heutigen Reihenfolge an den geraden Plätzen, geprüft gekreuzt:
// jede Hälfte mit den Gewichten aus der anderen.
// Aufruf: node tests/beurteilung/schwierigkeit.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beurteile, TEILE } from '../../tools/beurteilung/index.mjs';
import { eiche, gekreuzt, jeBereich, gerade, ungerade } from '../../tools/beurteilung/schwierigkeit-eichung.mjs';
import { test, miniLevel, heutigeLevel, vorausBeurteilen } from './helfer.mjs';
import { schliessbar, horizonte, siebenFallunterscheidungen as sieben } from './probieren-level.mjs';
import { ALLE } from '../../tools/lader.mjs';

console.log('Beurteilung: Schwierigkeit');
await vorausBeurteilen(['teuer']);

const schwierigkeit = (level) => beurteile(level).schwierigkeit;
const TEILWERTE = ['denkarbeit', 'zusammenspiel', 'weglaenge', 'groesse'];
const DENKARBEIT = ['spielermodell', 'farblogik', 'kernideen'];
const nah = (a, b) => Math.abs(a - b) < 1e-9;

/** Ein Spiegel lenkt weisses Licht auf das Ziel; welche Stellung, legt erst das Ziel fest. */
const einSpiegel = miniLevel([
  { type: 'source', x: 0, z: 3, dir: 0 },
  { type: 'mirror', x: 3, z: 3, rot: 1 },
  { type: 'target', x: 3, z: 6, color: 'white' },
], 'Ein Spiegel');

/** Das Level um eine Vierteldrehung gedreht, Ost wird Süd (hier unabhängig von der Feldform): dasselbe Rätsel. */
function gedreht(level) {
  const n = (level.size || 7) - 1, platz = (x, z) => [n - z, x];
  const elements = level.elements.map((e) => {
    const [x, z] = platz(e.x, e.z), neu = { ...e, x, z };
    if (e.dir !== undefined) neu.dir = (e.dir + 2) % 8;
    if (e.rot !== undefined) neu.rot = (e.rot + 2) % 8;
    return neu;
  });
  const solution = Object.fromEntries(Object.entries(level.solution)
    .map(([zelle, v]) => [platz(...zelle.split(',').map(Number)).join(','), (v + 2) % 8]));
  return { ...level, name: level.name + ' (gedreht)', elements, solution };
}

test('Teilwerte Denkarbeit (Spielermodell, Farblogik, Kernideen), Zusammenspiel, Weglänge und Grösse, je mit Anteil', () => {
  assert.equal(TEILE.schwierigkeit, 'Schwierigkeit');
  const b = beurteile(einSpiegel);
  assert.ok(!b.offen.includes('Schwierigkeit'));
  const { wert, teilwerte } = b.schwierigkeit;
  assert.deepEqual(Object.keys(teilwerte).sort(), [...TEILWERTE].sort());
  assert.ok(nah(wert, TEILWERTE.reduce((s, t) => s + teilwerte[t].wert, 0)), 'Der Wert ist die Summe der Teilwerte');
  assert.ok(nah(teilwerte.denkarbeit.wert, DENKARBEIT.reduce((s, t) => s + teilwerte.denkarbeit[t].wert, 0)));
  for (const t of TEILWERTE) assert.ok(nah(teilwerte[t].anteil, teilwerte[t].wert / wert), t);
  assert.deepEqual(Object.keys(teilwerte.denkarbeit).sort(), ['anteil', ...DENKARBEIT, 'wert'].sort());
  const { spielermodell, farblogik, kernideen } = teilwerte.denkarbeit;
  assert.deepEqual(Object.keys(spielermodell).sort(),
    ['fallunterscheidungen', 'kette', 'rueckschluesse', 'stillstand', 'wert']);
  assert.deepEqual(Object.keys(farblogik).sort(), ['filtern', 'mischen', 'wert', 'zerlegen']);
  assert.deepEqual(Object.keys(kernideen).sort(), ['wert', 'zahl']);
  assert.deepEqual(Object.keys(teilwerte.zusammenspiel).sort(), ['anteil', 'jeElement', 'stellen', 'wert']);
  assert.deepEqual(Object.keys(teilwerte.weglaenge).sort(), ['abschnitte', 'anteil', 'wert']);
  assert.deepEqual(Object.keys(teilwerte.groesse).sort(), ['anteil', 'drehbar', 'wert']);
});

test('Ohne die teuren Regeln (teuer: false) fehlt die Schwierigkeit und steht in offen: Sie braucht alle Kernideen', () => {
  const b = beurteile(einSpiegel, { teuer: false });
  assert.equal(b.schwierigkeit, null);
  assert.ok(b.offen.includes('Schwierigkeit'));
});

console.log('Schwierigkeit: Denkarbeit');
test('Den Spiegel legt erst das Ziel fest: ein Rückschluss, keine Fallunterscheidung, kein Stillstand', () => {
  const { wert, ...d } = schwierigkeit(einSpiegel).teilwerte.denkarbeit.spielermodell;
  assert.deepEqual(d, { rueckschluesse: 1, fallunterscheidungen: 0, kette: 0, stillstand: 0 });
  assert.ok(wert > 0);
});

test('Fallunterscheidungen: Folgern allein löst das eine Level, das andere braucht sieben und mehr; mehr Denkarbeit', () => {
  const d = (level) => schwierigkeit(level).teilwerte.denkarbeit.spielermodell;
  assert.equal(d(schliessbar).fallunterscheidungen, 0);
  assert.equal(d(schliessbar).kette, 0);
  assert.ok(d(horizonte).fallunterscheidungen > 0, 'Horizont 2 braucht eine Fallunterscheidung');
  assert.ok(d(sieben).fallunterscheidungen >= 7 && d(sieben).kette > 0, JSON.stringify(d(sieben)));
  assert.ok(d(sieben).wert > d(horizonte).wert && d(sieben).wert > d(schliessbar).wert);
});

test('Gedreht ist es dasselbe Rätsel: dieselbe Schwierigkeit, obwohl das Spielermodell die Zellen anders durchgeht', () => {
  const querschlaeger = ALLE.LEVELS.find(l => l.name === 'Querschläger');
  for (const level of [querschlaeger, sieben]) {
    const b = beurteile(level), b1 = beurteile(gedreht(level)), b2 = beurteile(gedreht(gedreht(level)));
    assert.ok(b.schwierigkeit, level.name);
    assert.deepEqual(b1.schwierigkeit, b.schwierigkeit, level.name);
    assert.deepEqual(b2.schwierigkeit, b.schwierigkeit, level.name);
    // Gegenprobe: Die Teilwerte zum Schliessen in der festen Reihenfolge der Zellen hängen von der Drehung ab
    const s = (x) => [x.schliessen.k2, x.schliessen.kInf, x.schliessen.kette];
    assert.ok(s(b1).join() !== s(b).join() || s(b2).join() !== s(b).join(), `${level.name}: ${s(b)} ${s(b1)} ${s(b2)}`);
  }
});

console.log('Schwierigkeit: Farblogik');
const farblogik = (elements) => {
  const { wert, ...f } = schwierigkeit(miniLevel(elements)).teilwerte.denkarbeit.farblogik;
  return f;
};
test('Mischen: Rot und Blau aus zwei Quellen ergeben das Magenta des Ziels; aus einer magentafarbenen Quelle nicht', () => {
  assert.deepEqual(farblogik([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'source', x: 6, z: 6, dir: 4, color: 'blue' },
    { type: 'target', x: 3, z: 6, color: 'magenta' },
  ]), { mischen: 1, filtern: 0, zerlegen: 0 });
  assert.deepEqual(farblogik([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6, color: 'magenta' },
  ]), { mischen: 0, filtern: 0, zerlegen: 0 });
});

test('Filtern: Ein Rotfilter macht aus Weiss das Rot des Ziels; vor einer roten Quelle bewirkt er nichts', () => {
  const mit = (farbe) => farblogik([
    { type: 'source', x: 0, z: 3, dir: 0, color: farbe },
    { type: 'filter', x: 1, z: 3, color: 'red' },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 3, z: 6, color: 'red' },
  ]);
  assert.deepEqual(mit('white'), { mischen: 0, filtern: 1, zerlegen: 0 });
  assert.deepEqual(mit('red'), { mischen: 0, filtern: 0, zerlegen: 0 });
});

test('Zerlegen: Ein Prisma bricht Weiss und schickt das Rot ins Ziel; Rot allein lenkt es nur um', () => {
  const mit = (farbe) => farblogik([
    { type: 'source', x: 0, z: 3, dir: 0, color: farbe },
    { type: 'prism', x: 3, z: 3, rot: 1 },
    { type: 'target', x: 6, z: 3, color: 'red' },
  ]);
  assert.deepEqual(mit('white'), { mischen: 0, filtern: 0, zerlegen: 1 });
  assert.deepEqual(mit('red'), { mischen: 0, filtern: 0, zerlegen: 0 });
});

console.log('Schwierigkeit: Kernideen');
test('Kernideen: Sie zählen die nötigen Kernideen; das Level mit Sammelstelle und Mischziel aus zwei Quellen hat zwei', () => {
  const level = miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
    { type: 'prism', x: 3, z: 3, rot: 7 },
    { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
    { type: 'mirror', x: 5, z: 3, rot: 3, fixed: true },
    { type: 'target', x: 5, z: 1, color: 'magenta' },
  ]);
  const b = beurteile(level);
  assert.equal(b.kernideen.length, 2);
  assert.equal(b.schwierigkeit.teilwerte.denkarbeit.kernideen.zahl, 2);
  assert.ok(b.schwierigkeit.teilwerte.denkarbeit.kernideen.wert > 0);
  assert.deepEqual(schwierigkeit(einSpiegel).teilwerte.denkarbeit.kernideen, { wert: 0, zahl: 0 });
});

console.log('Schwierigkeit: Zusammenspiel');
test('Zusammenspiel: Rot und Blau aus zwei Quellen treffen sich auf dem Ziel, eine Stelle je drehbares Element; allein keine', () => {
  const zwei = beurteile(miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'source', x: 6, z: 6, dir: 4, color: 'blue' },
    { type: 'target', x: 3, z: 6, color: 'magenta' },
  ]));
  const { wert, anteil: _, ...z } = zwei.schwierigkeit.teilwerte.zusammenspiel;
  assert.deepEqual(z, { jeElement: 1, stellen: 1 });
  assert.ok(wert > 0);
  assert.equal(z.jeElement, zwei.spielwert.teilwerte.zusammenspiel, 'derselbe Teilwert wie im Spielwert');
  assert.deepEqual(schwierigkeit(einSpiegel).teilwerte.zusammenspiel, { wert: 0, anteil: 0, jeElement: 0, stellen: 0 });
});

console.log('Schwierigkeit: Weglänge');
test('Weglänge: über einen Spiegel zwei gerade Abschnitte bis zum Ziel, über zwei Spiegel drei; mehr Weg, mehr Schwierigkeit', () => {
  const zwei = miniLevel([
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'mirror', x: 3, z: 5, rot: 1 },
    { type: 'target', x: 6, z: 5, color: 'white' },
  ], 'Zwei Spiegel');
  const [a, b] = [einSpiegel, zwei].map(l => schwierigkeit(l).teilwerte.weglaenge);
  assert.deepEqual([a.abschnitte, b.abschnitte], [2, 3]);
  assert.ok(b.wert > a.wert && a.wert > 0);
});

console.log('Schwierigkeit auf den 150 heutigen Leveln');
test('Stillstand: Wo das Spielermodell mit Horizont 2 steckt (116, 138, 139, 140, 147, 150), zählt er, sonst nie', () => {
  const all = heutigeLevel({ teuer: true });
  const stillstand = (h) => h.beurteilung.schwierigkeit.teilwerte.denkarbeit.spielermodell.stillstand;
  assert.deepEqual(all.filter(h => stillstand(h) > 0).map(h => h.platz), [116, 138, 139, 140, 147, 150]);
  assert.ok(all.every(h => [0, 1].includes(stillstand(h))));
});

test('Was sicheres Licht vorwärts zeigt, ist kein Rückschluss: 37 Knotenpunkt hat 7 drehbare Elemente, aber 6,5 Rückschlüsse', () => {
  // In zwei der vier Drehungen entscheidet das Spielermodell ein Element vorwärts, bevor es rückwärts folgert
  const { teilwerte } = heutigeLevel({ teuer: true })[36].beurteilung.schwierigkeit;
  const { rueckschluesse, fallunterscheidungen } = teilwerte.denkarbeit.spielermodell;
  assert.deepEqual([teilwerte.groesse.drehbar, rueckschluesse, fallunterscheidungen], [7, 6.5, 0]);
  for (const { platz, beurteilung: { schwierigkeit: { teilwerte: t } } } of heutigeLevel({ teuer: true })) {
    assert.ok(t.denkarbeit.spielermodell.rueckschluesse <= t.groesse.drehbar, `${platz}`);
  }
});

test('Kernideen, Mischziele und Zusammenspiel der Schwierigkeit sind die der Beurteilung und des Spielwerts', () => {
  for (const { platz, beurteilung: b } of heutigeLevel({ teuer: true })) {
    assert.equal(b.schwierigkeit.teilwerte.zusammenspiel.jeElement, b.spielwert.teilwerte.zusammenspiel, `${platz}`);
    assert.equal(b.schwierigkeit.teilwerte.denkarbeit.kernideen.zahl, b.kernideen.length, `${platz}`);
    assert.equal(b.schwierigkeit.teilwerte.denkarbeit.farblogik.mischen, b.mischziele.length, `${platz}`);
  }
});

test('Grösse: höchstens 10 Punkte, voll ab 12 drehbaren Elementen, steigend; ihr Anteil ist ausgewiesen und höchstens ein Fünftel', () => {
  const all = heutigeLevel({ teuer: true }).map(h => ({ platz: h.platz, ...h.beurteilung.schwierigkeit }));
  for (const { platz, wert, teilwerte: { groesse } } of all) {
    assert.ok(groesse.wert > 0 && groesse.wert <= 10, `${platz}: ${groesse.wert}`);
    assert.equal(groesse.wert === 10, groesse.drehbar >= 12, `${platz}`);
    assert.ok(nah(groesse.anteil, groesse.wert / wert), `${platz}`);
    assert.ok(groesse.anteil <= 0.2, `${platz}: Anteil ${groesse.anteil}`);
  }
  const nachGroesse = all.map(s => s.teilwerte.groesse).sort((a, b) => a.drehbar - b.drehbar);
  for (let i = 1; i < nachGroesse.length; i++) assert.ok(nachGroesse[i].wert >= nachGroesse[i - 1].wert);
});

test('Anteile: Die Denkarbeit trägt im Mittel mindestens die Hälfte, die Weglänge höchstens ein Viertel, bei keinem Level ein Drittel', () => {
  const all = heutigeLevel({ teuer: true }).map(h => h.beurteilung.schwierigkeit.teilwerte);
  const mittel = (teil) => all.reduce((s, t) => s + t[teil].anteil, 0) / all.length;
  const prozent = (x) => `${(100 * x).toFixed(1).replace('.', ',')} %`;
  console.log(`        im Mittel: Denkarbeit ${prozent(mittel('denkarbeit'))}, `
    + `Weglänge ${prozent(mittel('weglaenge'))}, Zusammenspiel ${prozent(mittel('zusammenspiel'))}, `
    + `Grösse ${prozent(mittel('groesse'))}`);
  assert.ok(mittel('denkarbeit') >= 0.5, `Denkarbeit ${prozent(mittel('denkarbeit'))}`);
  assert.ok(mittel('weglaenge') <= 0.25, `Weglänge ${prozent(mittel('weglaenge'))}`);
  const hoechstens = Math.max(...all.map(t => t.weglaenge.anteil));
  assert.ok(hoechstens <= 1 / 3, `Weglänge bei einem Level ${prozent(hoechstens)}`);
});

// Eichung und Eichprüfung (ADR 0001): tools/eiche-schwierigkeit.mjs stellt die Gewichte an den geraden Plätzen ein
// (schwierigkeit-eichung.mjs). Abnahme (Spec, Entscheide des Nutzers): gekreuzt über beide Hälften, auf zwei Stellen
// gerundet wie beim Knäuel, über alle mindestens 0,85 und in jedem 30er-Bereich mindestens 0,3. Das bisherige Mass (an
// den 75 ungeraden Plätzen, je Bereich früher 0,5) wird weiter gezeigt. Über alle verlangt es weiter 0,85: Das
// gekreuzte Mass eicht selbst neu, nur das bisherige prüft die versionierten Gewichte.
const zahl = (x, n = 2) => x.toFixed(n).replace('.', ',');
const zweiStellen = (x) => Math.round(x * 100) / 100;
const heutige = () => heutigeLevel({ teuer: true })
  .map(h => ({ platz: h.platz, teilwerte: h.beurteilung.schwierigkeit.teilwerte }));
const text = ({ bereiche }, n = 2) => bereiche.map(({ von, bis, rho }) => `${von}–${bis} ${zahl(rho, n)}`).join(', ');
/** Das bisherige Mass: die Schwierigkeit mit den versionierten Gewichten an den 75 ungeraden Plätzen. */
const bisher = () => {
  const hs = heutigeLevel({ teuer: true }).filter(h => ungerade(h.platz));
  return jeBereich(hs.map(h => h.beurteilung.schwierigkeit.wert), hs.map(h => h.platz));
};
/** Das gekreuzte Mass: jede Hälfte mit den Gewichten aus der anderen, über alle 150; einmal je Lauf. */
let kreuz = null;
const gekreuztesMass = () => (kreuz ??= gekreuzt(heutige()));

test('Eichung: Die versionierten Gewichte sind die der Eichung an den geraden Plätzen; die Plätze der ungeraden ändern sie nicht', () => {
  const datei = new URL('../../tools/beurteilung/schwierigkeit-gewichte.json', import.meta.url);
  const { gewichte } = JSON.parse(readFileSync(datei, 'utf8'));
  assert.deepEqual(eiche(heutige(), gerade), gewichte);
  // Gegenprobe: die heutige Reihenfolge der ungeraden Plätze vertauscht, dieselben Gewichte
  const vertauscht = heutige().map(h => (ungerade(h.platz) ? { ...h, platz: 150 - h.platz } : h));
  assert.ok(vertauscht.filter(h => ungerade(h.platz)).length === 75 && vertauscht[0].platz === 149);
  assert.deepEqual(eiche(vertauscht, gerade), gewichte);
});

test('Gekreuzt: Jede Hälfte kommt aus den Gewichten der anderen; getauschte Plätze in ihr ändern nur die Werte der anderen', () => {
  // Je zwei benachbarte Plätze einer Hälfte getauscht (1 und 3, 5 und 7, … bzw. 2 und 4, …; 149 und 150 bleiben): Die
  // Werte dieser Hälfte bleiben, die der anderen nicht. Sagte jede Hälfte sich selbst voraus, wäre es umgekehrt.
  const x = gekreuztesMass(), alle = heutige();
  for (const [name, haelfte, erster] of [['gerade', gerade, 2], ['ungerade', ungerade, 1]]) {
    const getauscht = (p) => {
      const q = (p - erster) % 4 < 2 ? p + 2 : p - 2;
      return haelfte(p) && q <= 150 ? q : p;
    };
    const y = gekreuzt(alle.map(h => ({ ...h, platz: getauscht(h.platz) })));
    assert.ok(alle.every((h, i) => !haelfte(h.platz) || y.werte[i] === x.werte[i]), `${name}: eigene Werte geändert`);
    assert.ok(alle.some((h, i) => !haelfte(h.platz) && y.werte[i] !== x.werte[i]), `${name}: Werte der anderen gleich`);
  }
});

test('Eichprüfung über alle: gekreuzt Rangkorrelation mindestens 0,85 (auf zwei Stellen), an den ungeraden Plätzen ebenso', () => {
  const x = gekreuztesMass().gesamt, b = bisher().gesamt;
  console.log(`        Rangkorrelation über alle: gekreuzt ${zahl(x, 3)}, an den ungeraden Plätzen ${zahl(b, 3)}`);
  assert.ok(zweiStellen(x) >= 0.85, `gekreuzt ${zahl(x)}, verlangt 0,85`);
  assert.ok(zweiStellen(b) >= 0.85, `an den ungeraden Plätzen ${zahl(b)}, verlangt 0,85`);
});

test('Eichprüfung je 30er-Bereich: gekreuzt über alle 30 Level Rangkorrelation mindestens 0,3 (auf zwei Stellen)', () => {
  const x = gekreuztesMass();
  console.log(`        gekreuzt, je Bereich: ${text(x, 3)}`);
  console.log(`        bisher, je Bereich (15 ungerade Plätze, früher verlangt 0,5): ${text(bisher())}`);
  for (const { von, bis, rho } of x.bereiche) {
    assert.ok(zweiStellen(rho) >= 0.3, `${von}–${bis}: ${zahl(rho, 3)}, gerundet ${zahl(rho)}, verlangt 0,3`);
  }
});
