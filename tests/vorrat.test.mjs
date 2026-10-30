// Tests des Vorrats und des gemeinsamen Laders (Spec .scratch/noa-geschichte/, «Daten» und «Tests»; Ticket 02):
// Ablegen und Zurückholen sind verlustfrei (index.html und der Vorrat byte-gleich nach hin und zurück, auch in Teilen,
// in anderer Gruppierung und Reihenfolge, über mehrere Schritte, für alle Level und mit CRLF im Vorrat), die Folge nach
// dem Zurückholen (einfuegen) an erfundenen Fällen, das Format des Vorrats (der Block wie im Spiel, der Platz darüber,
// Leveldaten wie im Spiel, Titel), die Auswahl nach Art und Grad und die Fehler; dazu der Lader auf dem Stand der
// Dateien: jedes Level genau einmal, in der Folge wie nach dem Zurückholen aller, die Level im Spiel dieselben Objekte
// wie in L. Gerechnet wird auf Kopien der Texte im Speicher; die Dateien bleiben unberührt. Seit dem Umbau zu Noas
// Geschichte (Ticket 04): Jedes Level von vorher (tests/vor-dem-umbau.json) steht im Spiel oder im Vorrat, unverändert.
// Aufruf: node tests/vorrat.test.mjs   (wenige Sekunden)
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { L } from '../tools/solver.mjs';
import { GRADE } from '../tools/beurteilung/index.mjs';
import { levelCode } from '../tools/leveldaten.mjs';
import {
  ARTEN, ablegen, auswahl, einfuegen, inhalt, lese, leveldaten, mitAllen, namenImSpiel, zurueckholen,
} from '../tools/vorrat.mjs';
import { ALLE, VORRAT, alleText, ort } from '../tools/lader.mjs';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

// Die Texte, auf denen gerechnet wird: index.html und ein leerer Vorrat (die Dateien ohne ihre Level), damit die Tests
// nicht davon abhängen, was gerade im Vorrat liegt
const DATEIEN = lese();
const T = { spiel: mitAllen(DATEIEN), flach: null, wuerfel: null };
for (const art of Object.keys(ARTEN)) {
  // ein Vorrat ohne Level: die Datei, zwischen den Markierungen geleert
  const text = DATEIEN[art], nl = text.includes('\r\n') ? '\r\n' : '\n';
  const a = text.indexOf('/* VORRAT:BEGIN */'), e = text.indexOf('/* VORRAT:END */');
  T[art] = text.slice(0, text.indexOf(nl, a) + nl.length) + text.slice(text.lastIndexOf(nl, e) + nl.length);
}
const FLACH = namenImSpiel(T.spiel, 'flach'), WUERFEL = namenImSpiel(T.spiel, 'wuerfel');
/** Gleich wie T, Text für Text. */
const gleich = (r, wo) => {
  for (const k of ['spiel', 'flach', 'wuerfel']) assert.ok(r[k] === T[k], `${wo}: ${k} anders`);
};
/** Zufall mit festem Startwert, für die Reihenfolge beim Zurückholen. */
const zufall = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const gemischt = (liste, seed) => {
  const r = zufall(seed), a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
// Abgelegt zur Probe: am Anfang, eine Folge in der Mitte, am Ende, je flach und im Würfel
const WAHL = [FLACH[0], FLACH[1], FLACH[2], FLACH[100], FLACH[101], FLACH[102], FLACH.at(-1), WUERFEL[0], WUERFEL[1],
  WUERFEL[150], WUERFEL.at(-1)];
const A = ablegen(T, WAHL);

console.log('Ablegen und Zurückholen');
test('Hin und zurück: index.html und Vorrat byte-gleich (am Anfang, in der Mitte, am Ende, flach und im Würfel)', () => {
  assert.deepEqual(A.abgelegt,
    { flach: WAHL.filter(x => FLACH.includes(x)), wuerfel: WAHL.filter(x => WUERFEL.includes(x)) });
  assert.deepEqual(namenImSpiel(A.spiel, 'flach'), FLACH.filter(x => !WAHL.includes(x)));
  assert.deepEqual(namenImSpiel(A.spiel, 'wuerfel'), WUERFEL.filter(x => !WAHL.includes(x)));
  assert.deepEqual(inhalt(A.flach, 'flach').map(e => e.name), A.abgelegt.flach, 'in der Reihenfolge im Spiel');
  gleich(zurueckholen(A, WAHL), 'zurück');
  gleich(zurueckholen(A, null), 'alles zurück');
  assert.equal(mitAllen(A), T.spiel, 'mitAllen');
});
test('In Teilen, in anderer Gruppierung und Reihenfolge zurück: wieder byte-gleich', () => {
  // nach Grad und Art, wie die Kommandozeile wählt
  let r = A;
  const je = () => Object.fromEntries(Object.keys(ARTEN).map(art => [art, inhalt(r[art], art)]));
  for (const wahl of [{ namen: [FLACH[101]] }, { arten: ['wuerfel'], grad: 'leicht' }, { grad: 'sehr schwer' },
    { arten: ['flach'] }, { alle: true }]) {
    const namen = auswahl(je(), wahl);
    if (namen.length) r = zurueckholen(r, namen);
  }
  gleich(r, 'nach Gruppen');
  // einzeln in gemischter Reihenfolge
  for (const seed of [1, 2, 3, 4, 5]) {
    let s = A;
    for (const x of gemischt(WAHL, seed)) s = zurueckholen(s, [x]);
    gleich(s, `einzeln, Mischung ${seed}`);
  }
});
test('In mehreren Schritten abgelegt (Vorgänger schon im Vorrat oder mit abgelegt): zurück wieder byte-gleich', () => {
  const schritte = [[FLACH[5], FLACH[7], WUERFEL[20]], [FLACH[6], FLACH[4], WUERFEL[19], WUERFEL[21]], [FLACH[3]],
    [FLACH[8], FLACH[9], FLACH[10]]];
  let r = T;
  for (const s of schritte) r = ablegen(r, s);
  // der Vorgänger beim Ablegen: das Level unmittelbar davor in der ganzen Folge, auch wenn es schon im Vorrat liegt
  // oder im selben Schritt geht; so zeigt jedes Level auf einen anderen
  const nach = Object.fromEntries(inhalt(r.flach, 'flach').map(e => [e.name, e.nach]));
  assert.deepEqual(FLACH.slice(3, 11).map(x => nach[x]), FLACH.slice(2, 10));
  assert.deepEqual(inhalt(r.wuerfel, 'wuerfel').map(e => [e.name, e.nach]),
    [[WUERFEL[20], WUERFEL[19]], [WUERFEL[19], WUERFEL[18]], [WUERFEL[21], WUERFEL[20]]]);
  assert.equal(mitAllen(r), T.spiel, 'mitAllen');
  gleich(zurueckholen(r, null), 'alles zurück');
  for (const seed of [6, 7, 8, 9]) {
    let s = r;
    for (const x of gemischt(schritte.flat(), seed)) s = zurueckholen(s, [x]);
    gleich(s, `einzeln, Mischung ${seed}`);
  }
});
test('Zufällig abwechselnd abgelegt und zurückgeholt: die ganze Folge bleibt dieselbe, am Ende byte-gleich', () => {
  // aus einem kleinen Bereich, damit oft Nachbarn zusammen oder nacheinander gehen
  const bereich = [...FLACH.slice(0, 25), ...FLACH.slice(-5), ...WUERFEL.slice(10, 30)];
  for (const seed of [11, 12, 13, 14]) {
    const r = zufall(seed), wahl = (liste) => liste.filter(() => r() < 0.3);
    let s = T;
    for (let schritt = 0; schritt < 12; schritt++) {
      const imVorrat = Object.keys(ARTEN).flatMap(art => inhalt(s[art], art).map(e => e.name));
      const hin = schritt % 2 === 0;
      const namen = wahl(hin ? bereich.filter(x => !imVorrat.includes(x)) : imVorrat);
      if (!namen.length) continue;
      s = hin ? ablegen(s, namen) : zurueckholen(s, namen);
      assert.equal(mitAllen(s), T.spiel, `Mischung ${seed}, Schritt ${schritt + 1}`);
    }
    gleich(zurueckholen(s, null), `Mischung ${seed}`);
  }
});
test('Alle flachen und alle Würfel-Level abgelegt (wie im Umbau) und zurück: byte-gleich', () => {
  const r = ablegen(T, [...FLACH, ...WUERFEL]);
  assert.deepEqual([namenImSpiel(r.spiel, 'flach'), namenImSpiel(r.spiel, 'wuerfel')], [[], []]);
  assert.deepEqual(inhalt(r.wuerfel, 'wuerfel').map(e => e.name), WUERFEL);
  assert.equal(mitAllen(r), T.spiel, 'mitAllen');
  gleich(zurueckholen(r, null), 'alles zurück');
  // nur ein Teil zurück, dann der Rest
  gleich(zurueckholen(zurueckholen(r, FLACH.filter((_, k) => k % 7 === 3)), null), 'in zwei Teilen');
});
test('Zeilenenden: ein Vorrat mit CRLF bleibt CRLF, mit LF bleibt LF, index.html gleich, byte-gleich zurück', () => {
  const lf = (s) => s.replaceAll('\r\n', '\n'), crlf = (s) => lf(s).replaceAll('\n', '\r\n');
  const mit = (f) => ({ ...T, flach: f(T.flach), wuerfel: f(T.wuerfel) });
  const [r, s] = [ablegen(mit(crlf), WAHL), ablegen(mit(lf), WAHL)];
  assert.equal(r.spiel, s.spiel);
  assert.ok(r.flach === crlf(s.flach) && s.flach === lf(s.flach), 'Zeilenenden des Vorrats');
  for (const [x, f] of [[r, crlf], [s, lf]]) {
    const z = zurueckholen(x, null);
    assert.ok(z.spiel === T.spiel && z.flach === f(T.flach) && z.wuerfel === f(T.wuerfel), 'zurück');
  }
});

console.log('Format');
test('Je Level die Zeile mit seinem Platz, dann sein Block Zeile für Zeile wie im Spiel; Leveldaten wie im Spiel', () => {
  const zeilen = T.spiel.split(/\r?\n/);
  for (const art of Object.keys(ARTEN)) {
    const eintraege = inhalt(A[art], art), spiel = art === 'flach' ? ALLE.LEVELS : ALLE.LEVELS_3D;
    const imSpiel = namenImSpiel(T.spiel, art);
    for (const e of eintraege) {
      const k = imSpiel.indexOf(e.name);
      assert.equal(e.platz, `  // Platz im Spiel: ${k ? `nach „${imSpiel[k - 1]}“` : 'am Anfang'}`, e.name);
      const start = zeilen.lastIndexOf('  {', zeilen.findIndex(y => y.startsWith(`    name: '${e.name}',`)));
      assert.deepEqual(e.zeilen, zeilen.slice(start, start + e.zeilen.length), `${e.name}: Block`);
      assert.equal(e.grad, spiel.find(l => l.name === e.name).grad, `${e.name}: Grad`);
    }
    assert.deepEqual(leveldaten(A[art], art), eintraege.map(e => spiel.find(l => l.name === e.name)),
      `${art}: Leveldaten`);
    // die Datei bleibt JavaScript wie index.html
    assert.equal(new Function(`${A[art]}\nreturn ${art === 'flach' ? 'VORRAT_FLACH' : 'VORRAT_WUERFEL'};`)().length,
      eintraege.length);
  }
});
test('Titel: levelCode schreibt ihn hinter Name und Würfel, Vorrat und Spiel lesen ihn', () => {
  const flach = { ...ALLE.LEVELS[ALLE.TUTORIAL_COUNT], titel: 'Moosbett' };
  const wuerfel = { ...ALLE.LEVELS_3D[0], titel: "Noa's Turm" };
  assert.match(levelCode(flach),
    new RegExp(`\\n {4}name: '${flach.name}', titel: 'Moosbett', grad: '${flach.grad}',\\n`));
  assert.match(levelCode(wuerfel), /\n {4}name: '[^']+', dim: 3, size: 7, height: 5, titel: 'Noa\\'s Turm', grad: '/);
  // in den Zeilenenden der Datei (CRLF in einem Windows-Checkout mit core.autocrlf), wie vorrat.mjs selbst schreibt
  const nl = T.wuerfel.includes('\r\n') ? '\r\n' : '\n';
  const text = T.wuerfel.replace('  /* VORRAT:END */', ['  // Platz im Spiel: am Anfang', levelCode(wuerfel),
    '  /* VORRAT:END */'].join('\n').replace(/\n/g, nl));
  assert.deepEqual(inhalt(text, 'wuerfel').map(e => [e.name, e.titel, e.grad]),
    [[wuerfel.name, "Noa's Turm", wuerfel.grad]]);
  assert.deepEqual(leveldaten(text, 'wuerfel'), [wuerfel]);
  // ohne Titel wie bisher
  assert.ok(!levelCode(ALLE.LEVELS[ALLE.TUTORIAL_COUNT]).includes('titel'));
});

console.log('Folge nach dem Zurückholen und Auswahl');
test('einfuegen: hinter den Vorgänger, sonst dessen Vorgänger aus dem Vorrat, am Anfang, unbekannt ans Ende', () => {
  const v = [{ name: 'B', nach: 'A' }, { name: 'C', nach: 'B' }, { name: 'E', nach: null }, { name: 'F', nach: 'X' },
    { name: 'G', nach: 'H' }, { name: 'H', nach: 'G' }];
  const nur = (...namen) => v.filter(e => namen.includes(e.name));
  assert.deepEqual(einfuegen(['A', 'D'], nur('C'), v), ['A', 'C', 'D'], 'über B zu A');
  assert.deepEqual(einfuegen(['A', 'D'], nur('B', 'C'), v), ['A', 'B', 'C', 'D']);
  assert.deepEqual(einfuegen(['A', 'B', 'D'], nur('C'), v.filter(e => e.name !== 'B')), ['A', 'B', 'C', 'D']);
  // C vor B zurück, B danach: dieselbe Folge (gerechnet mit dem ganzen Vorrat)
  assert.deepEqual(einfuegen(['A', 'D'], nur('C'), v), ['A', 'C', 'D']);
  assert.throws(() => einfuegen(['A', 'B'], nur('C'), v), /schon im Spiel: B/);
  assert.deepEqual(einfuegen(['A', 'D'], nur('E'), v), ['E', 'A', 'D'], 'am Anfang');
  assert.deepEqual(einfuegen(['A', 'D'], nur('F'), v), ['A', 'D', 'F'], 'Vorgänger unbekannt');
  assert.deepEqual(einfuegen(['A'], nur('G'), v), ['A', 'G'], 'Kreis im Vorrat: ans Ende, ohne zu hängen');
  assert.deepEqual(einfuegen(['A', 'D'], [], v), ['A', 'D']);
});
test('Auswahl: einzelne Namen, eine Art, ein Grad (ohne Art in beiden), Art und Grad, alle', () => {
  const je = { flach: [{ name: 'a', grad: 'leicht' }, { name: 'b', grad: 'mittel' }],
    wuerfel: [{ name: 'w', grad: 'leicht' }, { name: 'x', grad: 'schwer' }] };
  assert.deepEqual(auswahl(je, { namen: ['b'] }), ['b']);
  assert.deepEqual(auswahl(je, { arten: ['wuerfel'] }), ['w', 'x']);
  assert.deepEqual(auswahl(je, { grad: 'leicht' }), ['a', 'w']);
  assert.deepEqual(auswahl(je, { arten: ['flach'], grad: 'leicht', namen: ['x'] }), ['x', 'a']);
  assert.deepEqual(auswahl(je, { alle: true }), ['a', 'b', 'w', 'x']);
  assert.deepEqual(auswahl(je, {}), []);
});
test('Fehler: Tutorial, unbekannt, schon im Vorrat, nicht im Vorrat, im Spiel und im Vorrat zugleich', () => {
  assert.throws(() => ablegen(T, [L.LEVELS[0].name]), /Nicht im Spiel \(oder im Tutorial\): Erstes Licht/);
  assert.throws(() => ablegen(T, ['Gibt es nicht']), /Nicht im Spiel/);
  assert.throws(() => ablegen({ ...A, spiel: T.spiel }, [FLACH[0]]), /Schon im Vorrat: /);
  assert.throws(() => zurueckholen(A, [FLACH[50]]), /Nicht im Vorrat: /);
  assert.throws(() => zurueckholen({ ...A, spiel: T.spiel }, [FLACH[0]]), /Im Spiel und im Vorrat: /);
  // ein Vorrat ohne Zeile mit dem Platz ist kaputt
  assert.throws(() => inhalt(A.flach.replace(/^ {2}\/\/ Platz im Spiel: [^\n]*\n/m, ''), 'flach'),
    /ohne Zeile mit dem Platz/);
});

console.log('Lader und Dateien');
test('Lader: jedes Level aus Spiel und Vorrat genau einmal, wie nach dem Zurückholen aller, die im Spiel aus L', () => {
  const h = alleText();
  const voll = new Function(`${h.slice(h.indexOf('/* LOGIC:BEGIN'), h.indexOf('/* LOGIC:END'))}
    return { LEVELS, TUTORIAL_COUNT, LEVELS_3D };`)();
  assert.deepEqual(ALLE.LEVELS, voll.LEVELS);
  assert.deepEqual(ALLE.LEVELS_3D, voll.LEVELS_3D);
  assert.equal(ALLE.TUTORIAL_COUNT, L.TUTORIAL_COUNT);
  for (const [alle, spiel, vorrat] of [[ALLE.LEVELS, L.LEVELS, VORRAT.flach],
    [ALLE.LEVELS_3D, L.LEVELS_3D, VORRAT.wuerfel]]) {
    assert.equal(alle.length, spiel.length + vorrat.length);
    assert.ok(spiel.every(l => alle.includes(l)) && vorrat.every(l => alle.includes(l)), 'dieselben Objekte');
    assert.deepEqual(alle.filter(l => spiel.includes(l)), spiel, 'die im Spiel in ihrer Reihenfolge');
  }
  assert.deepEqual([...L.LEVELS, ...L.LEVELS_3D].filter(l => ort(l.name) !== 'spiel').map(l => l.name), []);
  assert.deepEqual([...VORRAT.flach, ...VORRAT.wuerfel].filter(l => ort(l.name) !== 'vorrat').map(l => l.name), []);
  assert.equal(ort('Gibt es nicht'), null);
  console.log(`        im Spiel ${L.LEVELS.length} flache und ${L.LEVELS_3D.length} Würfel-Level, im Vorrat `
    + `${VORRAT.flach.length} und ${VORRAT.wuerfel.length}`);
});
test('Dateien des Vorrats: lesbar, jedes Level mit Platz und Grad, kein Name doppelt mit dem Spiel', () => {
  for (const art of Object.keys(ARTEN)) {
    const eintraege = inhalt(DATEIEN[art], art);
    assert.deepEqual(eintraege.filter(e => !GRADE.includes(e.grad)).map(e => e.name), [], `${art}: ohne Grad`);
    assert.deepEqual(eintraege.filter(e => namenImSpiel(DATEIEN.spiel, art).includes(e.name)).map(e => e.name), []);
    // ohne seine Level ist die Datei die leere Vorlage (T)
    assert.equal(zurueckholen({ ...DATEIEN }, null)[art], T[art], `${art}: ohne Level`);
  }
});
test('Kommandozeile: liste liest nur, ein falscher Aufruf schreibt nichts', () => {
  const vorrat = fileURLToPath(new URL('../tools/vorrat.mjs', import.meta.url));
  const liste = spawnSync(process.execPath, [vorrat, 'liste'], { encoding: 'utf8' });
  assert.equal(liste.status, 0, liste.stderr);
  assert.match(liste.stdout, /^flache Level im Vorrat: \d+$/m);
  assert.match(liste.stdout, /^Würfel-Level im Vorrat: \d+$/m);
  for (const falsch of [['ablegen'], ['ablegen', '--grad', 'mittelschwer'], ['zurueckholen', '--unbekannt'],
    ['ablegen', '--alle']]) {
    const p = spawnSync(process.execPath, [vorrat, ...falsch], { encoding: 'utf8' });
    assert.notEqual(p.status, 0, falsch.join(' '));
  }
  assert.deepEqual(lese(), DATEIEN, 'Dateien unverändert');
});

console.log('Umbau zu Noas Geschichte (Ticket 04)');
// Die Level vor dem Umbau (tests/vor-dem-umbau.json: index.html im Stand fc22df1, je Name ein Abdruck der Leveldaten)
const VORHER = JSON.parse(readFileSync(new URL('./vor-dem-umbau.json', import.meta.url), 'utf8')).level;
/** Abdruck wie in vor-dem-umbau.json: sha256 der Leveldaten ohne Titel (den bringt erst der Umbau), 16 Zeichen. */
const abdruckVorher = (level) => {
  const { titel, ...daten } = level;
  return createHash('sha256').update(JSON.stringify(daten)).digest('hex').slice(0, 16);
};
/** Was an den Leveln (Name → Level) gegenüber vorher (Name → Abdruck) fehlt oder anders ist. */
const verloren = (vorher, levels) => Object.entries(vorher).flatMap(([name, h]) => (!levels.has(name)
  ? [`${name} fehlt`] : abdruckVorher(levels.get(name)) !== h ? [`${name} geändert`] : []));
test('Jedes Level von vor dem Umbau steht im Spiel oder im Vorrat, mit unveränderten Leveldaten, dazu nur die 15 '
  + 'neuen sehr schweren aus dem Ausbau; mit Gegenproben', () => {
  const jetzt = new Map([...ALLE.LEVELS, ...ALLE.LEVELS_3D].map(l => [l.name, l]));
  assert.equal(Object.keys(VORHER).length, 809, 'Tutorial, 500 flache und 300 Würfel-Level');
  assert.deepEqual(verloren(VORHER, jetzt), []);
  const dazu = [...jetzt.keys()].filter(x => !(x in VORHER));
  const neu = JSON.parse(readFileSync(new URL('../tools/geschichte/sehr-schwer-neu.json', import.meta.url), 'utf8'))
    .level.map(e => e.level.name);
  assert.deepEqual(dazu.sort(), [...neu].sort(), 'neu im Spiel');
  assert.deepEqual(VORRAT.wuerfel.map(l => l.name), ALLE.LEVELS_3D.map(l => l.name), 'alle Würfel-Level im Vorrat');
  // Gegenproben: ein Element gedreht, ein Level weg, ein Titel dazu (zählt nicht)
  const erstes = ALLE.LEVELS[ALLE.TUTORIAL_COUNT], k = erstes.elements.findIndex(e => 'rot' in e);
  const gedreht = { ...erstes, elements: erstes.elements.map((e, j) => (j === k ? { ...e, rot: e.rot + 1 } : e)) };
  assert.deepEqual(verloren(VORHER, new Map([...jetzt, [erstes.name, gedreht]])), [`${erstes.name} geändert`]);
  const ohne = new Map(jetzt);
  ohne.delete(ALLE.LEVELS_3D[0].name);
  assert.deepEqual(verloren(VORHER, ohne), [`${ALLE.LEVELS_3D[0].name} fehlt`]);
  const { titel, ...ohneTitel } = erstes;
  assert.deepEqual(verloren(VORHER, new Map([...jetzt, [erstes.name, { ...ohneTitel, titel: 'Anders' }]])), []);
});
