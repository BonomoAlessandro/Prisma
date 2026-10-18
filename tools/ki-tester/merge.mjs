// Prüft die Antworten der beiden KI-Tester eines Laufs, führt sie je Level zusammen und hängt das Ergebnis ans
// versionierte Protokoll an (protocol.jsonl; Regeln in protocol.mjs). Die Referenz jedes Levels und die Plätze der
// Anker kommen aus lauf.json, also aus der Reihenfolge bei der Vorbereitung, mit der die KI-Tester geurteilt haben.
// Aufruf: node tools/ki-tester/merge.mjs <lauf> [--trocken]
//   liest tests/output/ki-tester/<lauf>/lauf.json und antwort-A/urteile.json, antwort-B/urteile.json (von prepare.mjs
//   angelegt bzw. von den KI-Testern geschrieben)
//   --trocken: nur prüfen und das Ergebnis zeigen, nichts anhängen
// Danach: node tests/ki-tester.test.mjs prüft das ganze Protokoll.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VERSION, FINGERPRINT, TESTERS, answerPath, fingerprint, answerErrors, entry, protocolErrors, signed, today,
} from './protocol.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const protocolFile = join(here, 'protocol.jsonl');
const [run] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const dry = process.argv.includes('--trocken');
const fail = (msg) => { console.error(msg); process.exit(1); };
if (!run) fail('Aufruf: node tools/ki-tester/merge.mjs <lauf> [--trocken]');
const dir = join(resolve(here, '..', '..'), 'tests', 'output', 'ki-tester', run);
if (!existsSync(join(dir, 'lauf.json'))) fail(`Kein Lauf ${run}: zuerst prepare.mjs`);
const lauf = JSON.parse(readFileSync(join(dir, 'lauf.json'), 'utf8'));
if (fingerprint() !== FINGERPRINT) fail('Auftrag, Anker, Schema, Glossar oder Feld eines Ankers geändert, aber keine neue Version (siehe protocol.mjs).');
if (lauf.ablauf !== VERSION || lauf.fingerabdruck !== FINGERPRINT) {
  fail(`Lauf ${run} gehört zu Ablauf ${lauf.ablauf} (${lauf.fingerabdruck}), nicht zu ${VERSION} (${FINGERPRINT}): neu vorbereiten.`);
}

// Antworten lesen und prüfen: jedes Level des Laufs genau einmal, jedes Urteil nach Schema
const errors = [], answers = {};
for (const t of TESTERS) {
  const file = join(dir, answerPath(t));
  if (!existsSync(file)) { errors.push(`${t}: ${file} fehlt`); continue; }
  let list;
  try { list = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { errors.push(`${t}: kein gültiges JSON (${e.message})`); continue; }
  if (!Array.isArray(list)) { errors.push(`${t}: erwartet eine Liste von Urteilen`); continue; }
  answers[t] = new Map();
  for (const a of list) {
    const l = lauf.level.find(x => x.id === a?.level);
    if (!l) { errors.push(`${t}: Urteil zu unbekanntem Level ${JSON.stringify(a?.level)}`); continue; }
    if (answers[t].has(l.id)) errors.push(`${t}: ${l.id} doppelt`);
    answers[t].set(l.id, a);
    errors.push(...answerErrors(a, l).map(m => `${t}: ${m}`));
  }
  for (const l of lauf.level) if (!answers[t].has(l.id)) errors.push(`${t}: Urteil zu ${l.id} fehlt`);
}
if (errors.length) fail('Antworten ungültig, nichts angehängt:\n  ' + errors.join('\n  '));

const old = existsSync(protocolFile) ? readFileSync(protocolFile, 'utf8') : '';
if (old.split('\n').some(line => line.trim() && JSON.parse(line).lauf === run)) fail(`Lauf ${run} steht schon im Protokoll.`);
const datum = today();
const entries = lauf.level.map(l => entry({
  datum, lauf: run, agent: lauf.agent, level: l, referenz: l.referenz, anker: lauf.anker,
  urteile: Object.fromEntries(TESTERS.map(t => [t, answers[t].get(l.id)])),
}));
const text = (old && !old.endsWith('\n') ? '\n' : '') + entries.map(e => JSON.stringify(e) + '\n').join('');
const wrong = protocolErrors(old + text);
if (wrong.length) fail('Protokoll wäre ungültig, nichts angehängt:\n  ' + wrong.join('\n  '));

const row = (cells) => '  ' + cells.map(([v, w]) => String(v).padEnd(w)).join(' ');
const terms = (u) => u.ablehnung.join('+') || '–';
console.log(row([['Level', 5], ['Platz', 5], ['Name', 18], ['Gefühl', 7], ['Einordnung', 13], ['Ablehnung', 26], ['Ergebnis', 0]]));
for (const e of entries) {
  const [a, b] = TESTERS.map(t => e.urteile[t]);
  const g = e.ergebnis;
  console.log(row([[e.level.id, 5], [e.referenz.position, 5], [e.level.name, 18], [`${a.gefuehl}/${b.gefuehl}`, 7],
    [`${a.einordnung}/${b.einordnung}`, 13], [`${terms(a)}/${terms(b)}`, 26],
    [g.abgelehnt ? `abgelehnt (${g.gruende.join(', ')})` : g.verschiebung ? `${signed(g.verschiebung)} → ${g.position}` : 'bleibt', 0]]));
}
if (dry) console.log(`\nTrocken: ${entries.length} Einträge nicht angehängt.`);
else {
  appendFileSync(protocolFile, text);
  console.log(`\n${entries.length} Einträge an tools/ki-tester/protocol.jsonl angehängt. Prüfen: node tests/ki-tester.test.mjs`);
}
