// Bereitet einen Lauf der KI-Tester vor: je Level das Feld als Text und Screenshots der Startstellung, dasselbe für die
// Anker, die Aufträge an beide KI-Tester (brief in protocol.mjs, aus brief.md) und lauf.json für merge.mjs. Alles liegt
// unter tests/output/ki-tester/<lauf>/ (nicht versioniert). Die KI-Tester lesen nur eingabe/ und schreiben je in ihren
// eigenen Ordner antwort-A/ bzw. antwort-B/; lauf.json (Namen, Plätze, Reihenfolgen) und die Aufträge liegen ausserhalb.
// Aufruf: sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--anker] [--ohne-bilder]
//   platz          Level zum Beurteilen (1–150); ein Anker wird dabei als Anker beurteilt
//   --anker        auch alle Anker beurteilen (Probelauf)
//   --ohne-bilder  nur Texte und Aufträge (schnell, zum Durchsehen; die Screenshots brauchen leise.sh)
// Die Level bekommen neutrale Kennungen (L1, L2 …, nach einer festen Mischung ihrer Namen), damit die KI-Tester ihren
// heutigen Platz nicht kennen. KI-Tester A beurteilt in einer gemischten Reihenfolge, KI-Tester B in der umgekehrten.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { L } from '../solver.mjs';
import {
  VERSION, FINGERPRINT, AGENT, TESTERS, answerPath, brief, fingerprint, gradeOf, levelAt, loadAnchors, today,
} from './protocol.mjs';
import { fieldText } from './field.mjs';
import { takeShots } from './shots.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const [run, ...positions] = args.filter(a => !a.startsWith('--')).map(String);
const MAIN = L.LEVELS.length - L.TUTORIAL_COUNT;
const unknown = [...flags].filter(f => !['--anker', '--ohne-bilder'].includes(f));
if (!run || !/^[\w-]+$/.test(run) || unknown.length || positions.some(p => !(Number.isInteger(+p) && +p >= 1 && +p <= MAIN))) {
  console.error(`Aufruf: sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--anker] [--ohne-bilder]   (Platz 1–${MAIN})`);
  process.exit(1);
}
if (fingerprint() !== FINGERPRINT) {
  console.error('Auftrag, Anker, Schema, Glossar oder Feld eines Ankers geändert, aber keine neue Version (siehe protocol.mjs).');
  process.exit(1);
}
const dir = join(root, 'tests', 'output', 'ki-tester', run);
const input = join(dir, 'eingabe');
const slash = (p) => p.replaceAll('\\', '/');
for (const t of TESTERS) {
  if (existsSync(join(dir, answerPath(t)))) {
    console.error(`${slash(dir)} hat schon Antworten: neuer Name für den Lauf oder Antworten zuerst wegräumen.`);
    process.exit(1);
  }
}

const anchors = loadAnchors();
for (const a of anchors) {
  if (gradeOf(a.position).name !== a.grad) throw new Error(`Anker ${a.id} ${a.name} steht auf Platz ${a.position}, nicht in ${a.grad}`);
}
const byPosition = new Map(anchors.map(a => [a.position, a]));
const level = (position, id, anchor = null) => ({
  id, name: levelAt(position).name, position, grad: gradeOf(position).name, anker: anchor,
});
const hash = (s) => createHash('sha256').update(s).digest('hex');
const others = [...new Set(positions.map(Number))].filter(p => !byPosition.has(p))
  .sort((a, b) => hash(levelAt(a).name).localeCompare(hash(levelAt(b).name)));
const judged = [
  ...anchors.filter(a => flags.has('--anker') || positions.map(Number).includes(a.position)).map(a => level(a.position, a.id, a.id)),
  ...others.map((p, k) => level(p, `L${k + 1}`)),
];
if (!judged.length) { console.error('Keine Level zum Beurteilen: Plätze angeben oder --anker.'); process.exit(1); }
const orderA = judged.map(l => l.id).sort((a, b) => hash(run + a).localeCompare(hash(run + b)));
const order = { A: orderA, B: [...orderA].reverse() };

// Eingaben: Feld als Text, Bilder, Schema; je KI-Tester ein leerer Antwortordner
mkdirSync(join(input, 'bilder'), { recursive: true });
for (const t of TESTERS) mkdirSync(dirname(join(dir, answerPath(t))), { recursive: true });
const all = [...anchors.map(a => level(a.position, a.id, a.id)), ...judged.filter(l => !l.anker)];
for (const l of all) writeFileSync(join(input, `${l.id}.md`), fieldText(levelAt(l.position), l.id));
copyFileSync(join(here, 'answer.schema.json'), join(input, 'answer.schema.json'));
let seconds = null;
if (!flags.has('--ohne-bilder')) {
  seconds = await takeShots(all.map(l => ({ index: L.TUTORIAL_COUNT + l.position - 1, label: l.id, file: join(input, 'bilder', l.id) })));
}

// Aufträge und lauf.json
for (const t of TESTERS) {
  writeFileSync(join(dir, `auftrag-${t}.md`), brief({
    tester: t, lauf: run, eingabe: slash(input), ausgabe: slash(join(dir, answerPath(t))), anchors,
    levels: order[t].map(id => judged.find(l => l.id === id)),
  }));
}
writeFileSync(join(dir, 'lauf.json'), JSON.stringify({
  lauf: run, ablauf: VERSION, fingerabdruck: FINGERPRINT, agent: AGENT, erstellt: today(), referenz: 'heutige Reihenfolge',
  anker: Object.fromEntries(anchors.map(a => [a.id, a.position])), level: judged, reihenfolge: order,
}, null, 2) + '\n');

console.log(`Lauf ${run} vorbereitet in ${slash(dir)}`);
for (const l of judged) console.log(`  ${l.id.padEnd(4)} ${String(l.position).padStart(3)} ${l.name} (${l.grad})`);
if (seconds) {
  for (const [view, list] of Object.entries(seconds)) {
    console.log(`  Screenshots ${view}: ${list.length} Level, ${(list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)} s je Aufnahme`);
  }
}
console.log(`Aufträge: ${TESTERS.map(t => slash(join(dir, `auftrag-${t}.md`))).join(', ')}`);
console.log(`Antworten: ${TESTERS.map(t => slash(join(dir, answerPath(t)))).join(', ')}`);
