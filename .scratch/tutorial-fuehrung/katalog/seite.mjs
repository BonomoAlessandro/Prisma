// Baut die Katalogseite «Führung im Dorf» (Ticket 01): node seite.mjs → index.html
// vorlage.html enthält Seite, Richtungen und Führung; hier kommen die Strahlregel und die Bretter von «Erstes Licht»
// und «Umweg» unverändert aus index.html des Spiels dazu, damit die Bretter sich wie im Spiel verhalten.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const spiel = readFileSync(join(here, '../../../index.html'), 'utf8').replace(/\r\n/g, '\n');

// Strahlregel: von den Richtungen (DIRS) bis vor die Level-Definitionen
const a = spiel.indexOf('const DIRS = [');
const b = spiel.lastIndexOf('/**', spiel.indexOf(' * Level-Definitionen'));
if (a < 0 || b < a) throw new Error('Strahlregel in index.html nicht gefunden');
const strahlregel = spiel.slice(a, b).trim();

// Die ersten beiden Übungen aus LEVELS (bis vor «Sperre»)
const l0 = spiel.indexOf('const LEVELS = [');
const l1 = spiel.lastIndexOf('{', spiel.indexOf("name: 'Sperre'"));
if (l0 < 0 || l1 < l0) throw new Error('LEVELS in index.html nicht gefunden');
const levels = spiel.slice(l0, l1).trimEnd() + '\n];';

// Probe: beide Bretter sind mit der notierten Lösung gelöst und zu Beginn nicht
const { traceBeams, createBoard } = new Function(`${strahlregel}\nreturn { traceBeams, createBoard };`)();
const LEVELS = new Function(`${levels}\nreturn LEVELS;`)();
if (LEVELS.map(l => l.name).join() !== 'Erstes Licht,Umweg') throw new Error('Unerwartete Übungen: ' + LEVELS.map(l => l.name));
for (const L of LEVELS) {
  const brett = createBoard(L);
  if (traceBeams(brett).solved) throw new Error(`${L.name}: schon zu Beginn gelöst`);
  for (const [k, rot] of Object.entries(L.solution)) brett.elements.find(e => `${e.x},${e.z}` === k).rot = rot;
  if (!traceBeams(brett).solved) throw new Error(`${L.name}: Lösung löst nicht`);
}

const vorlage = readFileSync(join(here, 'vorlage.html'), 'utf8');
const out = vorlage.replace('/*STRAHLREGEL*/', () => strahlregel).replace('/*LEVELS*/', () => levels);
writeFileSync(join(here, 'index.html'), out);
console.log(`index.html geschrieben (${Math.round(out.length / 1024)} KB)`);
