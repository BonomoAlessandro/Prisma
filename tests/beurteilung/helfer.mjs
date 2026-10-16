// Gemeinsamer Helfer der Tests der Beurteilung (Spec, Nahtstelle 2): Testfälle melden, Mini-Level bauen und die 150
// heutigen Level und die Eichmenge des Spielwerts einmal beurteilen. Jede Regel hat ihre eigene Testdatei in
// tests/beurteilung/; alle zusammen laufen mit node tests/beurteilung.test.mjs, dann teilen sie sich diese
// Beurteilungen, vorab auf mehreren Threads beurteilt (vorausBeurteilen).
import { L, keyOf, getRot } from '../../tools/solver.mjs';
import { beurteile } from '../../tools/beurteilung/index.mjs';
import { beurteileAlle } from '../../tools/beurteilung/parallel.mjs';
import { eichmenge } from '../../tools/beurteilung/spielwert-eichmenge.mjs';
import { gradeOf } from '../../tools/ki-tester/protocol.mjs';

let passed = 0, failed = 0;
export function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { failed++; console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden${failed ? `, ${failed} fehlgeschlagen` : ''}.`));

/**
 * Mini-Level aus Elementen in Lösungsstellung (Leveldaten wie in LEVELS): Die Lösung nennt jedes drehbare Element in der
 * Stellung, in der es steht.
 */
export function miniLevel(elements, name = 'Mini-Level') {
  const solution = {};
  for (const e of elements) if (L.isRotatable(e)) solution[keyOf(e)] = getRot(e) ?? 0;
  return { name, elements, solution };
}

const heute = () => L.LEVELS.slice(L.TUTORIAL_COUNT);
const grad = (i) => gradeOf(i + 1).name;
let menge = null;
const eichung = () => (menge ??= eichmenge());
// Was die Tests teuer beurteilen, je Teil die Aufträge { level, opts } an beurteile: die Kandidaten der Eichmenge des
// Spielwerts ausserhalb des Spiels (ohne Grad), die 150 mit und ohne die teuren Regeln. Die teuersten stehen zuerst,
// damit am Schluss eines Durchgangs auf mehreren Threads keiner lange allein rechnet.
const AUFTRAEGE = {
  kandidaten: () => eichung().filter(e => !e.platz).map(e => ({ level: e.level, opts: { grad: null, teuer: true } })),
  teuer: () => heute().map((level, i) => ({ level, opts: { grad: grad(i), teuer: true } })),
  ohne: () => heute().map((level, i) => ({ level, opts: { grad: grad(i), teuer: false } })),
};
const beurteilt = new Map();
/** Die Beurteilungen eines Teils von AUFTRAEGE, einmal je Lauf: aus vorausBeurteilen oder hier auf einem Thread. */
function beurteilungen(teil) {
  if (!beurteilt.has(teil)) beurteilt.set(teil, AUFTRAEGE[teil]().map(({ level, opts }) => beurteile(level, opts)));
  return beurteilt.get(teil);
}

let vorabGescheitert = false;
/**
 * Beurteilt die genannten Teile von AUFTRAEGE (Vorgabe alle), soweit sie fehlen, in einem Durchgang, verteilt auf die
 * Threads von tools/beurteilung/parallel.mjs (Vorgabe 4, BEURTEILUNG_THREADS übersteuert), und legt sie in den Cache.
 * tests/beurteilung.test.mjs ruft es vor den Testdateien auf, eine teure Testdatei zu Beginn für ihre Teile (allein so
 * schneller, über den Einstieg ohne Wirkung); die Testfälle bleiben synchron und finden alles im Cache. Was nicht vorab
 * beurteilt ist, beurteilt heutigeLevel bzw. eichmengeBeurteilt beim ersten Aufruf auf einem Thread. Ein Fehler hier
 * ist ein roter Testfall; danach beurteilen die Testfälle selbst und melden einen Fehler im Level wie ohne
 * Vorab-Durchgang.
 */
export async function vorausBeurteilen(teile = Object.keys(AUFTRAEGE)) {
  teile = teile.filter(teil => !beurteilt.has(teil));
  if (vorabGescheitert || !teile.length) return;
  const auftraege = teile.map(teil => AUFTRAEGE[teil]());
  let alle;
  try {
    alle = await beurteileAlle(auftraege.flat());
  } catch (e) {
    vorabGescheitert = true;
    test('Vorab auf mehreren Threads beurteilt (sonst beurteilen die Tests selbst)', () => { throw e; });
    return;
  }
  let i = 0;
  teile.forEach((teil, j) => beurteilt.set(teil, alle.slice(i, i += auftraege[j].length)));
}

const cache = new Map();
/**
 * Die 150 Level nach dem Tutorial, je { platz, level, grad, beurteilung }. Beurteilt mit dem vorläufigen Grad nach dem
 * heutigen Platz (Spec: leicht 1–30, mittel 31–100, schwer 101–140, sehr schwer 141–150), einmal je Lauf.
 * Ohne teuer: true fehlen die teuren Regeln (sie stehen in offen): Die Suche ohne Abschneiden dauert auf den 150 rund
 * 25 s, und nur die Tests ihrer Zahlen brauchen sie.
 */
export function heutigeLevel({ teuer = false } = {}) {
  if (!cache.has(teuer)) {
    const b = beurteilungen(teuer ? 'teuer' : 'ohne');
    cache.set(teuer, heute().map((level, i) => ({ platz: i + 1, level, grad: grad(i), beurteilung: b[i] })));
  }
  return cache.get(teuer);
}

let geeicht = null;
/**
 * Die Eichmenge des Spielwerts (spielwert-eichmenge.mjs), je Eintrag dazu seine beurteilung mit den teuren Regeln: die
 * heutigen Level aus heutigeLevel({ teuer: true }), die Kandidaten ohne Grad (auf einem Thread rund 45 s). Einmal je
 * Lauf.
 */
export function eichmengeBeurteilt() {
  if (!geeicht) {
    const kandidaten = beurteilungen('kandidaten');
    let k = 0;
    geeicht = eichung().map(e => ({
      ...e, beurteilung: e.platz ? heutigeLevel({ teuer: true })[e.platz - 1].beurteilung : kandidaten[k++],
    }));
  }
  return geeicht;
}
