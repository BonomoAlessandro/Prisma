// Kernidee „Farben abzählen“ (Glossar): aus den Zielfarben folgern, welche Grundfarbe von welcher Quelle wohin muss.
// Review 6 zu 149 Zenit: „Farben abzählen: drei Quellen, drei Blau“.
// - Knapp ist eine Grundfarbe, wenn genau so viele Quellen sie an ein Ziel bringen können (allein, noetig.mjs), wie Ziele
//   sie brauchen, mindestens zwei. Licht lässt sich nicht verdoppeln, ein Strahl einer Grundfarbe endet an höchstens
//   einem Ziel: Also muss jede dieser Quellen ihre Grundfarbe an ein eigenes Ziel bringen.
// - Nötig ist das Abzählen, wenn sich der Verlust der Grundfarbe bei einer Quelle (er muss möglich sein) an keinem Ziel
//   zeigt: Jedes Ziel könnte sie noch aus einer anderen Quelle bekommen, auch wenn man Ziel für Ziel zuteilt, was nur
//   einen möglichen Lieferanten hat. Erst das Abzählen zeigt dann, dass es nicht aufgeht. Bei zwei Quellen zeigt sich
//   der Verlust immer schon so (eine Quelle für zwei Ziele); nötig wird das Abzählen erst ab drei.
// - Ist eine Suche des Lösers abgebrochen, fehlen Möglichkeiten; dann zählt keine Grundfarbe als knapp.
import { L } from '../../solver.mjs';
import { jeQuelle, loesung } from '../loesungsstellung.mjs';
import { allein, quellen, FARBNAME, liste } from '../noetig.mjs';

/**
 * Zeigt sich ein Verlust Ziel für Ziel? kann(quelle, ziel): Die Quelle kann die Grundfarbe an das Ziel bringen;
 * lieferanten: die Quellen ohne die verlorene; ziele: die Ziele, die die Grundfarbe brauchen. Ein Ziel mit nur einem
 * möglichen Lieferanten bekommt ihn, bei den übrigen fällt er weg; bleibt einem Ziel keiner, zeigt sich der Verlust.
 */
function zeigtSich(kann, lieferanten, ziele) {
  const moeglich = new Map(ziele.map(z => [z, lieferanten.filter(q => kann(q, z))]));
  for (let weiter = true; weiter;) {
    weiter = false;
    for (const [z, l] of moeglich) {
      if (!l.length) return true;
      if (l.length > 1) continue;
      moeglich.delete(z);
      for (const [z2, l2] of moeglich) moeglich.set(z2, l2.filter(q => q !== l[0]));
      weiter = true;
    }
  }
  return false;
}

/**
 * Knappe Grundfarben, je { farbe, quellen, ziele, zuordnung: { Quelle: Ziel ihrer Grundfarbe in der Lösung }, unsichtbar:
 * Quellen, deren Verlust sich an keinem Ziel zeigt }; nötig ist das Abzählen, wenn unsichtbar nicht leer ist.
 */
export const knappeFarben = (ctx) => ctx.merke(knappeFarben, () => {
  const moeglich = allein(ctx);
  if ([...moeglich.values()].some(m => m.abgebrochen)) return [];
  const zelle = ctx.feldform.zelle;
  const ziele = loesung(ctx).brett.elements.filter(t => t.type === 'target');
  return [1, 2, 4].flatMap((c) => {
    const brauchen = ziele.filter(t => t.color & c).map(zelle);
    const liefern = quellen(ctx).filter(q => [...moeglich.get(q).farben.values()].some(f => f & c));
    if (brauchen.length < 2 || liefern.length !== brauchen.length) return [];
    const kann = (q, z) => !!((moeglich.get(q).farben.get(z) || 0) & c);
    const unsichtbar = liefern.filter(q => (moeglich.get(q).verlierbar & c) && !zeigtSich(kann, liefern.filter(x => x !== q), brauchen));
    const zuordnung = {};
    for (const { quelle, brett, strahlbild } of jeQuelle(ctx)) {
      const t = liefern.includes(quelle) && brett.elements.find(e => e.type === 'target' && strahlbild.hits.get(e.id) & c);
      if (t) zuordnung[quelle] = zelle(t);
    }
    return [{ farbe: L.COLOR_NAMES[c], quellen: liefern, ziele: brauchen, zuordnung, unsichtbar }];
  });
});

/** Nötiges Abzählen: die knappen Grundfarben, deren Verlust sich bei einer Quelle an keinem Ziel zeigt. */
export const farbenAbzaehlen = (ctx) => ctx.merke(farbenAbzaehlen, () => knappeFarben(ctx).filter(k => k.unsichtbar.length).map((k) => {
  const name = FARBNAME[L.COLORS[k.farbe]], n = k.quellen.length;
  const bei = k.unsichtbar.length === 1 ? liste(k.unsichtbar) : `einer von ${liste(k.unsichtbar)}`;
  const begruendung = `${name} ist knapp: ${n} Quellen können es an ein Ziel bringen, ${liste(k.quellen)}, und ${n} Ziele `
    + `brauchen es, ${liste(k.ziele)}. Also muss jede Quelle ihr ${name} an ein eigenes Ziel bringen. Ginge es bei ${bei} `
    + `verloren, zeigte das kein einzelnes Ziel, erst das Abzählen. In der Lösung: `
    + `${Object.entries(k.zuordnung).map(([q, z]) => `(${q}) → (${z})`).join(', ')}.`;
  return { ...k, begruendung };
}));

export default { teil: 'kernideen', begriff: 'Farben abzählen', beurteile: farbenAbzaehlen };
