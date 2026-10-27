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
import { MAX_SHIFT, VERSIONS } from '../tools/ki-tester/protocol.mjs';
import { fallendeSeiten, haeufungen, ladeLevelliste, obenIn, zaehlendeWuerfelUrteile } from '../tools/levelliste.mjs';
import {
  BEHALTEN, GRENZ_DULDUNG, GRUPPEN, QUADER, WUERFEL_TEXT, ZIEL, bestandNach, ebenenVerletzt, getroffeneEbenen, istWuerfel, senke,
  verletzt, wuerfelReihenfolge,
} from '../tools/wuerfelliste.mjs';
import { KERN } from './wuerfel-handgebaut.mjs';

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

await test(`Jedes Würfel-Level ist ein Würfel ${WUERFEL_TEXT} mit Grad`, () => {
  assert.deepEqual(W.filter(l => !istWuerfel(l)).map(l => l.name), []);
  assert.deepEqual(W.filter(l => !GRADE.includes(l.grad)).map(l => l.name), [], 'ohne Grad');
});
await test('Reihenfolge und Grade wie von ordne-wuerfel.mjs gerechnet', () => {
  assert.deepEqual(r.folge.map(i => W[i].name), W.map(l => l.name));
  assert.deepEqual(W.map(l => l.grad), r.grad);
  // Fixpunkt (Ticket 05): mit umgedrehter Eingabe dieselbe Folge, auch bei Leveln mit gleichem Wert
  const um = W.map((_, i) => W.length - 1 - i);
  const ru = wuerfelReihenfolge(um.map(i => werte[i]), um.map(i => W[i].name), um.map(i => b[i].hauptKernidee.begriff),
    { kandidat: um.map(i => kandidatName(W[i])), urteile });
  assert.deepEqual(ru.folge.map(k => W[um[k]].name), W.map(l => l.name), 'hängt von der Reihenfolge in index.html ab');
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
await test('Jedes Würfel-Level erfüllt die Ebenen-Regel (mindestens 3 getroffene Ebenen, am Boden; Dauerregel)', () => {
  assert.deepEqual(W.flatMap(l => ebenenVerletzt(l).map(t => `${l.name}: ${t}`)), []);
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
await test('Jedes Würfel-Level: Urteil der KI-Tester (wuerfel-…), Herkunft mit Stand des Codes, kein Hinweis', () => {
  const neu = W.map((_, i) => i);
  assert.deepEqual(neu.filter(i => !r.ki.has(i)).map(i => W[i].name), [], 'ohne Urteil');
  // Stand: der Commit, mit dem ausbau.mjs pool … --wuerfel das Level aus dem Seed baut (mit „+“ nicht nachbaubar)
  // „gesenkt um N“: aus dem Würfel 7 × 7 × 7 in den Quader (wuerfel.mjs umrechnen, .scratch/wuerfel-7x7x5/)
  const herkunft = (name) => new RegExp(`// Generator [a-z -]+, Seed \\d+(?:, Ziel [\\d,]+–[\\d,]+)?, Stand [0-9a-f]{7,40}`
    + `(?:, gesenkt um \\d)? · Würfel „[a-z ]+“\\r?\\n {4}name: '${name}', dim: 3`);
  assert.deepEqual(neu.filter(i => !herkunft(W[i].name).test(html)).map(i => W[i].name), [], 'Herkunft');
  const staende = [...new Set([...html.matchAll(/, Stand ([0-9a-f]{7,40})(?:, gesenkt um \d)? · Würfel/g)].map(m => m[1]))];
  assert.deepEqual(staende.filter(x => !commitDa(x)), [], 'Stand ist kein Commit');
  assert.deepEqual(W.filter(l => l.hint).map(l => l.name), [], 'Hinweis');
});

await test('Grenz-Duldung (Ticket 13): nur leichte Level, und jedes gebraucht (seit 7 × 7 × 5 leer)', () => {
  const p = (x) => W.findIndex(l => l.name === x);
  assert.deepEqual(GRENZ_DULDUNG.filter(x => p(x) < 0 || W[p(x)].grad !== 'leicht'), [], 'nicht im Spiel oder nicht leicht');
  // ein geduldetes Level steht in einer Häufung, die ohne die Duldung offen bliebe (Entscheid des Nutzers vom 26.10.2026)
  const ohne = haeufungen(r.folge, b.map(x => x.hauptKernidee.begriff), new Set(), 0, Infinity, obenIn(r.grad, r.ausbau));
  assert.deepEqual(GRENZ_DULDUNG.filter(x => !ohne.some(h => h.mit.includes(p(x)))), [], 'nicht gebraucht');
});

console.log('Bausteine');
await test('Verteilung der Grade: Bestand nach jeder Gruppe wie in der Tabelle der Spec', () => {
  // bis 300 die Tabelle der Spec wuerfel-7x7x5 (Gruppen 1–9), danach die der Spec wuerfel-500 ab ihrer Gruppe 13
  const zeilen = (spec) => [...readFileSync(new URL(`../.scratch/${spec}/spec.md`, import.meta.url), 'utf8')
    .matchAll(/^ {2,3}\| (\d+) \| \d+ \| (\d+) \| ([\d /]+) \| ([\d /]+) \|/gm)]
    .map(([, g, n, bestand, neu]) => [Number(g), Number(n), bestand.trim(), neu.trim()]);
  const tabelle = [...zeilen('wuerfel-7x7x5'), ...zeilen('wuerfel-500').filter(([g]) => g > 12).map(([g, ...x]) => [g - 3, ...x])];
  assert.deepEqual(tabelle.map(([g]) => g), Array.from({ length: GRUPPEN }, (_, k) => k + 1));
  assert.deepEqual(bestandNach(0), BEHALTEN);
  for (const [g, n, bestand, neu] of tabelle) {
    const x = bestandNach(g), vorher = bestandNach(g - 1);
    assert.equal(GRADE.map(k => x[k]).join(' / '), bestand, `Gruppe ${g}`);
    assert.equal(GRADE.map(k => x[k] - vorher[k]).join(' / '), neu, `Gruppe ${g}: Spalte neu`);
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
await test('Korrektur der KI-Tester im Würfel: die Verschiebung aus dem Protokoll, vom Platz der Formel aus (Ticket 10 der Spec wuerfel-7x7x5)', () => {
  // Das Urteil sagt beim Lauf −3; wie die Anker heute stehen, ändert daran nichts (früher rechnete reihenfolge neu)
  const urteil = { lauf: 'wuerfel-1', ablauf: 'W1', level: { name: 'Z', anker: null }, anker: { A1: 1, A2: 2 },
    urteile: Object.fromEntries(['A', 'B'].map(t => [t, { einordnung: 'A1-A2', ablehnung: [] }])),
    ergebnis: { abgelehnt: false, gruende: [], verschiebung: -3, position: 2 } };
  const v = (namen, w = [10, 15, 20, 30, 35]) => wuerfelReihenfolge(w, namen, w.map(() => null), { urteile: [urteil] })
    .ki.get(4).verschiebung;
  assert.equal(v(['Aufzug', 'P', 'Q', 'Kern', 'Z']), -3);
  assert.equal(v(['Aufzug', 'P', 'Q', 'Anders', 'Z']), -3, 'Anker nicht im Spiel');
  assert.equal(v(['Aufzug', 'P', 'Q', 'Kern', 'Z'], [25, 15, 20, 10, 35]), -3, 'Anker anders geordnet');
});
await test('Jedes zählende Würfel-Urteil wirkt mit der Verschiebung aus seinem Lauf', () => {
  assert.deepEqual([...r.ki.values()].filter(u => u.verschiebung !== u.eintrag.ergebnis.verschiebung)
    .map(u => u.eintrag.level.name), []);
});
await test('Grenz-Duldung: ein leichtes Level der Liste zählt wie ab mittel (3), nicht mehr und nur mit diesem Namen', () => {
  // eine Seite: das leichte Level 0 und die mittleren 1, 2 mit derselben Haupt-Kernidee S, die übrigen verschieden;
  // die Liste hier eigens (GRENZ_DULDUNG ist seit 7 × 7 × 5 leer, der Mechanismus bleibt)
  const liste = ['Geduldet'];
  const offen = (name, w, haupt) => wuerfelReihenfolge(w, [name, ...w.slice(1).map((_, i) => `L${i + 1}`)], haupt,
    { obenAuch: liste }).offen.map(h => `${h.begriff} ${h.mit.length}`);
  const w = [40, 45, 46, 50, 52, 54, 60, 62, 64, 66], haupt = ['S', 'S', 'S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  assert.deepEqual(offen(liste[0], w, haupt), []);
  assert.deepEqual(offen('Anders', w, haupt), ['S 3'], 'ohne die Liste gilt für ein leichtes Level die Grenze 2');
  assert.deepEqual(offen(liste[0], w, ['S', 'S', 'S', 'S', 'B', 'C', 'D', 'E', 'F', 'G']), ['S 4'], 'viermal');
  // mit einem zweiten leichten Level in der Häufung gilt wieder die Grenze 2
  assert.deepEqual(offen(liste[0], [40, 41, 46, 50, 52, 54, 60, 62, 64, 66], haupt), ['S 3'], 'zwei leichte');
});
await test('Ähnlichkeit im Würfel: über die 48 Symmetrien mit gedrehter Drehachse, Gegenproben', () => {
  const kern = KERN;
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
  const kern = KERN;
  const anders = { ...kern, elements: kern.elements.map((e, k) => (k === 1 ? { ...e, axis: 'x' } : e)) };
  assert.notEqual(abdruck(anders), abdruck(kern));
  assert.notEqual(kandidatName({ ...kern, elements: kern.elements.map((e, k) => (k === 1 ? { ...e, y: 1 } : e)) }),
    kandidatName(kern));
  // Quader 7 × 7 × 5 (.scratch/wuerfel-7x7x5/): height steht im Text und im Abdruck, height = size wie ohne
  const flach = W.find(l => l.elements.every(e => e.y < 5)), quader = { ...flach, height: 5 };
  const code = levelCode(quader, []);
  assert.match(code, /dim: 3, size: 7, height: 5, grad:/);
  assert.deepEqual(new Function(`return [${code}][0]`)(), quader);
  const ohne = { ...quader };
  delete ohne.height;
  assert.notEqual(abdruck(quader), abdruck(ohne));
  assert.equal(abdruck({ ...ohne, height: 7 }), abdruck(ohne), "height = size wie ohne");
});
await test('Ebenen-Regel (Dauerregel): getroffene Ebenen in der Lösung, Zierstück zählt nicht, am Boden', () => {
  // Quelle unten, Spiegel mit Achse z lenkt nach oben, Spiegel auf Ebene 2 nach Süd, Ziel auf Ebene 2: zwei Ebenen
  const level = { name: 'Probe', ...QUADER, elements: [
    { type: 'source', x: 0, y: 0, z: 0, dir: 0 }, { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 0 },
    { type: 'mirror', x: 3, y: 2, z: 0, axis: 'x', rot: 0 }, { type: 'target', x: 3, y: 2, z: 5 },
    { type: 'blocker', x: 6, y: 4, z: 6 }], solution: { '3,0,0': 3, '3,2,0': 1 } };
  assert.ok(L.traceBeams(L.createBoard({ ...level, elements: level.elements.map(e => {
    const k = `${e.x},${e.y},${e.z}`;
    return k in level.solution ? { ...e, rot: level.solution[k] } : e;
  }) })).solved, 'Probe gelöst');
  assert.deepEqual(getroffeneEbenen(level), [0, 2]);
  assert.equal(ebenenVerletzt(level).length, 1, 'der Blocker auf Ebene 4 zählt nicht');
  // Ziel eine Ebene höher (Spiegel auf Ebene 2 nach Süd und oben geht nicht): Ziel und Spiegel auf Ebene 4
  const drei = { ...level, elements: level.elements.map(e => (e.type === 'target' ? { ...e, y: 4 } : e.y === 2 ? { ...e, y: 4 } : e)),
    solution: { '3,0,0': 3, '3,4,0': 1 } };
  const mitte = { ...drei, elements: [...drei.elements, { type: 'filter', x: 3, y: 2, z: 0, color: 'white' }] };
  assert.deepEqual(getroffeneEbenen(mitte), [0, 2, 4]);
  assert.deepEqual(ebenenVerletzt(mitte), []);
  // gehoben: schwebt; gesenkt wieder am Boden, Lösung und getroffene Ebenen wie vorher
  const hoch = { ...mitte, height: 7, elements: mitte.elements.map(e => ({ ...e, y: e.y + 1 })),
    solution: { '3,1,0': 3, '3,5,0': 1 } };
  assert.ok(ebenenVerletzt(hoch).some(t => /schwebt/.test(t)));
  assert.deepEqual(senke(hoch, 1), { ...mitte, height: 5 });
  // der Löser sieht gehoben und gesenkt dieselben Lösungen (über und unter den Elementen nur leerer Raum)
  const loesungen = (l) => solve(l, { collect: 10 }).solutions.map(s => JSON.stringify(s.set)).sort();
  assert.ok(loesungen(hoch).length, 'gehoben lösbar');
  assert.deepEqual(loesungen(senke(hoch, 1)).map(s => s.replace(/,(\d),/g, (_, y) => `,${+y + 1},`)), loesungen(hoch));
});
await test('Ebenen-Regel: getroffen zählt bei jeder Ereignisart, die Lösungsstellung gilt auch für den Kombinator', () => {
  const quelle = { type: 'source', x: 0, y: 0, z: 0, dir: 0 }, hoch = { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 3 };
  const probe = (elements, solution = {}) => getroffeneEbenen({ name: 'Probe', ...QUADER, elements, solution });
  // Spiegel streifend (am Rahmen geschluckt), Prisma schluckt, Prisma fächert, Blocker: das getroffene zählt, das
  // dahinter (Ebene 4) nicht
  for (const zwei of [{ type: 'mirror', axis: 'z', rot: 2 }, { type: 'prism', axis: 'z', rot: 1 },
    { type: 'prism', axis: 'z', rot: 0 }, { type: 'blocker' }]) {
    assert.deepEqual(probe([quelle, hoch, { ...zwei, x: 3, y: 2, z: 0 }, { type: 'blocker', x: 3, y: 4, z: 0 }]), [0, 2],
      zwei.type);
  }
  // Kombinator: Startstellung dir 0 trifft nichts, die Lösung dir 6 lenkt nach oben auf das Ziel auf Ebene 3
  const kombi = [quelle, { type: 'combiner', x: 2, y: 0, z: 0, axis: 'z', dir: 0 }, { type: 'target', x: 2, y: 3, z: 0 }];
  assert.deepEqual(probe(kombi), [0]);
  assert.deepEqual(probe(kombi, { '2,0,0': 6 }), [0, 3]);
});
await test('Ähnlichkeit im Quader 7 × 7 × 5: nur Symmetrien, die y erhalten; Würfel und Quader nie ähnlich', () => {
  const q = { name: 'q', dim: 3, size: 7, height: 5, solution: {}, elements: [
    { type: 'source', x: 0, y: 0, z: 1, dir: 0 }, { type: 'mirror', x: 5, y: 0, z: 1, axis: 'z', rot: 1 },
    { type: 'mirror', x: 5, y: 4, z: 1, rot: 1 }, { type: 'target', x: 5, y: 4, z: 6 }] };
  // um y gedreht (x, z) → (6 − z, x) und in der Höhe gespiegelt (y → 4 − y): gleich
  const gedreht = { ...q, elements: q.elements.map(e => ({ ...e, x: 6 - e.z, z: e.x, ...(e.axis === 'z' ? { axis: 'x' } : {}) })) };
  assert.equal(aehnlichkeit(q, gedreht), 1);
  assert.equal(aehnlichkeit(q, { ...q, elements: q.elements.map(e => ({ ...e, y: 4 - e.y })) }), 1);
  // y mit x getauscht ist im Quader keine Symmetrie
  const gekippt = { ...q, elements: q.elements.map(e => ({ ...e, x: e.y, y: Math.min(e.x, 4) })) };
  assert.ok(aehnlichkeit(q, gekippt) < 1);
  assert.equal(aehnlichkeit(q, { ...q, height: undefined }), 0);
});
