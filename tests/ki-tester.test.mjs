// Testet den Ablauf der KI-Tester (tools/ki-tester/): Schema der Antworten, Zusammenführen der beiden Urteile, Referenz
// und Grade in der Reihenfolge im Spiel, die Anker, das Feld als Text, den Auftrag samt Fingerabdruck der Eingaben und
// das versionierte Protokoll mit den Einträgen aller Versionen.
// Dazu der Würfel (.scratch/wuerfel-500/): Feld als Text im Würfel, eigene Versionen mit eigenen Ankern und
// Fingerabdruck, Einträge im Protokoll, die Seite mit Würfel-Kandidaten und prepare.mjs mit einer Würfel-Vorschau.
// Die Vorschau baut der Test aus den Würfel-Leveln im Spiel und drei Kandidaten aus dem Generator
// (tests/ki-tester/wuerfel-kandidaten.json, im Quader 7 × 7 × 5 aus dem Pool vom Stand 74361c6: leicht Seeds 60001
// und 60005, mittel mit Mischziel aus zwei Quellen Seed 60001), damit
// sie die Anker jeder Würfel-Version enthält. Was die Form einer Version braucht (zwei Anker, erfundene Einträge,
// Gegenproben), prüft er fest mit W1; was die aktuelle betrifft, mit WUERFEL_VERSION und loadAnchorsWuerfel().
// Aufruf: node tests/ki-tester.test.mjs [protokoll]   (Vorgabe tools/ki-tester/protocol.jsonl; mit einer Kopie, in der
//         ein Eintrag verfälscht ist, muss der Test rot werden)
import { copyFileSync, mkdtempSync, readFileSync, rmSync, appendFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { L } from '../tools/solver.mjs';
import * as protocol from '../tools/ki-tester/protocol.mjs';
import { fieldText } from '../tools/ki-tester/field.mjs';
import { ladeLevelliste } from '../tools/levelliste.mjs';
import { kandidatName, seiteMitLeveln, seiteMitWuerfeln } from '../tools/leveldaten.mjs';
import { AUFZUG, KERN } from './wuerfel-handgebaut.mjs';

const {
  VERSION, VERSIONS, FINGERPRINT, AGENT, fingerprint, GRADES, PROVISIONAL_GRADES, MAX_SHIFT, reference, levelAt,
  loadAnchors, gradesIn, SCHEMA, glossary, rejectionTerms, brief, answerErrors, merge, entry, protocolErrors,
  WUERFEL_VERSION, WUERFEL_FINGERPRINT, WUERFEL_FINGERPRINTS, WUERFEL_IM_SPIEL, fingerprintWuerfel, loadAnchorsWuerfel,
  referenceWuerfel, schemaFor, schemaOf, placings,
} = protocol;
const WUERFEL_ANKER = JSON.parse(readFileSync(new URL('../tools/ki-tester/anchors-wuerfel.json', import.meta.url),
  'utf8')).versionen;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const protocolFile = process.argv[2] || join(root, 'tools', 'ki-tester', 'protocol.jsonl');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}

// Ein gültiges Urteil, Felder einzeln überschreibbar
const answer = (over = {}) => ({
  level: 'L1',
  aha: { ja: true, beschreibung: 'Das Prisma muss beide Ziele zugleich bedienen.' },
  lesbarkeit: { desktop: 4, handy: 3, beschreibung: 'Auf dem Handy liegen zwei Spiegel eng.' },
  gefuehl: 4,
  einordnung: 'A3-A4',
  ablehnung: [],
  begruendung: 'Klarer Aufbau, eine Idee.',
  ...over,
});
// Die Regeln prüfen feste Plätze, unabhängig von der Reihenfolge im Spiel: Anker und Grade wie in Ablauf 1, die
// Referenz in der Form von Ablauf 2
const ANCHORS = { A1: 3, A2: 30, A3: 35, A4: 94, A5: 103, A6: 135, A7: 141, A8: 148 };
const fixedReference = (position, art = 'Reihenfolge im Spiel') => {
  const g = PROVISIONAL_GRADES.find(x => position >= x.from && position <= x.to);
  return { art, position, grad: g.name, von: g.from, bis: g.to };
};
const LEVEL = { id: 'L1', name: 'Testlevel', anker: null };
const A3 = { id: 'A3', name: 'Kreuzweg', anker: 'A3' };
const judge = (a, b, position = 60, level = LEVEL) =>
  merge({ level, referenz: fixedReference(position), anker: ANCHORS, urteile: { A: answer(a), B: answer(b) } });
const decide = (...args) => judge(...args).ergebnis;
const errorsOf = (a, level = LEVEL) => answerErrors(answer(a), level);

console.log('Schema der Antwort');
test('Gültiges Urteil hat keine Fehler', () => assert.deepEqual(errorsOf({}), []));
test('Fehlendes Feld', () => {
  const a = answer(); delete a.gefuehl;
  assert.ok(answerErrors(a, LEVEL).some(e => e.includes('Feld gefuehl fehlt')));
});
test('Gefühl nur ganz von 1 bis 5', () => {
  for (const g of [0, 6, 2.5, '4', null]) assert.notDeepEqual(errorsOf({ gefuehl: g }), [], String(g));
  for (const g of [1, 5]) assert.deepEqual(errorsOf({ gefuehl: g }), []);
});
test('Lesbarkeit je Bildschirm von 1 bis 5', () => {
  assert.notDeepEqual(errorsOf({ lesbarkeit: { desktop: 4, beschreibung: 'x' } }), []);
  assert.notDeepEqual(errorsOf({ lesbarkeit: { desktop: 4, handy: 0, beschreibung: 'x' } }), []);
});
test('Aha-Moment braucht ja/nein und eine Beschreibung', () => {
  assert.notDeepEqual(errorsOf({ aha: { ja: 'ja', beschreibung: 'x' } }), []);
  assert.notDeepEqual(errorsOf({ aha: { ja: false, beschreibung: '' } }), []);
});
test('Einordnung nur zwischen benachbarten Ankern oder bei einem Anker', () => {
  for (const e of ['A3-A5', 'A4-A3', 'A9', 'zwischen A3 und A4', null]) assert.notDeepEqual(errorsOf({ einordnung: e }), [], String(e));
  for (const e of ['<A1', 'A1', 'A7-A8', '>A8']) assert.deepEqual(errorsOf({ einordnung: e }), [], e);
});
test('Ablehnung: eine Liste von Begriffen aus dem Glossar, leer für keine', () => {
  for (const g of [['langweilig'], ['Knaeuel'], [''], ['Kernidee'], ['Knäuel', 'Knäuel'], 'Knäuel', null]) {
    assert.notDeepEqual(errorsOf({ ablehnung: g }), [], JSON.stringify(g));
  }
  for (const g of [[], ['Probieren'], ['Füllteil', 'Zerfall'], ['Probieren', 'Füllteil', 'Scheinmischung', 'Zerfall', 'Knäuel']]) {
    assert.deepEqual(errorsOf({ ablehnung: g }), [], JSON.stringify(g));
  }
});
test('Unbekannte Felder und leere Begründung', () => {
  assert.notDeepEqual(errorsOf({ position: 12 }), []);
  assert.notDeepEqual(errorsOf({ begruendung: '' }), []);
});
test('Urteil gehört zum Level', () => assert.notDeepEqual(errorsOf({ level: 'L2' }), []));
test('Ein Anker ordnet sich bei sich selbst ein', () => {
  assert.deepEqual(answerErrors(answer({ level: 'A3', einordnung: 'A3' }), A3), []);
  assert.notDeepEqual(answerErrors(answer({ level: 'A3', einordnung: 'A3-A4' }), A3), []);
});
test('Schema: Einordnungen passen zu den Ankern, Ablehnungen zum Glossar', () => {
  const ids = loadAnchors().map(a => a.id);
  const expected = ['<' + ids[0]];
  ids.forEach((id, k) => { expected.push(id); if (k < ids.length - 1) expected.push(id + '-' + ids[k + 1]); });
  expected.push('>' + ids.at(-1));
  assert.deepEqual(SCHEMA.properties.einordnung.enum, expected);
  assert.deepEqual(SCHEMA.properties.ablehnung.items.enum, rejectionTerms());
  assert.deepEqual(rejectionTerms(), ['Probieren', 'Füllteil', 'Scheinmischung', 'Zerfall', 'Knäuel']);
});

console.log('Ablehnen nur gemeinsam');
test('Beide nennen einen Begriff: abgelehnt', () => {
  const r = decide({ ablehnung: ['Knäuel'] }, { ablehnung: ['Knäuel'] });
  assert.equal(r.abgelehnt, true);
  assert.deepEqual(r.gruende, ['Knäuel']);
});
test('Verschiedene Begriffe: abgelehnt mit allen Begriffen beider Listen', () => {
  assert.deepEqual(decide({ ablehnung: ['Probieren', 'Knäuel'] }, { ablehnung: ['Knäuel', 'Zerfall'] }).gruende,
    ['Probieren', 'Knäuel', 'Zerfall']);
});
test('Nur einer nennt einen Begriff: nicht abgelehnt', () => {
  for (const [a, b] of [[['Knäuel', 'Probieren'], []], [[], ['Zerfall']]]) {
    const r = decide({ ablehnung: a }, { ablehnung: b });
    assert.equal(r.abgelehnt, false);
    assert.deepEqual(r.gruende, []);
  }
});
test('Füllteil und Zerfall zählen erst ab mittel', () => {
  const easy = (a, b) => judge({ ablehnung: a, einordnung: 'A1-A2' }, { ablehnung: b, einordnung: 'A1-A2' }, 12);
  for (const g of ['Füllteil', 'Zerfall']) {
    assert.equal(easy([g], [g]).ergebnis.abgelehnt, false, g);
    assert.equal(decide({ ablehnung: [g] }, { ablehnung: [g] }, 60).abgelehnt, true, g);
  }
  // in einem leichten Level zählen nur die übrigen Begriffe
  assert.equal(easy(['Füllteil'], ['Knäuel']).ergebnis.abgelehnt, false);
  const r = easy(['Füllteil', 'Knäuel'], ['Zerfall', 'Probieren']);
  assert.deepEqual([r.ergebnis.abgelehnt, r.ergebnis.gruende], [true, ['Knäuel', 'Probieren']]);
  assert.match(r.begruendung, /Füllteil \(gilt erst ab mittel\)/);
});
test('Abgelehnt, also keine Verschiebung', () => {
  // beide wollen nach vorn (wie unten: −5), aber das Level ist abgelehnt
  const r = decide({ einordnung: 'A2-A3', ablehnung: ['Knäuel'] }, { einordnung: 'A3', ablehnung: ['Probieren'] }, 60);
  assert.deepEqual([r.abgelehnt, r.verschiebung, r.position], [true, 0, 60]);
});

console.log('Korrektur der Position');
test('Platz liegt im Bereich beider KI-Tester: keine Verschiebung', () => {
  assert.equal(decide({}, {}).verschiebung, 0);
  assert.equal(decide({}, {}).position, 60);
});
test('Beide wollen nach vorn: kleinerer Wunsch, höchstens 5 Plätze', () => {
  // A3-A4 heisst Platz 36–93; vorn: A2-A3 heisst 31–34
  const r = decide({ einordnung: 'A2-A3' }, { einordnung: 'A3' }, 60); // Wünsche 34−60 = −26 und 36−60 = −24
  assert.equal(r.verschiebung, -MAX_SHIFT);
  assert.equal(r.position, 55);
});
test('Kleiner gemeinsamer Wunsch wird ganz übernommen', () => {
  // bei A3 (Platz 35) heisst 34–36: von 39 aus −3; A2-A3 heisst 31–34: von 39 aus −5
  const r = decide({ einordnung: 'A3' }, { einordnung: 'A2-A3' }, 39);
  assert.equal(r.verschiebung, -3);
  assert.equal(r.position, 36);
});
test('Beide wollen nach hinten', () => {
  assert.equal(decide({ einordnung: 'A4-A5' }, { einordnung: 'A4' }, 90).verschiebung, 3); // 95−90 und 93−90
});
test('Verschiedene Richtungen oder nur einer: keine Verschiebung', () => {
  assert.equal(decide({ einordnung: 'A2-A3' }, { einordnung: 'A4-A5' }, 60).verschiebung, 0);
  assert.equal(decide({ einordnung: 'A2-A3' }, { einordnung: 'A3-A4' }, 60).verschiebung, 0);
});
test('Nie über eine Gradgrenze', () => {
  // mittel endet bei 100, kein Anker dazwischen: von 98 aus wollen beide +6 (A5-A6 beginnt bei 104), erlaubt sind +2
  const up = judge({ einordnung: 'A5-A6' }, { einordnung: 'A5-A6' }, 98);
  assert.deepEqual([up.ergebnis.verschiebung, up.ergebnis.position], [2, 100]);
  assert.match(up.begruendung, /nicht über die Grenze von mittel/);
  // mittel beginnt bei 31: von 33 aus wollen beide −4 (A1-A2 endet bei 29), erlaubt sind −2
  const down = decide({ einordnung: 'A1-A2' }, { einordnung: 'A1-A2' }, 33);
  assert.deepEqual([down.verschiebung, down.position], [-2, 31]);
});
test('An einem Anker vorbei: das Level zieht vorbei, der Anker rückt um einen Platz', () => {
  // von 27 aus wollen beide +4 (A2-A3 heisst 31–34); die Gradgrenze erlaubt +3 auf Platz 30, A2 rückt auf 29
  const r = judge({ einordnung: 'A2-A3' }, { einordnung: 'A2-A3' }, 27);
  assert.deepEqual([r.ergebnis.verschiebung, r.ergebnis.position], [3, 30]);
  assert.match(r.begruendung, /an Anker A2 vorbei, der auf Platz 29 rückt/);
  // im selben Grad: von 92 aus wollen beide +3 (A4-A5 beginnt bei 95), vorbei an A4 auf 94
  assert.equal(decide({ einordnung: 'A4-A5' }, { einordnung: 'A4-A5' }, 92).verschiebung, 3);
  // nach vorn: von 37 aus wollen beide −3 (A2-A3 endet bei 34), vorbei an A3 auf 35, A3 rückt auf 36
  const back = judge({ einordnung: 'A2-A3' }, { einordnung: 'A2-A3' }, 37);
  assert.equal(back.ergebnis.verschiebung, -3);
  assert.match(back.begruendung, /an Anker A3 vorbei, der auf Platz 36 rückt/);
});
test('Ränder: leichter als A1, schwerer als A8', () => {
  assert.equal(decide({ einordnung: '<A1' }, { einordnung: '<A1' }, 6).verschiebung, -4); // bis Platz 2, an A1 vorbei
  assert.equal(decide({ einordnung: '>A8' }, { einordnung: '>A8' }, 145).verschiebung, 4); // ab Platz 149, an A8 vorbei
});
test('Ein Anker wird durch sein eigenes Urteil nie verschoben', () => {
  const r = decide({ level: 'A3', einordnung: 'A3' }, { level: 'A3', einordnung: 'A3' }, 35, A3);
  assert.deepEqual([r.verschiebung, r.position], [0, 35]);
});
test('Begründung nennt beide Listen und die Verschiebung', () => {
  const r = judge({ einordnung: 'A2-A3', ablehnung: ['Knäuel', 'Zerfall'] }, { einordnung: 'A3' });
  assert.match(r.begruendung, /A: Knäuel, Zerfall; B: keine/);
  assert.match(r.begruendung, /−5/);
});

console.log('Referenz und Grade (Ablauf 2)');
const MAIN = L.LEVELS.length - L.TUTORIAL_COUNT;
test('Die Grade folgen der Reihenfolge im Spiel: je ein Abschnitt, zusammen lückenlos alle Plätze', () => {
  let next = 1;
  for (const g of GRADES) {
    assert.equal(g.from, next, `${g.name} beginnt nicht bei ${next}`);
    next = g.to + 1;
  }
  assert.equal(next, MAIN + 1);
});
test('Referenz: Platz in der Reihenfolge im Spiel, Grad aus den Leveldaten, Grenzen aus der Reihenfolge', () => {
  for (let p = 1; p <= MAIN; p++) {
    const r = reference(p), level = L.LEVELS[L.TUTORIAL_COUNT + p - 1];
    assert.equal(levelAt(p), level, `Platz ${p}`);
    assert.deepEqual([r.art, r.position, r.grad], ['Reihenfolge im Spiel', p, level.grad], `Platz ${p}`);
    const inside = L.LEVELS.slice(L.TUTORIAL_COUNT).flatMap((l, k) => (l.grad === r.grad ? [k + 1] : []));
    assert.deepEqual([r.von, r.bis], [inside[0], inside.at(-1)], `Platz ${p}`);
  }
});

console.log('Anker');
// Duldungsliste (Grund Ausschlussgrund) und Prüfliste aus tools/levelliste.json
const LEVELLISTE = ladeLevelliste();
const AUSSCHLUSS = LEVELLISTE.duldung.ausschlussgrund;
const GRENZFAELLE = ['Zwielicht', 'Lichtkegel', 'Schnittstelle', 'Prismenreigen', 'Widerschein', 'Sonnenwende',
  'Einklang', 'Knotenpunkt', 'Glasmurmel', 'Blendwerk', 'Opal', 'Doppelspiegel', 'Chamäleon', 'Supernova', 'Lichthof'];
/** Taugt als Anker: kein Ausschlussgrund und nicht auf der Prüfliste (Regel des Nutzers, Ticket 16). */
const usable = (level) => !AUSSCHLUSS.includes(level.name) && !LEVELLISTE.pruefliste.includes(level.name);
test('Je zwei Anker pro Grad der Reihenfolge im Spiel, einer am unteren und einer am oberen Ende', () => {
  // Gerechnet in der Reihenfolge des Bestands, ohne die Level des Ausbaus auf 500 Level: Die Anker sind eine feste
  // Auswahl aus dem Bestand; kämen mit jeder Gruppe neue, wären die Urteile der Läufe nicht mehr vergleichbar
  const ausbau = LEVELLISTE.ausbau ?? [];
  const bestand = L.LEVELS.slice(L.TUTORIAL_COUNT).filter(l => !ausbau.includes(l.name));
  const anchors = loadAnchors(bestand), imBestand = (position) => bestand[position - 1];
  for (const g of gradesIn(bestand)) {
    const own = anchors.filter(a => a.grad === g.name);
    assert.deepEqual(own.map(a => a.ende), ['unten', 'oben'], g.name);
    const third = (g.to - g.from + 1) / 3;
    for (const a of own) {
      assert.ok(a.position >= g.from && a.position <= g.to, `${a.name} (${a.position}) nicht in ${g.name}`);
      // Am Ende heisst: im äussersten Drittel des Grads, oder zwischen ihm und dem Ende taugt kein Level als Anker
      const outer = a.ende === 'unten' ? a.position < g.from + third : a.position > g.to - third;
      const [from, to] = a.ende === 'unten' ? [g.from, a.position - 1] : [a.position + 1, g.to];
      const nearer = Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => imBestand(from + k)).filter(usable);
      assert.ok(outer || !nearer.length, `${a.name} nicht am Ende, näher daran: ${nearer.map(l => l.name).join(', ')}`);
    }
  }
  const positions = anchors.map(a => a.position);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'Anker nach Platz geordnet');
});
test('Kein Anker mit Ausschlussgrund, auf der Prüfliste oder ein Grenzfall der Neuzählung', () => {
  // seit Ticket 25 ist die Liste mit Ausschlussgrund leer (alle vier Grade ausgetauscht); gelesen ist sie trotzdem
  assert.ok(Array.isArray(AUSSCHLUSS) && LEVELLISTE.pruefliste.length > 0, 'levelliste.json gelesen');
  for (const a of loadAnchors()) {
    assert.ok(usable(a), `${a.name}: Ausschlussgrund oder Prüfliste`);
    assert.ok(!GRENZFAELLE.includes(a.name), a.name);
    assert.ok(a.begruendung.length > 40, `${a.name}: Begründung fehlt`);
  }
});

console.log('Feld als Text');
test('Feld als Text kennt weder Lösung noch Name noch Grad und nennt jedes Element', () => {
  for (let i = L.TUTORIAL_COUNT; i < L.LEVELS.length; i++) {
    const lvl = L.LEVELS[i];
    const text = fieldText(lvl, 'L1');
    assert.equal(fieldText({ ...lvl, solution: undefined }, 'L1'), text, `${lvl.name}: hängt von der Lösung ab`);
    const anders = lvl.grad === 'leicht' ? 'sehr schwer' : 'leicht';
    assert.equal(fieldText({ ...lvl, name: 'Anders', grad: anders }, 'L1'), text,
      `${lvl.name}: hängt von Name oder Grad ab`);
    assert.ok(!text.includes(lvl.name), `${lvl.name}: Name verrät das Level`);
    for (const e of lvl.elements) assert.ok(text.includes(`(${e.x},${e.z})`), `${lvl.name}: (${e.x},${e.z}) fehlt`);
  }
});

console.log('Auftrag und Fingerabdruck');
test('Glossar für die KI-Tester: geschärft bei Füllteil, Abschalten und Falle, ohne die Hinweise für Autoren', () => {
  const text = glossary(), flat = text.replace(/\s+/g, ' ');
  assert.ok(flat.includes('_Vermeiden_: Füllteil für einen kurzen Strang, den ein anderer Strahl an einem seiner ' +
    'Spiegel trifft (das ist ein Einstieg)'));
  const term = (name) => flat.slice(flat.indexOf(`**${name}**:`)).split(' **')[0];
  assert.match(term('Abschalten'), /Licht in der Farbe des Ziels/);
  const ABGRENZUNG = 'Die Falle bringt dasselbe Licht auf einem anderen Weg ans Ziel, das Abschalten nimmt es dem ' +
    'Ziel weg.';
  for (const name of ['Abschalten', 'Falle']) assert.ok(term(name).includes(ABGRENZUNG), `${name}: Abgrenzung fehlt`);
  assert.ok(!text.includes('_Vermeiden_: Muster'), 'Hinweis zur Benennung der Kernidee');
  assert.ok(!text.includes('## Beurteilung von Leveln'));
});
test('Auftrag aus brief.md: alles eingesetzt, Anker mit Grad, keine Namen der Level', () => {
  const text = brief({ tester: 'B', lauf: 'test', eingabe: 'x/eingabe', ausgabe: 'x/antwort-B/urteile.json',
    levels: [{ id: 'L1', anker: null }, { id: 'A3', anker: 'A3' }] });
  assert.ok(!/\{\{|\}\}|<!--/.test(text), 'Platzhalter oder Vorlagen übrig');
  for (const a of loadAnchors()) {
    assert.ok(text.includes(`- **${a.id}**: ${a.grad}, ${a.ende === 'unten' ? 'unteres' : 'oberes'} Ende des Grads.`), a.id);
    assert.ok(!text.includes(a.name), `${a.name}: Name verrät den Anker`);
  }
  assert.match(text, /^1\. \*\*L1\*\*: `L1\.md`/m);
  assert.match(text, /^2\. \*\*A3\*\* \(der Anker selbst, Einordnung „A3“\)/m);
  assert.ok(text.includes('`x/antwort-B/urteile.json`') && text.includes('`x/eingabe`'));
  assert.ok(text.includes(glossary().replace(/^## /gm, '### ')), 'Glossar fehlt');
});
test(`Version ${VERSION}: alles, was die KI-Tester sehen, ist unverändert (Fingerabdruck)`, () => {
  assert.equal(fingerprint(), FINGERPRINT, 'Auftrag, Anker, Schema, Glossar oder Feld eines Ankers geändert: VERSION in ' +
    'tools/ki-tester/protocol.mjs erhöhen und FINGERPRINT nachführen');
});

console.log('Protokoll');
const valid = () => entry({
  datum: '2026-10-16', lauf: 'test', agent: AGENT, level: LEVEL, referenz: fixedReference(60), anker: ANCHORS,
  urteile: { A: answer({ einordnung: 'A2-A3', ablehnung: ['Knäuel'] }), B: answer({ einordnung: 'A3' }) },
});
const line = (e) => JSON.stringify(e) + '\n';
test('Ein Eintrag aus dem Zusammenführen ist gültig und nennt Modell und Agent-Typ der KI-Tester', () => {
  const e = valid();
  assert.deepEqual(protocolErrors(line(e)), []);
  assert.equal(e.ablauf, VERSION);
  assert.deepEqual(e.agent, { modell: 'claude-opus-5-5', typ: 'general-purpose' });
  assert.deepEqual(Object.keys(e.urteile), ['A', 'B']);
  assert.deepEqual([e.ergebnis.verschiebung, e.ergebnis.position], [-5, 55]);
});
test(`Das versionierte Protokoll ist gültig (${protocolFile.replace(root, '.')})`, () => {
  const text = readFileSync(protocolFile, 'utf8');
  assert.deepEqual(protocolErrors(text), []);
  const entries = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  const per = Object.keys(VERSIONS).map(v => `Ablauf ${v}: ${entries.filter(e => e.ablauf === v).length}`);
  console.log(`        ${entries.length} Einträge (${per.join(', ')})`);
});
test('Versionen: die aktuelle mit ihrem Fingerabdruck, Ablauf 1 als Geschichte, dazu die des Würfels', () => {
  assert.deepEqual(Object.keys(VERSIONS), ['1', '2', ...Object.keys(WUERFEL_ANKER)]);
  assert.deepEqual(Object.keys(VERSIONS).filter(v => VERSIONS[v].wuerfel), Object.keys(WUERFEL_ANKER));
  assert.equal(VERSIONS[VERSION].fingerabdruck, FINGERPRINT);
  assert.deepEqual([VERSIONS[1].referenz, VERSIONS[2].referenz], ['heutige Reihenfolge', 'Reihenfolge im Spiel']);
  assert.equal(valid().referenz.art, VERSIONS[VERSION].referenz);
});
test('Ablauf 1 bleibt gültig lesbar: 43 Einträge mit der heutigen Reihenfolge und den vorläufigen Graden', () => {
  const old = readFileSync(protocolFile, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l))
    .filter(e => e.ablauf === '1');
  assert.equal(old.length, 43);
  for (const e of old) {
    const g = PROVISIONAL_GRADES.find(x => e.referenz.position >= x.from && e.referenz.position <= x.to);
    assert.deepEqual([e.referenz.art, e.referenz.grad, e.referenz.von, e.referenz.bis],
      ['heutige Reihenfolge', g.name, g.from, g.to], `${e.lauf} ${e.level.id}`);
  }
  assert.deepEqual(protocolErrors(old.map(line).join('')), []);
});
// Gegenproben: eine Kopie des Protokolls mit einem verfälschten Eintrag muss mit der erwarteten Meldung rot werden
const both = (e, over) => { for (const t of ['A', 'B']) Object.assign(e.urteile[t], over); };
const tampered = [
  ['Anker verschoben', (e) => {
    e.level = A3; e.referenz = fixedReference(35); both(e, { level: 'A3', einordnung: 'A3' });
    e.ergebnis = { abgelehnt: false, gruende: [], verschiebung: 1, position: 36 };
  }, /Anker A3 verschoben/],
  ['unbekannte Version', (e) => { e.ablauf = '9'; }, /Version des Ablaufs fehlt oder unbekannt \(9\)/],
  ['Ablauf 1 mit der Referenz von Ablauf 2', (e) => { e.ablauf = '1'; },
    /Referenz nicht die von Ablauf 1 \(heutige Reihenfolge\)/],
  ['Ablauf 2 mit der Referenz von Ablauf 1', (e) => { e.referenz.art = 'heutige Reihenfolge'; },
    /Referenz nicht die von Ablauf 2 \(Reihenfolge im Spiel\)/],
  ['Ablauf 1 mit anderen als den vorläufigen Graden', (e) => {
    e.ablauf = '1'; e.referenz = { art: 'heutige Reihenfolge', position: 60, grad: 'mittel', von: 33, bis: 102 };
  }, /Referenz nicht die von Ablauf 1 \(heutige Reihenfolge\)/],
  // Seit dem Ausbau auf 500 Level ohne Obergrenze: Kandidaten stehen in einer Vorschau, die länger ist als das Spiel
  ['Ablauf 2 mit einem Grad vor Platz 1', (e) => { e.referenz.von = 0; }, /Referenz nicht die von Ablauf 2/],
  ['Verschiebung 6', (e) => { e.ergebnis.verschiebung = -6; e.ergebnis.position = 54; }, /Verschiebung −6: mehr als 5 Plätze/],
  ['über die Gradgrenze 30/31', (e) => {
    e.referenz = fixedReference(33); e.ergebnis.verschiebung = -5; e.ergebnis.position = 28;
  }, /Platz 28 ausserhalb von mittel \(31–100\)/],
  ['über die Gradgrenze 100/101, wo kein Anker steht', (e) => {
    e.referenz = fixedReference(98); both(e, { einordnung: 'A5-A6' });
    e.ergebnis.verschiebung = 3; e.ergebnis.position = 101;
  }, /Platz 101 ausserhalb von mittel \(31–100\)/],
  ['abgelehnt, obwohl nur einer ablehnt', (e) => {
    e.ergebnis = { abgelehnt: true, gruende: ['Knäuel'], verschiebung: 0, position: 60 };
  }, /abgelehnt, aber nicht beide nennen einen Begriff, der bei mittel gilt/],
  ['abgelehnt mit Füllteil in einem leichten Level', (e) => {
    e.referenz = fixedReference(12); both(e, { einordnung: 'A1-A2', ablehnung: ['Füllteil'] });
    e.ergebnis = { abgelehnt: true, gruende: ['Füllteil'], verschiebung: 0, position: 12 };
  }, /abgelehnt, aber nicht beide nennen einen Begriff, der bei leicht gilt/],
  ['nicht abgelehnt, obwohl beide ablehnen', (e) => { e.urteile.B.ablehnung = ['Zerfall']; }, /gilt, aber nicht abgelehnt/],
  ['abgelehnt und verschoben', (e) => {
    e.urteile.B.ablehnung = ['Knäuel']; e.ergebnis.abgelehnt = true; e.ergebnis.gruende = ['Knäuel'];
  }, /abgelehnt und verschoben/],
  ['Gefühl 6', (e) => { e.urteile.A.gefuehl = 6; }, /gefuehl: 6 nicht in 1–5/],
  ['Ablehnung ohne Glossarbegriff', (e) => { e.urteile.A.ablehnung = ['langweilig']; }, /ablehnung\[0\]: "langweilig" ist nicht erlaubt/],
  ['Ablehnung als Begriff statt als Liste', (e) => { e.urteile.A.ablehnung = 'Knäuel'; }, /ablehnung: string statt array/],
  ['nur ein Urteil', (e) => { delete e.urteile.B; }, /Urteile von A und B nötig/],
  ['Verschiebung gegen die Regel', (e) => { e.ergebnis.verschiebung = -2; e.ergebnis.position = 58; }, /Ergebnis entspricht nicht der Regel/],
  ['Platz passt nicht zur Verschiebung', (e) => { e.ergebnis.position = 57; }, /Platz 57 ist nicht 60 −5/],
  ['ohne Datum', (e) => { delete e.datum; }, /Datum fehlt/],
  ['ohne Version', (e) => { e.ablauf = ''; }, /Version des Ablaufs fehlt oder unbekannt/],
  ['ohne Modell der KI-Tester', (e) => { delete e.agent.modell; }, /Modell oder Agent-Typ der KI-Tester fehlt/],
  ['ohne Begründung', (e) => { e.begruendung = ''; }, /Begründung fehlt/],
  ['doppelter Eintrag', null, /: doppelt$/],
];
for (const [name, spoil, expected] of tampered) {
  test(`Gegenprobe: ${name}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'prisma-protokoll-'));
    try {
      const copy = join(dir, 'protocol.jsonl');
      copyFileSync(protocolFile, copy);
      const bad = valid();
      if (spoil) spoil(bad);
      else appendFileSync(copy, line(bad));
      appendFileSync(copy, line(bad));
      const errors = protocolErrors(readFileSync(copy, 'utf8'));
      assert.ok(errors.some(m => expected.test(m)), `erwartet ${expected}, gemeldet: ${errors.join(' | ') || 'nichts'}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

console.log('Kandidaten ohne Platz im Spiel (Austausch, Tickets 23–26)');
// Zwei erfundene Kandidaten: Leveldaten zweier leichter Level, ohne Namen und mit einer anderen Startstellung
const kandidatAus = (l) => ({ name: '', grad: l.grad, solution: l.solution,
  elements: l.elements.map(e => (e.type === 'combiner' && !e.fixed ? { ...e, dir: ((e.dir ?? 0) + 1) % 8 }
    : ['mirror', 'prism'].includes(e.type) && !e.fixed ? { ...e, rot: ((e.rot ?? 0) + 1) % 8 } : e)) });
const HAUPT = L.LEVELS.slice(L.TUTORIAL_COUNT), KANDIDATEN = [HAUPT[2], HAUPT[5]].map(kandidatAus);
test('Seite mit Kandidaten: index.html mit <base> und den Kandidaten am Ende von LEVELS, sonst gleich', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8'), basis = pathToFileURL(root).href + '/';
  const seite = seiteMitLeveln(html, KANDIDATEN, basis);
  const kopf = html.indexOf('<head>') + '<head>'.length;
  assert.match(seite.slice(kopf), new RegExp(`^\\r?\\n<base href="${basis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  const logik = (h) => new Function(`${h.slice(h.indexOf('/* LOGIC:BEGIN'), h.indexOf('/* LOGIC:END'))}
    return LEVELS;`)();
  const vorher = logik(html), nachher = logik(seite);
  assert.equal(nachher.length, vorher.length + 2);
  assert.deepEqual(nachher.slice(0, vorher.length), vorher);
  assert.deepEqual(nachher.slice(-2), KANDIDATEN);
  // Ausser <base> und den zwei Blöcken vor LEVELS:END ist die Seite index.html
  const ohne = seite.replace(/\r?\n<base href="[^"]+">/, ''), ende = html.indexOf('  /* LEVELS:END */');
  assert.ok(ohne.startsWith(html.slice(0, ende)) && ohne.endsWith(html.slice(ende)), 'sonst gleich');
});
test('prepare.mjs --kandidaten: Name „Kandidat <Abdruck>“, Referenz am Platz der Formel, Feld und Seite aus den Daten',
  () => {
    const lauf = `test-kandidaten-${process.pid}`, dir = join(root, 'tests', 'output', 'ki-tester', lauf);
    const datei = join(mkdtempSync(join(tmpdir(), 'prisma-kandidaten-')), 'kandidaten.json');
    const prepare = (liste) => {
      writeFileSync(datei, JSON.stringify(liste));
      return spawnSync(process.execPath, [join(root, 'tools', 'ki-tester', 'prepare.mjs'), lauf, '--kandidaten', datei,
        '--ohne-bilder'], { encoding: 'utf8' });
    };
    try {
      const p = prepare(KANDIDATEN.map((level, k) => ({ formel: 12 + k, level, name: 'egal' })));
      assert.equal(p.status, 0, p.stderr);
      const lj = JSON.parse(readFileSync(join(dir, 'lauf.json'), 'utf8'));
      assert.equal(lj.level.length, 2);
      for (const [k, level] of KANDIDATEN.entries()) {
        const l = lj.level.find(x => x.name === kandidatName(level));
        assert.ok(l, `${kandidatName(level)} fehlt`);
        assert.deepEqual([l.position, l.grad, l.anker, l.kandidat], [12 + k, 'leicht', null, true]);
        assert.deepEqual(l.referenz, reference(12 + k));
        assert.equal(readFileSync(join(dir, 'eingabe', `${l.id}.md`), 'utf8'), fieldText(level, l.id));
      }
      // Die Seite für die Bilder liegt ausserhalb von eingabe/ und hat die Kandidaten in der Reihenfolge der Kennungen
      const ids = lj.level.map(x => x.id).sort();
      const seite = readFileSync(join(dir, 'seite', 'index.html'), 'utf8');
      assert.equal(seite, seiteMitLeveln(readFileSync(join(root, 'index.html'), 'utf8'),
        ids.map(id => KANDIDATEN.find(lv => kandidatName(lv) === lj.level.find(x => x.id === id).name)),
        pathToFileURL(root).href + '/'));
      assert.ok(!readFileSync(join(dir, 'auftrag-A.md'), 'utf8').includes('Kandidat'), 'Name im Auftrag');
      // Ein Kandidat mit einem anderen Grad als dem seines Platzes wird abgewiesen
      rmSync(dir, { recursive: true, force: true });
      const falsch = prepare([{ formel: 100, level: KANDIDATEN[0] }]);
      assert.notEqual(falsch.status, 0);
      assert.match(falsch.stderr, /Grad leicht, auf Platz 100 gilt mittel/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(dirname(datei), { recursive: true, force: true });
    }
  });
test('prepare.mjs --kandidaten mit Vorschau (Ausbau): Plätze, Grade, Referenz und Anker in der Reihenfolge der Vorschau',
  () => {
    const lauf = `test-vorschau-${process.pid}`, dir = join(root, 'tests', 'output', 'ki-tester', lauf);
    const datei = join(mkdtempSync(join(tmpdir(), 'prisma-vorschau-')), 'ordnung.json');
    // Die Vorschau wie aus ordne-level.mjs --ausbau --json: das Spiel, dazu auf Platz 3 und 5 die zwei Kandidaten
    const reihe = HAUPT.map(l => ({ name: l.name, grad: l.grad }));
    const mit = [...reihe.slice(0, 2), { kandidat: KANDIDATEN[0] }, ...reihe.slice(2, 3), { kandidat: KANDIDATEN[1] },
      ...reihe.slice(3)];
    // Die Anker und das Level auf Platz 12 stehen darin, wie ordne-level.mjs ein neues Level im Spiel (Austausch oder
    // früherer Ausbau) ausgibt: mit kandidat und Leveldaten; sie zählen trotzdem unter ihrem Namen im Spiel
    const alsNeu = new Set([...loadAnchors().map(a => a.name), HAUPT[9].name]);
    const liste = mit.map((x, k) => (x.kandidat ? { platz: k + 1, formel: k + 1, name: kandidatName(x.kandidat),
      kandidat: kandidatName(x.kandidat), grad: 'leicht', level: x.kandidat, ausbau: true }
      : { platz: k + 1, name: x.name, grad: x.grad,
        ...(alsNeu.has(x.name) ? { kandidat: kandidatName(HAUPT.find(l => l.name === x.name)),
          level: HAUPT.find(l => l.name === x.name) } : {}) }));
    writeFileSync(datei, JSON.stringify(liste));
    try {
      const p = spawnSync(process.execPath, [join(root, 'tools', 'ki-tester', 'prepare.mjs'), lauf, '12', '--kandidaten',
        datei, '--ohne-bilder'], { encoding: 'utf8' });
      assert.equal(p.status, 0, p.stderr);
      const lj = JSON.parse(readFileSync(join(dir, 'lauf.json'), 'utf8'));
      const vorschau = mit.map(x => (x.kandidat ? { name: kandidatName(x.kandidat), grad: 'leicht' } : x));
      assert.equal(lj.level.length, 3);
      assert.deepEqual(lj.level.filter(x => !x.kandidat).map(x => [x.name, x.position]), [[HAUPT[9].name, 12]]);
      for (const [k, level] of KANDIDATEN.entries()) {
        const l = lj.level.find(x => x.name === kandidatName(level));
        assert.deepEqual([l.position, l.kandidat], [3 + 2 * k, true]);
        assert.deepEqual(l.referenz, reference(3 + 2 * k, vorschau));
      }
      // Die Anker stehen auf ihrem Platz in der Vorschau: hinter den Kandidaten zwei Plätze weiter als im Spiel
      for (const a of loadAnchors()) {
        assert.equal(lj.anker[a.id], vorschau.findIndex(x => x.name === a.name) + 1, a.id);
        if (a.position > 3) assert.equal(lj.anker[a.id], a.position + 2, a.id);
      }
      assert.equal(lj.vorschau, datei);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(dirname(datei), { recursive: true, force: true });
    }
  });

console.log('Würfel: Feld als Text');
// Die Würfel-Vorschau in der Form von ordne-wuerfel.mjs --json: die Würfel-Level im Spiel in ihrer Reihenfolge, jeder
// Kandidat hinter dem letzten Level seines Grads (oder eines leichteren), damit der Grad nie sinkt
const GRAD_RANG = ['leicht', 'mittel', 'schwer', 'sehr schwer'];
const VORSCHAU = (() => {
  const reihe = WUERFEL_IM_SPIEL.map(l => ({ name: l.name, grad: l.grad, wuerfel: true }));
  const kandidaten = JSON.parse(readFileSync(join(root, 'tests', 'ki-tester', 'wuerfel-kandidaten.json'), 'utf8'));
  for (const k of kandidaten) {
    const rang = GRAD_RANG.indexOf(k.level.grad);
    const hinter = reihe.findLastIndex(x => GRAD_RANG.indexOf(x.grad) <= rang);
    reihe.splice(hinter + 1, 0, { name: k.kandidat, grad: k.level.grad, wuerfel: true, kandidat: k.kandidat,
      level: k.level });
  }
  return reihe.map((x, i) => ({ platz: i + 1, ...x }));
})();
const WUERFEL_KANDIDATEN = VORSCHAU.filter(x => x.level);
// die Reihenfolge der Vorschau, wie prepare.mjs sie liest
const VORSCHAU_REIHE = VORSCHAU.map(x => ({ name: x.kandidat ?? x.name, grad: x.grad }));
const WUERFEL_LEVEL = [...WUERFEL_IM_SPIEL, ...WUERFEL_KANDIDATEN.map(x => x.level)];
const AXIS_TEXT = { y: 'Achse y (senkrecht)', x: 'Achse x (West–Ost)', z: 'Achse z (Nord–Süd)' };
test('Würfel: kennt weder Lösung noch Name noch Grad, nennt jedes Element mit Zelle (x,y,z) und Achse', () => {
  for (const lvl of WUERFEL_LEVEL) {
    const text = fieldText(lvl, 'L1'), wo = lvl.name;
    assert.equal(fieldText({ ...lvl, solution: undefined }, 'L1'), text, `${wo}: hängt von der Lösung ab`);
    assert.equal(fieldText({ ...lvl, name: 'Anders', grad: 'sehr schwer' }, 'L1'), text, `${wo}: Name oder Grad`);
    assert.ok(!text.includes(lvl.name), `${wo}: Name verrät das Level`);
    const h = lvl.height || lvl.size;
    assert.match(text, new RegExp(`^Würfel 7 × 7 × ${h} auf einer Plattform\\. Jede Zelle hat drei Koordinaten \\(x,y,z\\)`, 'm'));
    for (const e of lvl.elements) {
      const line = text.split('\n').find(l => l.startsWith(`- (${e.x},${e.y},${e.z}) `));
      assert.ok(line, `${wo}: (${e.x},${e.y},${e.z}) fehlt unter Elemente`);
      if (['mirror', 'prism', 'combiner', 'source'].includes(e.type)) {
        assert.ok(line.includes(AXIS_TEXT[e.axis || 'y']), `${wo}: Achse fehlt in ${line}`);
      }
    }
    // Ebene für Ebene: jede Ebene einmal, eine leere in einer Zeile
    for (let y = 0; y < h; y++) {
      const leer = !lvl.elements.some(e => e.y === y);
      assert.equal(text.split('\n').filter(l => l.startsWith(`Ebene y=${y}`)).length, 1, `${wo}: Ebene ${y}`);
      assert.equal(new RegExp(`^Ebene y=${y}[^\\n]*: leer$`, 'm').test(text), leer, `${wo}: Ebene ${y} leer?`);
    }
    // je Abschnitt des Lichts eine Zeile
    const r = L.traceBeams(L.createBoard(lvl));
    const licht = text.slice(text.indexOf('## Licht'), text.indexOf('\nZiele:')).split('\n')
      .filter(l => l.startsWith('- '));
    assert.equal(licht.length, r.segments.length || 1, `${wo}: Abschnitte des Lichts`);
  }
});
test('Würfel: Licht in drei Koordinaten, die Richtungen als Wörter, Enden auf der Plattform und am Rand', () => {
  const aufzug = fieldText(AUFZUG, 'A1');
  assert.ok(aufzug.includes('- weiss von (0,0,3) nach Ost bis (3,0,3), Spiegel lenkt um\n'), 'Aufzug, Spiegel');
  assert.ok(aufzug.includes('- weiss von (3,0,3) nach unten, endet auf der Plattform\n'), 'Aufzug, Plattform');
  assert.ok(aufzug.includes('- (3,3,3) Prisma, drehbar, Achse x (West–Ost), Farbfächer nach Süd (weisses Licht: '
    + 'Rot nach Süd und unten, Grün nach Süd, Blau nach Süd und oben)'), 'Aufzug, Prisma');
  assert.ok(aufzug.includes('- (3,0,3) Spiegel, drehbar, Achse z (Nord–Süd), Fläche durch die Achse (Nord–Süd) und '
    + 'West oben–Ost unten'), 'Aufzug, Spiegel');
  const kern = fieldText(KERN, 'A2');
  assert.ok(kern.includes('- rot von (4,6,6) nach West und unten bis (1,3,6), trifft das Ziel\n'), 'Kern, schräg');
  assert.ok(kern.includes('- blau von (4,6,6) nach West und oben, verlässt den Würfel\n'), 'Kern, oben hinaus');
  assert.ok(kern.includes('- (1,3,6) grün: bekommt rot, falsche Farbe'), 'Kern, Ziel');
  // floor nach einigen Schritten schräg nach unten, edge nach einigen Schritten seitlich
  const probe = { name: 'Probe', dim: 3, size: 7, elements: [
    { type: 'source', x: 0, y: 3, z: 3, axis: 'z', dir: 1 },
    { type: 'source', x: 2, y: 5, z: 0, dir: 2, color: 'blue' },
    { type: 'prism', x: 2, y: 5, z: 4, axis: 'x', rot: 0 },
    { type: 'target', x: 6, y: 6, z: 6, color: 'red' },
    { type: 'mirror', x: 6, y: 0, z: 6, axis: 'x', rot: 0 },
  ], solution: {} };
  const text = fieldText(probe, 'L1');
  assert.ok(text.includes('- weiss von (0,3,3) nach Ost und unten bis (3,0,3), endet auf der Plattform\n'), 'floor');
  assert.ok(text.includes('- blau von (2,5,4) nach Süd und oben bis (2,6,5), verlässt den Würfel\n'), 'edge');
  assert.ok(text.includes('- (0,3,3) Quelle weiss, Achse z (Nord–Süd), strahlt nach Ost und unten'), 'Quelle');
  assert.match(text, /^Ebene y=1: leer$/m);
  // die Lage der Spiegelfläche als Wort
  assert.ok(text.includes('- (6,0,6) Spiegel, drehbar, Achse x (West–Ost), Fläche durch die Achse (West–Ost) und '
    + 'Nord–Süd, liegt waagrecht\n'), 'waagrecht');
  assert.ok(aufzug.includes('West oben–Ost unten, steht schräg\n'), 'schräg');
  assert.ok(kern.includes('und unten–oben, steht senkrecht\n'), 'senkrecht');
});
test('Würfel: Quader 7 × 7 × 5 (height) mit fünf Ebenen, Licht nach oben endet über der Ebene 4', () => {
  const quader = { name: 'Quader', dim: 3, size: 7, height: 5, solution: {}, elements: [
    { type: 'source', x: 3, y: 0, z: 3, axis: 'z', dir: 6 }, { type: 'target', x: 0, y: 4, z: 0 }] };
  const text = fieldText(quader, 'L1');
  assert.match(text, /^Würfel 7 × 7 × 5 auf einer Plattform\..* Ebene y = 0 … 4 von unten nach oben/m);
  assert.match(text, /Zeile z = 0 … 6 von hinten nach vorne/);
  assert.match(text, /^Ebene y=4 \(oben\):$/m);
  assert.ok(!text.includes('Ebene y=5'), 'Ebene 5');
  assert.ok(text.includes('- weiss von (3,0,3) nach oben bis (3,4,3), verlässt den Würfel\n'), text);
});
test('Würfel: Die flache Ausgabe hängt nicht vom Würfel ab (Felder ohne dim wie bisher)', () => {
  const flat = L.LEVELS[L.TUTORIAL_COUNT];
  assert.ok(!fieldText(flat, 'L1').includes('Würfel') && fieldText(flat, 'L1').startsWith('# Level L1\n\nFeld 7 × 7.'));
});

console.log('Würfel: Versionen, Anker, Auftrag');
test(`Würfel-Version ${WUERFEL_VERSION}: alles, was die KI-Tester im Würfel sehen, ist unverändert (Fingerabdruck)`,
  () => {
  assert.equal(fingerprintWuerfel(), WUERFEL_FINGERPRINT, 'Auftrag, Würfel-Anker, Schema, Glossar oder Feld eines '
    + 'Würfel-Ankers geändert: neue Version in anchors-wuerfel.json und WUERFEL_FINGERPRINTS in protocol.mjs');
  assert.equal(WUERFEL_VERSION, Object.keys(WUERFEL_ANKER).at(-1), 'die letzte Version ist die aktuelle');
  for (const v of Object.keys(WUERFEL_ANKER)) {
    assert.match(v, /^W[1-9][0-9]*$/, v);
    assert.ok(/^[0-9a-f]{16}$/.test(WUERFEL_FINGERPRINTS[v]), `${v}: Fingerabdruck fehlt`);
    assert.equal(VERSIONS[v].fingerabdruck, WUERFEL_FINGERPRINTS[v], v);
    assert.deepEqual(VERSIONS[v].kennungen, WUERFEL_ANKER[v].anker.map(a => a.id), v);
  }
  // der Fingerabdruck der flachen Version hängt nicht am Würfel
  assert.equal(fingerprint(), FINGERPRINT);
  assert.notEqual(WUERFEL_FINGERPRINT, FINGERPRINT);
});
test('Würfel-Anker: in eigener Datei mit Namen, Kennungen A1 … An, Würfel-Level im Spiel, nach Platz geordnet', () => {
  for (const [v, w] of Object.entries(WUERFEL_ANKER)) {
    assert.deepEqual(w.anker.map(a => a.id), w.anker.map((_, k) => `A${k + 1}`), v);
    assert.equal(new Set(w.anker.map(a => a.name)).size, w.anker.length, `${v}: Namen doppelt`);
    for (const a of w.anker) {
      assert.ok(['leicht', 'mittel', 'schwer', 'sehr schwer'].includes(a.grad), `${v} ${a.id}: Grad`);
      assert.ok([null, 'unten', 'oben'].includes(a.ende), `${v} ${a.id}: Ende`);
      assert.ok(a.begruendung.length > 40, `${v} ${a.id}: Begründung fehlt`);
    }
  }
  // die aktuelle Auswahl steht im Spiel, als Würfel-Level; W1: die zwei handgebauten (Entscheid des Koordinators)
  const anchors = loadAnchorsWuerfel();
  assert.ok(anchors.every(a => WUERFEL_IM_SPIEL[a.position - 1].dim === 3));
  assert.deepEqual(WUERFEL_ANKER.W1.anker.map(a => [a.id, a.name, a.grad]), [['A1', 'Aufzug', 'leicht'],
    ['A2', 'Kern', 'leicht']]);
  for (const a of anchors) assert.equal(WUERFEL_IM_SPIEL[a.position - 1].grad, a.grad, `${a.id}: Grad im Spiel`);
  // in der Vorschau auf dem Platz ihres Namens, nach Platz geordnet und im Grad ihres Platzes
  const imVorschau = loadAnchorsWuerfel(VORSCHAU_REIHE);
  for (const [k, a] of imVorschau.entries()) {
    assert.equal(a.position, VORSCHAU_REIHE.findIndex(x => x.name === a.name) + 1, a.id);
    assert.ok(!k || a.position > imVorschau[k - 1].position, `${a.id}: nicht nach Platz geordnet`);
    assert.equal(VORSCHAU_REIHE[a.position - 1].grad, a.grad, a.id);
  }
  // W1 in einer Reihenfolge, in der Aufzug und Kern stehen (eine ältere Version braucht ihre Anker nicht im Spiel)
  const w1 = loadAnchorsWuerfel([{ name: 'X' }, { name: 'Aufzug' }, { name: 'Y' }, { name: 'Kern' }], 'W1');
  assert.deepEqual(w1.map(a => [a.id, a.position]), [['A1', 2], ['A2', 4]]);
});
test('Würfel: Schema mit den Einordnungen der Anker, sonst wie answer.schema.json', () => {
  assert.deepEqual(placings(['A1', 'A2']), ['<A1', 'A1', 'A1-A2', 'A2', '>A2']);
  assert.deepEqual(placings(loadAnchors().map(a => a.id)), SCHEMA.properties.einordnung.enum, 'flach');
  const s = schemaOf(WUERFEL_VERSION), ids = VERSIONS[WUERFEL_VERSION].kennungen;
  assert.deepEqual(s.properties.einordnung.enum, placings(ids));
  assert.equal(schemaOf(VERSION), SCHEMA);
  const ohne = (x) => {
    const c = structuredClone(x);
    delete c.properties.level; delete c.properties.einordnung;
    return c;
  };
  assert.deepEqual(ohne(s), ohne(SCHEMA), 'übrige Felder gleich');
  // die aktuelle Version: alle Einordnungen ihrer Anker, keine zu einem Anker dahinter
  const errors = (a, level = LEVEL, schema = s) => answerErrors(answer(a), level, schema);
  const n = ids.length, weiter = `A${n + 1}`;
  for (const e of placings(ids)) assert.deepEqual(errors({ einordnung: e }), [], e);
  for (const e of [`A${n}-${weiter}`, weiter, `>${weiter}`]) assert.notDeepEqual(errors({ einordnung: e }), [], e);
  assert.notDeepEqual(errors({ level: weiter, einordnung: `A${n}` }, { id: weiter, anker: weiter }), [],
    `Kennung ${weiter}`);
  assert.deepEqual(schemaFor(ids), s);
  // W1 mit zwei Ankern: fünf Einordnungen
  const w1 = schemaOf('W1');
  assert.deepEqual(w1, schemaFor(['A1', 'A2']));
  for (const e of ['<A1', 'A1', 'A1-A2', 'A2', '>A2']) assert.deepEqual(errors({ einordnung: e }, LEVEL, w1), [], e);
  for (const e of ['A2-A3', 'A3', '>A8']) assert.notDeepEqual(errors({ einordnung: e }, LEVEL, w1), [], e);
  assert.notDeepEqual(errors({ level: 'A3', einordnung: 'A2' }, { id: 'A3', anker: 'A3' }, w1), [], 'Kennung A3');
});
test('Würfel: Auftrag aus brief-wuerfel.md, alles eingesetzt, Anker ohne Namen, vier Bilder je Level', () => {
  const text = brief({ tester: 'A', lauf: 'wuerfel-test', wuerfel: true, eingabe: 'x/eingabe',
    ausgabe: 'x/antwort-A/urteile.json', levels: [{ id: 'L1', anker: null }, { id: 'A2', anker: 'A2' }] });
  assert.ok(!/\{\{|\}\}|<!--/.test(text), 'Platzhalter oder Vorlagen übrig');
  assert.ok(text.startsWith(`# Auftrag an KI-Tester A (Lauf wuerfel-test, Ablauf ${WUERFEL_VERSION})`));
  assert.ok(text.includes('## Das Spiel im Würfel') && text.includes('Drehachse'));
  for (const a of loadAnchorsWuerfel()) {
    const ende = a.ende ? `, ${a.ende === 'unten' ? 'unteres' : 'oberes'} Ende des Grads` : '';
    assert.ok(text.includes(`- **${a.id}**: ${a.grad}${ende}. `), a.id);
    // als Wort: „Kern“ steckt in „Kernidee“
    assert.ok(!new RegExp(`(^|\\P{L})${a.name}(\\P{L}|$)`, 'u').test(text), `${a.name}: Name verrät den Anker`);
  }
  const werte = (ids) => `genau einer dieser Werte: ${placings(ids).map(p => `\`"${p}"\``).join(', ')}`;
  assert.ok(text.includes(werte(loadAnchorsWuerfel().map(a => a.id))), 'Einordnungen der aktuellen Version');
  // W1: zwei Anker ohne Ende des Grads, fünf Einordnungen
  const w1 = brief({ tester: 'A', lauf: 'wuerfel-test', wuerfel: true, version: 'W1', anchors: WUERFEL_ANKER.W1.anker,
    eingabe: 'x/eingabe', ausgabe: 'x/antwort-A/urteile.json', levels: [{ id: 'L1', anker: null }] });
  assert.ok(w1.startsWith('# Auftrag an KI-Tester A (Lauf wuerfel-test, Ablauf W1)'));
  assert.ok(w1.includes('genau einer dieser Werte: `"<A1"`, `"A1"`, `"A1-A2"`, `"A2"`, `">A2"`'));
  assert.ok(w1.includes('- **A1**: leicht. ') && w1.includes('- **A2**: leicht. '), 'W1 ohne Ende des Grads');
  assert.ok(text.includes('1. **L1**: `L1.md`, `bilder/L1-desktop.png`, `bilder/L1-desktop-oben.png`, '
    + '`bilder/L1-desktop-seite.png`, `bilder/L1-handy.png`'));
  assert.ok(text.includes(glossary().replace(/^## /gm, '### ')), 'Glossar fehlt');
  // „Was Spass verdirbt“ und die Regel des Ablehnens wie im flachen Auftrag
  const flach = brief({ tester: 'A', lauf: 'x', eingabe: 'x', ausgabe: 'y', levels: [] });
  const regel = (t) => t.slice(t.indexOf('- `ablehnung`'), t.indexOf('es kommt dann nicht ins Spiel.'));
  assert.equal(regel(text), regel(flach));
});

console.log('Würfel: Protokoll');
// Erfundene Einträge in der Form von W1 (zwei Anker): fest W1, unabhängig von der aktuellen Version
const W_ANKER = { A1: 2, A2: 4 };
// erfundene Würfel-Reihenfolge: leicht 1–4, mittel 5–30
const wReferenz = (position) => ({ art: 'Reihenfolge der Würfel', position, grad: position <= 4 ? 'leicht' : 'mittel',
  von: position <= 4 ? 1 : 5, bis: position <= 4 ? 4 : 30 });
const wValid = (over = {}) => entry({
  datum: '2026-10-24', ablauf: 'W1', lauf: 'wuerfel-1', agent: AGENT, level: LEVEL, referenz: wReferenz(10),
  anker: { ...W_ANKER },
  urteile: { A: answer({ einordnung: '>A2' }), B: answer({ einordnung: '>A2', ablehnung: ['Knäuel'] }) },
  ...over,
});
test('Ein Würfel-Eintrag ist gültig: Version W…, Lauf wuerfel-…, Referenz in der Reihenfolge der Würfel', () => {
  const e = wValid();
  assert.deepEqual(protocolErrors(line(e)), []);
  assert.deepEqual([e.ablauf, e.referenz.art, e.ergebnis.verschiebung, e.ergebnis.abgelehnt], ['W1',
    'Reihenfolge der Würfel', 0, false]);
  const erfunden = Array.from({ length: 30 }, (_, k) => ({ name: `W${k + 1}`, grad: k < 4 ? 'leicht' : 'mittel' }));
  for (const p of [2, 10]) assert.deepEqual(referenceWuerfel(p, erfunden), wReferenz(p), String(p));
  // die aktuelle Version mit den Plätzen ihrer Anker im Spiel, für ein Level im Spiel, das kein Anker ist
  const anchors = loadAnchorsWuerfel();
  const position = WUERFEL_IM_SPIEL.findIndex((_, k) => !anchors.some(a => a.position === k + 1)) + 1;
  const urteil = answer({ einordnung: `>${anchors.at(-1).id}` });
  const jetzt = entry({ datum: '2026-10-24', ablauf: WUERFEL_VERSION, lauf: 'wuerfel-1', agent: AGENT, level: LEVEL,
    referenz: referenceWuerfel(position), anker: Object.fromEntries(anchors.map(a => [a.id, a.position])),
    urteile: { A: urteil, B: urteil } });
  assert.deepEqual(protocolErrors(line(jetzt)), [], WUERFEL_VERSION);
});
test('Würfel: Zusammenführen mit zwei Ankern, höchstens 5 Plätze, nie über eine Gradgrenze', () => {
  const both = (a, b, position) => merge({ level: LEVEL, referenz: wReferenz(position), anker: W_ANKER,
    urteile: { A: answer({ einordnung: a }), B: answer({ einordnung: b }) } }).ergebnis;
  assert.equal(both('>A2', '>A2', 20).verschiebung, 0, 'mittel ist schwerer als A2');
  // von 3 aus wollen beide über A2 hinaus (ab 5), leicht endet bei 4: +1, an A2 vorbei
  assert.deepEqual([both('>A2', '>A2', 3).verschiebung, both('>A2', '>A2', 3).position], [1, 4]);
  assert.equal(both('<A1', 'A1', 4).verschiebung, -1, 'A1 heisst 1–3, <A1 Platz 1');
  assert.equal(both('A1-A2', 'A1-A2', 12).verschiebung, -5, 'mittel beginnt bei 5, höchstens 5 Plätze');
  assert.equal(both('A1-A2', '>A2', 12).verschiebung, 0, 'nur gemeinsam');
});
const wGegenproben = [
  ['Würfel-Ablauf in einem flachen Lauf', (e) => { e.lauf = 'ausbau-1'; },
    /Würfel-Ablauf W1 in einem Lauf ohne wuerfel-/],
  ['flacher Ablauf in einem Würfel-Lauf', (e) => { e.ablauf = '2'; e.referenz.art = 'Reihenfolge im Spiel'; },
    /Lauf wuerfel-1 mit dem flachen Ablauf 2/],
  ['Würfel mit der Referenz der flachen Level', (e) => { e.referenz.art = 'Reihenfolge im Spiel'; },
    /Referenz nicht die von Ablauf W1 \(Reihenfolge der Würfel\)/],
  ['Einordnung zu einem Anker, den es im Würfel nicht gibt', (e) => { e.urteile.A.einordnung = 'A3-A4'; },
    /einordnung: "A3-A4" ist nicht erlaubt/],
  ['Plätze der Würfel-Anker fehlen', (e) => { delete e.anker.A2; }, /Plätze der Anker fehlen/],
  ['Würfel-Anker verschoben', (e) => {
    e.level = { id: 'A2', name: 'Kern', anker: 'A2' }; e.referenz = wReferenz(4);
    for (const t of ['A', 'B']) Object.assign(e.urteile[t], { level: 'A2', einordnung: 'A2', ablehnung: [] });
    e.ergebnis = { abgelehnt: false, gruende: [], verschiebung: -1, position: 3 };
  }, /Anker A2 verschoben/],
];
for (const [name, spoil, expected] of wGegenproben) {
  test(`Würfel-Gegenprobe: ${name}`, () => {
    const bad = wValid();
    spoil(bad);
    const errors = protocolErrors(readFileSync(protocolFile, 'utf8') + line(bad));
    assert.ok(errors.some(m => expected.test(m)), `erwartet ${expected}, gemeldet: ${errors.join(' | ') || 'nichts'}`);
  });
}
test('Würfel: Ein flacher Eintrag in einem Lauf wuerfel-… ist ungültig, die flachen Einträge bleiben gültig', () => {
  const e = valid();
  e.lauf = 'wuerfel-test';
  assert.ok(protocolErrors(line(e)).some(m => /mit dem flachen Ablauf 2/.test(m)));
  const flach = readFileSync(protocolFile, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l))
    .filter(x => !VERSIONS[x.ablauf]?.wuerfel);
  assert.deepEqual(protocolErrors(flach.map(line).join('')), []);
});

console.log('Würfel: Kandidaten (Vorschau, Seite)');
test('Seite mit Würfel-Kandidaten: <base> und die Kandidaten am Ende von LEVELS_3D, sonst wie index.html', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8'), basis = pathToFileURL(root).href + '/';
  const neu = WUERFEL_KANDIDATEN.map(x => x.level);
  const seite = seiteMitWuerfeln(html, neu, basis);
  const logik = (h) => new Function(`${h.slice(h.indexOf('/* LOGIC:BEGIN'), h.indexOf('/* LOGIC:END'))}
    return { LEVELS, LEVELS_3D };`)();
  const vorher = logik(html), nachher = logik(seite);
  assert.deepEqual(nachher.LEVELS, vorher.LEVELS, 'flache Level unverändert');
  assert.deepEqual(nachher.LEVELS_3D, [...vorher.LEVELS_3D, ...neu]);
  const ohne = seite.replace(/\r?\n<base href="[^"]+">/, '');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const ende = html.indexOf(`${nl}];`, html.indexOf('const LEVELS_3D = [')) + nl.length;
  assert.ok(ohne.startsWith(html.slice(0, ende)) && ohne.endsWith(html.slice(ende)), 'sonst gleich');
});
test('prepare.mjs wuerfel-… --kandidaten <Würfel-Vorschau>: Plätze, Grade, Referenz und Anker in der Vorschau',
  () => {
    const lauf = `wuerfel-test-${process.pid}`, dir = join(root, 'tests', 'output', 'ki-tester', lauf);
    const tmp = mkdtempSync(join(tmpdir(), 'prisma-wuerfel-')), vorschauDatei = join(tmp, 'vorschau.json');
    writeFileSync(vorschauDatei, JSON.stringify(VORSCHAU));
    const run = (name, datei = vorschauDatei, ...mehr) => spawnSync(process.execPath, [join(root, 'tools',
      'ki-tester', 'prepare.mjs'), name, '--kandidaten', datei, '--ohne-bilder', ...mehr], { encoding: 'utf8' });
    try {
      const p = run(lauf, vorschauDatei, '--anker');
      assert.equal(p.status, 0, p.stderr);
      const lj = JSON.parse(readFileSync(join(dir, 'lauf.json'), 'utf8'));
      assert.deepEqual([lj.ablauf, lj.fingerabdruck, lj.wuerfel, lj.referenz], [WUERFEL_VERSION, WUERFEL_FINGERPRINT,
        true, 'Reihenfolge der Würfel']);
      // die Anker der aktuellen Version auf ihrem Platz in der Vorschau, hinter Kandidaten weiter als im Spiel
      const reihe = VORSCHAU_REIHE, anchors = loadAnchorsWuerfel(reihe);
      assert.deepEqual(lj.anker, Object.fromEntries(anchors.map(a => [a.id, a.position])));
      assert.deepEqual(lj.level.filter(l => l.anker).map(l => [l.id, l.name, l.position]),
        anchors.map(a => [a.id, a.name, a.position]));
      for (const a of loadAnchorsWuerfel()) {
        const davor = WUERFEL_KANDIDATEN.filter(x => x.platz < lj.anker[a.id]).length;
        assert.equal(lj.anker[a.id], a.position + davor, a.id);
      }
      assert.equal(lj.level.length, anchors.length + WUERFEL_KANDIDATEN.length);
      for (const x of WUERFEL_KANDIDATEN) {
        const l = lj.level.find(y => y.name === x.kandidat);
        assert.ok(l, `${x.kandidat} fehlt`);
        assert.deepEqual([l.position, l.grad, l.kandidat], [x.platz, x.grad, true]);
        assert.deepEqual(l.referenz, referenceWuerfel(x.platz, reihe));
        assert.equal(readFileSync(join(dir, 'eingabe', `${l.id}.md`), 'utf8'), fieldText(x.level, l.id));
      }
      for (const a of loadAnchorsWuerfel()) {
        assert.equal(readFileSync(join(dir, 'eingabe', `${a.id}.md`), 'utf8'),
          fieldText(WUERFEL_IM_SPIEL[a.position - 1], a.id));
      }
      assert.deepEqual(JSON.parse(readFileSync(join(dir, 'eingabe', 'answer.schema.json'), 'utf8')),
        schemaOf(WUERFEL_VERSION));
      const auftrag = readFileSync(join(dir, 'auftrag-B.md'), 'utf8');
      assert.ok(auftrag.includes('## Das Spiel im Würfel') && !auftrag.includes('Kandidat'), 'Auftrag');
      // Die Seite für die Bilder: die Kandidaten unter ihrem Namen am Ende von LEVELS_3D, nach Kennung
      const ids = lj.level.filter(l => l.kandidat).map(l => l.id).sort();
      const seite = readFileSync(join(dir, 'seite', 'index.html'), 'utf8');
      assert.equal(seite, seiteMitWuerfeln(readFileSync(join(root, 'index.html'), 'utf8'), ids.map((id) => {
        const name = lj.level.find(l => l.id === id).name;
        return { ...WUERFEL_KANDIDATEN.find(x => x.kandidat === name).level, name };
      }), pathToFileURL(root).href + '/'));
      // Abgewiesen: Würfel-Vorschau in einem flachen Lauf, flache Liste in einem Würfel-Lauf, falscher Grad
      rmSync(dir, { recursive: true, force: true });
      const flach = run(`test-flach-${process.pid}`);
      assert.notEqual(flach.status, 0);
      assert.match(flach.stderr, /Würfel-Vorschau nur in einem Lauf wuerfel-/);
      const falsch = join(tmp, 'falsch.json');
      writeFileSync(falsch, JSON.stringify(VORSCHAU.map(x => ({ ...x, wuerfel: undefined }))));
      assert.match(run(lauf, falsch).stderr, /keine Würfel-Vorschau/);
      const k = WUERFEL_KANDIDATEN[0], anders = k.grad === 'leicht' ? 'mittel' : 'leicht';
      writeFileSync(falsch, JSON.stringify(VORSCHAU.map(x => (x === k ? { ...x, level: { ...x.level,
        grad: anders } } : x))));
      assert.match(run(lauf, falsch).stderr, new RegExp(`Grad ${anders}, auf Platz ${k.platz} gilt ${k.grad}`));
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(tmp, { recursive: true, force: true });
    }
  });

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}`);
