// Kernidee „Mischziel aus zwei Quellen“ (Glossar): ein Ziel, dessen Farbe nur entsteht, wenn sich Strahlen aus zwei
// verschiedenen Quellen darauf treffen, auf dem Ziel oder in einem Kombinator davor.
// - Vorauswahl: die Mischziele, auf die mindestens zwei Quellen je allein Licht bringen (mischziele.mjs, ausZweiQuellen).
// - Nötig (Gegenprobe, noetig.mjs): Mit dem Licht nur einer Quelle verliert das Ziel seine Farbe, gleich mit welcher.
//   Liefert eine Quelle die Farbe allein, ist das Licht der zweiten bloss dekorativ (heute je ein gelbes Ziel in
//   114 Gordischer Knoten und 125 Halo).
// - Gemessen wird in der Lösung. Ob eine Quelle die Farbe in einer anderen Stellung allein liefern könnte, zählt nicht:
//   Eine solche Stellung löst das Level nicht, und so gezählt fielen 26 der 44 Ziele weg, darunter die beiden
//   Magentaziele von 148 Sternenstaub, die Review 6 als Mischung aus zwei Quellen nennt.
import { L } from '../../solver.mjs';
import { mischziele } from '../mischziele.mjs';
import { jeQuelle } from '../loesungsstellung.mjs';
import { gegenprobe, nurQuelle, quellen, FARBNAME } from '../noetig.mjs';

/** Nötige Mischziele aus zwei Quellen, je { ziel, farbe, quellen, licht: { Quelle: Farbe ihres Lichts auf dem Ziel }, begruendung }. */
export const mischzieleAusZweiQuellen = (ctx) => ctx.merke(mischzieleAusZweiQuellen, () => mischziele(ctx)
  .filter(m => m.ausZweiQuellen && quellen(ctx).every(q => gegenprobe(ctx, nurQuelle(ctx, q)).includes(m.ziel)))
  .map(({ ziel, farbe, quellen: mit }) => {
    const licht = {};
    for (const { quelle, brett, strahlbild } of jeQuelle(ctx)) {
      if (!mit.includes(quelle)) continue;
      const t = brett.elements.find(e => ctx.feldform.zelle(e) === ziel);
      licht[quelle] = L.COLOR_NAMES[strahlbild.hits.get(t.id)];
    }
    const name = FARBNAME[L.COLORS[farbe]];
    const teile = mit.map(q => `${FARBNAME[L.COLORS[licht[q]]]} von (${q})`);
    const begruendung = `Ziel (${ziel}) bekommt sein ${name} nur aus ${mit.length === 2 ? 'zwei' : 'mehreren'} Quellen: `
      + `${teile.join(', ')}. Mit dem Licht nur einer Quelle bekäme es kein ${name}.`;
    return { ziel, farbe, quellen: mit, licht, begruendung };
  }));

export default { teil: 'kernideen', begriff: 'Mischziel aus zwei Quellen', beurteile: mischzieleAusZweiQuellen };
