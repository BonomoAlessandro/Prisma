// Tests der Würfel-Level (.scratch/wuerfel-500/, Ticket 01): die Würfel-Level im Spiel (LEVELS_3D) stehen in der
// Reihenfolge und mit den Graden, die tools/ordne-wuerfel.mjs nach den Regeln in tools/wuerfelliste.mjs rechnet, und
// erfüllen jede Regel (keine Duldungsliste im Würfel); dazu die Bausteine an erfundenen Fällen: Verteilung der Grade
// nach der Tabelle der Spec, Reihenfolge mit Korrekturen der KI-Tester, Ähnlichkeit über die Symmetrien des Würfels,
// Leveldaten als Text (tools/leveldaten.mjs) für Würfel-Level.
// Aufruf: node tests/wuerfelliste.test.mjs   (über leise.sh; beurteilt die Würfel-Level einmal mit ihrem Grad)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { L, solve, period, keyOf } from '../tools/solver.mjs';
import { GRADE } from '../tools/beurteilung/index.mjs';
import { beurteileAlle } from '../tools/beurteilung/parallel.mjs';
import { gradVon } from '../tools/beurteilung/grad.mjs';
import { AEHNLICH_AB, aehnlichkeit } from '../tools/aehnlichkeit.mjs';
import { abdruck, kandidatName, levelCode } from '../tools/leveldaten.mjs';
import { MAX_SHIFT } from '../tools/ki-tester/protocol.mjs';
import { fallendeSeiten, ladeLevelliste, zaehlendeWuerfelUrteile } from '../tools/levelliste.mjs';
import {
  GRUPPEN, HANDGEBAUT, WUERFEL, ZIEL, bestandNach, verletzt, wuerfelReihenfolge,
} from '../tools/wuerfelliste.mjs';

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const W = L.LEVELS_3D;
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const commitDa = (x) => {
  try { execFileSync('git', ['cat-file', '-e', `${x}^{commit}`], { stdio: 'ignore' }); return true; } catch { return false; }
};

console.log('Würfel-Level im Spiel');
const b = await beurteileAlle(W.map(level => ({ level, opts: { grad: level.grad ?? null, teuer: true } })));
const werte = b.map(x => x.schwierigkeit.wert);
const urteile = zaehlendeWuerfelUrteile();
const r = wuerfelReihenfolge(werte, W.map(l => l.name), b.map(x => x.hauptKernidee.begriff),
  { kandidat: W.map(kandidatName), urteile });

await test('Jedes Würfel-Level ist ein Würfel 7 × 7 × 7 mit Grad', () => {
  assert.deepEqual(W.filter(l => l.dim !== WUERFEL.dim || l.size !== WUERFEL.size).map(l => l.name), []);
  assert.deepEqual(W.filter(l => !GRADE.includes(l.grad)).map(l => l.name), [], 'ohne Grad');
});
await test('Reihenfolge und Grade wie von ordne-wuerfel.mjs gerechnet', () => {
  assert.deepEqual(r.folge.map(i => W[i].name), W.map(l => l.name));
  assert.deepEqual(W.map(l => l.grad), r.grad);
});
await test('Grad sinkt nie, Mittel je 10 Level fällt nicht, keine Häufung der Haupt-Kernidee offen', () => {
  assert.deepEqual(W.filter((l, p) => p && GRADE.indexOf(l.grad) < GRADE.indexOf(W[p - 1].grad)).map(l => l.name), []);
  assert.deepEqual(fallendeSeiten(r.folge, werte), []);
  assert.deepEqual(r.offen.map(h => `Seite ${h.gruppe + 1} ${h.begriff}`), []);
});
await test('Kein Würfel-Level verletzt eine Regel (Ausschlussgrund, Kernidee, Spielwert, Ablehnung)', () => {
  assert.deepEqual(W.flatMap((l, i) => {
    const v = verletzt(b[i], l.grad, r.ki.get(i));
    return v.length ? [`${l.name}: ${v.join(', ')}`] : [];
  }), []);
});
await test('Jedes Würfel-Level hat genau eine Lösung, die notierte', () => {
  const falsch = W.filter((level) => {
    const s = solve(level, { unique: true });
    const norm = (set) => Object.entries(set).map(([k, v]) => `${k}:${v % period(level.elements.find(e => keyOf(e) === k))}`)
      .sort().join(' ');
    return s.aborted || s.count !== 1 || norm(s.solutions[0].set) !== norm(level.solution);
  });
  assert.deepEqual(falsch.map(l => l.name), []);
});
await test(`Kein Würfel-Level ist einem anderen zu ähnlich (ab ${AEHNLICH_AB})`, () => {
  const zuNah = [];
  for (let i = 0; i < W.length; i++) {
    for (let j = i + 1; j < W.length; j++) {
      const wert = aehnlichkeit(W[i], W[j]);
      if (wert >= AEHNLICH_AB) zuNah.push(`${W[i].name} – ${W[j].name} ${wert}`);
    }
  }
  assert.deepEqual(zuNah, []);
});
await test('Namen eindeutig über flache und Würfel-Level, keiner von der Liste entfernter Level', () => {
  const namen = [...L.LEVELS, ...W].map(l => l.name), entfernt = ladeLevelliste().entfernteNamen ?? [];
  assert.deepEqual(namen.filter((x, k) => namen.indexOf(x) !== k), []);
  assert.deepEqual(W.map(l => l.name).filter(x => entfernt.includes(x)), []);
});
await test('Ausser den handgebauten: Urteil der KI-Tester (wuerfel-…) und Herkunft mit Stand des Codes', () => {
  const neu = W.flatMap((l, i) => (HANDGEBAUT.includes(l.name) ? [] : [i]));
  assert.deepEqual(neu.filter(i => !r.ki.has(i)).map(i => W[i].name), [], 'ohne Urteil');
  // Stand: der Commit, mit dem ausbau.mjs pool … --wuerfel das Level aus dem Seed baut (mit „+“ nicht nachbaubar)
  const herkunft = (name) => new RegExp(`// Generator [a-z -]+, Seed \\d+(?:, Ziel [\\d,]+–[\\d,]+)?, Stand [0-9a-f]{7,40} `
    + `· Würfel „[a-z ]+“\\r?\\n {4}name: '${name}', dim: 3`);
  assert.deepEqual(neu.filter(i => !herkunft(W[i].name).test(html)).map(i => W[i].name), [], 'Herkunft');
  const staende = [...new Set([...html.matchAll(/, Stand ([0-9a-f]{7,40}) · Würfel/g)].map(m => m[1]))];
  assert.deepEqual(staende.filter(x => !commitDa(x)), [], 'Stand ist kein Commit');
  assert.deepEqual(W.filter(l => !HANDGEBAUT.includes(l.name) && l.hint).map(l => l.name), [], 'Hinweis nur handgebaut');
});

console.log('Bausteine');
await test('Verteilung der Grade: Bestand nach jeder Gruppe wie in der Tabelle der Spec', () => {
  const spec = readFileSync(new URL('../.scratch/wuerfel-500/spec.md', import.meta.url), 'utf8');
  const tabelle = [...spec.matchAll(/^ {2}\| (\d+) \| \d+ \| (\d+) \| ([\d /]+) \|/gm)]
    .map(([, g, n, bestand]) => [Number(g), Number(n), bestand.trim()]);
  assert.equal(tabelle.length, GRUPPEN);
  for (const [g, n, bestand] of tabelle) {
    const x = bestandNach(g);
    assert.equal(GRADE.map(k => x[k]).join(' / '), bestand, `Gruppe ${g}`);
    assert.equal(GRADE.reduce((s, k) => s + x[k], 0), n, `Gruppe ${g}`);
  }
  assert.deepEqual(bestandNach(GRUPPEN), ZIEL);
});
await test('Reihenfolge: nach der Formel, Grad nach der Schwelle, Korrektur der KI-Tester im Grad, nur Läufe wuerfel-<Gruppe>…', () => {
  // sechs Level, 1 leicht; das Urteil zu L3 will nach vorn, kommt aber nicht über die Grenze von „mittel“
  const w = [30, 10, 55, 80, 20, 45], namen = w.map((_, i) => `L${i}`), haupt = w.map(() => null);
  const ohne = wuerfelReihenfolge(w, namen, haupt);
  assert.deepEqual(ohne.folge, [1, 4, 0, 5, 2, 3]);
  assert.deepEqual(ohne.grad, w.map(gradVon));
  const anker = { A1: 2, A2: 4 };
  const urteil = (name, lauf) => ({ lauf, ablauf: '2', level: { name, anker: null }, anker,
    urteile: Object.fromEntries(['A', 'B'].map(t => [t, { einordnung: '<A1', ablehnung: [] }])) });
  // L2 (55, mittel, Platz 5) will vor A1: in seinem Grad höchstens bis an die Grenze von „mittel“ (Platz 4)
  const mit = wuerfelReihenfolge(w, namen, haupt, { urteile: [urteil('L2', 'wuerfel-1')] });
  assert.ok(mit.ki.get(2).verschiebung < 0 && mit.ki.get(2).verschiebung >= -MAX_SHIFT);
  assert.deepEqual(mit.folge, [1, 4, 0, 2, 5, 3]);
  // ein Urteil aus einem flachen Lauf zählt im Würfel nicht
  assert.deepEqual(wuerfelReihenfolge(w, namen, haupt, { urteile: [urteil('L2', 'ausbau-1')] }).folge, ohne.folge);
});
await test('Ähnlichkeit im Würfel: über die 48 Symmetrien mit gedrehter Drehachse, Gegenproben', () => {
  const kern = W.find(l => l.name === 'Kern');
  // (x, y, z) → (z, 6 − x, y): die Achse x wird zu y, y zu z, z zu x; Stellungen beliebig
  const zu = { x: 'y', y: 'z', z: 'x' };
  const gedreht = { ...kern, elements: kern.elements.map(e => ({ ...e, x: e.z, y: 6 - e.x, z: e.y,
    axis: zu[e.axis || 'y'], ...(e.rot !== undefined ? { rot: (e.rot + 3) % 8 } : {}) })) };
  assert.equal(aehnlichkeit(kern, gedreht), 1);
  // dieselben Zellen, aber die Drehachsen nicht mitgedreht: Spiegel und Prisma zählen anders
  const achseFalsch = { ...gedreht, elements: gedreht.elements.map((e, k) => ({ ...e, axis: kern.elements[k].axis })) };
  assert.ok(aehnlichkeit(kern, achseFalsch) < 1);
  // ein flaches Level und ein Würfel-Level sind nie ähnlich
  assert.equal(aehnlichkeit(kern, { ...L.LEVELS[0] }), 0);
});
await test('Leveldaten als Text: ein Würfel-Level liest sich zurück, sein Abdruck hängt an Ebene und Achse', () => {
  for (const level of W) {
    const code = levelCode(level, ['Probe']);
    assert.deepEqual(new Function(`return [${code}][0]`)(), level, level.name);
  }
  const kern = W.find(l => l.name === 'Kern');
  const anders = { ...kern, elements: kern.elements.map((e, k) => (k === 1 ? { ...e, axis: 'x' } : e)) };
  assert.notEqual(abdruck(anders), abdruck(kern));
  assert.notEqual(kandidatName({ ...kern, elements: kern.elements.map((e, k) => (k === 1 ? { ...e, y: 1 } : e)) }),
    kandidatName(kern));
});
