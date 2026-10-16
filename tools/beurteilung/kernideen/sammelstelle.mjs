// Kernidee „Sammelstelle“ (Glossar): ein Prisma, das Licht aus mehreren Richtungen sammelt und neu verteilt. Review 6 zu
// 148 Sternenstaub: „Ein Prisma sammelt R, G und B aus drei Richtungen und fächert sie neu auf.“
// - Muster, in der Lösung: Aus mindestens zwei Richtungen fällt Licht in das Prisma, das es bricht (zulauf, noetig.mjs).
//   Licht, das an seiner Rückseite verschwindet, sammelt es nicht. Wohin es das Licht bricht, hängt nur von seiner
//   Stellung und der Grundfarbe ab: Eine Stellung muss allen Zuläufen zugleich dienen.
// - Nötig (ohneZulauf, noetig.mjs): Ohne den Zulauf aus einer Richtung verliert ein Ziel seine Farbe, und das gilt für
//   mindestens zwei Richtungen. Zählt nur ein Zulauf, etwa weil das übrige Licht ins Leere läuft oder dieselbe Bahn
//   nimmt, ist das Sammeln bloss dekorativ (heute 40 Geflecht, 56 Strahlenkranz, 114, 117, 123 und 125 Halo).
// - Fest oder drehbar ist gleich: Auch in ein festes Prisma muss der Spieler das Licht aus mehreren Richtungen bringen.
import { L } from '../../solver.mjs';
import { loesung } from '../loesungsstellung.mjs';
import { ohneZulauf, zulauf, FARBNAME, liste } from '../noetig.mjs';

/**
 * Nötige Sammelstellen, je Prisma { element: Zelle, zulauf: [{ von: Zelle, farbe, ziele: Zellen der Ziele, die ohne
 * diesen Zulauf ihre Farbe verlieren }] (nur die nötigen Zuläufe, in der Reihenfolge der Zellen), begruendung }.
 */
export const sammelstellen = (ctx) => ctx.merke(sammelstellen, () => {
  const { brett, strahlbild } = loesung(ctx);
  const ungeloest = brett.elements.filter(t => t.type === 'target' && strahlbild.hits.get(t.id) !== t.color).map(ctx.feldform.zelle);
  const funde = [];
  for (const p of brett.elements.filter(e => e.type === 'prism')) {
    const element = ctx.feldform.zelle(p);
    const gebrochen = [...zulauf(ctx, strahlbild, element)].filter(([d, z]) => L.refractInPrism(d, z.farbe, p.rot).length);
    if (gebrochen.length < 2) continue;
    // Wächter (ADR 0003): Ohne Wegnahme gibt ohneZulauf die Lösung wieder, sonst bricht es anders als die Strahlregel
    if (ohneZulauf(ctx, element).join(' ') !== ungeloest.join(' ')) {
      throw new Error(`Sammelstelle: ohneZulauf gibt am Prisma (${element}) die Lösung nicht wieder (ADR 0003)`);
    }
    const noetig = gebrochen
      .map(([d, { von, farbe }]) => ({ von, farbe: L.COLOR_NAMES[farbe], ziele: ohneZulauf(ctx, element, d) }))
      .filter(z => z.ziele.length);
    if (noetig.length < 2) continue;
    const licht = (z) => `${FARBNAME[L.COLORS[z.farbe]]} von (${z.von})`;
    const teile = noetig.map(licht);
    const folgen = noetig.map(z => `ohne das ${licht(z)} ${z.ziele.length === 1 ? 'verliert' : 'verlieren'} ${liste(z.ziele)} `
      + `${z.ziele.length === 1 ? 'seine' : 'ihre'} Farbe`);
    const begruendung = `Prisma (${element}) sammelt Licht aus ${noetig.length === 2 ? 'zwei' : noetig.length} Richtungen, `
      + `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}, und verteilt es neu: ${folgen.join('; ')}.`;
    funde.push({ element, zulauf: noetig, begruendung });
  }
  return funde;
});

export default { teil: 'kernideen', begriff: 'Sammelstelle', beurteile: sammelstellen };
