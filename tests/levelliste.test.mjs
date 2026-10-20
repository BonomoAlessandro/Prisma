// Tests der Levelliste (Spec „Entscheide zu den Tests“, Nahtstelle 3; Tickets 15–17 und 23–26): die 150 Level im
// Spiel, ihre Reihenfolge samt den Urteilen der KI-Tester, ihre Grade und die Duldungsliste (tools/levelliste.json).
// Sie ersetzen die Tests zu Markierung, gehärteten Leveln, Härte-Abnahme und Auswahlliste. Die Regeln stehen in
// tools/levelliste.mjs, gemeinsam mit tools/ordne-level.mjs, das Reihenfolge, Grade, Duldungsliste und Prüfliste
// schreibt. Dazu die Daten der Anzeige der Grade in index.html (Punkte, Text und Seitentitel; Ticket 17), seit
// Ticket 21 die Namen gegenüber der heutigen Reihenfolge und die fremde Filterfarbe (vorher in tests/logic.test.mjs)
// und der Austausch (Tickets 23–26): neue Level nach der Formel und mit Urteil der KI-Tester, entfernte Level samt
// Namen und fester Kopie für die Eichung, die Leveldaten als Text (tools/leveldaten.mjs); seit Ticket 24 die Gruppe
// „behalten nach Urteil der KI-Tester“ mit der Regel stark (in „schwer“ seit Ticket 25).
// Beurteilt werden die 150 einmal mit allen Regeln und ihrem Grad, auf den Threads von tools/beurteilung/parallel.mjs.
// Aufruf: node tests/levelliste.test.mjs   (über leise.sh etwa 25 s)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { L, solve, period, setRot, keyOf } from '../tools/solver.mjs';
import { GRADE } from '../tools/beurteilung/index.mjs';
import { beurteileAlle } from '../tools/beurteilung/parallel.mjs';
import { HEUTIGE_REIHENFOLGE, entfernteLevel } from '../tools/beurteilung/heutige-reihenfolge.mjs';
import { gradVon } from '../tools/beurteilung/grad.mjs';
import { AGENT, MAX_SHIFT, entry } from '../tools/ki-tester/protocol.mjs';
import { abdruck, kandidatName, levelCode } from '../tools/leveldaten.mjs';
import {
  GRUENDE, HAUPT_KERNIDEE_JE_10, MAX_ENTZERREN, MIN_GEFUEHL_BEHALTEN, TOLERANZ_MITTEL, alleUrteile, entzerre,
  ergaenzungBegruendet, haeufungen, imSpiel, festePlaetze, korrigiere, ladeLevelliste, reihenfolge, stark,
  zaehlendeUrteile, zaehlt, zehner, zustimmung, zuWeitKorrigiert,
} from '../tools/levelliste.mjs';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const MAIN = L.LEVELS.slice(L.TUTORIAL_COUNT);
const liste = ladeLevelliste();
const gueltig = (grad) => (GRADE.includes(grad) ? grad : null);
const t0 = Date.now();
const beurteilt = await beurteileAlle(MAIN.map(level => ({ level, opts: { grad: gueltig(level.grad), teuer: true } })));
console.log(`Levelliste: ${MAIN.length} Level beurteilt (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const nach = new Map(MAIN.map((level, i) => [level.name, { level, b: beurteilt[i] }]));
const wert = (level) => nach.get(level.name).b.schwierigkeit.wert;
// Die Formel rechnet von der heutigen Reihenfolge aus (beurteilung/heutige-reihenfolge.mjs), mit den zählenden
// Urteilen der KI-Tester aus dem Protokoll (Ablauf 2, Läufe pruefung-… und ersatz-…). heute: die Level im Spiel, zuerst
// die der heutigen Reihenfolge, dann die neuen aus dem Austausch (imSpiel); platzHeute: ihr heutiger Platz oder null
const { levels: heute, heute: platzHeute } = imSpiel(MAIN);
const werteHeute = heute.map(wert);
const namenHeute = heute.map(l => l.name);
const kandidat = heute.map((l, i) => (platzHeute[i] === null ? kandidatName(l) : null));
const urteile = zaehlendeUrteile();
// Häufung der Haupt-Kernidee: gezählt ohne die Duldungsliste, mit den Beurteilungen beim Grad im Spiel
const beiHeute = heute.map(l => nach.get(l.name).b);
const r = reihenfolge(werteHeute, namenHeute, urteile, {
  haupt: beiHeute.map(b => b.hauptKernidee.begriff),
  geduldet: (i, grad, u) => Object.values(GRUENDE).some(g => g.gilt(beiHeute[i], grad, u)),
  heute: platzHeute, kandidat, formelEntscheid: liste.prueflisteFormel,
});
const kiNach = new Map([...r.ki].map(([i, u]) => [heute[i].name, u]));
const verletzt = (grund) => MAIN.filter(l => GRUENDE[grund].gilt(nach.get(l.name).b, l.grad, kiNach.get(l.name)))
  .map(l => l.name);
const ohne = (namen, weg) => namen.filter(x => !weg.includes(x));
const duldung = Object.values(liste.duldung).flat();

console.log('Grade');
test('Jedes Level nach dem Tutorial trägt einen der vier Grade im Feld grad, das Tutorial keinen', () => {
  assert.deepEqual(MAIN.filter(l => !GRADE.includes(l.grad)).map(l => `${l.name}: ${l.grad}`), []);
  assert.deepEqual(L.LEVELS.slice(0, L.TUTORIAL_COUNT).filter(l => 'grad' in l).map(l => l.name), []);
  assert.deepEqual(L.LEVELS.filter(l => 'difficulty' in l).map(l => l.name), [], 'alte Markierung difficulty');
});
test('Entlang der Reihenfolge sinkt der Grad nie', () => {
  const sinkt = MAIN.filter((l, i) => i && GRADE.indexOf(l.grad) < GRADE.indexOf(MAIN[i - 1].grad));
  assert.deepEqual(sinkt.map(l => `${MAIN.indexOf(l) + 1} ${l.name}`), []);
});
// Die Daten der Anzeige aus index.html (GRAD_ANZEIGE und die Seiten der Levelauswahl, Ticket 17); wie Kachel, Kopfzeile
// und Seitentitel aussehen, prüfen die Screenshot-Proben
const anzeige = (levels, tutorialCount) => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const konstante = (k) => html.match(new RegExp(`^const ${k} = [^;]+;`, 'm'))[0];
  const code = ['levelNumber', 'GRAD_PUNKTE', 'GRAD_ANZEIGE', 'PAGE_SIZE'].map(konstante).join('\n') + '\n' +
    html.match(/^const PAGES = [\s\S]*?^\}\)\(\);/m)[0] + '\nreturn { GRAD_PUNKTE, GRAD_ANZEIGE, PAGES };';
  return new Function('LEVELS', 'TUTORIAL_COUNT', code)(levels, tutorialCount);
};
test('Die Anzeige zeigt die vier Grade als 1–4 volle Punkte und als Text, das Tutorial ohne Grad', () => {
  const { GRAD_PUNKTE, GRAD_ANZEIGE } = anzeige(L.LEVELS, L.TUTORIAL_COUNT);
  assert.deepEqual(Object.keys(GRAD_ANZEIGE), GRADE);
  const punkte = (d) => '●'.repeat(d.punkte) + '○'.repeat(GRAD_PUNKTE - d.punkte);
  assert.deepEqual(GRADE.map(g => `${punkte(GRAD_ANZEIGE[g])} ${GRAD_ANZEIGE[g].label}`),
    ['●○○○ Leicht', '●●○○ Mittel', '●●●○ Schwer', '●●●● Sehr schwer']);
  assert.deepEqual(L.LEVELS.slice(0, L.TUTORIAL_COUNT).filter(l => GRAD_ANZEIGE[l.grad]).map(l => l.name), []);
});
test('Der Seitentitel nennt den Grad der Seite, auf einer gemischten den Bereich, das Tutorial keinen', () => {
  // von Hand: 2 Tutorial-Level, eine leichte Seite, zwei gemischte (zwei und drei Grade) und eine angefangene sehr
  // schwere
  const reihe = (grad, n) => Array.from({ length: n }, (_, k) => ({ name: `${grad} ${k}`, grad }));
  const hand = [{ name: 'T1', tutorial: true }, { name: 'T2', tutorial: true },
    ...reihe('leicht', 15), ...reihe('mittel', 8), ...reihe('schwer', 4), ...reihe('sehr schwer', 6)];
  assert.deepEqual(anzeige(hand, 2).PAGES.map(p => p.title),
    ['Tutorial · die Mechaniken', 'Level 1 – 10 · Leicht', 'Level 11 – 20 · Leicht bis Mittel',
      'Level 21 – 30 · Mittel bis Sehr schwer', 'Level 31 – 33 · Sehr schwer']);
  // im Spiel: Jeder Titel endet auf den Grad, den alle Level der Seite haben, sonst auf den Bereich vom leichtesten bis
  // zum schwersten; ohne Grad (Tutorial) nennt er keinen
  const { GRAD_ANZEIGE, PAGES } = anzeige(L.LEVELS, L.TUTORIAL_COUNT);
  const falsch = PAGES.filter((p) => {
    const grade = GRADE.filter(g => p.indices.some(i => L.LEVELS[i].grad === g)).map(g => GRAD_ANZEIGE[g].label);
    const soll = grade.length > 1 ? ` · ${grade[0]} bis ${grade.at(-1)}` : grade.length ? ` · ${grade[0]}` : '';
    const genannt = Object.values(GRAD_ANZEIGE).some(d => p.title.includes(d.label));
    return soll ? !p.title.endsWith(soll) : genannt;
  });
  assert.deepEqual(falsch.map(p => p.title), []);
});

console.log('Reihenfolge');
// Je Level im Spiel, ob es am heutigen Platz bleibt (nach ordne)
const bleibt = (l) => r.bleibt.has(heute.indexOf(l));
test('Die Reihenfolge folgt der Schwierigkeit: bis 10 Plätze weit, weiter wandernde Level am heutigen Platz, '
  + 'ausser die KI-Tester stimmen der Formel zu; dazu ihre Korrekturen und die Häufungsregel', () => {
  assert.deepEqual(MAIN.map(l => l.name), r.folge.map(i => heute[i].name));
  // Dazu ohne ordne() nachgerechnet, vor den eigenen Korrekturen der KI-Tester (r.basis): Wer bleibt, steht am
  // heutigen Platz, jedes andere Level höchstens 10 Plätze davon, ausser beide KI-Tester stimmen der Formel zu oder es
  // ist neu (ohne heutigen Platz); und diese stehen untereinander nach der Schwierigkeit, bei gleichem Wert in der
  // heutigen Reihenfolge, die neuen danach
  const weit = r.basis.filter((i, k) => (r.bleibt.has(i) ? platzHeute[i] !== k + 1
    : platzHeute[i] !== null && !r.zurFormel.has(i) && Math.abs(platzHeute[i] - k - 1) > 10));
  assert.deepEqual(weit.map(i => `${platzHeute[i]} → ${r.basis.indexOf(i) + 1} ${heute[i].name}`), []);
  const frei = r.basis.filter(i => !r.bleibt.has(i));
  const ungeordnet = frei.filter((i, k) => k && (werteHeute[i] - werteHeute[frei[k - 1]] || i - frei[k - 1]) < 0);
  assert.deepEqual(ungeordnet.map(i => heute[i].name), [], 'nicht nach der Schwierigkeit');
});
test('Die Prüfliste für Ticket 16 nennt genau die Level, die nach der Formel mehr als 10 Plätze wandern würden', () => {
  const pruef = r.folge.filter(i => r.pruefliste.includes(i)).map(i => heute[i].name);
  assert.deepEqual(liste.pruefliste, pruef);
  // Dazu ohne ordne(): Der Platz nach der Formel ist der Rang nach der Schwierigkeit, bei gleichem Wert der heutige; ein
  // neues Level hat keinen heutigen Platz und steht nie auf der Prüfliste. Ein Level mit Entscheid misst sich am Platz
  // der Formel beim Entscheid (prueflisteFormel, Ticket 26)
  const rang = heute.map((_, i) => i).sort((i, j) => werteHeute[i] - werteHeute[j] || i - j);
  const fest = liste.prueflisteFormel ?? {};
  const weit = rang.filter((i, p) => platzHeute[i] !== null
    && Math.abs((Object.hasOwn(fest, heute[i].name) ? fest[heute[i].name] : p + 1) - platzHeute[i]) > 10)
    .map(i => heute[i].name);
  assert.deepEqual([...liste.pruefliste].sort(), weit.sort());
});
test('Der Grad folgt den Schwellen; ein Level am heutigen Platz hat den Grad seines Abschnitts', () => {
  assert.deepEqual(MAIN.filter((l, k) => l.grad !== r.grad[r.folge[k]]).map(l => `${l.name}: ${l.grad}`), []);
  // Dazu ohne gradeEntlang(): Jedes Level, das nach der Formel steht, hat den Grad nach den Schwellen
  assert.deepEqual(MAIN.filter(l => !bleibt(l) && l.grad !== gradVon(wert(l))).map(l => `${l.name}: ${l.grad}`), []);
});
test('Jede Abweichung vom Platz der Formel ist im Protokoll oder durch die Häufungsregel begründet (Ticket 16)', () => {
  // Die Prüfliste ist erledigt: Jedes Level darauf hat genau ein zählendes Urteil (Ablauf 2, Läufe pruefung-…), nur
  // Level der Prüfliste haben eines (reihenfolge() wirft sonst), gefällt am alten Platz
  assert.equal(liste.prueflisteErledigt, true, 'levelliste.json: prueflisteErledigt');
  assert.deepEqual(r.pruefliste.filter(i => !r.ki.has(i)).map(i => heute[i].name), [], 'ohne zählendes Urteil');
  for (const e of urteile.filter(x => namenHeute.includes(x.level.name))) {
    const i = namenHeute.indexOf(e.level.name);
    assert.equal(e.referenz.position, platzHeute[i], `${e.lauf} ${e.level.name}: alter Platz`);
  }
  // Am heutigen Platz statt nach der Formel steht ein Level der Prüfliste, bis beide KI-Tester dem Platz der Formel
  // zustimmen, oder ein Level, das zwischen ihnen sonst zu weit wanderte (ordne)
  for (const [i, warum] of r.bleibt) {
    if (warum === 'Formel') assert.ok(!r.ki.get(i)?.zurFormel, heute[i].name);
    else assert.equal(warum, 'Reihenfolge', heute[i].name);
  }
  // Eigene Korrekturen: nur mit Urteil, höchstens MAX_SHIFT Plätze, ohne Ablehnung; nach den Korrekturen und nach der
  // Häufungsregel steht jedes korrigierte Level höchstens MAX_SHIFT Plätze von seinem Platz davor (zuWeitKorrigiert,
  // dieselbe Prüfung wie in ordne-level.mjs)
  const korrigiert = [...r.ki].filter(([, u]) => u.verschiebung);
  for (const [i, u] of korrigiert) assert.ok(Math.abs(u.verschiebung) <= MAX_SHIFT && !u.abgelehnt, heute[i].name);
  assert.deepEqual(zuWeitKorrigiert(r).map(v => `${heute[v.i].name} ${v.davor}→${v.korrigiert}→${v.ende}`), [],
    `mehr als ${MAX_SHIFT} Plätze von seinem Platz davor`);
  // Häufungsregel: jeder Zug höchstens MAX_ENTZERREN Plätze im eigenen Grad, und danach ist keine Häufung offen
  assert.deepEqual(r.offen.map(h => `${10 * h.gruppe + 1}–${10 * h.gruppe + 10} ${h.begriff}`), [], 'offen');
  for (const z of r.zuege) {
    assert.ok(Math.abs(z.nach - z.von) <= MAX_ENTZERREN, `${heute[z.i].name}: Zug zu weit`);
    assert.equal(r.grad[r.folge[z.nach]], r.grad[z.i], `${heute[z.i].name}: Zug in einen anderen Grad`);
  }
  if (!r.zuege.length) assert.deepEqual(r.folge, r.korrigiert);
  const zug = (z) => `${heute[z.i].name} ${z.von + 1}→${z.nach + 1}`;
  console.log(`        ${r.ki.size} Level der Prüfliste mit Urteil, zur Formel ${r.zurFormel.size}, eigene Korrektur `
    + `${korrigiert.length}; Häufungsregel: ${r.zuege.map(zug).join(', ') || 'keine Züge'}`);
});
test('Die Entscheide aus Ticket 16 zur Prüfliste bleiben fest, auch wenn ein Austausch die Formel verschiebt', () => {
  // Entscheid des Nutzers vom 19.10.2026 (Ticket 26): Zugestimmt wird am Platz der Formel beim Entscheid, den
  // levelliste.json festhält (prueflisteFormel); jedes Level der Prüfliste mit Urteil hat ihn, und nur solche (oder
  // inzwischen entfernte)
  const fest = liste.prueflisteFormel ?? {};
  const mitUrteil = r.pruefliste.filter(i => r.ki.has(i)).map(i => heute[i].name);
  assert.deepEqual(mitUrteil.filter(x => !Object.hasOwn(fest, x)), [], 'ohne festen Platz der Formel');
  assert.deepEqual(Object.keys(fest).filter(x => !mitUrteil.includes(x) && !liste.entfernteNamen.includes(x)), [],
    'fester Platz ohne Level der Prüfliste');
  for (const [i, u] of r.ki) if (!u.neu) assert.equal(u.formelEntscheid, fest[heute[i].name], heute[i].name);
  // Auf dem Stand im Spiel kommt beim Schreiben nichts dazu (festePlaetze, wie in ordne-level.mjs); Gegenproben an
  // erfundenen Verschiebungen der Formel siehe unten (Regel für die Prüfliste)
  assert.deepEqual(festePlaetze(fest, r, namenHeute), fest);
});
test('Neue Level (Austausch): jedes mit zählendem Urteil (ersatz-…), keines von beiden abgelehnt', () => {
  // Ein neues Level steht nach der Formel (oben); die KI-Tester haben es unter seinem Namen als Kandidat beurteilt
  const neu = heute.flatMap((l, i) => (platzHeute[i] === null ? [i] : []));
  assert.deepEqual(neu.filter(i => !r.ki.has(i)).map(i => `${heute[i].name} (${kandidat[i]})`), [], 'ohne Urteil');
  assert.deepEqual(neu.filter(i => r.ki.get(i)?.abgelehnt).map(i => heute[i].name), [], 'von beiden abgelehnt');
  for (const i of neu) assert.ok(/^ersatz-/.test(r.ki.get(i).eintrag.lauf) && r.ki.get(i).neu, heute[i].name);
  console.log(`        ${neu.length} neue Level: ${neu.map(i => `${heute[i].name} (${r.ki.get(i)?.eintrag.lauf})`)
    .join(', ') || 'keine'}`);
});
test('Neue Level: Der Kommentar nennt Auftrag, Seed und Ziel-Schwierigkeit zum Nachbauen', () => {
  // Ohne die Ziel-Schwierigkeit entsteht aus Auftrag und Seed ein anderes Level (Review Ticket 23, M1). Der Auftrag
  // heisst <grad> oder <grad>-<kernidee>, auch „sehr schwer-…“ (Ticket 26)
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  const herkunft = (name) => new RegExp('\\n {4}// Generator (?:sehr )?[a-z]+(?:-[a-z]+)?, Seed \\d+, '
    + `Ziel \\d+(,\\d+)?–\\d+(,\\d+)? · `
    + `ersetzt [^\\n]+\\n {4}name: '${name}'`);
  const neu = heute.filter((l, i) => platzHeute[i] === null);
  assert.deepEqual(neu.filter(l => !herkunft(l.name).test(html)).map(l => l.name), []);
});
test('Entfernte Level: nicht im Spiel, Name auf der Liste, Leveldaten als feste Kopie für die Eichung', () => {
  // Jedes Level der heutigen Reihenfolge steht im Spiel oder ist entfernt (sein Name auf entfernteNamen); seine
  // Leveldaten bleiben in beurteilung/entfernte-level.json, damit die Eichung an den 150 heutigen Leveln bleibt
  const kopie = entfernteLevel().map(l => l.name);
  assert.deepEqual(HEUTIGE_REIHENFOLGE.filter(x => !nach.has(x) && !liste.entfernteNamen.includes(x)), [], 'fehlt');
  assert.deepEqual(HEUTIGE_REIHENFOLGE.filter(x => !nach.has(x)).sort(), [...kopie].sort(), 'Kopie');
  assert.deepEqual(kopie.filter(x => nach.has(x)), [], 'im Spiel und in der Kopie');
  assert.equal(MAIN.length, 150);
  // Je entferntes Level der heutigen Reihenfolge kam ein neues ins Spiel
  assert.equal(platzHeute.filter(p => p === null).length, kopie.length, 'neue Level');
});
test(`Das Mittel der Schwierigkeit je 10 Level steigt, mit höchstens ${TOLERANZ_MITTEL} Punkt Rückschritt`, () => {
  const mittel = zehner(MAIN).map(z => z.reduce((s, l) => s + wert(l), 0) / z.length);
  const text = mittel.map(m => m.toFixed(1)).join(' ');
  for (let k = 1; k < mittel.length; k++) {
    assert.ok(mittel[k] >= mittel[k - 1] - TOLERANZ_MITTEL, `Mittelwerte ${text}`);
  }
  assert.ok(mittel.at(-1) - mittel[0] >= 15, `zu wenig Spannweite: ${text}`);
});
test(`Dieselbe Haupt-Kernidee höchstens ${HAUPT_KERNIDEE_JE_10}-mal je 10 Level, ohne die Duldungsliste`, () => {
  const zuOft = zehner(MAIN).flatMap((z, k) => {
    const zahl = {};
    for (const l of z.filter(x => !duldung.includes(x.name))) {
      const h = nach.get(l.name).b.hauptKernidee.begriff;
      if (h) zahl[h] = (zahl[h] || 0) + 1;
    }
    return Object.entries(zahl).filter(([, x]) => x > HAUPT_KERNIDEE_JE_10)
      .map(([h, x]) => `Plätze ${10 * k + 1}–${10 * k + 10}: ${h} ${x}-mal`);
  });
  assert.deepEqual(zuOft, []);
});

console.log('Duldungsliste');
for (const [grund, { text }] of Object.entries(GRUENDE)) {
  test(`${text}: nur bei Leveln auf der Duldungsliste (${liste.duldung[grund].length} Level)`, () => {
    assert.deepEqual(ohne(verletzt(grund), liste.duldung[grund]), [], 'nicht geduldet');
  });
  test(`${text}: Jedes Level auf der Duldungsliste verletzt die Regel noch (sonst streichen)`, () => {
    assert.deepEqual(ohne(liste.duldung[grund], verletzt(grund)), []);
  });
}
test('Die Duldungsliste wird nur kürzer: Je Grund nur Level, die auf der ursprünglichen Liste standen', () => {
  assert.deepEqual(Object.keys(liste.urspruenglich), Object.keys(GRUENDE));
  for (const grund of Object.keys(GRUENDE)) {
    assert.deepEqual(ohne(liste.duldung[grund], liste.urspruenglich[grund]), [], grund);
  }
});
test('Die ursprüngliche Liste wuchs nur einmal, in Ticket 16, und jede Ergänzung ist durch das Protokoll begründet',
  () => {
    // Ticket 15 legte die ursprüngliche Liste an (je Grund Anzahl und Fingerabdruck der sortierten Namen, damit kein
    // Name ausgetauscht wird); in Ticket 16 kamen nur die Ergänzungen (ergaenzt) dazu: Level, die beide KI-Tester
    // ablehnen, und Level, die durch ihr Urteil in einen Grad kommen, in dem sie eine Regel verletzen
    const TICKET_15 = {
      ausschlussgrund: [37, '825262a36571069d'], ohneKernidee: [57, 'c584b4479b4b3fd4'],
      unterMindestSpielwert: [55, '5577806e52aaa74f'], abgelehnt: [0, 'e3b0c44298fc1c14'],
    };
    const abdruck = (namen) => createHash('sha256').update([...namen].sort().join('\n')).digest('hex').slice(0, 16);
    assert.deepEqual(Object.keys(liste.ergaenzt), Object.keys(GRUENDE));
    for (const grund of Object.keys(GRUENDE)) {
      assert.deepEqual(ohne(liste.ergaenzt[grund], liste.urspruenglich[grund]), [], `${grund}: nicht ursprünglich`);
      const vorher = ohne(liste.urspruenglich[grund], liste.ergaenzt[grund]);
      assert.deepEqual([vorher.length, abdruck(vorher)], TICKET_15[grund], `${grund}: nicht die Liste aus Ticket 15`);
      assert.equal(liste.urspruenglich[grund].length, TICKET_15[grund][0] + liste.ergaenzt[grund].length, grund);
      // ein Level, das es nicht mehr gibt, bleibt mit seinem Urteil darauf
      const ohneGrund = liste.ergaenzt[grund].filter(n => nach.has(n)
        && !ergaenzungBegruendet(grund, kiNach.get(n), nach.get(n).level.grad));
      assert.deepEqual(ohneGrund, [], `${grund}: Ergänzung ohne Begründung`);
    }
  });
test('Die Duldungsliste nennt nur Level im Spiel, je Grund jedes höchstens einmal', () => {
  assert.deepEqual(Object.keys(liste.duldung), Object.keys(GRUENDE));
  for (const namen of Object.values(liste.duldung)) {
    assert.deepEqual(namen.filter(x => !nach.has(x)), [], 'nicht im Spiel');
    assert.equal(new Set(namen).size, namen.length, 'doppelt');
  }
});
// Der Austausch geschieht je Grad in einem Durchgang (Tickets 23–26); danach steht aus dem Grad kein Level mehr auf der
// Duldungsliste, ausser es ist behalten nach Urteil der KI-Tester (Entscheid des Nutzers vom 18.10.2026, Ticket 24).
// Seit Ticket 25 sind alle vier Grade ausgetauscht: Auf der Liste stehen nur noch behaltene Level (Endbedingung von
// Phase 6, Spec), 27 in „mittel“ (Ticket 24) und 4 in „schwer“ (Ticket 25)
const AUSGETAUSCHT = ['leicht', 'mittel', 'schwer', 'sehr schwer'];
test(`Nach dem Austausch steht aus ${AUSGETAUSCHT.join(', ')} nur noch ein behaltenes Level auf der Duldungsliste`,
  () => {
    const behalten = liste.behalten ?? [];
    assert.deepEqual(duldung.filter(x => AUSGETAUSCHT.includes(nach.get(x)?.level.grad) && !behalten.includes(x)), []);
  });
test('Alle vier Grade sind ausgetauscht (Tickets 23–26): Die Duldungsliste nennt genau die behaltenen Level, 27 in '
  + '„mittel“ und 4 in „schwer“', () => {
  const behalten = liste.behalten ?? [];
  assert.deepEqual(AUSGETAUSCHT, GRADE);
  assert.deepEqual([...new Set(duldung)].sort(), [...behalten].sort());
  assert.deepEqual(GRADE.map(g => behalten.filter(x => nach.get(x)?.level.grad === g).length), [0, 27, 4, 0]);
});

console.log('Behalten nach Urteil der KI-Tester (Tickets 24 und 25)');
// Entscheid des Nutzers vom 18.10.2026 (Ticket 24, Variante b′): Von den Leveln in „mittel“, die nur wegen Kernidee
// oder Spielwert auf der Duldungsliste standen, bleiben die starken im Spiel. Die Gruppe wächst nie: höchstens diese
const BEHALTEN_TICKET_24 = ['Glasfenster', 'Lichtnetz', 'Streulicht', 'Strahlenkranz', 'Turmalin', 'Farbschleuse',
  'Perlmutt', 'Bumerang', 'Mondlicht', 'Weichen', 'Glasbaustein', 'Fadenkreuz', 'Lichtschranke', 'Blaue Stunde',
  'Pinselstrich', 'Farbtupfer', 'Rubin', 'Lichtkreuz', 'Glühwürmchen', 'Spektralband', 'Traumfänger', 'Schimmer',
  'Kreuzfeuer', 'Farbverlauf', 'Schachbrett', 'Smaragd', 'Silberstreif'];
// Entscheid des Nutzers vom 19.10.2026 (Ticket 25, Option a): dieselbe Regel in „schwer“; nach dem Lauf
// behalten-schwer-1 sind diese vier stark. Auch diese Liste wächst nie.
const BEHALTEN_TICKET_25 = ['Sonnenwende', 'Pendel', 'Kathedrale', 'Lichtjahr'];
const ENTSCHIEDEN = [...BEHALTEN_TICKET_24, ...BEHALTEN_TICKET_25];
const protokoll = alleUrteile();
test('Behalten: eine Gruppe, die nie wächst; jedes Level im Spiel, nur wegen Kernidee oder Spielwert geduldet, und '
  + 'nach dem Protokoll stark', () => {
  const behalten = liste.behalten ?? [];
  assert.deepEqual(ohne(behalten, ENTSCHIEDEN), [], 'nicht aus den Entscheiden in Ticket 24 und 25');
  const anders = (namen, grad) => namen.filter(x => nach.get(x)?.level.grad !== grad);
  assert.deepEqual(anders(BEHALTEN_TICKET_24, 'mittel'), [], 'Ticket 24: nicht „mittel“');
  assert.deepEqual(anders(BEHALTEN_TICKET_25, 'schwer'), [], 'Ticket 25: nicht „schwer“');
  // Gegenprobe: Sternwarte (behalten-schwer-1, Gefühl 3,5, ersetzt) ist nicht stark und gehört zu keinem Entscheid
  assert.equal(stark('Sternwarte', protokoll).stark, false, 'Gegenprobe: Sternwarte stark');
  assert.deepEqual(ohne([...behalten, 'Sternwarte'], ENTSCHIEDEN), ['Sternwarte'], 'Gegenprobe: Sternwarte');
  assert.equal(new Set(behalten).size, behalten.length, 'doppelt');
  assert.deepEqual(behalten.filter(x => !nach.has(x)), [], 'nicht im Spiel');
  const nurKernidee = [...liste.urspruenglich.ohneKernidee, ...liste.urspruenglich.unterMindestSpielwert];
  assert.deepEqual(ohne(behalten, nurKernidee), [], 'nicht auf der ursprünglichen Liste wegen Kernidee oder Spielwert');
  const mitAusschluss = [...liste.duldung.ausschlussgrund, ...liste.duldung.abgelehnt];
  assert.deepEqual(behalten.filter(x => mitAusschluss.includes(x)), [], 'mit Ausschlussgrund oder abgelehnt');
  assert.deepEqual(behalten.map(x => [x, stark(x, protokoll).maengel]).filter(([, m]) => m.length), [], 'nicht stark');
});
test(`Regel stark an erfundenen Urteilen: jedes Urteil mit Aha-Moment bei beiden, ohne Ablehnung, Gefühl im Mittel `
  + `mindestens ${MIN_GEFUEHL_BEHALTEN}, eines aus Ablauf 2; mit Gegenproben`, () => {
  const urteil = (gefuehl, aha = true, ablehnung = []) => ({ aha: { ja: aha, beschreibung: '' }, gefuehl, ablehnung });
  const e = (A, B, ablauf = '2', lauf = 'behalten-test') => ({ ablauf, lauf, level: { name: 'X' }, urteile: { A, B } });
  const gut = [e(urteil(4), urteil(4)), e(urteil(5), urteil(3), '1', 'spielwert-test')];
  assert.equal(stark('X', gut).stark, true);
  assert.equal(stark('X', gut).gefuehl, 4);
  // Gegenproben: je ein Mangel
  const faelle = {
    'ohne Aha-Moment': [e(urteil(5), urteil(5, false))],
    'Gefühl im Mittel 3,75': [e(urteil(4), urteil(4)), e(urteil(4), urteil(3), '1')],
    'Begriff der Ablehnung': [e(urteil(5), urteil(5, true, ['Zerfall']))],
    'nur Ablauf 1': [e(urteil(4), urteil(4), '1')],
    'kein Urteil': [],
  };
  for (const [text, eintraege] of Object.entries(faelle)) assert.equal(stark('X', eintraege).stark, false, text);
  // an echten Leveln: A3 Glasfenster mit seinem Urteil als Anker (Ablauf 2) stark; Kreuzweg im zweiten Urteil nicht
  assert.equal(stark('Glasfenster', protokoll).stark, true, 'Glasfenster');
  assert.equal(stark('Kreuzweg', protokoll).stark, false, 'Kreuzweg');
});

console.log('Regel für die Prüfliste (Ticket 16), mit erfundenen Urteilen');
// Erfundene Einträge wie aus merge.mjs, mit Referenz und Plätzen der Anker wie bei der Vorbereitung der Läufe der
// Prüfliste (aus dem echten Eintrag des Levels; ohne einen am heutigen Platz in „leicht“)
const erfunden = (name, A, B, ablehnung = [], lauf = 'pruefung-test', position = null) => {
  const { referenz, anker } = urteile.find(e => e.level.name === name) ?? { anker: urteile[0].anker, referenz: {
    art: 'Reihenfolge im Spiel', position: position ?? platzHeute[namenHeute.indexOf(name)], grad: 'leicht', von: 1,
    bis: 31 } };
  const urteil = (einordnung) => ({
    level: 'L1', aha: { ja: true, beschreibung: 'Erfunden.' }, lesbarkeit: { desktop: 4, handy: 4, beschreibung: 'x' },
    gefuehl: 3, einordnung, ablehnung, begruendung: 'Erfunden für den Test.',
  });
  return entry({
    datum: '2026-10-17', lauf, agent: AGENT, level: { id: 'L1', name, anker: null }, referenz, anker,
    urteile: { A: urteil(A), B: urteil(B) },
  });
};
const imSpielHeute = { heute: platzHeute, kandidat };
test('Zustimmung: Der Platz der Formel liegt im Bereich der Einordnung oder näher daran als der alte Platz', () => {
  const e = erfunden('Lichtnetz', 'A3', 'A2-A3'); // A3 heisst 32–34, A2-A3 heisst 31–32
  assert.deepEqual(zustimmung(e, 74, 35).je.A, { formel: 1, alt: 40, stimmtZu: true });
  assert.equal(zustimmung(e, 74, 35).zurFormel, true);
  assert.equal(zustimmung(e, 34, 74).zurFormel, false, 'weiter weg als der alte Platz');
  assert.equal(zustimmung(erfunden('Lichtnetz', 'A3', 'A4-A5'), 74, 35).zurFormel, false, 'nur einer stimmt zu');
  assert.equal(zaehlt({ ...e, lauf: 'probelauf-4' }), false, 'Probelauf');
  assert.equal(zaehlt({ ...e, lauf: 'spielwert-5' }), false, 'Eichlauf');
  assert.equal(zaehlt({ ...e, ablauf: '1' }), false, 'Ablauf 1');
  assert.equal(zaehlt(e), true);
});
test('Feste Entscheide der Prüfliste an erfundenen Verschiebungen der Formel, mit Gegenproben (Ticket 26)', () => {
  const fest = liste.prueflisteFormel ?? {}, n = werteHeute.length;
  const rang = heute.map((_, i) => i).sort((i, j) => werteHeute[i] - werteHeute[j] || i - j);
  /** Schwierigkeiten, bei denen das Level i in der Formel auf den Platz p (1–n) rückt; die übrigen bleiben. */
  const aufPlatz = (i, p) => {
    const w = [...werteHeute], ohne = rang.filter(j => j !== i);
    w[i] = p > 1 ? werteHeute[ohne[p - 2]] + 1e-9 : werteHeute[ohne[0]] - 1;
    return w;
  };
  const mitFest = (w, eintraege = urteile, festePl = fest) => reihenfolge(w, namenHeute, eintraege,
    { ...imSpielHeute, formelEntscheid: festePl });
  // 1. Ein Austausch rückt die Formel eines Levels der Prüfliste, das am heutigen Platz bleibt, an diesen Platz: Es
  //    bleibt auf der Prüfliste, mit Entscheid und Platz; ohne den festen Platz fiele es von der Prüfliste, und sein
  //    Urteil wäre ein Fehler
  const [x] = [...r.ki].find(([, u]) => !u.neu && !u.zurFormel);
  const w1 = aufPlatz(x, platzHeute[x]);
  assert.throws(() => reihenfolge(w1, namenHeute, urteile, imSpielHeute), /steht nicht auf der Prüfliste/);
  const m1 = mitFest(w1);
  assert.equal(m1.formel[x], platzHeute[x]);
  assert.deepEqual([m1.pruefliste.includes(x), m1.ki.get(x).zurFormel, m1.ki.get(x).formelEntscheid, m1.platz[x]],
    [true, false, fest[heute[x].name], platzHeute[x]], heute[x].name);
  // 2. Zugestimmt wird am festen Platz, nicht an dem von heute: Ein Level, dem beide am festen Platz zustimmen, bleibt
  //    am heutigen Platz, wenn der feste Platz ein anderer wäre, an dem sie nicht zustimmen (11 Plätze auf der anderen
  //    Seite des heutigen); die Formel von heute ist dieselbe
  const andererPlatz = (i) => platzHeute[i] - 11 * Math.sign(fest[heute[i].name] - platzHeute[i]);
  const y = [...r.ki.keys()].find((i) => {
    const u = r.ki.get(i), p = andererPlatz(i);
    return !u.neu && u.zurFormel && p >= 1 && p <= n
      && !zustimmung(u.eintrag, u.eintrag.referenz.position, p).zurFormel;
  });
  assert.ok(y !== undefined, 'ein Level mit Zustimmung');
  const m2 = mitFest(werteHeute, urteile, { ...fest, [heute[y].name]: andererPlatz(y) });
  assert.deepEqual([r.zurFormel.has(y), m2.zurFormel.has(y), m2.formel[y], m2.platz[y]],
    [true, false, r.formel[y], platzHeute[y]], heute[y].name);
  // 3. Ein Level, das erst durch einen Austausch weiter als 10 Plätze wandern würde, kommt auf die Prüfliste und
  //    braucht ein Urteil (ADR 0002); mit einem erfundenen Urteil kommt sein Platz der Formel beim Schreiben dazu, die
  //    übrigen festen Plätze bleiben
  const v = rang.find((i, p) => platzHeute[i] !== null && !r.pruefliste.includes(i) && p + 16 <= n
    && Math.abs(p + 1 - platzHeute[i]) <= 3);
  const w3 = aufPlatz(v, rang.indexOf(v) + 16);
  const ohneUrteil = mitFest(w3);
  assert.deepEqual([ohneUrteil.pruefliste.includes(v), ohneUrteil.ki.has(v)], [true, false], heute[v].name);
  assert.deepEqual(festePlaetze(fest, ohneUrteil, namenHeute), fest, 'ohne Urteil kein fester Platz');
  const m3 = mitFest(w3, [...urteile, erfunden(heute[v].name, 'A1', 'A1')]);
  assert.ok(m3.ki.has(v), heute[v].name);
  assert.deepEqual(festePlaetze(fest, m3, namenHeute), { ...fest, [heute[v].name]: m3.formel[v] });
});
test('Korrektur: höchstens 5 Plätze, nie aus dem Abschnitt des Grads, die Level dazwischen rücken einen Platz', () => {
  const grad = ['leicht', 'leicht', 'leicht', 'mittel', 'mittel', 'mittel', 'mittel', 'mittel', 'mittel', 'mittel'];
  const folge = [...grad.keys()];
  assert.deepEqual(korrigiere(folge, grad, new Map([[3, 9]])), [0, 1, 2, 4, 5, 6, 7, 8, 3, 9], '+5 statt +9');
  assert.deepEqual(korrigiere(folge, grad, new Map([[5, -4]])), [0, 1, 2, 5, 3, 4, 6, 7, 8, 9], 'bis zur Grenze');
  assert.deepEqual(korrigiere(folge, grad, new Map([[1, 2]])), [0, 2, 1, 3, 4, 5, 6, 7, 8, 9], 'leicht endet bei 2');
});
test(`Korrekturen schieben einander: höchstens ${MAX_SHIFT} Plätze vom Platz davor, nach den Korrekturen und am Ende`,
  () => {
    // 15 Level in einem Grad. 3 rückt 4 Plätze nach hinten, dann 9 fünf nach vorn, an 3 vorbei: 3 steht 5 Plätze
    // weiter, 9 fünf Plätze weiter vorn; das ist die Grenze. Mit 5 statt 4 Plätzen für 3 sind es 6.
    const grad = Array(15).fill('mittel'), basis = [...grad.keys()];
    const ki = (k3, k9) => new Map([[3, { verschiebung: k3 }], [9, { verschiebung: k9 }]]);
    const lauf = (k3, k9) => {
      const korrigiert = korrigiere(basis, grad, new Map([[3, k3], [9, k9]]));
      return { basis, korrigiert, folge: korrigiert, ki: ki(k3, k9) };
    };
    assert.deepEqual(lauf(4, -5).korrigiert.slice(0, 10), [0, 1, 2, 4, 9, 5, 6, 7, 3, 8]);
    assert.deepEqual(zuWeitKorrigiert(lauf(4, -5)), [], 'genau 5 Plätze');
    assert.deepEqual(zuWeitKorrigiert(lauf(5, -5)), [{ i: 3, davor: 4, korrigiert: 10, ende: 10 }], '6 Plätze');
    // Am Ende: Rückt ein Level nach der Korrektur (Häufungsregel) an 3 vorbei, steht 3 dort 6 Plätze weiter
    const x = lauf(4, -5), folge = [...x.korrigiert];
    folge.splice(7, 0, ...folge.splice(9, 1));
    assert.deepEqual(zuWeitKorrigiert({ ...x, folge }), [{ i: 3, davor: 4, korrigiert: 9, ende: 10 }], 'am Ende');
    // Nur nach den Korrekturen: Holt ein Zug danach 3 auf 5 Plätze zurück, bleibt es gemeldet (so Zitronenlicht mit
    // b6965c5f für Lichtfaden, Ticket 24)
    const y = lauf(5, -5), zurueckgeholt = [...y.korrigiert];
    zurueckgeholt.splice(9, 0, ...zurueckgeholt.splice(8, 1));
    assert.deepEqual(zuWeitKorrigiert({ ...y, folge: zurueckgeholt }), [{ i: 3, davor: 4, korrigiert: 10, ende: 9 }],
      'nur nach den Korrekturen');
    // Gegenproben: rückt das Level an 3 vorbei nach hinten, ist 3 wieder 4 Plätze weit; ein Level ohne eigene
    // Korrektur zählt nicht, wie weit es auch rückt
    const zurueck = [...x.korrigiert];
    zurueck.splice(9, 0, ...zurueck.splice(7, 1));
    assert.deepEqual(zuWeitKorrigiert({ ...x, folge: zurueck }), [], 'nach hinten');
    const ohne = { ...lauf(5, -5), ki: new Map([[3, { verschiebung: 0 }]]) };
    assert.deepEqual(zuWeitKorrigiert(ohne), [], 'ohne Korrektur');
  });
test(`Häufungsregel: höchstens ${MAX_ENTZERREN} Plätze, betroffene Level zuerst, dann die Duldungsliste`, () => {
  // 30 Level in einem Grad (drei Seiten); X ist die Haupt-Kernidee, die sich häuft
  const grad = Array(30).fill('mittel'), folge = [...grad.keys()];
  const mit = (plaetze) => folge.map(i => (plaetze.includes(i) ? 'X' : null));
  // Betroffenes Level: 10 rückt auf Platz 9, die zweite Seite hat danach X nur noch zweimal
  assert.deepEqual(entzerre(folge, grad, mit([10, 13, 16]), new Set()).zuege, [{ i: 10, von: 10, nach: 9 }]);
  // Rückt eines der betroffenen 12, 15, 19, kommt X von Platz 9 oder 20 nach: Ein anderes Level der Nachbarseite
  // rückt, das kürzeste (21 auf 19), ein Level der Duldungsliste aber zuerst (22 auf 19, 3 Plätze)
  const haupt = mit([4, 9, 12, 15, 19, 20]);
  assert.deepEqual(entzerre(folge, grad, haupt, new Set()).zuege, [{ i: 21, von: 21, nach: 19 }]);
  const x = entzerre(folge, grad, haupt, new Set([22]));
  assert.deepEqual([x.zuege, haeufungen(x.folge, haupt, new Set([22]))], [[{ i: 22, von: 22, nach: 19 }], []]);
  // nie über eine Gradgrenze und nur, was zulaessig() erlaubt
  const grenze = folge.map(i => (i < 21 ? 'mittel' : 'schwer'));
  assert.equal(entzerre(folge, grenze, haupt, new Set()).offen.length, 1, 'Grad');
  assert.equal(entzerre(folge, grad, haupt, new Set(), () => false).offen.length, 1, 'zulaessig');
  // Lässt sich nichts auflösen, bleibt die Häufung offen
  const alle = entzerre(folge, grad, mit(folge), new Set());
  assert.deepEqual([alle.zuege, alle.offen.length], [[], 3]);
});
test('Ganze Regel an den heutigen Leveln: zur Formel, am alten Platz mit Korrektur, abgelehnt auf die Duldungsliste',
  () => {
    const name = (i) => heute[i].name, platz = (x, n) => x.folge.indexOf(namenHeute.indexOf(n)) + 1;
    const x = reihenfolge(werteHeute, namenHeute, [
      // 74 Lichtnetz (Formel 35): beide sehen es bei A3 (Platz 33), also zur Formel und von dort einen Platz nach vorn
      erfunden('Lichtnetz', 'A3', 'A3'),
      // 17 Weichen (Formel 62): B sieht es bei A2 (Platz 30), weiter weg von 62 als von 17, also bleibt es; beide
      // wollen nach hinten, um höchstens 5 Plätze
      erfunden('Weichen', 'A3-A4', 'A2'),
      // 27 Spiegelbild (Formel 46): beide stimmen zu und nennen Zerfall, der in mittel gilt, also abgelehnt
      erfunden('Spiegelbild', 'A3-A4', 'A3-A4', ['Zerfall']),
    ], imSpielHeute);
    const u = (n) => x.ki.get(namenHeute.indexOf(n));
    assert.deepEqual([u('Lichtnetz').zurFormel, u('Lichtnetz').verschiebung], [true, -1]);
    assert.equal(platz(x, 'Lichtnetz'), x.basis.indexOf(namenHeute.indexOf('Lichtnetz')));
    assert.deepEqual([u('Weichen').zurFormel, u('Weichen').verschiebung, platz(x, 'Weichen')], [false, 5, 22]);
    assert.deepEqual([u('Spiegelbild').zurFormel, u('Spiegelbild').abgelehnt, u('Spiegelbild').verschiebung],
      [true, true, 0]);
    assert.equal(GRUENDE.abgelehnt.gilt(null, 'mittel', u('Spiegelbild')), true);
    assert.equal(GRUENDE.abgelehnt.gilt(null, 'leicht', u('Weichen')), false);
    // Der Grad sinkt nie, und wer zur Formel kommt, hat den Grad nach den Schwellen
    const sinkt = x.folge.filter((i, k) => k && GRADE.indexOf(x.grad[i]) < GRADE.indexOf(x.grad[x.folge[k - 1]]));
    assert.deepEqual(sinkt.map(name), []);
    for (const i of x.zurFormel) assert.equal(x.grad[i], gradVon(werteHeute[i]), name(i));
    assert.throws(() => reihenfolge(werteHeute, namenHeute, [erfunden('Zickzack', 'A1', 'A1')], imSpielHeute),
      /nicht auf der Prüfliste/);
    assert.throws(() => reihenfolge(werteHeute, namenHeute, [erfunden('Weichen', 'A1', 'A1'),
      erfunden('Weichen', 'A2', 'A2')], imSpielHeute), /schon beurteilt/);
  });
test('Ganze Regel mit einem neuen Level (Austausch): nach der Formel, Korrektur von dort, Ablehnung, nur ersatz-…',
  () => {
    // 41 Schliff (Formel 27, auf der Prüfliste), als wäre es neu: ohne heutigen Platz, beurteilt als „Kandidat Test“
    const i = namenHeute.indexOf('Schliff'), neuHeute = platzHeute.map((p, j) => (j === i ? null : p));
    const neuKandidat = kandidat.map((k, j) => (j === i ? 'Kandidat Test' : k));
    const mit = (eintraege) => reihenfolge(werteHeute, namenHeute, eintraege,
      { heute: neuHeute, kandidat: neuKandidat });
    const ohne = mit([]), formel = ohne.formel[i];
    assert.ok(r.pruefliste.includes(i), 'mit heutigem Platz auf der Prüfliste');
    assert.equal(ohne.bleibt.has(i) || ohne.pruefliste.includes(i), false, 'neu: wandert nie, nie auf der Prüfliste');
    // nach der Formel: auf dem freien Platz, der seinem Rang unter den Leveln nach der Formel entspricht
    const besetzt = new Set([...ohne.bleibt.keys()].map(j => neuHeute[j]));
    const frei = [...Array(MAIN.length).keys()].map(k => k + 1).filter(p => !besetzt.has(p));
    const nachWert = [...Array(MAIN.length).keys()].filter(j => !ohne.bleibt.has(j))
      .sort((a, b) => werteHeute[a] - werteHeute[b] || a - b);
    assert.equal(ohne.platz[i], frei[nachWert.indexOf(i)], 'nach der Formel');
    // Beide sehen es bei A2 (in den Ankern des Eintrags hinter dem Platz der Formel), also weiter hinten: höchstens 5
    const e = erfunden('Kandidat Test', 'A2', 'A2', [], 'ersatz-test', formel);
    const x = mit([e]), u = x.ki.get(i);
    assert.deepEqual([u.neu, u.zurFormel, u.abgelehnt], [true, false, false]);
    assert.ok(u.verschiebung > 0 && u.verschiebung <= MAX_SHIFT, `Verschiebung ${u.verschiebung}`);
    assert.equal(x.folge.indexOf(i), x.basis.indexOf(i) + u.verschiebung, 'Korrektur von dort');
    assert.equal(x.grad[i], gradVon(werteHeute[i]), 'Grad nach der Schwelle');
    // Lehnen beide ab (Probieren gilt in jedem Grad), wird es nicht verschoben; ins Spiel kommt es so nicht
    const weg = mit([erfunden('Kandidat Test', 'A2', 'A2', ['Probieren'], 'ersatz-test', formel)]).ki.get(i);
    assert.deepEqual([weg.abgelehnt, weg.verschiebung, weg.gruende], [true, 0, ['Probieren']]);
    // Ein neues Level zählt nur aus einem Lauf ersatz-…, ein Lauf ersatz-… nur für neue Level
    assert.throws(() => mit([erfunden('Kandidat Test', 'A2', 'A2', [], 'pruefung-test', formel)]), /ersatz-/);
    assert.throws(() => mit([erfunden('Weichen', 'A2', 'A2', [], 'ersatz-test')]), /nur neue Level/);
    assert.equal(zaehlt(e), true, 'ersatz-… zählt');
  });

console.log('Leveldaten als Text (Austausch, tools/leveldaten.mjs)');
const ausCode = (code) => new Function(`return ${code.replace(/,\s*$/, '')};`)();
test('levelCode ergibt jedes Level im Spiel wieder, mit Lösungskommentar und weiteren Kommentarzeilen', () => {
  assert.deepEqual(MAIN.filter(l => !isDeepStrictEqual(ausCode(levelCode(l)), l)).map(l => l.name), []);
  const code = levelCode(MAIN[0], ['Herkunft: Test']);
  assert.match(code, /^ {2}\{\n {4}\/\/ Lösung: .+\n {4}\/\/ Herkunft: Test\n {4}name: 'Zickzack', grad: 'leicht',\n/);
  assert.match(code, /\n {4}solution: \{ .+ \},\n {2}\},$/);
});
test('Abdruck: hängt nur an dem, was das Spiel aus den Daten macht, nicht an Name, Grad und Reihenfolge', () => {
  const l = MAIN[0], k = kandidatName(l);
  assert.match(k, /^Kandidat [0-9a-f]{8}$/);
  const umgestellt = { grad: 'mittel', name: 'Anders', solution: l.solution,
    elements: [...l.elements].reverse().map(e => Object.fromEntries(Object.entries(e).reverse())) };
  assert.equal(kandidatName(umgestellt), k);
  const gedreht = { ...l, elements: l.elements.map((e, j) => (j === 1 ? { ...e, rot: (e.rot ?? 0) + 1 } : e)) };
  assert.notEqual(abdruck(gedreht), abdruck(l));
  assert.equal(new Set(MAIN.map(abdruck)).size, MAIN.length, 'jedes Level im Spiel hat einen eigenen Abdruck');
});

console.log('Namen, Lösung und Fortschritt');
test('Die Namen sind eindeutig, und keiner steht auf der Liste der entfernten Namen', () => {
  const namen = L.LEVELS.map(l => l.name);
  assert.deepEqual(namen.filter((x, i) => namen.indexOf(x) !== i), [], 'doppelt');
  assert.ok(Array.isArray(liste.entfernteNamen), 'Liste der entfernten Namen fehlt');
  assert.deepEqual(namen.filter(x => liste.entfernteNamen.includes(x)), []);
});
/** Namen der heutigen Reihenfolge, die weder unter namen noch auf der Liste entfernt stehen, also umbenannt sind. */
const umbenannt = (namen, entfernt) => HEUTIGE_REIHENFOLGE.filter(x => !namen.includes(x) && !entfernt.includes(x));
test('Kein Level wird umbenannt: Jeder Name der heutigen Reihenfolge steht im Spiel oder auf der Liste der entfernten '
  + 'Namen; nach dem Tutorial folgen 150 Level, mit Gegenprobe', () => {
  // Bis Ticket 21 verglich tests/logic.test.mjs die Namen mit NAMES in tools/profiles.mjs. Ein Ersatzlevel bringt einen
  // neuen Namen, der des ersetzten kommt auf die Liste der entfernten Namen (Spec, „Levelliste, Reihenfolge und
  // Austausch“). Die Anzahl bleibt änderbar (Spec); dann hier.
  // Die feste Liste hat dieselben 150 Namen wie früher NAMES; mit weniger prüfte der Test weniger
  assert.equal(new Set(HEUTIGE_REIHENFOLGE).size, 150, 'heutige Reihenfolge: 150 verschiedene Namen');
  const namen = MAIN.map(l => l.name);
  assert.deepEqual(umbenannt(namen, liste.entfernteNamen), []);
  // Gegenprobe: Ein umbenanntes Level fällt auf, ein ersetztes mit seinem Namen auf der Liste nicht
  const alt = HEUTIGE_REIHENFOLGE.find(x => namen.includes(x)), neu = namen.map(x => (x === alt ? `${x} II` : x));
  assert.deepEqual(umbenannt(neu, liste.entfernteNamen), [alt], 'Gegenprobe: umbenannt');
  assert.deepEqual(umbenannt(neu, [...liste.entfernteNamen, alt]), [], 'Gegenprobe: ersetzt');
  assert.equal(MAIN.length, 150);
  // Die Migration alter Spielstände entfernt ein Präfix „II:“ o. Ä.; ein Name darf so nicht beginnen
  assert.deepEqual(L.LEVELS.map(l => l.name).filter(x => /^[IVX]+:/.test(x)), [], 'wie ein alter Speicherschlüssel');
});

/**
 * Filter, die in der Lösung eine fremde Farbe abgeben: weder ihre eigene noch die eintreffende, etwa Cyan durch einen
 * Gelbfilter als Grün. Physikalisch richtig, wirkt im Spiel aber falsch. Die eintreffende Farbe zeigt dieselbe Stellung
 * mit einem weissen Filter an seiner Stelle. Bis Ticket 21 oddFilters in tools/quality.mjs; der Generator setzt solche
 * Filter nicht (wirkungslos in tools/generator/schritte.mjs).
 */
function fremdeFilterfarben(level) {
  return level.elements.flatMap((f, id) => {
    if (f.type !== 'filter') return [];
    const weiss = level.elements.map(e => (e === f ? { ...e, color: 'white' } : e));
    const brett = L.createBoard({ ...level, elements: weiss });
    for (const el of brett.elements.filter(L.isRotatable)) {
      if (keyOf(el) in level.solution) setRot(el, level.solution[keyOf(el)]);
    }
    const farbe = L.COLORS[f.color];
    return L.traceBeams(brett).events.filter(e => e.kind === 'filter' && e.element === id).map(e => e.color)
      .filter(c => (c & farbe) && (c & farbe) !== farbe && (c & farbe) !== c)
      .map(c => `${f.color}-Filter (${keyOf(f)}): ${L.COLOR_NAMES[c]} → ${L.COLOR_NAMES[c & farbe]}`);
  });
}
test('Kein Filter gibt in der Lösung eine fremde Farbe ab (etwa Cyan durch einen Gelbfilter als Grün), mit Gegenprobe',
  () => {
    const gegenprobe = {
      name: 'Gegenprobe', elements: [
        { type: 'source', x: 0, z: 3, dir: 0 },
        { type: 'filter', x: 2, z: 3, color: 'cyan' }, // Weiss → Cyan, seine eigene Farbe
        { type: 'filter', x: 4, z: 3, color: 'yellow' }, // Cyan → Grün, fremd
        { type: 'target', x: 6, z: 3, color: 'green' },
      ], solution: {},
    };
    assert.deepEqual(fremdeFilterfarben(gegenprobe), ['yellow-Filter (4,3): cyan → green']);
    assert.deepEqual(L.LEVELS.flatMap(l => fremdeFilterfarben(l).map(t => `${l.name}: ${t}`)), []);
  });
test('Jedes Level hat genau eine Lösung, die notierte', () => {
  const falsch = MAIN.filter((level) => {
    const r = solve(level, { unique: true });
    const norm = (set) => Object.entries(set).map(([z, v]) => {
      const el = level.elements.find(e => `${e.x},${e.z}` === z);
      return `${z}:${v % period(el)}`;
    }).sort().join(' ');
    return r.aborted || r.count !== 1 || norm(r.solutions[0].set) !== norm(level.solution);
  });
  assert.deepEqual(falsch.map(l => l.name), []);
});
test('Der Fortschritt hängt am Namen: Gelöste Level und das aktuelle bleiben beim Umordnen erhalten', () => {
  // Der Speicherstand aus index.html (progress) mit einer Attrappe von localStorage, einmal mit den Leveln in der
  // heutigen Reihenfolge (vor Ticket 15) und einmal in der neuen
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const von = html.indexOf('const progress = {'), bis = html.indexOf('\n};', von) + 3;
  // die Schlüssel aus FLOW (storageKey gibt es auch beim Himmel und beim Ton)
  const schluessel = (k) => html.slice(html.indexOf('const FLOW = {')).match(new RegExp(`${k}: '([^']+)'`))[1];
  const FLOW = { storageKey: schluessel('storageKey'), solvedKey: schluessel('solvedKey') };
  const speicher = new Map();
  const localStorage = { getItem: k => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, String(v)) };
  const code = `${html.slice(von, bis)}\nreturn progress;`;
  const fortschritt = (levels) => new Function('LEVELS', 'FLOW', 'localStorage', code)(levels, FLOW, localStorage);
  const vorher = [...L.LEVELS.slice(0, L.TUTORIAL_COUNT), ...heute];
  // ein Tutorial-Level und vier Level, die heute an einem anderen Platz stehen; das letzte ist das aktuelle
  const gewandert = vorher.map((_, i) => i).filter(i => L.LEVELS[i] !== vorher[i]);
  const geloest = [2, ...gewandert.filter((_, k) => k % 30 === 0)], aktuell = geloest.at(-1);
  assert.ok(geloest.length >= 4, 'zu wenige Level an einem anderen Platz');
  const alt = fortschritt(vorher);
  alt.load();
  for (const i of geloest) alt.markSolved(i);
  alt.save(aktuell);
  const neu = fortschritt(L.LEVELS);
  assert.equal(L.LEVELS[neu.load()].name, vorher[aktuell].name, 'aktuelles Level');
  assert.deepEqual(L.LEVELS.filter((_, i) => neu.isSolved(i)).map(l => l.name).sort(),
    geloest.map(i => vorher[i].name).sort(), 'gelöste Level');
});
