// Tests der Beurteilung (Spec, Nahtstelle 2): führt alle Dateien tests/beurteilung/*.test.mjs aus, je Regel eine, in
// einem Prozess. So beurteilt der Lauf die 150 heutigen Level nur einmal ohne und einmal mit den teuren Regeln
// (tests/beurteilung/helfer.mjs).
// Aufruf: node tests/beurteilung.test.mjs                  alle
//         node tests/beurteilung/<datei>.test.mjs          eine Datei
import { readdirSync } from 'node:fs';

const dir = new URL('./beurteilung/', import.meta.url);
for (const file of readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort()) await import(new URL(file, dir));
