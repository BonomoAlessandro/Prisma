// Lösungsstellung eines Levels und ihre Strahlbilder, gemeinsam für alle Regeln der Beurteilung. Was mehrere Regeln
// brauchen, rechnet ctx.merke einmal je Beurteilung. In allen Brettern hier sind die Ids der Elemente ihre Plätze im
// Level: Abgewandelt wird nur durch Ersetzen, nie durch Weglassen.
import { L, setRot } from '../solver.mjs';

/**
 * Brett der Strahlregel in der Lösungsstellung. elemente: die Elemente des Levels oder eine abgewandelte Liste davon
 * (etwa Elemente durch Blocker ersetzt); die Stellungen kommen aus der Lösung des Levels. Drehbare Elemente ohne
 * Eintrag in der Lösung behalten ihre Startstellung. Die übrigen Angaben des Levels (etwa size und dim) gehen
 * unverändert an die Strahlregel, damit sie auch ein Würfel-Level richtig anlegt.
 */
export function brettInLoesung(ctx, elemente = ctx.level.elements) {
  const brett = L.createBoard({ ...ctx.level, elements: elemente });
  for (const el of brett.elements) {
    const stellung = ctx.level.solution[ctx.feldform.zelle(el)];
    if (L.isRotatable(el) && stellung !== undefined) setRot(el, stellung);
  }
  return brett;
}

/** Brett und Strahlbild der Lösungsstellung: { brett, strahlbild }. */
export const loesung = (ctx) => ctx.merke(loesung, () => {
  const brett = brettInLoesung(ctx);
  return { brett, strahlbild: L.traceBeams(brett) };
});

/**
 * Je Quelle des Levels Brett und Strahlbild der Lösungsstellung, in der nur sie leuchtet: [{ quelle: Zelle, brett,
 * strahlbild }]. Die übrigen Quellen stehen dabei als Blocker im Feld, denn auch dunkel schlucken sie Licht.
 */
export const jeQuelle = (ctx) => ctx.merke(jeQuelle, () => ctx.level.elements.filter(e => e.type === 'source').map((quelle) => {
  const brett = brettInLoesung(ctx, ctx.level.elements.map(e => (e.type === 'source' && e !== quelle ? { ...e, type: 'blocker' } : e)));
  return { quelle: ctx.feldform.zelle(quelle), brett, strahlbild: L.traceBeams(brett) };
}));
