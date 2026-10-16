// Gemeinsamer Helfer der Tests der Beurteilung (Spec, Nahtstelle 2): Testfälle melden, Mini-Level bauen und die 150
// heutigen Level einmal beurteilen. Jede Regel hat ihre eigene Testdatei in tests/beurteilung/; alle zusammen laufen mit
// node tests/beurteilung.test.mjs, dann teilen sie sich die Beurteilung der 150.
import { L, keyOf, getRot } from '../../tools/solver.mjs';
import { beurteile } from '../../tools/beurteilung/index.mjs';
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

const cache = new Map();
/**
 * Die 150 Level nach dem Tutorial, je { platz, level, grad, beurteilung }. Beurteilt mit dem vorläufigen Grad nach dem
 * heutigen Platz (Spec: leicht 1–30, mittel 31–100, schwer 101–140, sehr schwer 141–150), einmal je Lauf.
 * Ohne teuer: true fehlen die teuren Regeln (sie stehen in offen): Die Suche ohne Abschneiden dauert auf den 150 rund
 * 25 s, und nur die Tests ihrer Zahlen brauchen sie.
 */
export function heutigeLevel({ teuer = false } = {}) {
  if (!cache.has(teuer)) cache.set(teuer, L.LEVELS.slice(L.TUTORIAL_COUNT).map((level, i) => {
    const grad = gradeOf(i + 1).name;
    return { platz: i + 1, level, grad, beurteilung: beurteile(level, { grad, teuer }) };
  }));
  return cache.get(teuer);
}
