// Tests der Wahl für Noas Geschichte (Spec .scratch/noa-geschichte/, «Wahl der 240 Level» und «Namen der Welten»;
// Ticket 03): tools/geschichte/wahl.json gegen die Regeln aus tools/geschichte.mjs. 4 × 60 Level, je Welt 10 auf den
// Plätzen 1–10, der Grad aus den Leveldaten, die Ränge nach Schwierigkeit je Welt und Vertauschungen um höchstens
// 2 Plätze (in «sehr schwer» nach dem Entscheid des Nutzers vom 29.10.2026 statt dessen höchstens 3 Plätze vom Rang im
// Grad, auch über die Weltgrenze), jede Welt in ihrem Abschnitt des Pools, die Vielfalt (ausser den Verstössen, die die
// Wahl in «sehr schwer» selbst nennt, weil sie dort auch mit 3 Plätzen nicht aufgeht), keine zwei zu ähnlichen Level,
// kein abgelehntes, genau eine Lösung, die Titel aus titel.json eindeutig und nach den Regeln, die Schlüssel der 15
// neuen Level; dazu, dass die Wahl nachbaubar ist (neu gerechnet byte-gleich wie die Datei). Gegenproben an erfundenen
// Fällen zeigen, dass jede Prüfung einen Verstoss findet, und an erfundenen Pools, dass die Wahl die Vielfalt vor die
// Bewertung stellt, über die Grenzen der Welten anordnet, über den ganzen Grad die kleinsten Verschiebungen findet und
// ohne Wahl so wenige Verstösse wie möglich lässt. Seit Ticket 04 die Wahl im Spiel: index.html enthält das Tutorial
// und genau die 240 mit ihrem Titel, in der Reihenfolge der Reihe (nicht umgeordnet), der Datenblock der Geschichte
// (STORY_LEVELS) die Reise aus wahl.json, alles übrige liegt im Vorrat; geschichte.mjs spiel ändert danach nichts mehr
// und bringt an Kopien der Texte jedes Level dorthin, wo es hingehört.
// Aufruf: LEISE_CPU=50 sh tools/leise.sh node tests/geschichte.test.mjs   (etwa 3 min: Beurteilung des Pools, die Wahl
//         neu und der Löser für die 240 Level)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { L, period, solve } from '../tools/solver.mjs';
import { ALLE, VORRAT } from '../tools/lader.mjs';
import { GRADE } from '../tools/beurteilung/index.mjs';
import { MINDEST_SPIELWERT } from '../tools/beurteilung/spielwert.mjs';
import { abdruck, kandidatName } from '../tools/leveldaten.mjs';
import { alleUrteile, ladeLevelliste } from '../tools/levelliste.mjs';
import { ablegen, lese, namenImSpiel, zurueckholen } from '../tools/vorrat.mjs';
import {
  DATEIEN, HOECHSTENS, JE_GRAD, JE_WELT, UEBER_GRENZEN, VERTAUSCHUNG, WELTEN, ablehnung, alleNamen, alsDaten,
  anordnungen, bewerte, bewertungen, blockZeilen, fensterVerstoesse, insSpiel, ladeTitel, mitTitel, nachSchwierigkeit,
  neueLevel, ordneUeberGrenzen, poolLevel, pruefe, reiseAus, reiseImSpiel, sechstel, titelFehler, waehle, waehleGrad,
  waehleWelt, wahlText, zuviel, zustandNach,
} from '../tools/geschichte.mjs';

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ', name); }
  catch (e) {
    console.error('  FAIL', name, '\n      ', e.message.split('\n').slice(0, 12).join('\n       '));
    process.exitCode = 1;
  }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const TEXT = readFileSync(DATEIEN.wahl, 'utf8').replace(/\r\n/g, '\n');
const DATEN = JSON.parse(TEXT), LEVEL = DATEN.level, TITEL = ladeTitel();
const BEWERTET = await bewerte();
const INFO = new Map(BEWERTET.map(p => [p.name, p]));
const info = (name) => INFO.get(name);
const ERLAUBT = Object.fromEntries(GRADE.map(g => [g, DATEN.grade[g].verstoesse]));
const ENTFERNT = ladeLevelliste().entfernteNamen;

console.log('Die Wahl in tools/geschichte/wahl.json');
await test('Nachbaubar: Gleiche Eingaben ergeben die gleiche Wahl, byte-gleich wie die Datei', () => {
  const neu = wahlText(alsDaten(waehle(BEWERTET), TITEL));
  if (neu !== TEXT) {
    const a = neu.split('\n'), b = TEXT.split('\n'), k = a.findIndex((z, i) => z !== b[i]);
    assert.fail(`erste andere Zeile ${k + 1}:\n neu:   ${a[k]?.slice(0, 200)}\n Datei: ${b[k]?.slice(0, 200)}`);
  }
});
await test('Alle Regeln (pruefe): 4 × 60, je Welt 10 auf den Plätzen 1–10, Grad, Ränge, Vertauschungen, Vielfalt, '
  + 'Ähnlichkeit, kein abgelehntes, keines doppelt', () => {
  assert.equal(LEVEL.length, GRADE.length * JE_GRAD);
  assert.deepEqual(pruefe(LEVEL, info, { erlaubt: ERLAUBT }), []);
});
await test('Grad: Jedes Level steht im Grad seiner Leveldaten (die 15 neuen in «sehr schwer»)', () => {
  for (const l of LEVEL) assert.equal(info(l.name).level.grad, l.grad, l.name);
  const neu = neueLevel().map(n => n.level.name);
  assert.deepEqual(LEVEL.filter(l => neu.includes(l.name)).map(l => l.grad), neu.map(() => GRADE[3]));
});
await test('Schwierigkeit: Welt w hat die Ränge 10·w … 10·w+9, höchstens 2 Plätze vertauscht (in «sehr schwer» '
  + 'höchstens 3 Plätze vom Rang im Grad, auch über die Weltgrenze), und die Datei nennt Rang und Schwierigkeit '
  + 'richtig', () => {
  assert.deepEqual(UEBER_GRENZEN, { 'sehr schwer': 3 }, 'Entscheid des Nutzers vom 29.10.2026');
  for (const g of GRADE) {
    const imGrad = LEVEL.filter(l => l.grad === g);
    const rang = new Map(imGrad.map(l => info(l.name)).sort(nachSchwierigkeit).map((p, i) => [p.name, i + 1]));
    for (const l of imGrad) {
      assert.equal(l.rang, rang.get(l.name), `${l.name}: Rang`);
      const platz = JE_WELT * WELTEN.indexOf(l.welt) + l.platz;
      if (UEBER_GRENZEN[g]) {
        assert.ok(Math.abs(l.rang - platz) <= UEBER_GRENZEN[g], `${l.name}: Platz ${platz} im Grad, Rang ${l.rang}`);
      } else {
        assert.equal(Math.floor((l.rang - 1) / JE_WELT), WELTEN.indexOf(l.welt), `${l.name}: Welt`);
        assert.ok(Math.abs((l.rang - 1) % JE_WELT - (l.platz - 1)) <= VERTAUSCHUNG, `${l.name}: Platz ${l.platz}`);
      }
      assert.equal(l.schwierigkeit, Math.round(info(l.name).schwierigkeit * 100) / 100, `${l.name}: Schwierigkeit`);
      assert.equal(l.hauptKernidee, info(l.name).haupt, `${l.name}: Haupt-Kernidee`);
    }
  }
});
await test('Bereich: Die Welten teilen den Pool ohne Lücke von unten nach oben, jede wählt aus ihrem Abschnitt (in '
  + '«sehr schwer» gilt statt dessen die Regel der 3 Plätze), Abweichungen von den Sechsteln stehen in der Datei',
  () => {
  for (const g of GRADE) {
    const d = DATEN.grade[g], reihe = BEWERTET.filter(p => p.grad === g && !p.abgelehnt).sort(nachSchwierigkeit);
    const n = reihe.length, sechs = sechstel(n);
    assert.equal(d.abschnitte[0].poolPlaetze[0], 1, g);
    assert.equal(d.abschnitte.at(-1).poolPlaetze[1], n, g);
    d.abschnitte.forEach((a, k) => {
      if (k) assert.equal(a.poolPlaetze[0], d.abschnitte[k - 1].poolPlaetze[1] + 1, `${g}: Lücke vor ${a.welt}`);
      const hier = reihe.slice(a.poolPlaetze[0] - 1, a.poolPlaetze[1]).map(p => p.name);
      for (const l of LEVEL.filter(x => x.grad === g && x.welt === a.welt && !UEBER_GRENZEN[g])) {
        assert.ok(hier.includes(l.name), `${g}: ${l.name} nicht im Abschnitt von ${a.welt}`);
      }
    });
    const verschoben = d.abschnitte.slice(1).filter((a, k) => a.poolPlaetze[0] - 1 !== sechs[k + 1]).length;
    assert.equal(d.verschoben.length, verschoben, `${g}: verschobene Grenzen`);
  }
});
await test('Vielfalt: in «leicht», «mittel», «schwer» höchstens 2-mal dieselbe Haupt-Kernidee je 10 '
  + 'aufeinanderfolgende Level, auch über die Weltgrenzen; in «sehr schwer» genau die genannten Verstösse', () => {
  for (const g of GRADE) {
    const folge = WELTEN.flatMap(w => LEVEL.filter(l => l.grad === g && l.welt === w).sort((a, b) => a.platz - b.platz))
      .map(l => info(l.name));
    assert.deepEqual(fensterVerstoesse(folge), DATEN.grade[g].verstoesse, g);
    if (g !== GRADE[3]) assert.deepEqual(DATEN.grade[g].verstoesse, [], g);
  }
});
await test('«sehr schwer»: Der Pool ist genau 60, mit den Rängen je Welt geht die Vielfalt schon in einer Welt nicht '
  + 'auf, und auch mit 3 Plätzen über die Weltgrenzen nicht (darum die Verstösse); die Anordnung hat weniger als nach '
  + 'Rang und als mit 2 Plätzen, und einige Level stehen in einer Nachbarwelt', () => {
  const reihe = BEWERTET.filter(p => p.grad === GRADE[3] && !p.abgelehnt).sort(nachSchwierigkeit);
  assert.equal(reihe.length, JE_GRAD);
  const welt = (w) => reihe.slice(JE_WELT * w, JE_WELT * (w + 1));
  const unmoeglich = WELTEN.filter((_, w) => {
    const je = {};
    for (const p of welt(w)) if (p.haupt) je[p.haupt] = (je[p.haupt] ?? 0) + 1;
    return Object.values(je).some(x => x > HOECHSTENS);
  });
  assert.ok(unmoeglich.length > 0, 'keine Welt mit mehr als 2-mal derselben Haupt-Kernidee: dann müsste es aufgehen');
  assert.equal(ordneUeberGrenzen(reihe, UEBER_GRENZEN[GRADE[3]]), null, 'mit 3 Plätzen ginge es ganz auf');
  const v = DATEN.grade[GRADE[3]].verstoesse;
  assert.ok(v.length > 0);
  assert.ok(zuviel(v) < zuviel(fensterVerstoesse(reihe)), 'nicht besser als nach Rang');
  const zwei = ordneUeberGrenzen(reihe, 2, { mitVerstoessen: true });
  assert.ok(zuviel(v) < zuviel(fensterVerstoesse(zwei)), 'nicht besser als mit 2 Plätzen');
  const nachbar = LEVEL.filter(l => l.grad === GRADE[3]
    && Math.floor((l.rang - 1) / JE_WELT) !== WELTEN.indexOf(l.welt));
  assert.ok(nachbar.length > 0 && nachbar.every(l => /in (Bergwald|Meer|Wüste|Vulkan|Planeten|Sterne) nach/
    .test(l.vielfalt)), 'Level in einer Nachbarwelt, mit Grund');
});
await test('Kein abgelehntes Level, und die Datei nennt die abgelehnten des Pools mit Grund', () => {
  for (const g of GRADE) {
    const ab = BEWERTET.filter(p => p.grad === g && p.abgelehnt);
    assert.deepEqual(DATEN.grade[g].ausgeschlossen, ab.map(p => ({ name: p.name, grund: p.abgelehnt })), g);
    assert.deepEqual(LEVEL.filter(l => l.grad === g && info(l.name).abgelehnt).map(l => l.name), [], g);
  }
});
/** Hat das Level nicht genau eine Lösung, die notierte? (wie in tests/levelliste.test.mjs) */
const loesungFalsch = (level) => {
  const r = solve(level, { unique: true });
  const norm = (set) => Object.entries(set).map(([z, v]) => {
    const el = level.elements.find(e => `${e.x},${e.z}` === z);
    return `${z}:${v % period(el)}`;
  }).sort().join(' ');
  return r.aborted || r.count !== 1 || norm(r.solutions[0].set) !== norm(level.solution);
};
await test('Jedes Level hat genau eine Lösung, die notierte; mit Gegenproben', () => {
  assert.deepEqual(LEVEL.filter(l => loesungFalsch(info(l.name).level)).map(l => l.name), []);
  // Gegenproben: eine falsch notierte Lösung, und ein drehbarer Spiegel mehr auf der ersten freien Zelle, die so
  // mehrere Lösungen gibt (etwa ohne Licht)
  const l = info(LEVEL[0].name).level;
  const [zelle, stellung] = Object.entries(l.solution)[0];
  assert.ok(loesungFalsch({ ...l, solution: { ...l.solution, [zelle]: stellung + 1 } }), 'falsch notiert');
  let mehr = null;
  for (let x = 0; x < 7 && !mehr; x++) {
    for (let z = 0; z < 7 && !mehr; z++) {
      if (l.elements.some(e => e.x === x && e.z === z)) continue;
      const probe = { ...l, elements: [...l.elements, { type: 'mirror', x, z, rot: 0 }] };
      if (solve(probe, { unique: true }).count > 1) mehr = probe;
    }
  }
  assert.ok(mehr && loesungFalsch(mehr), 'mehrere Lösungen');
});

console.log('Titel und Namen');
await test('Die Titel aus titel.json: je Welt und Grad 10, eindeutig über Titel und Namen (Gross- und Kleinschreibung '
  + 'egal), keiner von der Liste entfernter Level, ein oder zwei Wörter, ss statt ß', () => {
  assert.deepEqual(titelFehler(TITEL, alleNamen(), ENTFERNT), []);
  assert.equal(new Set(LEVEL.map(l => l.titel.toLowerCase())).size, LEVEL.length);
});
await test('Jedes Level trägt den Titel seines Platzes aus titel.json (titel ordnet neu zu)', () => {
  for (const l of LEVEL) assert.equal(l.titel, TITEL[l.welt][l.grad][l.platz - 1], l.name);
  const anders = structuredClone(TITEL);
  anders.Meer.mittel[3] = 'Wellenspiel';
  const neu = mitTitel(DATEN, anders);
  assert.equal(neu.level.find(l => l.welt === 'Meer' && l.grad === 'mittel' && l.platz === 4).titel, 'Wellenspiel');
  assert.deepEqual(Object.keys(neu.level[0]), Object.keys(LEVEL[0]), 'Felder in derselben Reihenfolge');
  assert.equal(wahlText(mitTitel(DATEN, TITEL)), TEXT, 'ohne Änderung byte-gleich');
});
await test('Gegenproben der Titel: doppelt (auch in anderer Schreibung), Name eines Levels, entfernter Name, ß, drei '
  + 'Wörter, zu wenige', () => {
  const mit = (welt, grad, platz, t) => {
    const x = structuredClone(TITEL);
    x[welt][grad][platz] = t;
    return titelFehler(x, alleNamen(), ENTFERNT);
  };
  assert.match(mit('Sterne', 'leicht', 0, TITEL.Meer.leicht[0].toUpperCase()).join(), /doppelt/);
  const erstes = ALLE.LEVELS[ALLE.TUTORIAL_COUNT].name.toLowerCase();
  assert.match(mit('Sterne', 'leicht', 0, erstes).join(), /Name eines Levels/);
  assert.match(mit('Sterne', 'leicht', 0, ALLE.LEVELS_3D[0].name).join(), /Name eines Levels/, 'Würfel');
  assert.match(mit('Sterne', 'leicht', 0, neueLevel()[0].level.name).join(), /Name eines Levels/, 'neues Level');
  assert.match(mit('Sterne', 'leicht', 0, ENTFERNT[0]).join(), /entfernter Level/);
  assert.match(mit('Sterne', 'leicht', 0, 'Grosse Strasse').join(), /^$/, 'ss ist richtig');
  assert.match(mit('Sterne', 'leicht', 0, 'Große Straße').join(), /ß statt ss/);
  assert.match(mit('Sterne', 'leicht', 0, 'Der Grosse Wagen').join(), /mehr als zwei Wörter/);
  const kurz = structuredClone(TITEL);
  kurz.Vulkan.schwer.pop();
  assert.match(titelFehler(kurz, alleNamen(), ENTFERNT).join(), /Vulkan, schwer: 9 Titel/);
});
await test('Die 15 neuen Level haben einen eigenen Schlüssel: eindeutig über Spiel und Vorrat (auch in anderer '
  + 'Schreibung; seit Ticket 04 je genau einmal im Spiel, mit denselben Leveldaten), nicht von der Liste entfernter '
  + 'Level, ihr Kandidat in der Datei', () => {
  const neu = neueLevel(), alle = [...ALLE.LEVELS, ...ALLE.LEVELS_3D];
  assert.equal(neu.length, 15);
  for (const n of neu) {
    assert.ok(n.level.name, `${n.kandidat} ohne Schlüssel`);
    const gleich = alle.filter(l => l.name.toLowerCase() === n.level.name.toLowerCase());
    assert.deepEqual(gleich.map(l => [l.name, abdruck(l), l.grad]), [[n.level.name, abdruck(n.level), n.level.grad]],
      `${n.level.name}: einmal, mit denselben Leveldaten`);
    assert.ok(!ENTFERNT.map(x => x.toLowerCase()).includes(n.level.name.toLowerCase()), `${n.level.name} entfernt`);
    assert.equal(kandidatName(n.level), n.kandidat, `${n.level.name}: Abdruck`);
    const l = LEVEL.find(x => x.name === n.level.name);
    if (l) assert.equal(l.kandidat, n.kandidat);
  }
  assert.equal(new Set(neu.map(n => n.level.name.toLowerCase())).size, 15);
  // im Pool je einmal und weiter als neu
  const pool = poolLevel(neu);
  assert.deepEqual(neu.map(n => pool.filter(p => p.name === n.level.name).map(p => [p.neu, p.kandidat])),
    neu.map(n => [[true, n.kandidat]]));
  // Gegenprobe: ein Schlüssel, den es mit anderen Leveldaten schon gibt, oder keiner
  const vorhanden = ALLE.LEVELS[ALLE.TUTORIAL_COUNT].name;
  const doppelt = neu.map((n, i) => (i ? n : { ...n, level: { ...n.level, name: vorhanden } }));
  assert.throws(() => poolLevel(doppelt), /gibt es schon/);
  const leer = neu.map((n, i) => (i ? n : { ...n, level: { ...n.level, name: '' } }));
  assert.throws(() => poolLevel(leer), /ohne Schlüssel/);
});

console.log('Gegenproben der Prüfung (pruefe) an erfundenen Änderungen');
/** Die Wahl mit einer Änderung an Kopien der Level. */
const geaendert = (f) => { const l = structuredClone(LEVEL); f(l); return pruefe(l, info, { erlaubt: ERLAUBT }); };
const finde = (l, grad, welt, platz) => l.find(x => x.grad === grad && x.welt === welt && x.platz === platz);
await test('Ein Level in der falschen Welt (zwei getauscht über eine Weltgrenze) fällt auf', () => {
  const f = geaendert((l) => {
    const a = finde(l, 'mittel', 'Meer', 10), b = finde(l, 'mittel', 'Wüste', 1);
    [a.name, b.name] = [b.name, a.name];
  });
  assert.match(f.join('\n'), /gehört also nicht in Meer/);
});
await test('Ein Level 3 Plätze von seinem Rang fällt auf', () => {
  const f = geaendert((l) => {
    const welt = l.filter(x => x.grad === 'leicht' && x.welt === 'Bergwald').sort((a, b) => a.rang - b.rang);
    const a = welt[0], ziel = Math.min(...[a.platz + 3, a.platz - 3].filter(p => p >= 1 && p <= 10));
    const b = welt.find(x => x.platz === ziel);
    [a.platz, b.platz] = [b.platz, a.platz];
  });
  assert.match(f.join('\n'), /leicht, Bergwald: .* auf Platz \d+, nach Schwierigkeit \d+/);
});
await test('Regel der 3 Plätze über die Weltgrenze (nur «sehr schwer»): eine Welt weiter um 1 oder 3 Plätze ist dort '
  + 'erlaubt, in «schwer» nicht; 4 Plätze fallen auch in «sehr schwer» auf', () => {
  // erfundene Grade ohne Haupt-Kernideen: das Level mit Rang q steht auf Platz q im Grad, ausser den getauschten
  const erfunden = (grad, tausch) => {
    const pos = Array.from({ length: JE_GRAD }, (_, q) => q);
    for (const [a, b] of tausch) [pos[a], pos[b]] = [pos[b], pos[a]];
    const level = pos.map((p, q) => ({ grad, welt: WELTEN[Math.floor(p / JE_WELT)], platz: p % JE_WELT + 1,
      name: `${grad}-${q}` }));
    const daten = (name) => ({ grad, schwierigkeit: Number(name.split('-').at(-1)), haupt: null, abgelehnt: null });
    // nur die Meldungen zu diesem Grad (die übrigen Grade fehlen hier ganz)
    return pruefe(level, daten).filter(f => f.startsWith(`${grad}:`) || f.startsWith(`${grad},`));
  };
  assert.deepEqual(erfunden('sehr schwer', [[9, 10]]), [], 'Bergwald 10 ↔ Meer 1');
  assert.deepEqual(erfunden('sehr schwer', [[7, 10]]), [], '3 Plätze über die Grenze');
  assert.match(erfunden('sehr schwer', [[8, 12]]).join('\n'),
    /sehr schwer: sehr schwer-8 auf Platz 13 des Grads, nach Schwierigkeit 9 \(mehr als 3 Plätze\)/);
  assert.match(erfunden('schwer', [[9, 10]]).join('\n'), /schwer: schwer-9 hat den Rang 10, gehört also nicht in Meer/);
  // an der echten Wahl: das leichteste sehr schwere Level 4 Plätze weiter
  const f = geaendert((l) => {
    const ss = l.filter(x => x.grad === GRADE[3]), platz = (x) => JE_WELT * WELTEN.indexOf(x.welt) + x.platz;
    const a = ss.find(x => x.rang === 1), b = ss.find(x => platz(x) === platz(a) + 4);
    [a.welt, a.platz, b.welt, b.platz] = [b.welt, b.platz, a.welt, a.platz];
  });
  assert.match(f.join('\n'), /sehr schwer: .* nach Schwierigkeit 1 \(mehr als 3 Plätze\)/);
});
await test('Ein fehlendes, ein doppeltes und ein Level aus einem anderen Grad fallen auf', () => {
  assert.match(geaendert(l => l.splice(5, 1)).join('\n'), /leicht: 59 Level statt 60/);
  assert.match(geaendert((l) => { l[5].name = l[6].name; }).join('\n'), /doppelt/);
  assert.match(geaendert((l) => { finde(l, 'leicht', 'Meer', 1).grad = 'mittel'; }).join('\n'),
    /Grad leicht, in der Geschichte mittel/);
  assert.match(geaendert((l) => { finde(l, 'schwer', 'Vulkan', 2).platz = 11; }).join('\n'), /schwer, Vulkan: Plätze/);
});
await test('Dreimal dieselbe Haupt-Kernidee in 10 aufeinanderfolgenden Leveln fällt auf, auch über die Weltgrenze; die '
  + 'genannten Verstösse gelten nur in ihrem Grad', () => {
  // erfunden: in «schwer» tragen die Level auf den Plätzen 9 und 10 im Bergwald und 1 im Meer dieselbe Haupt-Kernidee
  const ziel = ['Bergwald:9', 'Bergwald:10', 'Meer:1'].map((k) => {
    const [welt, platz] = k.split(':');
    return finde(LEVEL, 'schwer', welt, Number(platz)).name;
  });
  const anders = (name) => (ziel.includes(name) ? { ...info(name), haupt: 'Falle' } : info(name));
  const f = pruefe(LEVEL, anders, { erlaubt: ERLAUBT }).join('\n');
  assert.match(f, /schwer: Falle 3-mal auf den Plätzen \d+–\d+/);
  // die Verstösse aus «sehr schwer» gelten nicht für «schwer»
  assert.match(pruefe(LEVEL, info, { erlaubt: { schwer: ERLAUBT[GRADE[3]] } }).join('\n'), /sehr schwer: /);
});
await test('Zwei zu ähnliche Level und ein abgelehntes fallen auf', () => {
  const [a, b] = [LEVEL[0].name, LEVEL[100].name];
  const paar = [a, b].sort().join();
  const f = pruefe(LEVEL, info, { erlaubt: ERLAUBT, aehnlich: (x, y) => ([x.name, y.name].sort().join() === paar ? 0.6
    : 0) });
  assert.deepEqual(f, [`zu ähnlich: ${a} – ${b} (0.6)`]);
  const ab = pruefe(LEVEL, n => (n === a ? { ...info(n), abgelehnt: 'erfunden' } : info(n)), { erlaubt: ERLAUBT });
  assert.deepEqual(ab, [`${a}: abgelehnt (erfunden)`]);
});

console.log('Ablehnung und Bewertung an erfundenen Fällen');
const EINTRAG = alleUrteile().find(e => e.ablauf === '2' && !e.level.anker);
/** Ein Urteil wie EINTRAG, in dem A und B die genannten Begriffe der Ablehnung nennen. */
const urteil = (a, b) => ({ ...EINTRAG, urteile: { A: { ...EINTRAG.urteile.A, ablehnung: a },
  B: { ...EINTRAG.urteile.B, ablehnung: b } } });
await test('Abgelehnt: beide KI-Tester mit einem Begriff, der beim Grad gilt; Füllteil und Zerfall erst ab «mittel»; '
  + 'Ausschlussgrund; ab «mittel» unter dem Mindest-Spielwert; ein fehlendes Urteil nicht', () => {
  const p = { grad: 'mittel', spielwert: 80, ausschluesse: [], eintraege: [] };
  assert.equal(ablehnung(p), null, 'ohne Urteil');
  assert.equal(ablehnung({ ...p, eintraege: [urteil(['Knäuel'], [])] }), null, 'nur einer');
  assert.match(ablehnung({ ...p, eintraege: [urteil(['Knäuel'], ['Probieren'])] }), /beiden KI-Testern/);
  assert.match(ablehnung({ ...p, eintraege: [urteil(['Füllteil'], ['Zerfall'])] }), /beiden KI-Testern/);
  assert.equal(ablehnung({ ...p, grad: 'leicht', eintraege: [urteil(['Füllteil'], ['Zerfall'])] }), null, 'leicht');
  assert.match(ablehnung({ ...p, ausschluesse: ['Knäuel'] }), /Ausschlussgrund/);
  assert.match(ablehnung({ ...p, spielwert: MINDEST_SPIELWERT - 0.1 }), /Mindest-Spielwert/);
  assert.equal(ablehnung({ ...p, grad: 'leicht', spielwert: 20 }), null, 'leicht ohne Mindest-Spielwert');
});
await test('Bewertung: das Urteil, ohne Urteil das Mittel der Level mit dem nächsten Spielwert', () => {
  const u = (gefuehl, aha) => ({ gefuehl, aha, urteile: 1, laeufe: ['x'] });
  const levels = [
    { name: 'a', grad: 'mittel', spielwert: 70, urteil: u(5, 1) },
    { name: 'b', grad: 'mittel', spielwert: 90, urteil: u(3, 0) },
    { name: 'c', grad: 'mittel', spielwert: 71, urteil: null },
    { name: 'd', grad: 'leicht', spielwert: 71, urteil: u(1, 0) },
  ];
  const b = bewertungen(levels);
  assert.deepEqual([b[0].gefuehl, b[0].geschaetzt], [5, false]);
  assert.equal(b[2].geschaetzt, true);
  assert.equal(b[2].gefuehl, 4, 'Mittel aus a und b (nur derselbe Grad)');
});

console.log('Die Wahl an erfundenen Pools');
const IDEEN = ['Falle', 'Abschalten', 'Farben abzählen', 'Sammelstelle', 'Mischziel aus zwei Quellen'];
/** Ein erfundenes Level: Schwierigkeit, Haupt-Kernidee, Gefühl (Bewertung). */
const fl = (name, schwierigkeit, haupt, gefuehl = 4) => ({ name, schwierigkeit, haupt, spielwert: 80,
  bewertung: { gefuehl, aha: 1 }, level: null });
const keine = () => 0;
await test('anordnungen: höchstens 2 Plätze vom Rang, je Haupt-Kernidee höchstens 2-mal, die Plätze aus dem Zustand',
  () => {
  const welt = Array.from({ length: 10 }, (_, i) => fl(`w${i}`, i, null));
  const alle = anordnungen(welt);
  assert.ok(alle.every(a => a.every((r, j) => Math.abs(r - j) <= VERTAUSCHUNG)));
  assert.deepEqual(alle[0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'die erste ist die nach Rang');
  assert.equal(new Set(alle.map(a => a.join())).size, alle.length);
  // dreimal Falle in einer Welt: keine Anordnung
  assert.equal(anordnungen(welt.map((l, i) => (i < 3 ? { ...l, haupt: 'Falle' } : l))).length, 0);
  // Falle stand in der Welt davor auf den Plätzen 7 und 9: hier nicht vor 7 und 9
  const z = zustandNach(Array.from({ length: 10 }, (_, i) => ({ haupt: i === 7 || i === 9 ? 'Falle' : null })));
  assert.deepEqual(z.get('Falle'), [7, 9]);
  const mitFalle = welt.map((l, i) => (i === 8 || i === 9 ? { ...l, haupt: 'Falle' } : l));
  for (const a of anordnungen(mitFalle, z)) {
    const p = a.flatMap((r, j) => (r >= 8 ? [j] : []));
    assert.ok(p[0] >= 7 && p[1] >= 9, `Falle auf ${p}`);
  }
  assert.equal(anordnungen(welt.map((l, i) => (i === 0 ? { ...l, haupt: 'Falle' } : l)), z).length, 0,
    'Falle vom Rang 1 kann nicht auf Platz 8');
});
await test('Vielfalt vor Bewertung: Eine Welt nimmt das dritte Level derselben Haupt-Kernidee nicht, sondern das '
  + 'nächstbeste mit einer anderen, und nennt den Grund', () => {
  // die drei am besten bewerteten mit Falle, dann je zweimal vier andere, zuletzt eines ohne Haupt-Kernidee
  const kandidaten = [
    ...[0, 1, 2].map(i => fl(`f${i}`, i, 'Falle', 5)),
    ...[3, 4, 5, 6, 7, 8, 9, 10].map(i => fl(`k${i}`, i, IDEEN[1 + (i % 4)], 4)), fl('ohne', 11, null, 3),
  ];
  const r = waehleWelt(kandidaten, [new Map()], [], keine);
  assert.deepEqual(r.welt.map(l => l.name).sort(), ['f0', 'f1', 'k10', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9']);
  assert.deepEqual(r.uebergangen.map(u => [u.level.name, u.grund]),
    [['f2', 'Falle stand schon 2-mal in der Welt (f0, f1)']]);
});
await test('Ein ganzer Grad: Bei Haupt-Kernideen im Takt von 6 geht alles nach Rang auf; schlecht bewertete fallen '
  + 'weg, Abschnitte und Prüfung stimmen', () => {
  const ideen = [...IDEEN, 'Lockvogel'];
  const genau = Array.from({ length: 60 }, (_, i) => fl(`g${String(i).padStart(2, '0')}`, i, ideen[i % 6]));
  const r = waehleGrad(genau, { aehnlich: keine });
  assert.deepEqual(r.welten.flatMap(w => w.welt).map(l => l.name), genau.map(l => l.name), 'nach Rang, ohne Tausch');
  assert.deepEqual([r.verstoesse, r.verschoben], [[], []]);
  // 66 Level: je Welt eines mehr, schlecht bewertet und ohne Haupt-Kernidee; es fällt weg
  const mehr = [...genau, ...WELTEN.map((_, w) => fl(`schlecht${w}`, 10 * w + 4.5, null, 1))];
  const s = waehleGrad(mehr, { aehnlich: keine });
  const folge = s.welten.flatMap(w => w.welt);
  assert.deepEqual(folge.filter(l => l.name.startsWith('schlecht')), []);
  assert.deepEqual(fensterVerstoesse(folge), []);
  const level = s.welten.flatMap((w, k) => w.welt.map((l, j) => ({ grad: 'leicht', welt: WELTEN[k], platz: j + 1,
    name: l.name })));
  const p = new Map(mehr.map(l => [l.name, { ...l, grad: 'leicht', abgelehnt: null }]));
  assert.deepEqual(pruefe(level, n => p.get(n)).filter(f => !/^(mittel|schwer|sehr schwer)/.test(f)), []);
});
await test('Über die Weltgrenze: Wiederholt die nächste Welt die Haupt-Kernideen nicht im selben Muster, nimmt die '
  + 'Wahl schlechter bewertete Level, die passen (statt die Grenze zu verschieben)', () => {
  // Welt 1: je zweimal fünf Haupt-Kernideen in fester Folge; Welt 2: die am besten bewerteten in umgekehrter Folge,
  // die schlechter bewerteten in derselben
  const muster = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
  const w1 = muster.map((x, i) => fl(`a${i}`, i, IDEEN[x], 5));
  const gut = [...muster].reverse().map((x, i) => fl(`g${i}`, 10 + i, IDEEN[x], 5));
  const passend = muster.map((x, i) => fl(`s${i}`, 10.5 + i, IDEEN[x], 3));
  const zs = [zustandNach(w1)];
  const r = waehleWelt([...gut, ...passend], zs, w1, keine);
  assert.ok(r, 'keine Wahl');
  // waehleWelt gibt die Welt nach Rang; angeordnet wird sie erst danach
  const a = anordnungen(r.welt, zs[0])[0];
  assert.ok(a, 'keine Anordnung');
  assert.deepEqual(fensterVerstoesse([...w1, ...a.map(i => r.welt[i])]), [], 'Vielfalt über die Grenze');
  assert.ok(fensterVerstoesse([...w1, ...gut]).length > 0, 'die besser bewerteten gingen nicht');
  assert.ok(r.welt.some(l => l.name.startsWith('s')), 'nimmt passende, schlechter bewertete');
  assert.ok(r.uebergangen.some(u => /anordnen/.test(u.grund)));
});
await test('Ohne Wahl (Pool genau 60, eine Welt mit viermal derselben Haupt-Kernidee): Ränge und Vertauschungen '
  + 'halten, die Verstösse sind so wenige wie möglich und stehen im Ergebnis', () => {
  const pool = Array.from({ length: 60 }, (_, i) => fl(`q${i}`, i, i >= 20 && i < 24 ? 'Falle' : IDEEN[1 + (i % 4)]));
  const r = waehleGrad(pool, { aehnlich: keine });
  const folge = r.welten.flatMap(w => w.welt);
  assert.deepEqual(r.verstoesse, fensterVerstoesse(folge));
  assert.ok(r.verstoesse.length > 0);
  assert.ok(zuviel(r.verstoesse) <= zuviel(fensterVerstoesse([...pool].sort(nachSchwierigkeit))));
  folge.forEach((l, q) => {
    const rang = Number(l.name.slice(1));
    assert.equal(Math.floor(rang / JE_WELT), Math.floor(q / JE_WELT), `${l.name}: Welt`);
    assert.ok(Math.abs(rang - q) <= VERTAUSCHUNG, `${l.name}: Platz`);
  });
  // das Zuviel ist das kleinste: keine andere Anordnung der dritten Welt (die mit Falle) hat weniger
  const davor = folge.slice(11, 20), danach = folge.slice(30, 39);
  const welt3 = [...folge.slice(20, 30)].sort(nachSchwierigkeit);
  const kosten = (w) => zuviel(fensterVerstoesse([...davor, ...w, ...danach]));
  const best = Math.min(...anordnungen(welt3.map(l => ({ ...l, haupt: null }))).map(a => kosten(a.map(i => welt3[i]))));
  assert.equal(kosten(folge.slice(20, 30)), best);
});
/** Alle Anordnungen von n Rängen mit höchstens d Plätzen vom Rang, je als Ränge nach Platz, nach Rang geordnet. */
function alleMitVersatz(n, d) {
  const aus = [], folge = [], frei = new Array(n).fill(true);
  const rec = (p) => {
    if (p === n) { aus.push([...folge]); return; }
    for (let r = Math.max(0, p - d); r <= Math.min(n - 1, p + d); r++) {
      if (!frei[r] || (p - d >= 0 && frei[p - d] && r !== p - d)) continue;
      frei[r] = false; folge.push(r);
      rec(p + 1);
      frei[r] = true; folge.pop();
    }
  };
  rec(0);
  return aus;
}
await test('ordneUeberGrenzen (nur «sehr schwer»): gegen alle Anordnungen mit höchstens 3 Plätzen die kleinste '
  + 'Verschiebung ohne Verstoss, hier über die Weltgrenze; geht es nicht, null, und mit Verstössen das kleinste Zuviel',
  () => {
  // 12 Level, Falle auf den Rängen 1, 6 und 9: nach Rang dreimal unter den ersten 10
  const kosten = (folge, reihe) => [zuviel(fensterVerstoesse(folge)),
    folge.reduce((s, l, q) => s + Math.abs(reihe.indexOf(l) - q), 0),
    folge.filter((l, q) => reihe.indexOf(l) !== q).length];
  const vor = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const alle = alleMitVersatz(12, 3);
  const pruefeGegenAlle = (reihe, mitVerstoessen) => {
    const moeglich = alle.map(a => a.map(r => reihe[r]))
      .filter(f => mitVerstoessen || !fensterVerstoesse(f).length);
    const best = moeglich.reduce((b, f) => (!b || vor(kosten(f, reihe), kosten(b, reihe)) < 0 ? f : b), null);
    return best;
  };
  const reihe = Array.from({ length: 12 }, (_, i) => fl(`u${i}`, i, [0, 5, 8].includes(i) ? 'Falle' : null));
  const r = ordneUeberGrenzen(reihe, 3);
  assert.deepEqual(r.map(l => l.name), pruefeGegenAlle(reihe, false).map(l => l.name));
  // Rang 9 (Falle) und Rang 11 tauschen: Summe 4 wie bei [… 9, 10, 8, 11], aber nur 2 verschoben
  assert.deepEqual(r.map(l => reihe.indexOf(l)), [0, 1, 2, 3, 4, 5, 6, 7, 10, 9, 8, 11], 'Rang 9 auf Platz 11');
  assert.deepEqual(fensterVerstoesse(r), []);
  // dreimal Falle auf den Rängen 1–3: Mit 3 Plätzen kommt keine aus den ersten 10
  const eng = Array.from({ length: 12 }, (_, i) => fl(`e${i}`, i, i < 3 ? 'Falle' : null));
  assert.equal(ordneUeberGrenzen(eng, 3), null);
  const mit = ordneUeberGrenzen(eng, 3, { mitVerstoessen: true });
  assert.deepEqual(kosten(mit, eng), kosten(pruefeGegenAlle(eng, true), eng));
  assert.equal(zuviel(fensterVerstoesse(mit)), 1);
});

console.log('Die Wahl im Spiel (Ticket 04)');
const IM_SPIEL = L.LEVELS.slice(L.TUTORIAL_COUNT);
await test('index.html enthält das Tutorial und genau die 240 Level der Wahl, jedes mit dem Titel aus wahl.json, in '
  + 'der Reihenfolge der Reihe; die übrigen flachen und alle Würfel-Level liegen im Vorrat, ohne Titel', () => {
  assert.equal(L.TUTORIAL_COUNT, 9);
  assert.deepEqual(L.LEVELS.slice(0, L.TUTORIAL_COUNT).filter(l => !l.tutorial).map(l => l.name), []);
  assert.deepEqual(IM_SPIEL.map(l => l.name).sort(), LEVEL.map(l => l.name).sort());
  const titel = new Map(LEVEL.map(l => [l.name, l.titel]));
  assert.deepEqual(IM_SPIEL.filter(l => l.titel !== titel.get(l.name)).map(l => `${l.name}: ${l.titel}`), []);
  // nicht umgeordnet: dieselbe Folge wie in der ganzen Reihe aus Spiel und Vorrat (Lader)
  const reihe = ALLE.LEVELS.slice(ALLE.TUTORIAL_COUNT).map(l => l.name).filter(x => titel.has(x));
  assert.deepEqual(IM_SPIEL.map(l => l.name), reihe);
  assert.equal(L.LEVELS_3D.length, 0, 'keine Würfel-Level im Spiel');
  assert.equal(VORRAT.wuerfel.length, ALLE.LEVELS_3D.length);
  assert.equal(VORRAT.flach.length + IM_SPIEL.length, ALLE.LEVELS.length - ALLE.TUTORIAL_COUNT);
  assert.deepEqual([...VORRAT.flach, ...VORRAT.wuerfel].filter(l => 'titel' in l).map(l => l.name), []);
});
await test('Der Datenblock der Geschichte (STORY_LEVELS) nennt je Grad die 6 Welten mit ihren 10 Leveln wie wahl.json, '
  + 'jedes im Spiel mit seinem Grad; höchstens 120 Zeichen je Zeile', () => {
  const reise = reiseAus(DATEN);
  assert.deepEqual(L.STORY_LEVELS, reise);
  assert.deepEqual(reiseImSpiel(readFileSync(new URL('../index.html', import.meta.url), 'utf8')), reise);
  const grad = new Map(IM_SPIEL.map(l => [l.name, l.grad]));
  for (const g of GRADE) {
    assert.deepEqual(reise[g].map(w => w.length), WELTEN.map(() => JE_WELT), g);
    assert.deepEqual(reise[g].flat().filter(x => grad.get(x) !== g), [], `${g}: Grad`);
  }
  assert.deepEqual(blockZeilen(reise).filter(z => [...z].length > 120), []);
  // Gegenprobe: ein Platz doppelt bzw. leer fällt auf
  const doppelt = structuredClone(DATEN);
  doppelt.level[1].platz = doppelt.level[0].platz;
  assert.throws(() => reiseAus(doppelt), /passt nicht in die Reise/);
});
await test('geschichte.mjs spiel: ein zweiter Lauf ändert nichts; an Kopien der Texte kommt ein Level der Wahl aus '
  + 'dem Vorrat zurück, ein anderes geht hin (ohne Titel), danach wieder byte-gleich; ohne ein Level bricht es ab',
() => {
  const texte = lese();
  assert.deepEqual(insSpiel(texte, DATEN).schritte, [], 'nichts zu tun');
  // ein Level der Wahl liegt im Vorrat, ein übriges flaches und ein Würfel-Level stehen im Spiel, eines mit Titel; je
  // das letzte im Vorrat, denn Ablegen hängt hinten an (so ist der Vorrat danach wieder byte-gleich)
  const story = LEVEL[17].name, uebrig = VORRAT.flach.at(-1).name, wuerfel = VORRAT.wuerfel.at(-1).name;
  let t = ablegen(texte, [story]);
  t = zurueckholen(t, [uebrig, wuerfel]);
  t = { ...t, spiel: t.spiel.replace(`name: '${uebrig}', `, `name: '${uebrig}', titel: 'Irrweg', `) };
  const r = insSpiel(t, DATEN);
  assert.deepEqual(r.schritte.map(s => s.was), ['zurückholen', 'ablegen']);
  assert.deepEqual([r.holen, r.weg], [[story], { flach: [uebrig], wuerfel: [wuerfel] }]);
  const ende = r.schritte.at(-1).texte;
  for (const k of ['spiel', 'flach', 'wuerfel']) assert.ok(ende[k] === texte[k], `${k} byte-gleich`);
  assert.ok(namenImSpiel(ende.spiel, 'flach').includes(story));
  // ein Level der Wahl, das es nicht gibt
  const fremd = structuredClone(DATEN);
  fremd.level[0].name = 'Gibt es nicht';
  assert.throws(() => insSpiel(texte, fremd), /Weder im Spiel noch im Vorrat[^]*Gibt es nicht/);
});
