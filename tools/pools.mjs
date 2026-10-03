// Erzeugt die Kandidaten-Pools für tools/curate.mjs: je Profil (tools/profiles.mjs) eine Datei
// tools/pools/<profil>.jsonl mit JSON-Zeilen { level, metrics, quality, seed }.
// Vorhandene Pools werden übersprungen (--force erzeugt sie neu).
//
// Aufruf: node tools/pools.mjs [profil …] [--count N] [--jobs N] [--minutes M] [--force]
//   ohne Profil: alle Profile, von leicht nach schwer
//   --minutes  Zeitlimit je Profil; Stufe 3 bekommt das Doppelte, Stufe 4 und 5 das Dreifache (Standard 3)
// Alle Profile dauern im ungünstigsten Fall (jedes läuft bis zum Zeitlimit) rund 2,5 Stunden.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { PROFILES } from './profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'pools');
const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
const force = args.includes('--force') ? (args.splice(args.indexOf('--force'), 1), true) : false;
const count = Number(flag('--count', 25));
const jobs = Number(flag('--jobs', Math.max(1, os.cpus().length - 1)));
const minutes = Number(flag('--minutes', 3));
for (const [k, v] of [['--count', count], ['--jobs', jobs], ['--minutes', minutes]]) {
  if (!(v > 0) || (k !== '--minutes' && !Number.isInteger(v))) { console.error(`${k} braucht eine Zahl > 0`); process.exit(1); }
}
const ids = args.length ? args : PROFILES.map(p => p.id);
for (const id of ids) if (!PROFILES.some(p => p.id === id)) { console.error('Profil unbekannt: ' + id); process.exit(1); }
mkdirSync(dir, { recursive: true });

for (const id of ids) {
  const file = join(dir, id + '.jsonl');
  if (existsSync(file) && !force) { console.error(`${id}: vorhanden, übersprungen`); continue; }
  const tier = Number(id.split('-')[0]);
  const seconds = Math.round(minutes * 60 * (tier >= 4 ? 3 : tier === 3 ? 2 : 1));
  const gen = spawnSync(process.execPath, [join(here, 'generate.mjs'), id, String(count), '1', '1000000', '--jobs', String(jobs), '--time', String(seconds)],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (gen.error) { console.error(`${id}: Generator konnte nicht gestartet werden: ${gen.error.message}`); continue; }
  process.stderr.write(gen.stderr || '');
  if (gen.status !== 0) { console.error(`${id}: Generator mit Fehler beendet (Status ${gen.status})`); continue; }
  const lines = gen.stdout.trim().split('\n').filter(Boolean);
  if (!lines.length) { console.error(`${id}: kein Level gefunden – keine Datei geschrieben (mehr Zeit geben)`); continue; }
  writeFileSync(file, lines.join('\n') + '\n');
  const scores = lines.map(l => JSON.parse(l).metrics.score).sort((a, b) => a - b);
  console.error(`${id}: ${lines.length} Level, Wertung ${scores[0]}–${scores.at(-1)}`);
}
