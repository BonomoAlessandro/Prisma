// Löser und Schwierigkeitsmessung für PRISMA-Level.
// Lädt die reine Spiellogik aus index.html (Bereich LOGIC:BEGIN … LOGIC:END), genau wie die Tests.
//
// Idee: Statt alle Stellungen durchzuprobieren (bei 10 drehbaren Elementen bis zu 8^10), folgt der
// Löser den Strahlen und verzweigt erst, wenn ein Strahl ein drehbares Element erreicht, dessen
// Stellung noch offen ist. Elemente, die nie Licht bekommen, werden nicht durchprobiert – ihre
// Stellung ist für das Ergebnis egal (sie vervielfachen dann die Zahl der Lösungen).
// Abgeschnitten wird, sobald ein Ziel Licht einer falschen Farbe erhält: Licht lässt sich durch
// spätere Entscheidungen nur hinzufügen, nie wegnehmen (Treffer sind additive Farbmasken).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const code = html.slice(html.indexOf('/* LOGIC:BEGIN'), html.indexOf('/* LOGIC:END'));
export const L = new Function(code + `
  return { DIRS, COLORS, COLOR_NAMES, MAX_BOUNCES, EDGE_RUN, MIRROR_HALF_WIDTH, ELEMENT_TYPES, reflectOnMirror,
    mirrorFrontNormal, refractInPrism, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS, TUTORIAL_COUNT, mod8 };`)();

/** Wirksame Stellungen: Spiegel 4 (rot und rot + 4 wirken gleich), Prisma und Kombinator 8. */
export const period = (el) => (el.type === 'mirror' ? 4 : 8);
export const getRot = (el) => (el.type === 'combiner' ? el.dir : el.rot);
export const setRot = (el, v) => { if (el.type === 'combiner') el.dir = v; else el.rot = v; };
export const keyOf = (el) => el.x + ',' + el.z;

/** Wird geworfen, wenn die Verfolgung die Stellung eines noch offenen Elements liest. */
class Need { constructor(el) { this.el = el; } }

/**
 * Durchsucht die Stellungen der drehbaren Elemente, die das Licht erreicht.
 * Optionen: maxNodes (Abbruch), collect (wie viele Lösungen aufheben), prune (falsches Licht abschneiden).
 * Rückgabe:
 *   count:     Anzahl lösender Gesamtstellungen (Elemente ohne Licht vervielfachen)
 *   solutions: bis zu `collect` Lösungen als { set: { "x,z": Stellung }, free } (free = Elemente ohne Licht)
 *   nodes:     Anzahl Strahlverfolgungen – Suchaufwand, ein Mass für die Schwierigkeit
 *   leaves:    vollständig bestimmte Strahlbilder
 *   near:      Gesamtstellungen, in denen genau ein Ziel nicht stimmt ("fast gelöst"; nur ohne prune vollständig)
 *   aborted:   Suche wegen maxNodes abgebrochen
 */
export function solve(level, { maxNodes = 2e6, collect = 50, prune = true, onLeaf = null } = {}) {
  const board = L.createBoard(level);
  const rot = board.elements.filter(L.isRotatable);
  const targets = board.elements.filter(e => e.type === 'target');
  const value = new Map(); // el.id → Stellung (nur bereits entschiedene)
  for (const el of rot) {
    const prop = el.type === 'combiner' ? 'dir' : 'rot';
    Object.defineProperty(el, prop, {
      get() { if (!value.has(el.id)) throw new Need(el); return value.get(el.id); },
      set(v) { value.set(el.id, L.mod8(v)); },
      configurable: true,
    });
  }
  const out = { count: 0, solutions: [], nodes: 0, leaves: 0, near: 0, guesses: 0, aborted: false, rotatable: rot.length };
  const wrongLight = (hits) => targets.some(t => (hits.get(t.id) || 0) & ~t.color);

  // Rückgabe: Anzahl Blätter im Teilbaum. Eine Verzweigung mit mindestens zwei nicht sofort
  // widerlegten Möglichkeiten zählt als "Rateschritt" (guesses) – Zwangszüge zählen nicht.
  const visit = () => {
    if (out.nodes >= maxNodes) { out.aborted = true; return 0; }
    out.nodes++;
    let r;
    try {
      r = L.traceBeams(board);
    } catch (e) {
      if (!(e instanceof Need)) throw e;
      if (prune && e.partialHits && wrongLight(e.partialHits)) return 0;
      let leaves = 0, alive = 0;
      for (let v = 0; v < period(e.el) && !out.aborted; v++) {
        value.set(e.el.id, v);
        const n = visit();
        leaves += n;
        if (n) alive++;
      }
      if (alive >= 2) out.guesses++;
      value.delete(e.el.id);
      return leaves;
    }
    out.leaves++;
    if (onLeaf) onLeaf(r, board, value);
    const free = rot.filter(el => !value.has(el.id));
    const mult = free.reduce((m, el) => m * period(el), 1);
    if (targets.filter(t => !r.satisfied.has(t.id)).length === 1) out.near += mult;
    if (r.solved) {
      out.count += mult;
      if (out.solutions.length < collect) {
        out.solutions.push({
          set: Object.fromEntries(rot.filter(el => value.has(el.id)).map(el => [keyOf(el), value.get(el.id)])),
          free: free.length,
        });
      }
    }
    return 1;
  };
  visit();
  return out;
}

/** Klicks von der Startstellung bis zu einer Lösung (je Element der kürzere Drehweg). */
export function clicksTo(level, sol) {
  const board = L.createBoard(level);
  let n = 0;
  for (const el of board.elements.filter(L.isRotatable)) {
    const k = keyOf(el);
    if (!(k in sol)) continue;
    const p = period(el), d = ((sol[k] - getRot(el)) % p + p) % p;
    n += Math.min(d, p - d);
  }
  return n;
}

/** Alle Stellungen stumpf durchprobieren (nur für kleine Level – Gegenprobe zum schlauen Löser). */
export function bruteForce(level) {
  const b = L.createBoard(level);
  const rot = b.elements.filter(L.isRotatable);
  let total = 1;
  for (const el of rot) total *= period(el);
  let count = 0, near = 0;
  const targets = b.elements.filter(e => e.type === 'target');
  for (let i = 0; i < total; i++) {
    let k = i;
    for (const el of rot) { setRot(el, k % period(el)); k = Math.floor(k / period(el)); }
    const r = L.traceBeams(b);
    if (r.solved) count++;
    if (targets.filter(t => !r.satisfied.has(t.id)).length === 1) near++;
  }
  return { count, near, total };
}

/** Elemente, mit denen Licht in einem Strahlbild in Berührung kommt (als "x,z"). */
export function litCells(r, board) {
  const lit = new Set();
  const byId = new Map(board.elements.map(e => [e.id, e]));
  for (const e of r.events) {
    if (e.element !== undefined) { const el = byId.get(e.element); lit.add(el.x + ',' + el.z); }
    else if (e.kind === 'reflect' || e.kind === 'hit') lit.add(Math.round(e.x) + ',' + Math.round(e.z));
  }
  return lit;
}

/**
 * Schwierigkeitskennzahlen eines Levels. Bewusst nur Eigenschaften des Levels selbst – die
 * Klicks hängen von der zufälligen Startverdrehung ab und gehen nicht in die Wertung ein.
 *   unique:    genau eine lösende Gesamtstellung (gleiche Regel wie im Spiel)
 *   search:    log2 Suchknoten mit Abschneiden (wie viel man ausprobieren muss)
 *   space:     log2 der Stellungen, die das Licht überhaupt erreicht (ohne Abschneiden, ggf. gedeckelt)
 *   guesses:   Verzweigungen mit mehreren nicht sofort widerlegten Möglichkeiten
 *   onPath:    Elemente, die das Licht in der Lösung berührt
 *   mixed:     Ziele mit Mischfarbe · targets, sources, rotatable, kinds, clicks (nur zur Info)
 *   score:     Gesamtwertung, an der Reihenfolge der handgebauten Level geeicht (Test: Rangkorrelation ≥ 0.8)
 */
export function metrics(level) {
  const sol = solve(level, { collect: 2 });
  const full = solve(level, { prune: false, maxNodes: 3e5, collect: 0 });
  const b = L.createBoard(level);
  const rot = b.elements.filter(L.isRotatable);
  const targets = b.elements.filter(e => e.type === 'target');
  const set = sol.solutions[0]?.set;
  let onPath = 0;
  if (set) {
    const bb = L.createBoard(level);
    for (const el of bb.elements.filter(L.isRotatable)) if (keyOf(el) in set) setRot(el, set[keyOf(el)]);
    onPath = litCells(L.traceBeams(bb), bb).size;
  }
  const search = Math.log2(Math.max(1, sol.nodes));
  const space = Math.log2(Math.max(1, full.leaves));
  const mixed = targets.filter(t => ![1, 2, 4].includes(t.color)).length;
  // Rateschritte wachsen mit dem Suchbaum exponentiell – daher logarithmisch
  const score = search + 0.5 * space + 1.2 * Math.log2(1 + sol.guesses) + 0.5 * targets.length + 0.4 * mixed + 0.25 * onPath;
  return {
    unique: sol.count === 1 && !sol.aborted, count: sol.count, rotatable: rot.length,
    search: +search.toFixed(1), space: +space.toFixed(1), spaceCapped: full.aborted, guesses: sol.guesses,
    onPath, mixed, targets: targets.length, sources: b.elements.filter(e => e.type === 'source').length,
    kinds: [...new Set(b.elements.map(e => e.type))].sort(),
    clicks: set ? clicksTo(level, set) : NaN, score: +score.toFixed(1), solution: set,
  };
}
