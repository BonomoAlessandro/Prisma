// Spielermodell (Spec „Beurteilung“): ein Spieler, der schliesst, statt zu probieren (Glossar „Schliessen“). Er führt je
// drehbarem Element die Stellungen, die noch möglich sind, und streicht, was zu einem Widerspruch führt:
// - vorwärts: Sicheres Licht (nur über entschiedene Elemente) brächte einem Ziel eine Farbe, die es nicht hat.
// - rückwärts mit Horizont k: Ab jedem Ziel wird rückwärts gesucht, woher seine Grundfarben kommen können. Dabei denkt
//   er höchstens k offene Elemente hintereinander mit, dahinter gilt „möglich“; entschiedene Elemente kosten nichts.
//   Mit vollem Überblick (Horizont kInf) ist es die volle Erreichbarkeit über alle noch möglichen Stellungen.
// - Fallunterscheidung: Kommt er so nicht weiter, nimmt er an einem Element jede Stellung an und folgert weiter; was
//   zum Widerspruch führt, fällt weg. Er wählt das Element, das danach am wenigsten offen lässt, dann das mit den
//   kürzesten Ketten. Die Kette eines Falls ist die Zahl der Folgerungen bis zum Widerspruch.
// Das Licht ist je Grundfarbe linear: Spiegel und Prisma lenken jede Grundfarbe für sich, ein Filter lässt sie durch
// oder nicht, ein Kombinator gibt jede eintreffende Grundfarbe weiter, ein Ziel sammelt. Darum genügen Zustände
// (Zelle, Richtung, Grundfarbe).
//
// Übernommen aus dem Spielermodell der Reviews (Review 4, gemessen wie im Vorsieb aus Review 5). Bei gleicher
// Reihenfolge der drehbaren Elemente ist das Ergebnis gleich; das Original ging sie in der Reihenfolge der Leveldaten
// durch, dieses in der Reihenfolge der Zellen (siehe modell). Das Feld kennt es nur über die Feldform, die Wirkung der
// Elemente kommt aus der Strahlregel. Eine Stellung ist eine kleine Zahl (Drehung eines Spiegels oder Prismas, Richtung
// eines Kombinators) und dient als Bit einer Maske.
import { L, getRot } from '../solver.mjs';

const PRIM = [1, 2, 4];
const single = (m) => m !== 0 && (m & (m - 1)) === 0;
const lowBit = (m) => 31 - Math.clz32(m & -m);
/** Höchstens so viele Fallunterscheidungen spielt das Modell durch (wie in den Reviews). */
const MAX_FALLUNTERSCHEIDUNGEN = 60;

/**
 * Das Spielermodell eines Levels: spiele(k) mit Horizont k (Infinity für vollen Überblick) liefert
 * { fallunterscheidungen, folgerungen, steckt, geloest, widerspruch } (siehe spielermodell).
 */
function modell(level, feldform) {
  const elemente = L.createBoard(level).elements;
  const { zellen, richtungen } = feldform;
  const R = Math.max(...richtungen) + 1; // Richtungen dienen als Index
  const ALLE = richtungen.reduce((m, d) => m | (1 << d), 0);
  const nummer = new Map(zellen.map((z, c) => [z, c]));
  const zelleVon = elemente.map(e => nummer.get(feldform.zelle(e)));
  const at = new Array(zellen.length).fill(null);
  elemente.forEach((e, id) => { at[zelleVon[id]] = e; });
  // Gegenrichtung: der Schritt, der zur Ausgangszelle zurückführt
  const gegen = new Array(R).fill(-1);
  for (const d of richtungen) {
    const z = zellen.find(a => feldform.nachbar(a, d) !== null);
    if (z !== undefined) gegen[d] = richtungen.find(g => feldform.nachbar(feldform.nachbar(z, d), g) === z);
  }
  // Erstes Element ab Zelle c in Richtung d (vor) bzw. entgegen d (hinter, von dort kommt Licht in Richtung d); null am Rand
  const erstes = (c, d) => {
    for (let z = feldform.nachbar(zellen[c], d); z !== null; z = feldform.nachbar(z, d)) if (at[nummer.get(z)]) return at[nummer.get(z)];
    return null;
  };
  const vor = new Array(zellen.length * R).fill(null), hinter = new Array(zellen.length * R).fill(null);
  for (let c = 0; c < zellen.length; c++) for (const d of richtungen) {
    vor[c * R + d] = erstes(c, d);
    if (gegen[d] >= 0) hinter[c * R + d] = erstes(c, gegen[d]);
  }

  // Drehbare Elemente mit der Maske ihrer möglichen Stellungen; feste Elemente haben genau ihre eigene. Die drehbaren
  // stehen in der Reihenfolge der Zellen der Feldform, nicht der Leveldaten: Die Ketten und die Wahl unter gleich guten
  // Fallunterscheidungen hängen von der Reihenfolge ab, und dasselbe Level steht im Pool in der Reihenfolge seiner
  // Erzeugung, im Spiel nach Art und Platz sortiert.
  const drehbar = elemente.filter(e => feldform.stellungen(e).length).sort((a, b) => zelleVon[a.id] - zelleVon[b.id]);
  const index = new Int32Array(elemente.length).fill(-1);
  drehbar.forEach((e, i) => { index[e.id] = i; });
  const voll = drehbar.map(e => feldform.stellungen(e).reduce((m, v) => m | (1 << v), 0));
  const fest = elemente.map(e => (index[e.id] < 0 && ['mirror', 'prism', 'combiner'].includes(e.type) ? 1 << getRot(e) : 0));
  const maske = (el, dom) => (index[el.id] < 0 ? fest[el.id] : dom[index[el.id]]);
  const quellen = elemente.filter(e => e.type === 'source');
  const ziele = elemente.filter(e => e.type === 'target');

  // Prisma je Stellung v, Richtung d und Grundfarbe: Ausgangsrichtung (−1: kein Licht) und Eingänge zu einem Ausgang
  const V = 32 - Math.clz32([...voll, ...fest].reduce((m, x) => m | x, 1));
  const prismaAus = new Int32Array(V * R * 3).fill(-1), prismaEin = new Int32Array(V * R * 3);
  for (let v = 0; v < V; v++) for (const d of richtungen) for (let pi = 0; pi < 3; pi++) {
    const o = L.refractInPrism(d, PRIM[pi], v);
    if (!o.length) continue;
    prismaAus[(v * R + d) * 3 + pi] = o[0].dir;
    prismaEin[(v * R + o[0].dir) * 3 + pi] |= 1 << d;
  }

  /** Vorwärts je Grundfarbe; unter: nur über entschiedene Elemente (sicheres Licht), sonst über alle Stellungen. */
  const seen = new Int32Array(zellen.length * R * 3), queue = [];
  let stamp = 0;
  function reach(dom, unter, hits) {
    hits.fill(0);
    stamp++;
    const push = (c, d, pi) => {
      const k = (c * R + d) * 3 + pi;
      if (seen[k] !== stamp) { seen[k] = stamp; queue.push(k); }
    };
    for (const s of quellen) for (let pi = 0; pi < 3; pi++) if (s.color & PRIM[pi]) push(zelleVon[s.id], s.dir, pi);
    while (queue.length) {
      const k = queue.pop(), pi = k % 3, d = ((k - pi) / 3) % R, c = ((k - pi) / 3 - d) / R;
      const el = vor[c * R + d];
      if (!el) continue;
      const m = maske(el, dom);
      if (unter && index[el.id] >= 0 && !single(m)) continue;
      const ce = zelleVon[el.id];
      if (el.type === 'mirror') {
        for (let r = m; r; r &= r - 1) { const nd = L.reflectOnMirror(d, lowBit(r)); if (nd !== d) push(ce, nd, pi); }
      } else if (el.type === 'prism') {
        for (let r = m; r; r &= r - 1) { const o = prismaAus[(lowBit(r) * R + d) * 3 + pi]; if (o >= 0) push(ce, o, pi); }
      } else if (el.type === 'filter') { if (el.color & PRIM[pi]) push(ce, d, pi); }
      else if (el.type === 'combiner') { for (let r = m; r; r &= r - 1) push(ce, lowBit(r), pi); }
      else if (el.type === 'target') hits[el.id] |= PRIM[pi];
    }
  }

  /**
   * Kann ein Strahl der Grundfarbe PRIM[pi] die Zelle von el in Richtung d verlassen? Rückwärts mit Horizont budget:
   * Entschiedene Elemente kosten nichts, offene 1; ist das Budget an einem offenen Element aufgebraucht, zählt nur, ob
   * es überhaupt in diese Richtung abgeben kann.
   */
  const aufPfad = new Uint8Array(elemente.length * R * 3);
  function kannAbgeben(el, d, pi, budget, dom) {
    if (el.type === 'source') return el.dir === d && (el.color & PRIM[pi]) !== 0;
    if (el.type === 'target' || el.type === 'blocker') return false;
    const k = (el.id * R + d) * 3 + pi;
    if (aufPfad[k]) return false;
    const m = maske(el, dom), offen = index[el.id] >= 0 && !single(m);
    let ein = 0; // mögliche Eingangsrichtungen
    if (el.type === 'mirror') {
      for (let r = m; r; r &= r - 1) { const din = L.reflectOnMirror(d, lowBit(r)); if (din !== d) ein |= 1 << din; }
    } else if (el.type === 'prism') { for (let r = m; r; r &= r - 1) ein |= prismaEin[(lowBit(r) * R + d) * 3 + pi]; }
    else if (el.type === 'filter') { if (el.color & PRIM[pi]) ein = 1 << d; }
    else if (el.type === 'combiner') { if (m >> d & 1) ein = ALLE; }
    if (!ein) return false;
    if (offen && budget <= 0) return true;
    aufPfad[k] = 1;
    let ok = false;
    for (let r = ein; r && !ok; r &= r - 1) {
      const din = lowBit(r), src = hinter[zelleVon[el.id] * R + din];
      if (src && kannAbgeben(src, din, pi, offen ? budget - 1 : budget, dom)) ok = true;
    }
    aufPfad[k] = 0;
    return ok;
  }

  /** Widerspruch in den möglichen Stellungen dom? vorwärts immer, rückwärts mit Horizont k nur auf Wunsch. */
  const unter = new Int32Array(elemente.length), ueber = new Int32Array(elemente.length);
  function widerspruch(dom, k, rueckwaerts) {
    if (dom.some(m => !m)) return true;
    reach(dom, true, unter);
    if (ziele.some(t => unter[t.id] & ~t.color)) return true;
    if (!rueckwaerts) return false;
    if (k === Infinity) {
      reach(dom, false, ueber);
      return ziele.some(t => (ueber[t.id] & t.color) !== t.color);
    }
    for (const t of ziele) for (let pi = 0; pi < 3; pi++) {
      if (!(t.color & PRIM[pi]) || unter[t.id] & PRIM[pi]) continue;
      const kommt = richtungen.some((d) => {
        const src = hinter[zelleVon[t.id] * R + d];
        return src && kannAbgeben(src, d, pi, k, dom);
      });
      if (!kommt) return true;
    }
    return false;
  }

  /**
   * Folgert bis zum Fixpunkt: zuerst vorwärts, rückwärts erst, wenn ein Durchgang vorwärts nichts streicht; nach jedem
   * Durchgang mit Fund wieder vorwärts. Rückgabe { dom, widerspruch, schritte } (schritte: gestrichene Stellungen); log
   * sammelt die Folgerungen { art, i, bit }.
   */
  function folgern(dom0, k, log = null) {
    const dom = dom0.slice();
    let schritte = 0;
    for (;;) {
      if (widerspruch(dom, k, true)) return { dom, widerspruch: true, schritte };
      let changed = false;
      for (const rueckwaerts of [false, true]) {
        for (let i = 0; i < drehbar.length; i++) {
          if (single(dom[i])) continue;
          for (let r = dom[i]; r; r &= r - 1) {
            const bit = r & -r, vorher = dom[i];
            if (!(vorher & bit)) continue;
            dom[i] = bit;
            const w = widerspruch(dom, k, rueckwaerts);
            dom[i] = vorher;
            if (!w) continue;
            dom[i] &= ~bit; changed = true; schritte++;
            if (log) log.push({ art: rueckwaerts ? 'rückwärts' : 'vorwärts', i, bit });
            if (!dom[i]) return { dom, widerspruch: true, schritte };
          }
        }
        if (changed) break;
      }
      if (!changed) return { dom, widerspruch: false, schritte };
    }
  }

  const stellungen = (m) => { const out = []; for (let r = m; r; r &= r - 1) out.push(lowBit(r)); return out; };
  const zelle = (i) => feldform.zelle(drehbar[i]);

  /** Spielt das Level mit Horizont k: folgern, bei Stillstand eine Fallunterscheidung, wieder folgern. */
  function spiele(k) {
    const log = [], fallunterscheidungen = [];
    const ergebnis = (dom, mehr) => ({
      fallunterscheidungen,
      folgerungen: log.map(f => ({ art: f.art, element: zelle(f.i), stellungen: stellungen(f.bit) })),
      steckt: false, geloest: !!dom && dom.every(single), widerspruch: false, ...mehr,
    });
    let r = folgern(voll, k, log);
    if (r.widerspruch) return ergebnis(null, { widerspruch: true });
    let dom = r.dom;
    while (!dom.every(single) && fallunterscheidungen.length < MAX_FALLUNTERSCHEIDUNGEN) {
      let best = null;
      for (let i = 0; i < drehbar.length; i++) {
        if (single(dom[i])) continue;
        const widerlegt = [], ketten = [];
        let faelle = 0;
        for (let rr = dom[i]; rr; rr &= rr - 1) {
          faelle++;
          const t = dom.slice();
          t[i] = rr & -rr;
          const f = folgern(t, k);
          if (f.widerspruch) { widerlegt.push(rr & -rr); ketten.push(f.schritte); }
        }
        if (!widerlegt.length) continue;
        const left = faelle - widerlegt.length, cost = ketten.reduce((a, b) => a + b, 0);
        if (!best || left < best.left || (left === best.left && cost < best.cost)) best = { i, faelle, widerlegt, ketten, left, cost };
      }
      if (!best) return ergebnis(dom, { steckt: true });
      fallunterscheidungen.push({
        element: zelle(best.i), faelle: best.faelle, widerlegt: best.widerlegt.flatMap(stellungen), ketten: best.ketten,
      });
      for (const bit of best.widerlegt) dom[best.i] &= ~bit;
      log.push({ art: 'Fallunterscheidung', i: best.i, bit: best.widerlegt.reduce((a, b) => a | b, 0) });
      r = folgern(dom, k, log);
      if (r.widerspruch) return ergebnis(null, { widerspruch: true });
      dom = r.dom;
    }
    return ergebnis(dom);
  }

  /** Widerspruch, wenn nur die Elemente in stellung ({ Zelle: Stellung }) gesetzt sind, ohne Folgern (aufDenErstenBlick). */
  function widerlegt(stellung, k) {
    const dom = voll.map((m, i) => (zelle(i) in stellung ? 1 << (stellung[zelle(i)] % feldform.stellungen(drehbar[i]).length) : m));
    return widerspruch(dom, k, true);
  }

  return { spiele, widerlegt };
}

/** Das Modell eines Levels, einmal je Beurteilung. */
const modellVon = (ctx) => ctx.merke(modellVon, () => modell(ctx.level, ctx.feldform));

/**
 * Das Spielermodell mit Horizont 2 und mit vollem Überblick, einmal je Beurteilung: { k2, kInf }, je
 *   fallunterscheidungen: [{ element: Zelle, faelle: geprüfte Stellungen, widerlegt: Stellungen, ketten: je widerlegtem
 *                          Fall die Zahl der Folgerungen bis zum Widerspruch }]
 *   folgerungen:          [{ art: vorwärts, rückwärts oder Fallunterscheidung, element: Zelle, stellungen: gestrichen }]
 *   steckt:               keine Folgerung und keine Fallunterscheidung bringt es weiter
 *   geloest:              alle drehbaren Elemente entschieden
 *   widerspruch:          die Folgerungen widersprechen sich (ein Level ohne Lösung)
 */
export const spielermodell = (ctx) => ctx.merke(spielermodell, () => {
  const m = modellVon(ctx);
  return { k2: m.spiele(2), kInf: m.spiele(Infinity) };
});

/**
 * Widerlegt das Spielermodell mit Horizont k eine angenommene Stellung auf den ersten Blick (Ticket 11, Falle)? stellung:
 * { Zelle: Stellung } einiger drehbarer Elemente; nur sie sind gesetzt, alle übrigen offen. Geprüft wird wie bei jedem
 * Schritt des Folgerns, vorwärts (falsches Licht) und rückwärts (ein Ziel kann seine Farbe nicht mehr bekommen), aber
 * ohne weiter zu folgern.
 */
export const aufDenErstenBlick = (ctx, stellung, k = 2) => modellVon(ctx).widerlegt(stellung, k);

/**
 * Das Spielermodell auf jeder Drehung des Levels um die Drehachse (feldform.drehungen), einmal je Beurteilung: je
 * Drehung { k2, kInf } wie spielermodell(ctx), die erste ist das Level selbst. Gedreht ist es dasselbe Rätsel, aber das
 * Modell geht die drehbaren Elemente in einer anderen Reihenfolge durch und zählt ihre Stellungen von anderswo; die
 * Ketten und die Wahl unter gleich guten Fallunterscheidungen hängen davon ab (auf den 150 heutigen Leveln in 31
 * Fällen). Das Mittel über die Drehungen hängt nicht mehr davon ab, wie das Level gedreht ist (Schwierigkeit,
 * Ticket 12).
 */
export const spielermodellJeDrehung = (ctx) => ctx.merke(spielermodellJeDrehung, () => ctx.feldform.drehungen(ctx.level)
  .map((level, i) => {
    if (i === 0) return spielermodell(ctx);
    const m = modell(level, ctx.feldform);
    return { k2: m.spiele(2), kInf: m.spiele(Infinity) };
  }));
