// Mischziele (Glossar): Ziele, deren Farbe erst im Level gemischt wird, durch einen Kombinator oder durch mehrere
// Strahlen auf dem Ziel. Ein weisses Ziel, das sein Weiss direkt aus einer weissen Quelle bekommt, ist keines.
// Gemessen in der Lösungsstellung:
// - Ein Kombinator mischt, wenn er eine Mischfarbe abgibt, die keiner seiner Eingangsstrahlen schon hat. Weiss + Rot =
//   Weiss mischt also nichts.
// - Im Strahlbild ohne Mischung stehen an seiner Stelle Blocker. Mischt dort ein anderer Kombinator neu, weil ihm das
//   schon gemischte Licht fehlt, wird auch er zum Blocker, bis keiner mehr mischt. Bekommt ein Ziel mit Mischfarbe
//   dann keinen Strahl, der seine Farbe schon hat, wird seine Farbe gemischt: Es ist ein Mischziel. Weiss aus einer
//   weissen Quelle oder Gelb aus einem Gelbfilter sind so keine Mischziele.
// - Aus zwei Quellen ist ein Mischziel, wenn mindestens zwei Quellen je allein Licht darauf bringen (die Zählung der
//   Spec, 38 der 150 Level). Das ist nicht die Kernidee „Mischziel aus zwei Quellen“ (Ticket 10): Dort darf keine
//   einzelne Quelle die Farbe liefern können, und die Lösung muss davon abhängen.
import { L } from '../solver.mjs';
import { brettInLoesung, loesung, jeQuelle } from './loesungsstellung.mjs';

/** Mindestens zwei Grundfarben. */
const isMixed = (farbe) => (farbe & (farbe - 1)) !== 0;
/** Farben der Strahlen, die in einem Strahlbild auf einen Kombinator bzw. ein Ziel treffen (Id des Elements). */
const inputs = (strahlbild, id) => strahlbild.events.filter(e => e.kind === 'merge' && e.element === id).map(e => e.color);
const rays = (strahlbild, id) => strahlbild.events.filter(e => e.kind === 'hit' && e.target === id).map(e => e.color);
/** Ids der Kombinatoren, die in einem Bild { brett, strahlbild } mischen. */
const mixersIn = ({ brett, strahlbild }) => brett.elements.filter((k) => {
  const farbe = strahlbild.mixes.get(k.id) || 0;
  return k.type === 'combiner' && isMixed(farbe) && !inputs(strahlbild, k.id).includes(farbe);
}).map(k => k.id);

/** Mischziele der Lösungsstellung, je { ziel: Zelle, farbe, quellen: Zellen der Quellen mit Licht darauf, ausZweiQuellen }. */
export const mischziele = (ctx) => ctx.merke(mischziele, () => {
  const { brett } = loesung(ctx);
  // Bild ohne Mischung; die Ids sind in allen Brettern die Plätze im Level
  const blocked = new Set();
  let unmixed = loesung(ctx);
  for (let fresh = mixersIn(unmixed); fresh.length; fresh = mixersIn(unmixed)) {
    for (const id of fresh) blocked.add(id);
    const b = brettInLoesung(ctx, ctx.level.elements.map((e, i) => (blocked.has(i) ? { ...e, type: 'blocker' } : e)));
    unmixed = { brett: b, strahlbild: L.traceBeams(b) };
  }
  return brett.elements
    .filter(t => t.type === 'target' && isMixed(t.color) && !rays(unmixed.strahlbild, t.id).includes(t.color))
    .map((t) => {
      const quellen = jeQuelle(ctx).filter(q => q.strahlbild.hits.get(t.id)).map(q => q.quelle);
      return { ziel: ctx.feldform.zelle(t), farbe: L.COLOR_NAMES[t.color], quellen, ausZweiQuellen: quellen.length >= 2 };
    });
});

export default { teil: 'mischziele', beurteile: mischziele };
