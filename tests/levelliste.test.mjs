// Tests der Levelliste (Spec „Entscheide zu den Tests“, Nahtstelle 3; Ticket 15): die 150 Level im Spiel, ihre
// Reihenfolge, ihre Grade und die Duldungsliste (tools/levelliste.json). Sie ersetzen die Tests zu Markierung,
// gehärteten Leveln, Härte-Abnahme und Auswahlliste. Die Regeln stehen in tools/levelliste.mjs, gemeinsam mit
// tools/ordne-level.mjs, das Reihenfolge, Grade, Duldungsliste und Prüfliste schreibt.
// Beurteilt werden die 150 einmal mit allen Regeln und ihrem Grad, auf den Threads von tools/beurteilung/parallel.mjs.
// Aufruf: node tests/levelliste.test.mjs   (über leise.sh etwa 25 s)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { L, solve, period } from '../tools/solver.mjs';
import { GRADE } from '../tools/beurteilung/index.mjs';
import { beurteileAlle } from '../tools/beurteilung/parallel.mjs';
import { inHeutigerReihenfolge } from '../tools/beurteilung/heutige-reihenfolge.mjs';
import { gradVon } from '../tools/beurteilung/grad.mjs';
import {
  GRUENDE, HAUPT_KERNIDEE_JE_10, TOLERANZ_MITTEL, ladeLevelliste, ordne, gradeEntlang, zehner,
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
const verletzt = (grund) => MAIN.filter(l => GRUENDE[grund].gilt(nach.get(l.name).b, l.grad)).map(l => l.name);
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

console.log('Reihenfolge');
// Die Formel rechnet von der heutigen Reihenfolge aus (beurteilung/heutige-reihenfolge.mjs)
const heute = inHeutigerReihenfolge();
const werteHeute = heute.map(wert);
const ordnung = ordne(werteHeute);
const folge = heute.map((_, i) => i).sort((i, j) => ordnung.platz[i] - ordnung.platz[j]);
// Je Level im Spiel sein heutiger Platz (Index), und ob es dort bleibt (nach ordne)
const heutigerIndex = MAIN.map(l => heute.indexOf(l));
const bleibt = (l) => ordnung.bleibt.has(heute.indexOf(l));
test('Die Reihenfolge folgt der Schwierigkeit: bis 10 Plätze weit, weiter wandernde Level am heutigen Platz', () => {
  assert.deepEqual(MAIN.map(l => l.name), folge.map(i => heute[i].name));
  // Dazu ohne ordne() nachgerechnet: Wer bleibt, steht am heutigen Platz, jedes andere Level höchstens 10 Plätze davon,
  // und diese stehen untereinander nach der Schwierigkeit, bei gleichem Wert in der heutigen Reihenfolge
  const weit = MAIN.filter((l, k) => (bleibt(l) ? heutigerIndex[k] !== k : Math.abs(heutigerIndex[k] - k) > 10));
  assert.deepEqual(weit.map(l => `${heute.indexOf(l) + 1} → ${MAIN.indexOf(l) + 1} ${l.name}`), []);
  const frei = heutigerIndex.filter(i => !ordnung.bleibt.has(i));
  const ungeordnet = frei.filter((i, k) => k && (werteHeute[i] - werteHeute[frei[k - 1]] || i - frei[k - 1]) < 0);
  assert.deepEqual(ungeordnet.map(i => heute[i].name), [], 'nicht nach der Schwierigkeit');
});
test('Die Prüfliste für Ticket 16 nennt genau die Level, die nach der Formel mehr als 10 Plätze wandern würden', () => {
  const pruef = folge.filter(i => ordnung.bleibt.get(i) === 'Formel').map(i => heute[i].name);
  assert.deepEqual(liste.pruefliste, pruef);
  // Dazu ohne ordne(): Der Platz nach der Formel ist der Rang nach der Schwierigkeit, bei gleichem Wert der heutige
  const rang = heute.map((_, i) => i).sort((i, j) => werteHeute[i] - werteHeute[j] || i - j);
  const weit = rang.filter((i, r) => Math.abs(r - i) > 10).map(i => heute[i].name);
  assert.deepEqual([...liste.pruefliste].sort(), weit.sort());
});
test('Der Grad folgt den Schwellen; ein Level am heutigen Platz hat den Grad seines Abschnitts', () => {
  const grad = gradeEntlang(folge, werteHeute, ordnung.bleibt);
  assert.deepEqual(MAIN.filter((l, k) => l.grad !== grad[folge[k]]).map(l => `${l.name}: ${l.grad}`), []);
  // Dazu ohne gradeEntlang(): Jedes Level, das nach der Formel steht, hat den Grad nach den Schwellen
  assert.deepEqual(MAIN.filter(l => !bleibt(l) && l.grad !== gradVon(wert(l))).map(l => `${l.name}: ${l.grad}`), []);
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
test('Die Duldungsliste nennt nur Level im Spiel, je Grund jedes höchstens einmal', () => {
  assert.deepEqual(Object.keys(liste.duldung), Object.keys(GRUENDE));
  for (const namen of Object.values(liste.duldung)) {
    assert.deepEqual(namen.filter(x => !nach.has(x)), [], 'nicht im Spiel');
    assert.equal(new Set(namen).size, namen.length, 'doppelt');
  }
});

console.log('Namen, Lösung und Fortschritt');
test('Die Namen sind eindeutig, und keiner steht auf der Liste der entfernten Namen', () => {
  const namen = L.LEVELS.map(l => l.name);
  assert.deepEqual(namen.filter((x, i) => namen.indexOf(x) !== i), [], 'doppelt');
  assert.ok(Array.isArray(liste.entfernteNamen), 'Liste der entfernten Namen fehlt');
  assert.deepEqual(namen.filter(x => liste.entfernteNamen.includes(x)), []);
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
