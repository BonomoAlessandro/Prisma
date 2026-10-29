// Tests der Beurteilung (Spec, Nahtstelle 2): führt alle Dateien tests/beurteilung/*.test.mjs aus, je Regel eine, in
// einem Prozess. So beurteilt der Lauf die 150 heutigen Level nur einmal ohne und einmal mit den teuren Regeln, dazu
// die Kandidaten der Eichmenge des Spielwerts: vorab in einem Durchgang auf vier Threads (tests/beurteilung/helfer.mjs,
// tools/beurteilung/parallel.mjs). Die Testdateien finden sie im Cache. Die Level dafür, auch die Testlevel wie
// Querschläger und die Level, an denen Feldform und Würfel geprüft werden, kommen aus Spiel und Vorrat (ALLE im
// gemeinsamen Lader tools/lader.mjs, Spec .scratch/noa-geschichte/), damit Beurteilung und Eichung gültig bleiben.
// Aufruf: node tests/beurteilung.test.mjs                  alle
//         node tests/beurteilung/<datei>.test.mjs          eine Datei (eine teure beurteilt ihre Teile vorab)
//         BEURTEILUNG_THREADS=1 node tests/beurteilung.test.mjs   alle ohne Worker, mit denselben Ergebnissen
import { readdirSync } from 'node:fs';
import { vorausBeurteilen } from './beurteilung/helfer.mjs';

await vorausBeurteilen();
const dir = new URL('./beurteilung/', import.meta.url);
for (const file of readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort()) await import(new URL(file, dir));
