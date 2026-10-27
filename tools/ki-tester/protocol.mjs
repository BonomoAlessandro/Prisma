// Ablauf der KI-Tester (ADR 0002, Spec „KI-Tester“): Versionen und Fingerabdruck der Eingaben, Referenz und Grade,
// Anker, der Auftrag aus brief.md, Prüfung der Antworten, Zusammenführen der beiden Urteile und Prüfung des
// versionierten Protokolls (protocol.jsonl, eine JSON-Zeile je Level und Lauf). Genutzt von prepare.mjs, merge.mjs und
// tests/ki-tester.test.mjs.
//
// Referenz (Ablauf 2): der Platz eines Levels in der Reihenfolge im Spiel (1–150, ohne Tutorial) und sein Grad aus den
// Leveldaten (grad). Die Grenzen eines Grads gibt die Reihenfolge vor; sie verschieben sich mit jeder Verschiebung.
// prepare.mjs hält die Referenz jedes Levels und die Plätze der Anker bei der Vorbereitung in lauf.json fest, und
// merge.mjs rechnet mit diesen, auch wenn sich die Reihenfolge seither geändert hat. Ablauf 1 rechnete mit den Plätzen
// der heutigen Reihenfolge (feste Namensliste, beurteilung/heutige-reihenfolge.mjs) und den vorläufigen Graden; seine
// Einträge bleiben als Geschichte gültig (VERSIONS).
//
// Korrektur der Position: Jede Einordnung steht für einen Bereich von Plätzen in der Referenz: „A3-A4“ für die Plätze
// zwischen den beiden Ankern, „A3“ (etwa so schwer) für den Anker und seine beiden Nachbarplätze, „<A1“ und „>A8“ für
// alles davor bzw. dahinter. Liegt der Platz des Levels im Bereich, will der KI-Tester nichts verschieben, sonst bis an
// den nächsten Rand des Bereichs (Wunsch in Plätzen, negativ = nach vorn). Verschoben wird nur, wenn beide in dieselbe
// Richtung wollen: um den kleineren Wunsch, höchstens 5 Plätze und nie über eine Gradgrenze.
//
// Anker sind eine feste Auswahl, keine festen Plätze (Spec, User Story 43: „je zwei feste Anker pro
// Schwierigkeitsgrad“). Fest ist, welche Level die Anker sind, damit „schwerer als A3“ für beide KI-Tester und in
// jedem Lauf dasselbe Level meint. Ihr Platz folgt der Reihenfolge wie bei jedem anderen Level; die Bereiche eines
// Laufs rechnen mit den Plätzen bei seiner Vorbereitung (lauf.json). Ein Anker wird durch sein eigenes Urteil nie
// verschoben. Andere Level dürfen an ihm vorbei, er rückt dann um einen Platz und bleibt in seinem Grad. Feste Plätze
// hiessen dagegen, dass ein Level vor einem Anker bleiben muss, obwohl beide KI-Tester es schwerer finden.
//
// Ablehnen: Die KI-Tester nennen alle Begriffe aus „Was Spass verdirbt“, die zutreffen, unabhängig vom Grad. Abgelehnt
// ist ein Level, wenn beide mindestens einen Begriff nennen, der beim Grad der Referenz gilt; Füllteil und Zerfall
// gelten erst ab „mittel“ (Glossar).
//
// Würfel (.scratch/wuerfel-500/, Läufe wuerfel-…): eigene Versionen W1, W2 … neben den flachen, mit eigenem Auftrag
// (brief-wuerfel.md), eigenen Ankern (anchors-wuerfel.json, je Version eine Auswahl von Würfel-Leveln) und eigenem
// Fingerabdruck. Referenz ist der Platz in der Reihenfolge der Würfel-Level (1 = erstes Würfel-Level, eigene
// Reihenfolge neben der flachen) und der Grad dort. Glossar, Schema der Antwort (nur die Einordnungen folgen den
// Ankern der Version, schemaFor) und die Regel des Zusammenführens sind dieselben. Eine neue Auswahl der Anker ist eine
// neue Version in anchors-wuerfel.json mit einem Eintrag in WUERFEL_FINGERPRINTS; die Einträge einer früheren bleiben
// gültig, denn ihre Kennungen stehen weiter in der Datei.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { L } from '../solver.mjs';
import { fieldText } from './field.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/**
 * Version des Ablaufs; sie steht in jedem Eintrag des Protokolls. FINGERPRINT: alles, was die KI-Tester sehen (siehe
 * fingerprint). Ändert sich das oder die Regel, kommt eine neue Version; einen anderen Fingerabdruck melden der Test,
 * prepare.mjs und merge.mjs.
 */
export const VERSION = '2';
export const FINGERPRINT = '066a880667331a43';
/** So startet der Koordinator die KI-Tester (README); steht in lauf.json und in jedem Eintrag. */
export const AGENT = { modell: 'claude-opus-5-5', typ: 'general-purpose' };
export const MAX_SHIFT = 5;
/**
 * Vorläufige Grade nach der heutigen Reihenfolge (Spec, Ticket 05): leicht 1–30, mittel 31–100, schwer 101–140, sehr
 * schwer 141–150. Ablauf 1 rechnete mit ihnen und mit den Plätzen der heutigen Reihenfolge (Stand vor Ticket 15).
 */
export const PROVISIONAL_GRADES = [
  { name: 'leicht', from: 1, to: 30 },
  { name: 'mittel', from: 31, to: 100 },
  { name: 'schwer', from: 101, to: 140 },
  { name: 'sehr schwer', from: 141, to: 150 },
];
export const provisionalGradeOf = (position) => PROVISIONAL_GRADES.find(g => position >= g.from && position <= g.to);
const GRADE_NAMES = PROVISIONAL_GRADES.map(g => g.name);
const MAIN = L.LEVELS.slice(L.TUTORIAL_COUNT);
/** Das Level auf einem Platz der Reihenfolge im Spiel (1–150, ohne Tutorial). */
export const levelAt = (position) => MAIN[position - 1];
/**
 * Die Grade in einer Reihenfolge, je { name, from, to }: der Grad aus den Leveldaten, die Grenzen aus der Reihenfolge
 * (seit Ticket 16 leicht 1–31, mittel 32–105, schwer 106–137, sehr schwer 138–150). Weil der Grad entlang der
 * Reihenfolge nie sinkt (Test der Levelliste), ist jeder Grad ein Abschnitt. reihe: je Platz ein Level mit name und
 * grad, Vorgabe die Reihenfolge im Spiel; beim Ausbau auf 500 Level (.scratch/500-level/) die Vorschau aus
 * tools/ordne-level.mjs --ausbau --json, in der die Kandidaten schon stehen.
 */
export const gradesIn = (reihe = MAIN) => GRADE_NAMES.map((name) => {
  const at = reihe.flatMap((l, k) => (l.grad === name ? [k + 1] : []));
  return { name, from: at[0], to: at.at(-1) };
});
/** Die Grade in der Reihenfolge im Spiel (gradesIn). */
export const GRADES = gradesIn();
/** Der Grad eines Platzes, nach dem Grad des Levels dort (reihe wie bei gradesIn). */
export const gradeOf = (position, reihe = MAIN) => (reihe === MAIN ? GRADES : gradesIn(reihe))
  .find(g => g.name === reihe[position - 1]?.grad);
/** Referenz eines Levels in Ablauf 2: Platz in der Reihenfolge (reihe wie bei gradesIn), sein Grad und dessen Grenzen. */
export const reference = (position, reihe = MAIN) => {
  const g = gradeOf(position, reihe);
  return { art: 'Reihenfolge im Spiel', position, grad: g.name, von: g.from, bis: g.to };
};
const sameGrade = (r, g) => !!g && r.grad === g.name && r.von === g.from && r.bis === g.to;

/** Die Würfel-Level im Spiel in ihrer Reihenfolge (LEVELS_3D; Platz 1 = erstes Würfel-Level). */
export const WUERFEL_IM_SPIEL = L.LEVELS_3D;
export const WUERFEL_REFERENZ = 'Reihenfolge der Würfel';
/** Referenz eines Würfel-Levels: Platz in der Reihenfolge der Würfel-Level (reihe), sein Grad und dessen Grenzen. */
export const referenceWuerfel = (position, reihe = WUERFEL_IM_SPIEL) => {
  const g = gradesIn(reihe).find(x => x.name === reihe[position - 1]?.grad);
  return { art: WUERFEL_REFERENZ, position, grad: g.name, von: g.from, bis: g.to };
};
/** Läufe im Würfel heissen wuerfel-…, flache nie so. */
export const WUERFEL_LAEUFE = /^wuerfel-/;
/** Die Versionen des Würfel-Ablaufs aus anchors-wuerfel.json, je { hinweis, anker }; die letzte ist die aktuelle. */
const WUERFEL_ANKER = JSON.parse(read('./anchors-wuerfel.json')).versionen;
/**
 * Fingerabdruck je Version des Würfel-Ablaufs (fingerprintWuerfel). Eine neue Version in anchors-wuerfel.json braucht
 * hier ihren Eintrag; die früheren bleiben stehen.
 */
export const WUERFEL_FINGERPRINTS = { W1: 'b3600cb3e01e6cf0', W2: '01abed404f7b79b8', W3: 'a5338def1a55f16c',
  W4: 'b646a90be4fc8fbf', W5: '4b5c722cf0b56218', W6: '0b9f804f8878ea32' };
export const WUERFEL_VERSION = Object.keys(WUERFEL_ANKER).at(-1);
export const WUERFEL_FINGERPRINT = WUERFEL_FINGERPRINTS[WUERFEL_VERSION];
/**
 * Die Versionen des Ablaufs mit Fingerabdruck und Referenz. Einträge einer älteren Version bleiben als Geschichte
 * gültig: Jeder wird nach der Referenz seiner Version geprüft (gilt). Schema der Antwort und Regel des Zusammenführens
 * sind in beiden Versionen dieselben.
 * - 1 (Ticket 05, 16.10.2026; Probelauf 2 und die Eichläufe spielwert-1 bis -4 aus Ticket 13): Platz in der heutigen
 *   Reihenfolge, vorläufige Grade.
 * - 2 (Ticket 16): Platz in der Reihenfolge im Spiel, Grad aus den Leveldaten, Grenzen aus der Reihenfolge, dazu das
 *   geschärfte Glossar (Füllteil, Abschalten, Falle) und neue Anker.
 * - W1, W2 … (Würfel, siehe Kopf; unten aus anchors-wuerfel.json angefügt): Platz in der Reihenfolge der Würfel-Level,
 *   nur in Läufen wuerfel-…, mit wuerfel: true und den Kennungen ihrer Anker (kennungen).
 * Jede Version kennt die Kennungen ihrer Anker (kennungen) und damit ihr Schema (schemaOf).
 */
export const VERSIONS = {
  1: {
    fingerabdruck: 'd91d5db7fe66811d', referenz: 'heutige Reihenfolge',
    gilt: (r) => r.art === 'heutige Reihenfolge' && sameGrade(r, provisionalGradeOf(r.position)),
  },
  2: {
    fingerabdruck: FINGERPRINT, referenz: 'Reihenfolge im Spiel',
    // ohne Obergrenze: Beim Ausbau beurteilen die KI-Tester Kandidaten in einer Vorschau der Reihenfolge, die länger
    // ist als das Spiel, solange sie nicht darin stehen (abgelehnte nie)
    gilt: (r) => r.art === 'Reihenfolge im Spiel' && r.von >= 1,
  },
};
for (const [v, w] of Object.entries(WUERFEL_ANKER)) {
  VERSIONS[v] = {
    fingerabdruck: WUERFEL_FINGERPRINTS[v], referenz: WUERFEL_REFERENZ, wuerfel: true,
    kennungen: w.anker.map(a => a.id),
    // ohne Obergrenze wie Ablauf 2: Die Kandidaten stehen in einer Vorschau der Würfel-Reihenfolge
    gilt: (r) => r.art === WUERFEL_REFERENZ && r.von >= 1,
  };
}
export const TESTERS = ['A', 'B'];
/** Antwortdatei eines KI-Testers, relativ zum Ordner des Laufs: jeder hat einen eigenen Ordner. */
export const answerPath = (tester) => `antwort-${tester}/urteile.json`;
export const today = () => {
  const d = new Date(), two = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
};
export const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
export const SCHEMA = JSON.parse(read('./answer.schema.json'));
const ANCHORS = JSON.parse(read('./anchors.json')).anker;
// Die flachen Versionen haben die acht Kennungen aus anchors.json (Ablauf 1 andere Level unter denselben Kennungen)
for (const v of ['1', '2']) VERSIONS[v].kennungen = ANCHORS.map(a => a.id);

/** Die erlaubten Einordnungen zu den Kennungen der Anker: <A1, A1, A1-A2, A2, …, >An. */
export function placings(ids) {
  const out = ['<' + ids[0]];
  ids.forEach((id, k) => { out.push(id); if (k < ids.length - 1) out.push(id + '-' + ids[k + 1]); });
  return [...out, '>' + ids.at(-1)];
}
/**
 * Das Schema der Antwort zu den Kennungen der Anker: answer.schema.json, nur die Kennung des Levels und die
 * Einordnungen nach den Ankern. Die flache Version 2 nimmt die Datei selbst (dieselben Werte).
 */
export function schemaFor(ids) {
  const s = structuredClone(SCHEMA), first = ids[0], last = ids.at(-1);
  s.properties.level.description = `Kennung des Levels aus dem Auftrag (${first}–${last} für Anker, sonst L1, L2 …).`;
  s.properties.level.pattern = `^(${ids.join('|')}|L[1-9][0-9]*)$`;
  const second = ids[1] ?? first;
  s.properties.einordnung.description = `Schwierigkeit im Vergleich zu den Ankern: „${first}-${second}“ = `
    + `schwerer als ${first} und leichter als ${second}, „${first}“ = etwa so schwer wie ${first}, `
    + `„<${first}“ = leichter als ${first}, „>${last}“ = schwerer als ${last}.`;
  s.properties.einordnung.enum = placings(ids);
  return s;
}
/** Das Schema der Antwort einer Version (Vorgabe die aktuelle flache). */
export const schemaOf = (version = VERSION) => (VERSIONS[version]?.wuerfel ? schemaFor(VERSIONS[version].kennungen)
  : SCHEMA);
/** Gelten laut Glossar erst ab „mittel“. */
const FROM_MEDIUM = ['Füllteil', 'Zerfall'];
const SPOILERS = 'Was Spass verdirbt';

/**
 * Die Abschnitte des Glossars (CONTEXT.md), die ein KI-Tester kennt. Ohne die Hinweise für Autoren (_Vermeiden_),
 * ausser unter „Was Spass verdirbt“: Dort sagen sie, wofür ein Begriff der Ablehnung nicht steht.
 */
export function glossary() {
  const text = read('../../CONTEXT.md');
  return ['Was Spass macht', 'Kernideen', SPOILERS].map((title) => {
    const start = text.indexOf(`\n## ${title}\n`);
    if (start < 0) throw new Error(`CONTEXT.md: Abschnitt „${title}“ fehlt`);
    const end = text.indexOf('\n## ', start + 1);
    const section = text.slice(start + 1, end < 0 ? undefined : end).trim();
    return title === SPOILERS ? section : section.split('\n').filter(l => !l.startsWith('_Vermeiden_')).join('\n');
  }).join('\n\n');
}

/** Die Begriffe, mit denen ein KI-Tester ablehnen darf: der Abschnitt „Was Spass verdirbt“ im Glossar. */
export function rejectionTerms() {
  const text = glossary();
  return [...text.slice(text.indexOf(`## ${SPOILERS}`)).matchAll(/^\*\*(.+?)\*\*:/gm)].map(m => m[1]);
}

/** Die Anker aus anchors.json mit ihrem Platz in der Reihenfolge (reihe wie bei gradesIn; über den Namen gefunden). */
export function loadAnchors(reihe = MAIN) {
  return ANCHORS.map((a) => {
    const position = reihe.findIndex(l => l.name === a.name) + 1;
    if (!position) throw new Error(`Anker ${a.id}: kein Level „${a.name}“`);
    return { ...a, position };
  });
}

/**
 * Die Anker einer Version des Würfel-Ablaufs (Vorgabe die aktuelle) mit ihrem Platz in der Reihenfolge der Würfel-Level
 * (reihe, Vorgabe die im Spiel; über den Namen gefunden).
 */
export function loadAnchorsWuerfel(reihe = WUERFEL_IM_SPIEL, version = WUERFEL_VERSION) {
  return WUERFEL_ANKER[version].anker.map((a) => {
    const position = reihe.findIndex(l => l.name === a.name) + 1;
    if (!position) throw new Error(`Würfel-Anker ${a.id}: kein Würfel-Level „${a.name}“`);
    return { ...a, position };
  });
}

/**
 * brief.md (flach) bzw. brief-wuerfel.md: der Auftrag und, im Kommentar „<!-- Zeilen“ am Schluss, die Vorlagen der
 * Zeilen („name: Text“).
 */
function template(file = './brief.md') {
  const [text, rest = ''] = read(file).split('\n<!-- Zeilen');
  const line = Object.fromEntries([...rest.matchAll(/^([a-z-]+): (.+)$/gm)].map(m => [m[1], m[2]]));
  return { text: text.trimEnd() + '\n', line };
}
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (values[key] === undefined) throw new Error(`brief.md: {{${key}}} ohne Wert`);
  return values[key];
});

/**
 * Der Auftrag an einen KI-Tester. levels: die zu beurteilenden Level in seiner Reihenfolge, je { id, anker };
 * eingabe, ausgabe: die Pfade, die er liest und schreibt. wuerfel: der Auftrag im Würfel (brief-wuerfel.md, Vorgabe
 * Version und Anker des Würfel-Ablaufs); ein Anker ohne ende (W1) steht dort ohne Ende des Grads.
 */
export function brief({ tester, lauf, wuerfel = false, version = wuerfel ? WUERFEL_VERSION : VERSION, eingabe, ausgabe,
  levels, anchors = wuerfel ? loadAnchorsWuerfel() : loadAnchors() }) {
  const { text, line } = template(wuerfel ? './brief-wuerfel.md' : './brief.md');
  const files = (id) => fill(line.dateien, { ID: id });
  const ids = anchors.map(a => a.id);
  return fill(text, {
    TESTER: tester, LAUF: lauf, VERSION: version, EINGABE: eingabe, AUSGABE: ausgabe,
    GLOSSAR: glossary().replace(/^## /gm, '### '),
    ANKER: anchors.map(a => fill(line.anker, { ID: a.id, GRAD: a.grad, ENDE: a.ende ? line[`ende-${a.ende}`] : '',
      DATEIEN: files(a.id) })).join('\n'),
    LEVEL: levels.map((l, k) => fill(line[l.anker ? 'level-anker' : 'level'], { NR: k + 1, ID: l.id, DATEIEN: files(l.id) }))
      .join('\n'),
    ...(wuerfel ? {
      ANKERHINWEIS: line[anchors.every(a => a.ende) ? 'ankerhinweis-ende' : 'ankerhinweis-ohne'],
      EINORDNUNGEN: placings(ids).map(p => `\`"${p}"\``).join(', '), LETZTER: ids.at(-1),
    } : {}),
  });
}

/**
 * Fingerabdruck dessen, was die KI-Tester sehen: der Auftrag an beide (mit allen Ankern und einem weiteren Level, Lauf
 * und Pfade als Platzhalter), anchors.json, das Schema, das Glossar und je Anker das Feld als Text samt seinen
 * Leveldaten. Nicht darin sind die Bilder: Sie entstehen je Lauf neu.
 */
export function fingerprint() {
  const hash = createHash('sha256');
  const anchors = loadAnchors();
  const levels = [...anchors.map(a => ({ id: a.id, anker: a.id })), { id: 'L1', anker: null }];
  for (const t of TESTERS) {
    hash.update(brief({ tester: t, lauf: 'LAUF', version: 'VERSION', eingabe: 'EINGABE', ausgabe: answerPath(t), levels, anchors }));
  }
  for (const file of ['./anchors.json', './answer.schema.json']) hash.update(read(file));
  hash.update(glossary());
  for (const a of anchors) {
    // Name und Grad sehen die KI-Tester nicht (bis Ticket 15 hiess das Feld des Grads difficulty)
    const { name, difficulty, grad, ...data } = levelAt(a.position);
    hash.update(fieldText(data, a.id) + JSON.stringify(data));
  }
  return hash.digest('hex').slice(0, 16);
}

/**
 * Fingerabdruck einer Version des Würfel-Ablaufs, wie fingerprint: der Auftrag im Würfel an beide (mit allen Ankern und
 * einem weiteren Level), der Block der Version in anchors-wuerfel.json (nicht die ganze Datei: eine neue Version
 * ändert den Fingerabdruck einer früheren nicht), ihr Schema, das Glossar und je Anker Feld als Text und Leveldaten.
 */
export function fingerprintWuerfel(version = WUERFEL_VERSION) {
  const hash = createHash('sha256');
  const anchors = loadAnchorsWuerfel(WUERFEL_IM_SPIEL, version);
  const levels = [...anchors.map(a => ({ id: a.id, anker: a.id })), { id: 'L1', anker: null }];
  for (const t of TESTERS) {
    hash.update(brief({ tester: t, lauf: 'LAUF', wuerfel: true, version: 'VERSION', eingabe: 'EINGABE',
      ausgabe: answerPath(t), levels, anchors }));
  }
  hash.update(JSON.stringify(WUERFEL_ANKER[version]) + JSON.stringify(schemaOf(version)));
  hash.update(glossary());
  for (const a of anchors) {
    const { name, difficulty, grad, ...data } = WUERFEL_IM_SPIEL[a.position - 1];
    hash.update(fieldText(data, a.id) + JSON.stringify(data));
  }
  return hash.digest('hex').slice(0, 16);
}

const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
/** Prüft gegen die Teilmenge von JSON Schema, die answer.schema.json braucht. */
function schemaErrors(v, s, path) {
  if (s.enum && !s.enum.includes(v)) return [`${path}: ${JSON.stringify(v)} ist nicht erlaubt`];
  if (s.type && kind(v) !== s.type) return [`${path}: ${kind(v)} statt ${s.type}`];
  const out = [];
  if (typeof v === 'string') {
    const n = [...v].length;
    if (n < (s.minLength ?? 0)) out.push(`${path}: leer`);
    if (n > (s.maxLength ?? Infinity)) out.push(`${path}: länger als ${s.maxLength} Zeichen`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) out.push(`${path}: „${v}“ passt nicht`);
  }
  if (typeof v === 'number' && (v < (s.minimum ?? -Infinity) || v > (s.maximum ?? Infinity))) {
    out.push(`${path}: ${v} nicht in ${s.minimum}–${s.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s.uniqueItems && new Set(v).size < v.length) out.push(`${path}: doppelte Einträge`);
    if (s.items) v.forEach((x, k) => out.push(...schemaErrors(x, s.items, `${path}[${k}]`)));
  }
  if (kind(v) === 'object') {
    for (const k of s.required || []) if (!(k in v)) out.push(`${path}: Feld ${k} fehlt`);
    for (const [k, x] of Object.entries(v)) {
      if (s.properties?.[k]) out.push(...schemaErrors(x, s.properties[k], `${path}.${k}`));
      else if (s.additionalProperties === false) out.push(`${path}: unbekanntes Feld ${k}`);
    }
  }
  return out;
}

/**
 * Fehler eines Urteils zum Level { id, anker }: Schema (Vorgabe das flache, im Würfel schemaOf der Version), dazu
 * gehört es zum Level, und ein Anker ordnet sich bei sich ein.
 */
export function answerErrors(answer, level, schema = SCHEMA) {
  const out = schemaErrors(answer, schema, `Urteil ${level.id}`);
  if (out.length) return out;
  if (answer.level !== level.id) out.push(`Urteil ${level.id}: gehört zu ${answer.level}`);
  if (level.anker && answer.einordnung !== level.anker) {
    out.push(`Urteil ${level.id}: als Anker ist die Einordnung „${level.anker}“, nicht „${answer.einordnung}“`);
  }
  return out;
}

/** Plätze, für die eine Einordnung steht (anker: { A1: Platz, … }). */
function range(einordnung, anker) {
  if (einordnung.startsWith('<')) return [-Infinity, anker[einordnung.slice(1)] - 1];
  if (einordnung.startsWith('>')) return [anker[einordnung.slice(1)] + 1, Infinity];
  const [a, b] = einordnung.split('-');
  return b ? [anker[a] + 1, anker[b] - 1] : [anker[a] - 1, anker[a] + 1];
}

/** Verschiebung, die ein KI-Tester will: bis an den nächsten Rand seines Bereichs (negativ = nach vorn, leichter). */
export function wish(einordnung, position, anker) {
  const [lo, hi] = range(einordnung, anker);
  return position < lo ? lo - position : position > hi ? hi - position : 0;
}

const counts = (term, grad) => !(grad === 'leicht' && FROM_MEDIUM.includes(term));
/** Die Begriffe eines Urteils, die beim Grad gelten. */
const termsAt = (answer, grad) => answer.ablehnung.filter(term => counts(term, grad));

/**
 * Führt die Urteile beider KI-Tester zu einem Level zusammen.
 * level { id, name, anker } · referenz { art, position, grad, von, bis } · anker { A1: Platz, … } · urteile { A, B }
 * Rückgabe: { ergebnis: { abgelehnt, gruende, verschiebung, position }, begruendung }
 */
export function merge({ level, referenz: r, anker, urteile }) {
  const answers = TESTERS.map(t => urteile[t]);
  const counted = answers.map(u => termsAt(u, r.grad));
  const abgelehnt = counted.every(list => list.length > 0);
  const gruende = abgelehnt ? [...new Set(counted.flat())] : [];
  const wishes = answers.map(u => wish(u.einordnung, r.position, anker));
  const together = wishes[0] !== 0 && Math.sign(wishes[0]) === Math.sign(wishes[1]);
  let verschiebung = 0;
  const limits = []; // was die Verschiebung begrenzt hat
  if (!abgelehnt && !level.anker && together) {
    const smaller = Math.min(Math.abs(wishes[0]), Math.abs(wishes[1]));
    if (smaller > MAX_SHIFT) limits.push(`höchstens ${MAX_SHIFT} Plätze`);
    const wanted = r.position + Math.sign(wishes[0]) * Math.min(smaller, MAX_SHIFT);
    const target = Math.min(Math.max(wanted, r.von), r.bis);
    if (target !== wanted) limits.push(`nicht über die Grenze von ${r.grad} (${r.von}–${r.bis})`);
    verschiebung = target - r.position;
  }
  const position = r.position + verschiebung;
  // Anker zwischen altem und neuem Platz: das Level zieht vorbei, der Anker rückt um einen Platz zum alten hin
  const passed = verschiebung ? Object.entries(anker).filter(([, a]) => (a - r.position) * (a - position) <= 0) : [];

  const list = (u) => u.ablehnung.map(term => term + (counts(term, r.grad) ? '' : ' (gilt erst ab mittel)')).join(', ');
  const said = TESTERS.map((t, k) => `${t}: ${list(answers[k]) || 'keine'}`).join('; ');
  const parts = [abgelehnt ? `Abgelehnt, beide nennen einen Begriff, der bei ${r.grad} gilt (${said}).`
    : answers.some(u => u.ablehnung.length) ? `Nicht abgelehnt (${said}).` : 'Keine Ablehnung.'];
  const views = `A will ${signed(wishes[0])}, B ${signed(wishes[1])} (Einordnung A: ${answers[0].einordnung}, ` +
    `B: ${answers[1].einordnung}; Platz ${r.position}, ${r.art})`;
  if (level.anker) parts.push(`Anker ${level.anker} wird durch sein eigenes Urteil nicht verschoben.`);
  else if (abgelehnt) parts.push('Keine Verschiebung, weil abgelehnt.');
  else if (verschiebung) {
    const notes = [...limits, ...passed.map(([id, a]) => `an Anker ${id} vorbei, der auf Platz ${a - Math.sign(verschiebung)} rückt`)];
    parts.push(`Verschoben um ${signed(verschiebung)} auf Platz ${position}: ${views}${notes.map(n => `; ${n}`).join('')}.`);
  } else if (together) parts.push(`Keine Verschiebung: ${views}; ${limits.join(', ')}.`);
  else if (wishes.some(Boolean)) parts.push(`Keine Verschiebung, verschoben wird nur gemeinsam: ${views}.`);
  else parts.push(`Keine Verschiebung: ${views}.`);
  return { ergebnis: { abgelehnt, gruende, verschiebung, position }, begruendung: parts.join(' ') };
}

/**
 * Ein Eintrag des Protokolls: beide Einzelurteile, Ergebnis und Begründung, mit Datum, Version des Ablaufs (ablauf,
 * Vorgabe die aktuelle flache; im Würfel WUERFEL_VERSION) und dem Modell und Agent-Typ der KI-Tester
 * (agent { modell, typ }).
 */
export function entry({ datum, ablauf = VERSION, lauf, agent, level, referenz, anker, urteile }) {
  const { ergebnis, begruendung } = merge({ level, referenz, anker, urteile });
  return {
    datum, ablauf, lauf, agent: { modell: agent.modell, typ: agent.typ },
    level: { id: level.id, name: level.name, anker: level.anker ?? null }, referenz, anker,
    urteile: { A: urteile.A, B: urteile.B }, ergebnis, begruendung,
  };
}

const present = (v) => typeof v === 'string' && v.trim() !== '';

function entryErrors(e) {
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.datum ?? '')) out.push('Datum fehlt oder nicht JJJJ-MM-TT');
  const version = typeof e.ablauf === 'string' && Object.hasOwn(VERSIONS, e.ablauf) ? VERSIONS[e.ablauf] : null;
  if (!version) out.push(`Version des Ablaufs fehlt oder unbekannt (${e.ablauf})`);
  if (!present(e.lauf)) out.push('Lauf fehlt');
  else if (version && !!version.wuerfel !== WUERFEL_LAEUFE.test(e.lauf)) {
    out.push(version.wuerfel ? `Würfel-Ablauf ${e.ablauf} in einem Lauf ohne wuerfel-`
      : `Lauf ${e.lauf} mit dem flachen Ablauf ${e.ablauf}`);
  }
  if (!present(e.agent?.modell) || !present(e.agent?.typ)) out.push('Modell oder Agent-Typ der KI-Tester fehlt');
  if (!present(e.begruendung)) out.push('Begründung fehlt');
  const { level, referenz: r, anker, urteile, ergebnis: g } = e;
  if (typeof level?.id !== 'string' || typeof level.name !== 'string') return [...out, 'Level fehlt'];
  const complete = Number.isInteger(r?.position) && GRADE_NAMES.includes(r.grad) && r.von <= r.position &&
    r.position <= r.bis;
  if (!complete) return [...out, 'Referenz unvollständig'];
  if (version && !version.gilt(r)) out.push(`Referenz nicht die von Ablauf ${e.ablauf} (${version.referenz})`);
  const ids = version?.kennungen ?? ANCHORS.map(a => a.id);
  if (ids.some((id, k) => !Number.isInteger(anker?.[id]) || (k && anker[id] <= anker[ids[k - 1]]))) return [...out, 'Plätze der Anker fehlen'];
  if (level.anker && anker[level.anker] !== r.position) out.push(`Anker ${level.anker} steht nicht auf Platz ${r.position}`);
  if (typeof g?.abgelehnt !== 'boolean' || !Array.isArray(g.gruende) || !Number.isInteger(g.verschiebung) || !Number.isInteger(g.position)) {
    return [...out, 'Ergebnis unvollständig'];
  }
  if (Math.abs(g.verschiebung) > MAX_SHIFT) out.push(`Verschiebung ${signed(g.verschiebung)}: mehr als ${MAX_SHIFT} Plätze`);
  if (g.position !== r.position + g.verschiebung) out.push(`Platz ${g.position} ist nicht ${r.position} ${signed(g.verschiebung)}`);
  if (g.position < r.von || g.position > r.bis) out.push(`Platz ${g.position} ausserhalb von ${r.grad} (${r.von}–${r.bis})`);
  if (level.anker && g.verschiebung) out.push(`Anker ${level.anker} verschoben`);
  if (g.abgelehnt && g.verschiebung) out.push('abgelehnt und verschoben');
  if (Object.keys(urteile ?? {}).join() !== TESTERS.join()) return [...out, 'Urteile von A und B nötig'];
  const schema = version ? schemaOf(e.ablauf) : SCHEMA;
  const wrong = TESTERS.flatMap(t => answerErrors(urteile[t], level, schema).map(m => `${t}: ${m}`));
  if (wrong.length || !version) return [...out, ...wrong];
  const both = TESTERS.every(t => termsAt(urteile[t], r.grad).length > 0);
  if (g.abgelehnt && !both) out.push(`abgelehnt, aber nicht beide nennen einen Begriff, der bei ${r.grad} gilt`);
  if (!g.abgelehnt && both) out.push(`beide nennen einen Begriff, der bei ${r.grad} gilt, aber nicht abgelehnt`);
  const want = merge({ level, referenz: r, anker, urteile }).ergebnis;
  if (['abgelehnt', 'verschiebung', 'position'].some(k => want[k] !== g[k]) || want.gruende.join() !== g.gruende.join()) {
    out.push(`Ergebnis entspricht nicht der Regel, erwartet ${JSON.stringify(want)}`);
  }
  return out;
}

/**
 * Fehler im Protokoll (Text mit einer JSON-Zeile je Eintrag): Form, eine bekannte Version mit ihrer Referenz
 * (VERSIONS), Einzelurteile nach Schema, Grenzen der Korrektur, Ablehnen nur gemeinsam und das Ergebnis nach der Regel
 * von merge. Jedes Level steht je Lauf höchstens einmal darin.
 */
export function protocolErrors(text) {
  const out = [], seen = new Set();
  text.split('\n').forEach((line, k) => {
    if (!line.trim()) return;
    let e;
    try { e = JSON.parse(line); } catch (err) { out.push(`Zeile ${k + 1}: kein JSON (${err.message})`); return; }
    const where = `Zeile ${k + 1} (${e.lauf} ${e.level?.id} ${e.level?.name})`;
    out.push(...entryErrors(e).map(m => `${where}: ${m}`));
    const key = `${e.lauf} ${e.level?.id}`;
    if (seen.has(key)) out.push(`${where}: doppelt`);
    seen.add(key);
  });
  return out;
}
