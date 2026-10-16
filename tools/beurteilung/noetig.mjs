// Prüfung „nötig“ (Spec „Beurteilung“, Glossar „Kernidee“): Eine Kernidee zählt nur, wenn die Lösung von ihr abhängt;
// sonst ist sie bloss dekorativ. Gemeinsam für alle Kernideen (Tickets 10 und 11):
// - gegenprobe: Die Kernidee nimmt der Lösung ihren Beitrag weg und fragt, welches Ziel dann seine Farbe verliert. Was
//   ihr Beitrag ist, sagt sie mit einer Wegnahme, etwa „nur eine Quelle leuchtet“ (nurQuelle) oder „ein Element
//   schluckt“ (ein Blocker an seiner Stelle). Verliert kein Ziel seine Farbe, hängt die Lösung nicht davon ab.
// - wegZu: in irgendeiner Stellung je gesetztem drehbarem Element eine Wegnahme (ein Blocker an seiner Stelle): die
//   Elemente, ohne die sich das Licht eines Ziels ändert.
// - allein: was jede Quelle für sich in irgendeiner Stellung erreicht (Suche des Lösers). Damit fragt eine Kernidee, ob
//   eine andere Stellung ihren Beitrag ersetzen könnte oder wie ein Ziel sonst noch Licht bekäme.
// Wie in loesungsstellung.mjs wird nur ersetzt, nie weggelassen: Die Ids der Elemente bleiben ihre Plätze im Level.
import { L, solve, getRot } from '../solver.mjs';
import { brettInLoesung } from './loesungsstellung.mjs';

/** Zellen der Quellen, in der Reihenfolge des Levels. */
export const quellen = (ctx) => ctx.level.elements.filter(e => e.type === 'source').map(ctx.feldform.zelle);

/** Wegnahme: Nur die Quelle in dieser Zelle leuchtet, die übrigen schlucken als Blocker (wie in jeQuelle). */
export const nurQuelle = (ctx, quelle) => (e) => (e.type === 'source' && ctx.feldform.zelle(e) !== quelle ? { ...e, type: 'blocker' } : e);

/**
 * Gegenprobe in der Lösung: Welche Ziele verlieren ihre Farbe ohne einen Beitrag? wegnahme(element) gibt zurück, was an
 * der Stelle des Elements steht (es selbst, abgewandelt oder ein Blocker). Rückgabe: Zellen der Ziele, die die
 * Lösungsstellung ohne den Beitrag nicht mehr erfüllt; leer heisst, die Lösung hängt nicht von ihm ab.
 */
export function gegenprobe(ctx, wegnahme) {
  const brett = brettInLoesung(ctx, ctx.level.elements.map(wegnahme));
  const { hits } = L.traceBeams(brett);
  return brett.elements.filter(t => t.type === 'target' && hits.get(t.id) !== t.color).map(ctx.feldform.zelle);
}

/** Brett in einer beliebigen Stellung ({ Zelle: Stellung }), sonst wie brettInLoesung. */
export const brettIn = (ctx, elemente, stellung) => brettInLoesung({ ...ctx, level: { ...ctx.level, solution: stellung } }, elemente);

/**
 * Drehbare Elemente auf dem Weg des Lichts zu einem Ziel: die, deren Wegnahme (ein Blocker an ihrer Stelle) das Licht des
 * Ziels ändert. elemente: die Elemente des Levels oder eine abgewandelte Liste davon; stellung: { Zelle: Stellung } der
 * gesetzten drehbaren Elemente (etwa die Lösung). Rückgabe: Zellen, in der Reihenfolge von stellung.
 */
export function wegZu(ctx, ziel, elemente, stellung) {
  const licht = (els) => {
    const brett = brettIn(ctx, els, stellung);
    const t = brett.elements.find(e => ctx.feldform.zelle(e) === ziel);
    return L.traceBeams(brett).hits.get(t.id) || 0;
  };
  const mit = licht(elemente);
  return Object.keys(stellung).filter(z => licht(elemente.map(e => (ctx.feldform.zelle(e) === z ? { ...e, type: 'blocker' } : e))) !== mit);
}

/**
 * Was jede Quelle allein in irgendeiner Stellung erreicht, ohne dass ein Ziel falsches Licht bekommt: je Quelle eine Suche
 * des Lösers, die übrigen Quellen schlucken als Blocker; einmal je Beurteilung. Map Zelle der Quelle → {
 *   farben:        Map Zelle des Ziels → Grundfarben (Maske), die dort ankommen können
 *   verlierbar:    Grundfarben (Maske) der Quelle, die in mindestens einer solchen Stellung an keinem Ziel ankommen
 *   belieferungen: Map Zelle des Ziels → Stellungen ({ Zelle: Stellung } der Elemente, die ihr Licht berührt), in denen
 *                  sie das Ziel allein erfüllt
 *   abgebrochen:   Die Suche hat ihre Grenze erreicht; dann fehlen Möglichkeiten.
 * }
 */
export const allein = (ctx) => ctx.merke(allein, () => new Map(quellen(ctx).map((quelle) => {
  const elemente = ctx.level.elements.map(nurQuelle(ctx, quelle));
  const zelle = ctx.feldform.zelle;
  const licht = L.createBoard({ ...ctx.level, elements: elemente }).elements.find(e => e.type === 'source' && zelle(e) === quelle).color;
  const farben = new Map(), belieferungen = new Map();
  let verlierbar = 0;
  const { aborted } = solve({ ...ctx.level, elements: elemente }, { collect: 0, onLeaf: (r, brett) => {
    const ziele = brett.elements.filter(e => e.type === 'target');
    if (ziele.some(t => (r.hits.get(t.id) || 0) & ~t.color)) return;
    let stellung = null, angekommen = 0;
    for (const t of ziele) {
      const c = r.hits.get(t.id) || 0, z = zelle(t);
      angekommen |= c;
      farben.set(z, (farben.get(z) || 0) | c);
      if (c !== t.color) continue;
      stellung ??= Object.fromEntries(brett.elements.filter(e => L.isRotatable(e) && getRot(e) !== L.OPEN).map(e => [zelle(e), getRot(e)]));
      if (!belieferungen.has(z)) belieferungen.set(z, []);
      belieferungen.get(z).push(stellung);
    }
    verlierbar |= licht & ~angekommen;
  } });
  return [quelle, { farben, verlierbar, belieferungen, abgebrochen: aborted }];
})));

// Für die Begründungen der Kernideen
/** Deutsche Namen der Farben (Masken 0–7). */
export const FARBNAME = ['keine', 'Rot', 'Grün', 'Gelb', 'Blau', 'Magenta', 'Cyan', 'Weiss'];
/** Zellen als Text: „(1,4), (4,3) und (4,2)“. */
export function liste(zellen) {
  const z = zellen.map(c => `(${c})`);
  return z.length > 1 ? `${z.slice(0, -1).join(', ')} und ${z.at(-1)}` : z.join('');
}
