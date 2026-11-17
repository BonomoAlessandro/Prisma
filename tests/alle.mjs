// Alle Node-Tests ohne Browser nacheinander (npm test; Ticket 02 von .scratch/umbau/): golden ohne --write, die
// Strahllogik samt Build und Dev-Server, Hall, Vorrat, Geschichte, Levelliste, Würfelliste, KI-Tester, Beurteilung und
// Generator, dazu die Typen (tsc, Ticket 04) und die Sperre von leise.sh (mit eigenen Pfaden). Läuft jeder bis zum Ende, auch wenn einer scheitert; am Schluss die Übersicht. Schwer (mehrere Minuten,
// der Generator rechnet auf allen Kernen): nur über tools/leise.sh, etwa
//   LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 3600 npm test
// Aufruf: node tests/alle.mjs [name …]   (nur diese, etwa: node tests/alle.mjs logic golden)
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ALLE = {
  golden: 'golden.mjs',
  logic: 'logic.test.mjs',
  hall: 'hall.test.mjs',
  vorrat: 'vorrat.test.mjs',
  geschichte: 'geschichte.test.mjs',
  levelliste: 'levelliste.test.mjs',
  wuerfelliste: 'wuerfelliste.test.mjs',
  'ki-tester': 'ki-tester.test.mjs',
  beurteilung: 'beurteilung.test.mjs',
  generator: 'generator.test.mjs',
  typecheck: 'typecheck.mjs',
  leise: 'leise.test.mjs',
};
const wahl = process.argv.slice(2);
const unbekannt = wahl.filter((n) => !ALLE[n]);
if (unbekannt.length) {
  console.error(`Unbekannt: ${unbekannt.join(', ')} (bekannt: ${Object.keys(ALLE).join(', ')})`);
  process.exit(2);
}
const ergebnis = [];
for (const [name, datei] of Object.entries(ALLE).filter(([n]) => !wahl.length || wahl.includes(n))) {
  console.log(`\n=== ${name} (tests/${datei}) ===`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(here, datei)], { stdio: 'inherit' });
  ergebnis.push({ name, ok: r.status === 0, s: Math.round((Date.now() - t0) / 1000), code: r.status ?? r.signal });
}
console.log('\n=== Übersicht ===');
for (const e of ergebnis) console.log(`  ${e.ok ? 'ok    ' : 'FEHLER'} ${e.name.padEnd(13)} ${String(e.s).padStart(4)} s${e.ok ? '' : ` (${e.code})`}`);
process.exit(ergebnis.every((e) => e.ok) ? 0 : 1);
