// Speicherschicht (Ticket 05 von .scratch/umbau/): src/speicher.ts (Schnittstelle Speicher, Umsetzung für
// localStorage, Wahl beim Start) und src/spielstand.js (Schlüssel und Format des Spielstands). Prüft:
// - im Quelltext: Kein Teil des Spiels ausser der Speicherschicht nennt localStorage oder sessionStorage (index.html,
//   alle Module unter src/, sw.js), mit Gegenprobe;
// - die Umsetzung für localStorage: jeder Text unverändert unter seinem Schlüssel;
// - ein Spielstand von heute (17.11.2026, Schlüssel und Texte genau so, wie das Spiel sie schreibt) wird ohne
//   Umrechnung gelesen: Fortschritt je Grad, Bestwerte, zuletzt gespielter Grad und der Ton; unverändert gespeichert
//   ergibt er Byte für Byte dieselben Texte, und fremde und alte Schlüssel bleiben;
// - scheitert der Speicher (gesperrt, voll), wirft nichts, und das Spiel beginnt von vorn wie bisher.
// Läuft in Node ohne Browser (wenige Sekunden): node tests/speicher.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../tools/spielserver.mjs';
import { module } from '../tools/seitenmodule.mjs';
import { tsModul } from '../tools/ts-modul.mjs';
import { STORY_LEVELS } from '../src/logik.js';

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

/** Attrappe von localStorage über einer Map (Texte wie im Browser: setItem macht aus dem Wert einen Text). */
function attrappe(eintraege = {}) {
  const daten = new Map(Object.entries(eintraege));
  globalThis.localStorage = {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => { daten.set(String(k), String(v)); },
    removeItem: (k) => { daten.delete(k); },
  };
  return daten;
}

const SCHICHT = 'src/speicher.ts';
const { speicher, localStorageSpeicher, speicherFuerPlattform } = await tsModul(SCHICHT);
const { progress, einstellungen } = await tsModul('src/spielstand.js');

/** Dateien des Spiels, die localStorage oder sessionStorage nennen (auch in Kommentaren), ausser der Schicht. */
function direkteZugriffe(dateien) {
  return Object.entries(dateien).filter(([pfad, text]) => pfad !== SCHICHT && /\b(local|session)Storage\b/.test(text))
    .map(([pfad, text]) => `${pfad}:${text.split('\n').findIndex(z => /\b(local|session)Storage\b/.test(z)) + 1}`);
}

await test('Quelltext: nur die Speicherschicht greift auf localStorage zu (index.html, src/, sw.js), mit Gegenprobe', () => {
  const pfade = ['index.html', 'sw.js', ...module()];
  assert.ok(pfade.includes(SCHICHT) && pfade.includes('src/spielstand.js') && pfade.length > 30, pfade.join(', '));
  const dateien = Object.fromEntries(pfade.map(p => [p, readFileSync(join(root, p), 'utf8')]));
  assert.deepEqual(direkteZugriffe(dateien), []);
  assert.match(dateien[SCHICHT], /localStorage\.getItem/);
  // Gegenprobe: ein direkter Zugriff in einem anderen Modul fällt auf, auch window.sessionStorage
  assert.deepEqual(direkteZugriffe({ ...dateien, 'src/seite/ton.js': `${dateien['src/seite/ton.js']}\nlocalStorage.clear();\n`,
    'src/x.js': 'const a = 1;\nwindow.sessionStorage.setItem("a", 1);' }),
  [`src/seite/ton.js:${dateien['src/seite/ton.js'].split('\n').length + 1}`, 'src/x.js:2']);
});

await test('Schicht: die Plattform wählt beim Start die Umsetzung (heute localStorage), jeder Text unverändert', () => {
  assert.equal(speicherFuerPlattform(), localStorageSpeicher);
  assert.equal(speicher, localStorageSpeicher);
  const daten = attrappe({ a: 'eins' });
  assert.equal(speicher.lesen('a'), 'eins');
  assert.equal(speicher.lesen('fehlt'), null);
  speicher.schreiben('prisma.noa.sehr-schwer', '{"platz":3}');
  assert.equal(daten.get('prisma.noa.sehr-schwer'), '{"platz":3}');
  speicher.schreiben('leer', '');
  assert.equal(speicher.lesen('leer'), '', 'ein leerer Text ist nicht «fehlt»');
  speicher.loeschen('a');
  assert.equal(daten.has('a'), false);
  speicher.loeschen('fehlt');
  assert.deepEqual([...daten.keys()].sort(), ['leer', 'prisma.noa.sehr-schwer']);
});

// Ein Spielstand von heute, wie das Spiel ihn schreibt (JSON.stringify, Felder in dieser Reihenfolge): «leicht» ganz
// gespielt samt Dorf, «mittel» mitten in der dritten Welt (zuletzt gespielt), «sehr schwer» im Dorf; Bestwerte in zwei
// Graden; Ton aus; dazu alte Schlüssel von vor Noas Geschichte und ein fremder.
const L = STORY_LEVELS.leicht.flat(), M = STORY_LEVELS.mittel.flat();
const HEUTE = {
  'prisma.noa.zuletzt': 'mittel',
  'prisma.noa.leicht': JSON.stringify({ platz: 59, geloest: ['Erstes Licht', 'Brechung', 'Farbenlehre', 'Mischung', ...L],
    gesehen: ['prolog', 'angebot', 'dorf', 'wald', 'meer', 'wueste', 'eis', 'vulkan', 'nacht', 'finale'],
    geschafft: true, dorf: { ende: 'gespielt' }, gespielt: 1763290000000 }),
  'prisma.noa.leicht.bestwerte': JSON.stringify({ [L[0]]: { zeit: 12, drehungen: 4 }, [L[1]]: { zeit: 31, drehungen: 9 },
    'Erstes Licht': { zeit: 3, drehungen: 1 } }),
  'prisma.noa.mittel': JSON.stringify({ platz: 23, geloest: M.slice(0, 23), gesehen: ['prolog', 'angebot', 'wald', 'meer'],
    geschafft: false, dorf: { ende: 'uebersprungen' }, gespielt: 1763370000000 }),
  'prisma.noa.mittel.bestwerte': JSON.stringify({ [M[0]]: { zeit: 40, drehungen: 7 }, [M[22]]: { drehungen: 15 } }),
  'prisma.noa.sehr-schwer': JSON.stringify({ platz: 0, geloest: ['Erstes Licht', 'Brechung'],
    gesehen: ['prolog', 'angebot', 'dorf'], geschafft: false, dorf: { ende: null }, gespielt: 1763380000000 }),
  'prisma.muted': '1',
  'prisma.solvedLevels': '["Erstes Licht","Brechung"]',
  'prisma.current': '7',
  'anderes.spiel': 'bleibt',
};
const anzahl = (g) => STORY_LEVELS[g].flat().length;

await test('Ein Spielstand von heute wird ohne Umrechnung gelesen: Fortschritt, Bestwerte, zuletzt gespielt, Ton', () => {
  attrappe(HEUTE);
  for (const g of ['leicht', 'mittel', 'sehr schwer']) {
    assert.deepEqual(progress.load(g, anzahl(g)), JSON.parse(HEUTE[progress.keyOf(g)]), g);
  }
  assert.deepEqual(progress.load('schwer', anzahl('schwer')), { platz: 0, geloest: [], gesehen: [], geschafft: false },
    'ein Grad ohne Stand: von vorn');
  assert.deepEqual(progress.best('leicht'), JSON.parse(HEUTE['prisma.noa.leicht.bestwerte']));
  assert.deepEqual(progress.best('mittel'), JSON.parse(HEUTE['prisma.noa.mittel.bestwerte']));
  assert.deepEqual(progress.best('sehr schwer'), {});
  assert.equal(progress.last(), 'mittel');
  assert.equal(einstellungen.stumm(), true);
  attrappe({ ...HEUTE, 'prisma.muted': '0' });
  assert.equal(einstellungen.stumm(), false);
  attrappe({});
  assert.equal(einstellungen.stumm(), false, 'ohne Stand: Ton an');
});

await test('Ein Spielstand von heute, unverändert gespeichert, ergibt dieselben Texte; alte und fremde Schlüssel bleiben',
() => {
  const daten = attrappe(HEUTE);
  for (const g of ['leicht', 'mittel', 'sehr schwer']) progress.save(g, progress.load(g, anzahl(g)));
  progress.setLast(progress.last());
  einstellungen.setStumm(einstellungen.stumm());
  // ein Level ohne Verbesserung lösen: die Bestwerte bleiben Byte für Byte
  assert.deepEqual(progress.noteBest('leicht', L[1], { seconds: 31.7, turns: 9 }),
    { neueBestzeit: false, wenigerDrehungen: false });
  assert.deepEqual(Object.fromEntries(daten), HEUTE);
  // weiterspielen schreibt dasselbe Format unter denselben Schlüsseln
  const m = progress.load('mittel', anzahl('mittel'));
  progress.save('mittel', { ...m, platz: 24, geloest: [...m.geloest, M[23]], gespielt: 1763390000000 });
  assert.equal(daten.get('prisma.noa.mittel'), JSON.stringify({ platz: 24, geloest: M.slice(0, 24),
    gesehen: ['prolog', 'angebot', 'wald', 'meer'], geschafft: false, dorf: { ende: 'uebersprungen' },
    gespielt: 1763390000000 }));
  einstellungen.setStumm(false);
  assert.equal(daten.get('prisma.muted'), '0');
  progress.remove('sehr schwer');
  assert.deepEqual([...daten.keys()].filter(k => !Object.hasOwn(HEUTE, k)), [], 'kein neuer Schlüssel');
  assert.equal(daten.has('prisma.noa.sehr-schwer'), false);
  for (const k of ['prisma.solvedLevels', 'prisma.current', 'anderes.spiel']) assert.equal(daten.get(k), HEUTE[k], k);
});

await test('Scheitert der Speicher (gesperrt, voll, privates Fenster), wirft nichts, und das Spiel beginnt von vorn', () => {
  // gesperrt: schon der Name localStorage wirft (SecurityError)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true,
    get() { throw new Error('SecurityError: Zugriff verweigert'); } });
  assert.equal(speicher.lesen('prisma.noa.zuletzt'), null);
  speicher.schreiben('a', 'b');
  speicher.loeschen('a');
  assert.deepEqual(progress.load('leicht', 60), { platz: 0, geloest: [], gesehen: [], geschafft: false });
  assert.deepEqual(progress.best('leicht'), {});
  assert.equal(progress.last(), null);
  progress.save('leicht', { platz: 3, geloest: [], gesehen: [], geschafft: false });
  progress.setLast('leicht');
  progress.remove('leicht');
  assert.deepEqual(progress.noteBest('leicht', L[0], { seconds: 5, turns: 2 }),
    { neueBestzeit: false, wenigerDrehungen: false });
  assert.equal(einstellungen.stumm(), false);
  einstellungen.setStumm(true);
  delete globalThis.localStorage;
  // voll (QuotaExceededError): Lesen geht, Schreiben und Löschen scheitern still, der alte Stand bleibt
  const daten = new Map(Object.entries(HEUTE));
  const voll = () => { throw new Error('QuotaExceededError'); };
  globalThis.localStorage = { getItem: (k) => daten.get(k) ?? null, setItem: voll, removeItem: voll };
  progress.save('mittel', { platz: 50, geloest: [], gesehen: [], geschafft: false });
  progress.remove('leicht');
  einstellungen.setStumm(false);
  assert.deepEqual(Object.fromEntries(daten), HEUTE);
  assert.equal(progress.load('mittel', 60).platz, 23);
  // ohne localStorage überhaupt (ReferenceError)
  delete globalThis.localStorage;
  assert.equal(speicher.lesen('prisma.muted'), null);
  speicher.schreiben('a', 'b');
});
