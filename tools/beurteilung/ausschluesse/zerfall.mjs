// Zerfall (Glossar, Spec „Beurteilung“): Das Level besteht aus unabhängigen Teilrätseln, die sich einzeln lösen lassen.
// Gilt erst ab „mittel“, ohne vorgegebenen Grad wie ab „mittel“ (ab-mittel.mjs). Gemessen in der Lösungsstellung:
// - Ein Ziel hängt von einem drehbaren Element ab, wenn es anderes Licht bekommt, sobald an der Stelle des Elements ein
//   Blocker steht. Ziele, die von einem gemeinsamen Element abhängen, gehören zu einer Gruppe. Zu einer Gruppe gehören
//   die drehbaren Elemente, von denen ihre Ziele abhängen.
// - Ein gemeinsames Mischziel verbindet Gruppen: Ein Mischziel (mischziele.mjs) kommt in eine Gruppe mit allen Zielen,
//   auf die eine seiner Quellen allein Licht bringt. Kommt Licht über drehbare Elemente darauf, hängen die Gruppen schon
//   so zusammen; das Mischziel verbindet also über Quellen und feste Elemente, auch Gruppen, die sich bloss eine Quelle
//   teilen.
// - Zerfall: mehr als eine Gruppe, und die zweite (nach der Zahl der drehbaren Elemente) hat mindestens 3.
import { L } from '../../solver.mjs';
import { brettInLoesung, loesung, jeQuelle } from '../loesungsstellung.mjs';
import { mischziele } from '../mischziele.mjs';
import { giltAbMittel, zusatzOhneGrad } from './ab-mittel.mjs';

const MIN_ELEMENTE = 3;

/**
 * Gruppen von Zielen der Lösungsstellung, die mit den meisten drehbaren Elementen zuerst, je { ziele, elemente } als Ids
 * in der Reihenfolge des Levels. Exportiert für die Vorprüfung beim Ausbau (tools/ausbau.mjs wahl).
 */
export function gruppen(ctx) {
  const { level, feldform } = ctx;
  const { strahlbild } = loesung(ctx);
  const ziele = level.elements.flatMap((e, i) => (e.type === 'target' ? [i] : []));
  // Ziele, die ohne ein drehbares Element (dort ein Blocker) anderes Licht bekommen: Id des Elements → Ids der Ziele
  const abhaengig = new Map();
  level.elements.forEach((el, i) => {
    if (!feldform.stellungen(el).length) return;
    const brett = brettInLoesung(ctx, level.elements.map((e, j) => (j === i ? { ...e, type: 'blocker' } : e)));
    const hits = L.traceBeams(brett).hits;
    abhaengig.set(i, ziele.filter(t => (hits.get(t) || 0) !== (strahlbild.hits.get(t) || 0)));
  });
  // Ziele verbinden: über gemeinsame drehbare Elemente und über gemeinsame Mischziele
  const oben = new Map(ziele.map(t => [t, t]));
  const wurzel = (t) => (oben.get(t) === t ? t : wurzel(oben.get(t)));
  const verbinde = (a, b) => oben.set(wurzel(b), wurzel(a));
  for (const ts of abhaengig.values()) for (const t of ts) verbinde(ts[0], t);
  const idBei = new Map(level.elements.map((e, i) => [feldform.zelle(e), i]));
  for (const m of mischziele(ctx)) {
    for (const q of jeQuelle(ctx).filter(q => m.quellen.includes(q.quelle))) {
      for (const t of ziele) if (q.strahlbild.hits.get(t)) verbinde(idBei.get(m.ziel), t);
    }
  }
  const nachWurzel = new Map();
  for (const t of ziele) {
    const w = wurzel(t);
    if (!nachWurzel.has(w)) nachWurzel.set(w, { ziele: [], elemente: [] });
    nachWurzel.get(w).ziele.push(t);
  }
  for (const [el, ts] of abhaengig) if (ts.length) nachWurzel.get(wurzel(ts[0])).elemente.push(el);
  return [...nachWurzel.values()].sort((a, b) => b.elemente.length - a.elemente.length);
}

/** Zerfall der Lösungsstellung: höchstens ein Fund { begruendung, gruppen: [{ ziele, elemente }] } mit Zellen. */
export function zerfall(ctx) {
  if (!giltAbMittel(ctx)) return [];
  const alle = gruppen(ctx);
  if (alle.length < 2 || alle[1].elemente.length < MIN_ELEMENTE) return [];
  const zellen = (ids) => ids.map(id => ctx.feldform.zelle(ctx.level.elements[id]));
  const g = alle.map(({ ziele, elemente }) => ({ ziele: zellen(ziele), elemente: zellen(elemente) }));
  const beschreibe = ({ ziele, elemente }) => `${ziele.length > 1 ? 'Ziele' : 'Ziel'} ${ziele.join(' ')} ` +
    (elemente.length ? `mit ${elemente.length} drehbaren Element${elemente.length > 1 ? 'en' : ''} (${elemente.join(' ')})`
      : 'ohne drehbares Element');
  return [{
    begruendung: `Die Ziele zerfallen in ${g.length} Gruppen, die sich einzeln lösen lassen: ${g.map(beschreibe).join('; ')}.` +
      zusatzOhneGrad(ctx),
    gruppen: g,
  }];
}

export default { teil: 'ausschluesse', begriff: 'Zerfall', beurteile: zerfall };
