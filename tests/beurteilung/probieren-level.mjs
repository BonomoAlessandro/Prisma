// Testlevel für Schliessen und Probieren (tests/beurteilung/schliessen.test.mjs und probieren.test.mjs).
// - Drei Mini-Level auf 5 × 5, je zwei weisse Quellen, vier drehbare Spiegel und zwei weisse Ziele, eindeutig lösbar.
// - Zwei Kandidaten aus den Pools des Härtens (tools/pools/harden-*.jsonl, nicht versioniert) als bekannte Fälle beim
//   Raten, je genau eins über einer Schwelle: Solche Werte lassen sich von Hand nicht bauen. Genau auf den Schwellen
//   liegen 144 Spiegelkabinett und 135 Pulsar aus den 150 heutigen Leveln.
import { miniLevel } from './helfer.mjs';

const quelle = (x, z, dir) => ({ type: 'source', x, z, dir });
const spiegel = (x, z, rot) => ({ type: 'mirror', x, z, rot });
const ziel = (x, z) => ({ type: 'target', x, z });
const klein = (elements, name) => ({ ...miniLevel(elements, name), size: 5 });

/**
 * Lässt sich durch Schliessen lösen: Das Spielermodell braucht keine Fallunterscheidung. Von 49 Strahlbildern sind 12
 * Fast-Lösungen, keine weit von der Lösung.
 */
export const schliessbar = klein([
  quelle(0, 2, 0), quelle(2, 0, 2),
  spiegel(4, 3, 3), spiegel(2, 3, 1), spiegel(3, 2, 3), spiegel(3, 1, 1),
  ziel(4, 0), ziel(0, 1),
], 'Schliessbar');

/**
 * Voller gleichwertiger Fast-Lösungen: Die vier Spiegel stehen so eng, dass viele Stellungen eines der Ziele richtig
 * beleuchten. 6 der 58 Strahlbilder sind weite Fast-Lösungen (103,4 ‰).
 */
export const fastLoesungen = klein([
  quelle(0, 1, 0), quelle(1, 0, 2),
  spiegel(1, 2, 3), spiegel(2, 2, 1), spiegel(3, 2, 3), spiegel(3, 1, 1),
  ziel(2, 0), ziel(0, 2),
], 'Fast-Lösungen');

/**
 * Dieselben Quellen und Spiegelplätze, ein Ziel steht auf 4,2 statt 0,2: nur 3 der 58 Strahlbilder sind weite
 * Fast-Lösungen (51,7 ‰). Mit Horizont 2 braucht das Spielermodell eine Fallunterscheidung (am Spiegel 3,1), mit
 * vollem Überblick keine.
 */
export const horizonte = klein([
  quelle(0, 1, 0), quelle(1, 0, 2),
  spiegel(1, 2, 1), spiegel(2, 2, 3), spiegel(3, 2, 1), spiegel(3, 1, 1),
  ziel(2, 0), ziel(4, 2),
], 'Horizonte');

/**
 * Raten mit 7 Fallunterscheidungen bei vollem Überblick, längste Kette 36 (harden-8, Seed 8004; Review 5 strich ihn
 * wegen Raten). In der Reihenfolge der Leveldaten hätte das Spielermodell der Reviews hier andere Werte, umgekehrt
 * etwa 5 Fallunterscheidungen und Kette 34.
 */
export const siebenFallunterscheidungen = {
  name: 'Raten: kInf 7',
  elements: [
    { type: 'source', x: 0, z: 2, dir: 0 },
    { type: 'source', x: 0, z: 1, dir: 0 },
    { type: 'mirror', x: 1, z: 1, rot: 2 },
    { type: 'mirror', x: 3, z: 4, rot: 3 },
    { type: 'mirror', x: 1, z: 2, rot: 3 },
    { type: 'mirror', x: 6, z: 2, rot: 3 },
    { type: 'mirror', x: 6, z: 4, rot: 0 },
    { type: 'mirror', x: 1, z: 3, rot: 0 },
    { type: 'mirror', x: 3, z: 3, rot: 1 },
    { type: 'prism', x: 4, z: 4, rot: 0 },
    { type: 'prism', x: 3, z: 5, rot: 4 },
    { type: 'target', x: 5, z: 3, color: 'red' },
    { type: 'source', x: 0, z: 5, dir: 0 },
    { type: 'mirror', x: 2, z: 4, rot: 0 },
    { type: 'target', x: 0, z: 3, color: 'white' },
    { type: 'mirror', x: 4, z: 0, rot: 3, fixed: true },
    { type: 'target', x: 2, z: 1, color: 'red' },
    { type: 'prism', x: 2, z: 5, rot: 5 },
    { type: 'target', x: 2, z: 6, color: 'blue' },
  ],
  solution: { '1,1': 1, '3,4': 1, '1,2': 1, '6,2': 1, '6,4': 3, '1,3': 3, '3,3': 3, '4,4': 5, '3,5': 7, '2,4': 1, '2,5': 1 },
};

/** Raten mit einer Kette von 39 Folgerungen bei 2 Fallunterscheidungen (harden-3, Seed 3029). */
export const langeKette = {
  name: 'Raten: Kette 39',
  elements: [
    { type: 'source', x: 3, z: 0, dir: 2 },
    { type: 'source', x: 0, z: 3, dir: 0 },
    { type: 'source', x: 5, z: 6, dir: 6 },
    { type: 'prism', x: 5, z: 4, rot: 1 },
    { type: 'mirror', x: 4, z: 3, rot: 1 },
    { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
    { type: 'prism', x: 4, z: 2, rot: 6 },
    { type: 'combiner', x: 3, z: 2, dir: 0 },
    { type: 'target', x: 4, z: 5, color: 'red' },
    { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
    { type: 'target', x: 2, z: 4, color: 'white' },
    { type: 'target', x: 1, z: 0, color: 'red' },
    { type: 'mirror', x: 4, z: 4, rot: 3, fixed: true },
    { type: 'prism', x: 2, z: 1, rot: 7 },
    { type: 'prism', x: 2, z: 3, rot: 2 },
    { type: 'mirror', x: 3, z: 6, rot: 3, fixed: true },
    { type: 'prism', x: 1, z: 3, rot: 3 },
    { type: 'mirror', x: 1, z: 4, rot: 3 },
    { type: 'prism', x: 3, z: 1, rot: 5 },
  ],
  solution: { '5,4': 5, '4,3': 3, '4,2': 4, '3,2': 5, '2,1': 6, '2,3': 1, '1,3': 1, '1,4': 1, '3,1': 3 },
};
