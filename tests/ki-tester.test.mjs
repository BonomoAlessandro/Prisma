// Testet den Ablauf der KI-Tester (tools/ki-tester/): Schema der Antworten, Zusammenführen der beiden Urteile, die
// Anker, das Feld als Text, den Auftrag samt Fingerabdruck der Eingaben und das versionierte Protokoll.
// Aufruf: node tests/ki-tester.test.mjs [protokoll]   (Vorgabe tools/ki-tester/protocol.jsonl; mit einer Kopie, in der
//         ein Eintrag verfälscht ist, muss der Test rot werden)
import { copyFileSync, mkdtempSync, readFileSync, rmSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { L } from '../tools/solver.mjs';
import * as protocol from '../tools/ki-tester/protocol.mjs';
import { fieldText } from '../tools/ki-tester/field.mjs';

const {
  VERSION, FINGERPRINT, AGENT, fingerprint, GRADES, MAX_SHIFT, reference, loadAnchors, SCHEMA, glossary, rejectionTerms,
  brief, answerErrors, merge, entry, protocolErrors,
} = protocol;
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
const ANCHORS = { A1: 3, A2: 30, A3: 35, A4: 94, A5: 103, A6: 135, A7: 141, A8: 148 };
const LEVEL = { id: 'L1', name: 'Testlevel', anker: null };
const A3 = { id: 'A3', name: 'Kreuzweg', anker: 'A3' };
const judge = (a, b, position = 60, level = LEVEL) =>
  merge({ level, referenz: reference(position), anker: ANCHORS, urteile: { A: answer(a), B: answer(b) } });
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

console.log('Anker');
const DULDUNG = ['Begegnung', 'Seitenlicht', 'Auslese', 'Labyrinth', 'Doppelpass', 'Lichtbündel', 'Einklang',
  'Schnittstelle', 'Geflecht', 'Glasmurmel', 'Weichensteller', 'Mosaik', 'Laterne', 'Lichtorgel', 'Libelle',
  'Rangierbahnhof', 'Opal', 'Polarlicht', 'Lichtschleife', 'Komet', 'Unendlichkeit', 'Irrlicht', 'Interferenz',
  'Leuchtturm', 'Korona', 'Glasperlenspiel', 'Sternbild', 'Kristallpalast', 'Quasar', 'Ereignishorizont',
  'Lichtgeschwindigkeit', 'Singularität', 'Urknall', 'Prismenhof', 'Farbenrausch', 'Farbmühle', 'Zenit']; // Spec, Stand der Neuzählung
const GRENZFAELLE = ['Zwielicht', 'Lichtkegel', 'Schnittstelle', 'Prismenreigen', 'Widerschein', 'Sonnenwende',
  'Einklang', 'Knotenpunkt', 'Glasmurmel', 'Blendwerk', 'Opal', 'Doppelspiegel', 'Chamäleon', 'Supernova', 'Lichthof'];
test('Je zwei Anker pro Grad, einer am unteren und einer am oberen Ende', () => {
  const anchors = loadAnchors();
  assert.equal(DULDUNG.length, 37);
  for (const g of GRADES) {
    const own = anchors.filter(a => a.grad === g.name);
    assert.deepEqual(own.map(a => a.ende), ['unten', 'oben'], g.name);
    const third = (g.to - g.from + 1) / 3;
    for (const a of own) {
      assert.ok(a.position >= g.from && a.position <= g.to, `${a.name} (${a.position}) nicht in ${g.name}`);
      assert.ok(a.ende === 'unten' ? a.position < g.from + third : a.position > g.to - third, `${a.name} nicht am Ende`);
    }
  }
  const positions = anchors.map(a => a.position);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'Anker nach Platz geordnet');
});
test('Kein Anker auf der Duldungsliste oder ein Grenzfall der Neuzählung', () => {
  for (const a of loadAnchors()) {
    assert.ok(!DULDUNG.includes(a.name), a.name);
    assert.ok(!GRENZFAELLE.includes(a.name), a.name);
    assert.ok(a.begruendung.length > 40, `${a.name}: Begründung fehlt`);
  }
});

console.log('Feld als Text');
test('Feld als Text kennt weder Lösung noch Name noch Markierung und nennt jedes Element', () => {
  for (let i = L.TUTORIAL_COUNT; i < L.LEVELS.length; i++) {
    const lvl = L.LEVELS[i];
    const text = fieldText(lvl, 'L1');
    assert.equal(fieldText({ ...lvl, solution: undefined }, 'L1'), text, `${lvl.name}: hängt von der Lösung ab`);
    assert.equal(fieldText({ ...lvl, name: 'Anders', difficulty: 'sehr schwer' }, 'L1'), text,
      `${lvl.name}: hängt von Name oder Markierung ab`);
    assert.ok(!text.includes(lvl.name), `${lvl.name}: Name verrät das Level`);
    for (const e of lvl.elements) assert.ok(text.includes(`(${e.x},${e.z})`), `${lvl.name}: (${e.x},${e.z}) fehlt`);
  }
});

console.log('Auftrag und Fingerabdruck');
test('Glossar für die KI-Tester: mit der Vermeiden-Zeile bei Füllteil, ohne die Hinweise für Autoren', () => {
  const text = glossary();
  assert.ok(text.includes('_Vermeiden_: Füllteil für einen kurzen Strang, den ein anderer Strahl kreuzt (das ist ein Einstieg)'));
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
  datum: '2026-10-16', lauf: 'test', agent: AGENT, level: LEVEL, referenz: reference(60), anker: ANCHORS,
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
  console.log(`        ${text.split('\n').filter(l => l.trim()).length} Einträge`);
});
// Gegenproben: eine Kopie des Protokolls mit einem verfälschten Eintrag muss mit der erwarteten Meldung rot werden
const both = (e, over) => { for (const t of ['A', 'B']) Object.assign(e.urteile[t], over); };
const tampered = [
  ['Anker verschoben', (e) => {
    e.level = A3; e.referenz = reference(35); both(e, { level: 'A3', einordnung: 'A3' });
    e.ergebnis = { abgelehnt: false, gruende: [], verschiebung: 1, position: 36 };
  }, /Anker A3 verschoben/],
  ['unbekannte Version', (e) => { e.ablauf = '9'; }, /Version des Ablaufs fehlt oder unbekannt \(9\)/],
  ['Verschiebung 6', (e) => { e.ergebnis.verschiebung = -6; e.ergebnis.position = 54; }, /Verschiebung −6: mehr als 5 Plätze/],
  ['über die Gradgrenze 30/31', (e) => {
    e.referenz = reference(33); e.ergebnis.verschiebung = -5; e.ergebnis.position = 28;
  }, /Platz 28 ausserhalb von mittel \(31–100\)/],
  ['über die Gradgrenze 100/101, wo kein Anker steht', (e) => {
    e.referenz = reference(98); both(e, { einordnung: 'A5-A6' }); e.ergebnis.verschiebung = 3; e.ergebnis.position = 101;
  }, /Platz 101 ausserhalb von mittel \(31–100\)/],
  ['abgelehnt, obwohl nur einer ablehnt', (e) => {
    e.ergebnis = { abgelehnt: true, gruende: ['Knäuel'], verschiebung: 0, position: 60 };
  }, /abgelehnt, aber nicht beide nennen einen Begriff, der bei mittel gilt/],
  ['abgelehnt mit Füllteil in einem leichten Level', (e) => {
    e.referenz = reference(12); both(e, { einordnung: 'A1-A2', ablehnung: ['Füllteil'] });
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

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gibt Fehler' : ''}`);
