// Tests des Generators (Spec „Entscheide zu den Tests“, Nahtstelle 4; Ticket 18): ein Auftrag hinein, ein Level oder
// nichts heraus. Geprüft wird nur, was herauskommt, mit festen Seeds:
// - Aufträge aller vier Grade, ohne Kernidee und mit Mischziel, dazu zwei Ziel-Schwierigkeiten (Ticket 20).
// - Derselbe Auftrag ergibt dasselbe Level, auch nach anderen Aufträgen.
// - Jedes gelieferte Level hat genau eine Lösung, besteht die Beurteilung (hier neu beurteilt), hat den verlangten Grad
//   und die verlangte Kernidee nötig; die mitgegebene Beurteilung ist genau diese. Es hat Leveldaten wie in LEVELS und
//   eine Startstellung, die nicht gelöst ist.
// - Je Kernidee (Ticket 19) ein Auftrag in „leicht“ über 50 Seeds und ein fester Seed, der ein Level mit ihr liefert.
// - Je Grad ab „mittel“ und je Kernidee ein Auftrag (Ticket 28), je mit einem festen Seed, der ein Level liefert, in
//   dem sie die Haupt-Kernidee ist (bis auf den Lockvogel in „sehr schwer“, siehe FEST_AB_MITTEL).
// - Jedes gelieferte Level hat so viele Quellen, wie die Vorgabe seines Grads verlangt; darunter verwirft der Generator
//   (Ticket 29, am Beispiel ZU_WENIGE_QUELLEN mit Gegenprobe genau an der Untergrenze). „leicht“ (Untergrenze 1)
//   liefert weiter Level mit einer Quelle.
// - Keine wirkungslosen Elemente (Spec „Generator“): kein Filter, dessen Strahl schon seine Farbe hat, kein fester
//   Spiegel und kein Blocker, der weder für die Lösung zählt noch als Lockvogel wirkt; die Gegenprobe an handgebauten
//   Leveln zeigt, dass die Prüfung solche Elemente findet.
// - Der Generator kennt das Feld nur über die Feldform (Suche im Quelltext), läuft nur gedeckelt und weist Aufträge ab,
//   die er nicht kennt.
// Aufruf: sh tools/leise.sh node tests/generator.test.mjs   (nur über leise.sh: Der Generator prüft den Deckel)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { L, solve, period, setRot, clicksTo, litCells, keyOf } from '../tools/solver.mjs';
import { beurteile, TEILE } from '../tools/beurteilung/index.mjs';
import { feldformVon } from '../tools/beurteilung/feldform.mjs';
import { gradVon } from '../tools/beurteilung/grad.mjs';
import { ANTEIL } from '../tools/beurteilung/kernideen/lockvogel.mjs';
import { GRUENDE } from '../tools/levelliste.mjs';
import { generiere } from '../tools/generator/index.mjs';
import { VORGABEN } from '../tools/generator/vorgaben.mjs';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const feldform = feldformVon({});
const MISCHZIEL = 'Mischziel aus zwei Quellen';
const LEICHT_33_43 = [33, 43]; // Ziel-Schwierigkeit wie die zu ersetzenden leichten Level (Ticket 23)
const LEICHT_20_30 = [20, 30]; // Ziel mitten im Grad: auch „über dem Ziel“ macht er leichter (Review Ticket 20)
/**
 * FEST: je Kernidee ein fester Seed, der in „leicht“ ein Level liefert (Ticket 19). ANTEIL_LEVEL: welcher Anteil der 50
 * Seeds in „leicht“ ein Level liefern muss; „ohne“ (Schlüssel null) und Mischziel wie seit Ticket 18 mindestens zwei
 * Drittel, die übrigen Kernideen mindestens die Hälfte (gemessen: Falle und Farben abzählen rund 60–65 %, die übrigen
 * rund 80–85 %).
 */
const FEST = {
  'Mischziel aus zwei Quellen': 3, Abschalten: 1, 'Farben abzählen': 1, Sammelstelle: 2, Falle: 1, Lockvogel: 1,
};
const ANTEIL_LEVEL = { null: 2 / 3, 'Mischziel aus zwei Quellen': 2 / 3 };
/**
 * FEST_AB_MITTEL (Ticket 28): je Grad ab „mittel“ und Kernidee ein fester Seed, der ein Level liefert, in dem die
 * verlangte Kernidee die Haupt-Kernidee ist (nach der Rangfolge der Beurteilung). Für „sehr schwer“ fehlt der
 * Lockvogel: Er liefert dort nichts (Ticket 28, Ausbeute), der Bedarf für 24–26 ist ohne ihn gedeckt. Das Mischziel
 * liegt in den Seeds seiner Aufträge unten.
 */
const FEST_AB_MITTEL = {
  mittel: { [MISCHZIEL]: 6, Abschalten: 1, 'Farben abzählen': 3, Sammelstelle: 1, Falle: 3, Lockvogel: 4 },
  schwer: { [MISCHZIEL]: 10, Abschalten: 3, 'Farben abzählen': 5, Sammelstelle: 12, Falle: 26, Lockvogel: 20 },
  'sehr schwer': { [MISCHZIEL]: 12, Abschalten: 22, 'Farben abzählen': 2, Sammelstelle: 53, Falle: 28 },
};
/**
 * ZU_WENIGE_QUELLEN (Ticket 29): Bis Ticket 29 lieferte dieser Auftrag ein Level mit einer einzigen Quelle
 * (Schwierigkeit 43,3, Haupt-Kernidee Falle; das Festigen nahm die zweite als wirkungslos weg). Unter der Untergrenze
 * der Vorgabe (quellen[0]) verwirft der Generator jetzt das fertige Level. Gegenprobe: der feste Seed desselben
 * Auftrags (FEST_AB_MITTEL) liefert weiter, mit genau quellen[0] Quellen.
 */
const ZU_WENIGE_QUELLEN = { grad: 'mittel', kernidee: 'Falle', seed: 278 };
/**
 * Aufträge mit festen Seeds (seeds: 1 … seeds oder eine Liste) und so vielen gelieferten Leveln mindestens:
 * - „leicht“ ohne Kernidee und mit jeder Kernidee über 50 Seeds (Ticket 19), mindestens ANTEIL_LEVEL davon;
 * - „leicht“ mit zwei Ziel-Schwierigkeiten und die Grade ab „mittel“ ohne Kernidee und mit Mischziel (Ticket 20). Ab
 *   „mittel“ sind es weniger Seeds, weil jeder mehr kostet (sehr schwer rund 1 CPU-s), und die Ausbeute ist kleiner;
 *   ohne Kernidee liefert der Generator ab „mittel“ nur, wenn eine Kernidee nebenbei nötig wird.
 * - ab „mittel“ jede übrige Kernidee mit ihrem festen Seed aus FEST_AB_MITTEL (Ticket 28); der Lockvogel in „sehr
 *   schwer“ mit Seed 1 und ohne verlangtes Level.
 * - der Seed unter der Untergrenze der Quellen, ZU_WENIGE_QUELLEN (Ticket 29), ohne verlangtes Level.
 */
const AUFTRAEGE = [
  ...[null, ...TEILE.kernideen].map(kernidee => ({
    grad: 'leicht', kernidee, seeds: 50, mindestens: Math.ceil((ANTEIL_LEVEL[kernidee] ?? 1 / 2) * 50),
  })),
  { grad: 'leicht', kernidee: null, schwierigkeit: LEICHT_33_43, seeds: 30, mindestens: 5 },
  { grad: 'leicht', kernidee: null, schwierigkeit: LEICHT_20_30, seeds: 30, mindestens: 5 },
  { grad: 'mittel', kernidee: null, seeds: 30, mindestens: 1 },
  { grad: 'mittel', kernidee: MISCHZIEL, seeds: 30, mindestens: 8 },
  { grad: 'schwer', kernidee: null, seeds: 30, mindestens: 1 },
  { grad: 'schwer', kernidee: MISCHZIEL, seeds: 30, mindestens: 3 },
  { grad: 'sehr schwer', kernidee: null, seeds: 20, mindestens: 1 },
  { grad: 'sehr schwer', kernidee: MISCHZIEL, seeds: 12, mindestens: 1 },
  ...Object.entries(FEST_AB_MITTEL).flatMap(([grad, fest]) => TEILE.kernideen.filter(k => k !== MISCHZIEL)
    .map(kernidee => ({ grad, kernidee, seeds: [fest[kernidee] ?? 1], mindestens: kernidee in fest ? 1 : 0 }))),
  { grad: ZU_WENIGE_QUELLEN.grad, kernidee: ZU_WENIGE_QUELLEN.kernidee, seeds: [ZU_WENIGE_QUELLEN.seed],
    mindestens: 0 },
];
const auftragVon = ({ grad, kernidee, schwierigkeit }) => ({ grad, kernidee, ...(schwierigkeit ? { schwierigkeit } : {}) });
const seedsVon = (a) => (Array.isArray(a.seeds) ? a.seeds : Array.from({ length: a.seeds }, (_, i) => i + 1));
const t0 = Date.now();
const laeufe = AUFTRAEGE.map(a => ({
  ...a, ergebnisse: seedsVon(a).map(seed => ({ seed, ...generiere({ ...auftragVon(a), seed, feldform }) })),
}));
const benenne = ({ grad, kernidee, schwierigkeit }) => `${grad}${kernidee ? ' mit ' + kernidee : ''}`
  + `${schwierigkeit ? ` (${schwierigkeit.join('–')})` : ''}`;
const geliefert = laeufe.flatMap(a => a.ergebnisse.filter(r => r.level)
  .map(r => ({ grad: a.grad, kernidee: a.kernidee, schwierigkeit: a.schwierigkeit, ...r,
    name: `${benenne(a)}, Seed ${r.seed}` })));
console.log(`Generator: ${geliefert.length} Level aus ${laeufe.reduce((s, a) => s + a.ergebnisse.length, 0)} Aufträgen `
  + `(${((Date.now() - t0) / 1000).toFixed(1)} s): `
  + laeufe.map(a => `${benenne(a)} ${a.ergebnisse.filter(r => r.level).length}/${a.ergebnisse.length}`).join(', '));

/** Brett der Strahlregel in der Lösungsstellung, mit den Elementen elemente (Vorgabe: die des Levels). */
function inLoesung(level, elemente = level.elements) {
  const brett = L.createBoard({ ...level, elements: elemente });
  for (const el of brett.elements) {
    if (L.isRotatable(el) && keyOf(el) in level.solution) setRot(el, level.solution[keyOf(el)]);
  }
  return brett;
}
/** Licht der Ziele in der Lösungsstellung, nach Zelle. */
const zielLicht = (level, elemente) => {
  const brett = inLoesung(level, elemente), { hits } = L.traceBeams(brett);
  return Object.fromEntries(brett.elements.filter(e => e.type === 'target').map(t => [keyOf(t), hits.get(t.id) || 0]));
};

/** Filter, deren Strahl in der Lösung schon die Filterfarbe hat (sie nehmen keinem Strahl eine Farbe), als Zellen. */
function filterOhneWirkung(level) {
  return level.elements.filter(e => e.type === 'filter').filter((f) => {
    // Was ankommt: in der Lösung mit einem weissen Filter an seiner Stelle (er lässt alles durch)
    const offen = level.elements.map(e => (e === f ? { ...e, color: 'white' } : e));
    const ein = L.traceBeams(inLoesung(level, offen)).events
      .filter(e => e.kind === 'filter' && Math.round(e.x) === f.x && Math.round(e.z) === f.z).map(e => e.color);
    return ein.every(c => (c & L.COLORS[f.color]) === c);
  }).map(keyOf);
}

/**
 * Feste Spiegel (oder mit art die Blocker), die weder für die Lösung zählen noch als Lockvogel wirken, als Zellen. Für
 * die Lösung zählt einer, wenn ohne ihn ein Ziel in der Lösung anderes Licht bekommt oder das Level eine zweite Lösung
 * hätte. Als Lockvogel wirkt einer, der in der Lösung kein Licht bekommt, aber in mindestens ANTEIL der Strahlbilder
 * der Suche ohne Abschneiden (wie der Lockvogel der Beurteilung).
 */
function festeOhneWirkung(level, art = e => e.type === 'mirror' && e.fixed) {
  const brett = inLoesung(level), imLicht = litCells(L.traceBeams(brett), brett);
  return level.elements.filter(art).filter((m) => {
    const ohne = level.elements.filter(e => e !== m);
    if (!isDeepStrictEqual(zielLicht(level, ohne), zielLicht(level))) return false;
    const r = solve({ ...level, elements: ohne }, { unique: true, collect: 0 });
    if (r.aborted || r.count > 1) return false;
    if (imLicht.has(keyOf(m))) return true;
    let licht = 0, blaetter = 0;
    const zaehle = (res, b) => { blaetter++; if (litCells(res, b).has(keyOf(m))) licht++; };
    solve(level, { prune: false, collect: 0, onLeaf: zaehle });
    return licht < ANTEIL * blaetter;
  }).map(keyOf);
}

console.log('Ein Auftrag, ein Level oder nichts');
// Ab „mittel“ wiederholt der Test nur die ersten WIEDERHOLEN Seeds je Auftrag und dazu den ersten mit Level (so ist in
// jedem Auftrag ein Level dabei): Ein Seed kostet dort bis über 1 CPU-s, und alle zu wiederholen verdoppelte die
// Laufzeit (Review Ticket 20). „leicht“ wiederholt alle Seeds.
const WIEDERHOLEN = 5;
test('Derselbe Auftrag mit demselben Seed ergibt dasselbe Level, auch nach anderen Aufträgen (umgekehrt)', () => {
  for (const a of [...laeufe].reverse()) {
    const erstes = a.ergebnisse.find(r => r.level);
    const teil = a.grad === 'leicht' ? a.ergebnisse : a.ergebnisse.filter((r, i) => i < WIEDERHOLEN || r === erstes);
    for (const r of [...teil].reverse()) {
      const nochmal = generiere({ ...auftragVon(a), seed: r.seed, feldform });
      const vorher = { level: r.level, ...(r.level ? { beurteilung: r.beurteilung } : { grund: r.grund }) };
      assert.deepStrictEqual(nochmal, vorher, `${benenne(a)}, Seed ${r.seed}`);
    }
  }
});

test('Er liefert Level in allen Graden, ohne Kernidee und mit Kernidee („leicht“ mit jeder, für viele Seeds)', () => {
  for (const a of laeufe) {
    const n = a.ergebnisse.filter(r => r.level).length;
    assert.ok(n >= a.mindestens, `${benenne(a)}: nur ${n} von ${a.ergebnisse.length}, verlangt ${a.mindestens}`);
  }
});

test('Ab „mittel“ hat jedes gelieferte Level eine nötige Kernidee, auch ohne verlangte', () => {
  const ab = geliefert.filter(g => g.grad !== 'leicht');
  assert.ok(ab.length >= 15, `nur ${ab.length} Level ab „mittel“`);
  for (const { name, beurteilung } of ab) assert.ok(beurteilung.hauptKernidee.begriff, name);
});

test('Mit Ziel-Schwierigkeit liegt jedes gelieferte Level darin', () => {
  const mit = geliefert.filter(g => g.schwierigkeit);
  assert.ok(mit.length > 0);
  for (const { name, schwierigkeit: [von, bis], beurteilung } of mit) {
    const w = beurteilung.schwierigkeit.wert;
    assert.ok(w >= von && w <= bis, `${name}: Schwierigkeit ${w}`);
  }
});

test('Ohne Level nennt er den Grund', () => {
  for (const { ergebnisse } of laeufe) {
    for (const r of ergebnisse.filter(e => !e.level)) {
      assert.ok(typeof r.grund === 'string' && r.grund, `Seed ${r.seed}`);
    }
  }
});

console.log('Die vier Bedingungen');
test('Jedes gelieferte Level hat genau eine Lösung (Löser im Modus unique), und es ist die notierte', () => {
  const norm = (level, set) => Object.fromEntries(Object.entries(set).map(([k, v]) => {
    const el = level.elements.find(e => keyOf(e) === k);
    return [k, v % period(el)];
  }));
  for (const { name, level } of geliefert) {
    const r = solve(level, { unique: true, collect: 2 });
    assert.equal(r.aborted, false, `${name}: Suche abgebrochen`);
    assert.equal(r.count, 1, `${name}: ${r.count} Lösungen`);
    assert.deepEqual(norm(level, r.solutions[0].set), norm(level, level.solution), name);
  }
});

// Unabhängig vom Generator neu beurteilt, mit dem verlangten Grad
const beurteilt = geliefert.map(g => ({ ...g, neu: beurteile(g.level, { grad: g.grad }) }));

test('Jedes gelieferte Level besteht die Beurteilung: kein Ausschlussgrund, keiner der Gründe der Levelliste', () => {
  for (const { name, grad, neu } of beurteilt) {
    assert.deepEqual(neu.ausschluesse.map(a => a.begriff), [], name);
    assert.deepEqual(Object.values(GRUENDE).filter(r => r.gilt(neu, grad)).map(r => r.text), [], name);
  }
});

test('Jedes gelieferte Level hat den verlangten Grad, nach der Schwierigkeit (grad.mjs) und im Feld grad', () => {
  for (const { name, grad, level, neu } of beurteilt) {
    assert.equal(gradVon(neu.schwierigkeit.wert), grad, `${name}: Schwierigkeit ${neu.schwierigkeit.wert}`);
    assert.equal(level.grad, grad, name);
  }
});

test('In jedem gelieferten Level ist die verlangte Kernidee laut Beurteilung nötig', () => {
  const mit = beurteilt.filter(g => g.kernidee);
  assert.ok(mit.length > 0);
  for (const { name, kernidee, neu } of mit) assert.ok(neu.kernideen.some(k => k.begriff === kernidee), name);
});

console.log('Quellen nach der Vorgabe des Grads (Ticket 28 und 29)');
const quellenVon = (level) => level.elements.filter(e => e.type === 'source').length;
test('Jedes gelieferte Level hat so viele Quellen, wie die Vorgabe seines Grads verlangt (beide Grenzen); „leicht“ '
  + 'liefert weiter Level mit einer Quelle', () => {
  for (const { name, grad, level } of geliefert) {
    const n = quellenVon(level), [min, max] = VORGABEN[grad].quellen;
    assert.ok(n >= min && n <= max, `${name}: ${n} Quellen, Vorgabe ${min}–${max}`);
  }
  // Randfall: In „leicht“ ist die Untergrenze 1, dort verwirft er nichts (Ticket 29)
  const [min] = VORGABEN.leicht.quellen;
  assert.ok(geliefert.some(g => g.grad === 'leicht' && quellenVon(g.level) === min), `kein leichtes Level mit ${min}`);
});

const { grad: zwGrad, kernidee: zwKernidee, seed: zwSeed } = ZU_WENIGE_QUELLEN;
test(`Unter der Untergrenze verwirft er: ${zwGrad} mit ${zwKernidee}, Seed ${zwSeed} liefert kein Level, Grund `
  + `„zu wenige Quellen“; Gegenprobe: Seed ${FEST_AB_MITTEL[zwGrad][zwKernidee]} desselben Auftrags liefert, genau `
  + 'an der Untergrenze', () => {
  const lauf = laeufe.find(a => a.grad === zwGrad && a.kernidee === zwKernidee && !a.schwierigkeit
    && seedsVon(a).includes(zwSeed));
  const r = lauf.ergebnisse.find(e => e.seed === zwSeed);
  assert.equal(r.level, null, `Seed ${zwSeed} liefert ein Level mit ${r.level && quellenVon(r.level)} Quellen`);
  assert.equal(r.grund, 'zu wenige Quellen');
  const fest = FEST_AB_MITTEL[zwGrad][zwKernidee];
  const g = geliefert.find(b => b.grad === zwGrad && b.kernidee === zwKernidee && !b.schwierigkeit && b.seed === fest);
  assert.ok(g, `Seed ${fest} liefert kein Level`);
  assert.equal(quellenVon(g.level), VORGABEN[zwGrad].quellen[0], `${g.name}: nicht genau an der Untergrenze`);
});

console.log('Je Kernidee ein Level mit festem Seed (Ticket 19)');
for (const kernidee of TEILE.kernideen) {
  const seed = FEST[kernidee];
  test(`${kernidee}: Seed ${seed} liefert ein leichtes Level, in dem die Beurteilung sie nötig findet`, () => {
    const g = beurteilt.find(b => b.grad === 'leicht' && !b.schwierigkeit && b.kernidee === kernidee && b.seed === seed);
    assert.ok(g, `Seed ${seed} liefert kein Level`);
    const fund = g.neu.kernideen.find(k => k.begriff === kernidee);
    assert.ok(fund && fund.begruendung, `${g.name}: ${kernidee} nicht nötig`);
    assert.equal(gradVon(g.neu.schwierigkeit.wert), 'leicht', g.name);
  });
}

console.log('Ab „mittel“ je Grad und Kernidee ein Level mit ihr als Haupt-Kernidee (Ticket 28)');
for (const [grad, fest] of Object.entries(FEST_AB_MITTEL)) {
  test(`${grad}: der feste Seed je Kernidee liefert ein Level, in dem sie die Haupt-Kernidee ist`
    + ` (${Object.entries(fest).map(([k, s]) => `${k} ${s}`).join(', ')})`, () => {
    for (const [kernidee, seed] of Object.entries(fest)) {
      const g = beurteilt.find(b => b.grad === grad && !b.schwierigkeit && b.kernidee === kernidee && b.seed === seed);
      assert.ok(g, `${grad} mit ${kernidee}: Seed ${seed} liefert kein Level`);
      assert.equal(g.neu.hauptKernidee.begriff, kernidee, g.name);
      assert.equal(gradVon(g.neu.schwierigkeit.wert), grad, g.name);
    }
  });
}

test('Die mitgegebene Beurteilung ist genau die des gelieferten Levels mit dem verlangten Grad', () => {
  for (const { name, beurteilung, neu } of beurteilt) assert.ok(isDeepStrictEqual(beurteilung, neu), name);
});

console.log('Leveldaten');
test('Leveldaten wie in LEVELS: Name, Grad, Elemente im Feld, die Lösung nennt genau die drehbaren Elemente', () => {
  for (const { name, level, grad } of geliefert) {
    assert.deepEqual(Object.keys(level), ['name', 'grad', 'elements', 'solution'], name);
    assert.deepEqual([level.name, level.grad], ['', grad], name);
    const brett = L.createBoard(level); // wirft bei Elementen ausserhalb, doppelt belegten Zellen, unbekannten Farben
    const drehbar = brett.elements.filter(L.isRotatable).map(keyOf).sort();
    assert.deepEqual(drehbar, Object.keys(level.solution).sort(), name);
    assert.ok(L.traceBeams(inLoesung(level)).solved, `${name}: Lösung löst nicht`);
  }
});

test('Startstellung: nicht gelöst, höchstens ein Ziel leuchtet (bei einem keines), genug Klicks (Vorgabe)', () => {
  for (const { name, level, grad } of geliefert) {
    const r = L.traceBeams(L.createBoard(level)), ziele = level.elements.filter(e => e.type === 'target').length;
    assert.equal(r.solved, false, name);
    assert.ok(r.satisfied.size <= (ziele > 1 ? 1 : 0), `${name}: ${r.satisfied.size} Ziele leuchten`);
    assert.ok(clicksTo(level, level.solution) >= VORGABEN[grad].klicks, name);
  }
});

console.log('Keine wirkungslosen Elemente');
test('Gegenprobe: Die Prüfung findet Filter, deren Strahl schon ihre Farbe hat, und feste Teile ohne Wirkung', () => {
  const level = {
    name: 'Gegenprobe', elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'filter', x: 2, z: 3, color: 'yellow' }, // Rot durch einen Gelbfilter bleibt Rot: ohne Wirkung
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'filter', x: 5, z: 0, color: 'cyan' }, // Weiss durch einen Cyanfilter wird Cyan: wirkt
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true }, // auf dem Weg zum Ziel (0,1): zählt
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true }, // im Licht, lenkt es nur aus dem Feld: ohne Wirkung
      { type: 'mirror', x: 6, z: 6, rot: 1, fixed: true }, // abseits, bekommt nie Licht: kein Lockvogel
      { type: 'blocker', x: 6, z: 2 }, // ebenso
    ],
    solution: { '4,3': 1, '2,0': 3 },
  };
  assert.ok(L.traceBeams(inLoesung(level)).solved, 'das handgebaute Level ist in seiner Lösung gelöst');
  assert.equal(solve(level, { unique: true }).count, 1, 'das handgebaute Level ist eindeutig');
  assert.deepEqual(filterOhneWirkung(level), ['2,3']);
  assert.deepEqual(festeOhneWirkung(level), ['5,5', '6,6']);
  assert.deepEqual(festeOhneWirkung(level, e => e.type === 'blocker'), ['6,2']);
});

test('Kein geliefertes Level hat einen Filter, dessen Strahl schon die Filterfarbe hat', () => {
  const mit = geliefert.filter(g => g.level.elements.some(e => e.type === 'filter'));
  assert.ok(mit.length >= 3, `nur ${mit.length} Level mit Filter geprüft`);
  for (const { name, level } of geliefert) assert.deepEqual(filterOhneWirkung(level), [], name);
});

test('Kein geliefertes Level hat einen festen Spiegel, der weder für die Lösung zählt noch als Lockvogel wirkt', () => {
  const mit = geliefert.filter(g => g.level.elements.some(e => e.type === 'mirror' && e.fixed));
  assert.ok(mit.length >= 3, `nur ${mit.length} Level mit festem Spiegel geprüft`);
  for (const { name, level } of geliefert) assert.deepEqual(festeOhneWirkung(level), [], name);
});

test('Ebenso keinen Blocker ohne Wirkung (der Lockvogel-Baustein setzt auch Blocker, Ticket 19)', () => {
  const blocker = e => e.type === 'blocker';
  const mit = geliefert.filter(g => g.level.elements.some(blocker));
  assert.ok(mit.length >= 3, `nur ${mit.length} Level mit Blocker geprüft`);
  assert.ok(mit.some(g => g.kernidee === 'Lockvogel'), 'kein Lockvogel-Level mit Blocker geprüft');
  for (const { name, level } of mit) assert.deepEqual(festeOhneWirkung(level, blocker), [], name);
});

console.log('Nahtstellen');
test('Der Generator kennt das Feld nur über die Feldform: keine Koordinaten und keine Richtungen im Quelltext', () => {
  const dir = new URL('../tools/generator/', import.meta.url);
  const dateien = readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.mjs'));
  assert.ok(dateien.length >= 5);
  // Auch y (die Ebene im Würfel), axis (seine Drehachse in den Leveldaten) und die Namen der Drehachsen wie 'x'
  // (Ticket 22): Drehachsen kommen aus der Feldform (drehachsen, element)
  const verboten = [/\.[xyz]\b/, /\b[xyz]\s*:/, /\baxis\b/, /['"`][xyz]['"`]/, /\bDIRS\b/,
    /reflectOnMirror|refractInPrism|unitDir/, /split\(','\)/, /\.(rot|dir)\b/, /%\s*8\b/];
  for (const f of dateien) {
    const quelltext = readFileSync(new URL(f.replace(/\\/g, '/'), dir), 'utf8');
    const code = quelltext.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // ohne Kommentare
    for (const muster of verboten) assert.ok(!muster.test(code), `${f}: ${muster}`);
  }
});

test('Unbekannte Aufträge weist er ab: unbekannter Grad, unbekannte Kernidee, ohne Seed oder Feldform, Ziel '
  + 'ausserhalb des Grads; jeder Grad hat eine Vorgabe', () => {
  const auftrag = { grad: 'leicht', kernidee: null, seed: 1, feldform };
  for (const grad of ['leicht', 'mittel', 'schwer', 'sehr schwer']) assert.ok(VORGABEN[grad], grad);
  // Die Ziel-Schwierigkeit muss den Grad überschneiden („leicht“ bis unter 43, „sehr schwer“ ab 87)
  for (const schwierigkeit of [[50, 60], [43, 50], [40, 30], [33], 'leicht']) {
    assert.throws(() => generiere({ ...auftrag, schwierigkeit }), /Ziel-Schwierigkeit/);
  }
  assert.throws(() => generiere({ ...auftrag, grad: 'sehr schwer', schwierigkeit: [60, 86.9] }), /Ziel-Schwierigkeit/);
  assert.doesNotThrow(() => generiere({ ...auftrag, schwierigkeit: [42, 50] }));
  assert.throws(() => generiere({ ...auftrag, grad: 'mittelschwer' }), /unbekannter Grad/);
  assert.throws(() => generiere({ ...auftrag, kernidee: 'Muster' }), /unbekannte Kernidee/);
  assert.throws(() => generiere({ ...auftrag, seed: 1.5 }), /Seed/);
  assert.throws(() => generiere({ ...auftrag, feldform: undefined }), /Feldform/);
});

test('Er läuft nur gedeckelt: über LEISE_CPU 50 bricht er ab, mit LEISE_MAX_CPU erst über dieser Grenze', () => {
  const code = `import { generiere } from './tools/generator/index.mjs';
    import { feldformVon } from './tools/beurteilung/feldform.mjs';
    generiere({ grad: 'leicht', kernidee: null, seed: 1, feldform: feldformVon({}) });`;
  const lauf = (werte) => {
    const env = { ...process.env, ...werte };
    for (const [k, v] of Object.entries(werte)) if (v === undefined) delete env[k];
    return spawnSync(process.execPath, ['--input-type=module', '-e', code],
      { cwd: new URL('..', import.meta.url), env, encoding: 'utf8' });
  };
  const ohne = lauf({ LEISE_MAX_CPU: undefined, LEISE_CPU: '55' }); // Standard 50, auch wenn der Rechner mehr erlaubt
  assert.notEqual(ohne.status, 0);
  assert.match(ohne.stderr, /gedeckelte Umgebung/);
  const erlaubt = lauf({ LEISE_MAX_CPU: '65', LEISE_CPU: '65' });
  assert.equal(erlaubt.status, 0, erlaubt.stderr);
  const darueber = lauf({ LEISE_MAX_CPU: '65', LEISE_CPU: '70' });
  assert.notEqual(darueber.status, 0);
  assert.match(darueber.stderr, /gedeckelte Umgebung/);
});
