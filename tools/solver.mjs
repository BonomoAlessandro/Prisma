// Löser für PRISMA-Level. Wie schwer ein Level ist, sagt allein die Beurteilung (tools/beurteilung/); die alte
// Wertung (metrics mit score) gibt es seit Ticket 21 nicht mehr.
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
    mirrorFrontNormal, refractInPrism, dirToRotationY, createBoard, traceBeams, isRotatable, LEVELS, TUTORIAL_COUNT,
    mod8, OPEN, LEVELS_3D, AXES, planeDir, planeIndex, reflect3, refractInPrism3, STORY_LEVELS };`)();

/** Wirksame Stellungen: Spiegel 4 (rot und rot + 4 wirken gleich), Prisma und Kombinator 8. */
export const period = (el) => (el.type === 'mirror' ? 4 : 8);
export const getRot = (el) => (el.type === 'combiner' ? el.dir : el.rot);
export const setRot = (el, v) => { if (el.type === 'combiner') el.dir = v; else el.rot = v; };
/** Lösungsschlüssel: "x,z", im Würfel "x,y,z". */
export const keyOf = (el) => (el.y === undefined ? el.x + ',' + el.z : el.x + ',' + el.y + ',' + el.z);

/**
 * Durchsucht die Stellungen der drehbaren Elemente, die das Licht erreicht.
 * Optionen: maxNodes (Abbruch), collect (wie viele Lösungen aufheben), prune (falsches Licht abschneiden),
 *   unique (nur die Eindeutigkeit gefragt: hält bei der zweiten Lösung an, count ist dann mindestens 2 und die übrigen
 *   Zahlen gelten nur bis dahin; bei höchstens einer Lösung ist das Ergebnis dasselbe wie ohne unique).
 * Rückgabe:
 *   count:     Anzahl lösender Gesamtstellungen (Elemente ohne Licht vervielfachen)
 *   solutions: bis zu `collect` Lösungen als { set: { "x,z": Stellung }, free } (free = Elemente ohne Licht)
 *   nodes:     Anzahl Strahlverfolgungen (Suchaufwand)
 *   leaves:    vollständig bestimmte Strahlbilder
 *   near:      Gesamtstellungen, in denen genau ein Ziel nicht stimmt ("fast gelöst"; nur ohne prune vollständig)
 *   aborted:   Suche wegen maxNodes abgebrochen
 */
export function solve(level, { maxNodes = 2e6, collect = 50, prune = true, onLeaf = null, unique = false } = {}) {
  const board = L.createBoard(level);
  const rot = board.elements.filter(L.isRotatable);
  const targets = board.elements.filter(e => e.type === 'target');
  for (const el of rot) setRot(el, L.OPEN); // offen: die Verfolgung hält dort an (traceBeams liefert open)
  const out = { count: 0, solutions: [], nodes: 0, leaves: 0, near: 0, guesses: 0, aborted: false, rotatable: rot.length };
  const wrongLight = (hits) => targets.some(t => (hits.get(t.id) || 0) & ~t.color);
  // Elemente, deren Stellung noch offen ist (an einem Blatt: ohne Licht), und das Produkt ihrer Stellungen
  let free = rot.length, mult = rot.reduce((m, el) => m * period(el), 1);

  // Rückgabe: Anzahl Blätter im Teilbaum. Eine Verzweigung mit mindestens zwei nicht sofort
  // widerlegten Möglichkeiten zählt als "Rateschritt" (guesses) – Zwangszüge zählen nicht.
  // from: Stand der Verfolgung im Elternknoten, angehalten am Element, dessen Stellung eben gesetzt wurde. Bis dahin
  // ist sie für alle Stellungen gleich, die Verfolgung macht also dort weiter.
  const visit = (from) => {
    if (out.nodes >= maxNodes) { out.aborted = true; return 0; }
    out.nodes++;
    const r = L.traceBeams(board, undefined, from);
    if (r.open) {
      const el = r.open;
      if (prune && wrongLight(r.hits)) return 0;
      let leaves = 0, alive = 0;
      const multBefore = mult;
      free--; mult /= period(el);
      for (let v = 0; v < period(el) && !out.aborted && !(unique && out.count > 1); v++) {
        setRot(el, v);
        const n = visit(r.resume);
        leaves += n;
        if (n) alive++;
      }
      free++; mult = multBefore;
      if (alive >= 2) out.guesses++;
      setRot(el, L.OPEN);
      return leaves;
    }
    out.leaves++;
    if (onLeaf) onLeaf(r, board);
    if (r.satisfied.size === targets.length - 1) out.near += mult; // genau ein Ziel stimmt nicht
    if (r.solved) {
      out.count += mult;
      if (out.solutions.length < collect) {
        const set = {};
        for (const el of rot) if (getRot(el) !== L.OPEN) set[keyOf(el)] = getRot(el);
        out.solutions.push({ set, free });
      }
    }
    return 1;
  };
  visit(null);
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

/** Elemente, mit denen Licht in einem Strahlbild in Berührung kommt (als "x,z", im Würfel "x,y,z"). */
export function litCells(r, board) {
  const lit = new Set();
  const byId = new Map(board.elements.map(e => [e.id, e]));
  const round = (v) => (v === undefined ? undefined : Math.round(v));
  for (const e of r.events) {
    if (e.element !== undefined) lit.add(keyOf(byId.get(e.element)));
    else if (e.kind === 'reflect' || e.kind === 'hit') lit.add(keyOf({ x: round(e.x), y: round(e.y), z: round(e.z) }));
  }
  return lit;
}
