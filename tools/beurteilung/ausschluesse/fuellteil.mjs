// Füllteil (Glossar, Spec „Beurteilung“): ein kurzer Strang, dessen Stellungen für keinen fremden Strahl eine Rolle
// spielen. Gilt erst ab „mittel“, ohne vorgegebenen Grad wie ab „mittel“ (ab-mittel.mjs). Gemessen in der
// Lösungsstellung:
// - Ein Strang ist das Licht einer Quelle, die allein leuchtet (die übrigen stehen als Blocker im Feld), wenn es als
//   ein Strahl über Spiegel, auch feste, und Filter auf genau ein Ziel läuft: kein Prisma, kein Kombinator, und
//   unterwegs geht nichts verloren. Das Ziel muss sein eigenes sein: Keine andere Quelle bringt allein Licht darauf.
// - Ein Füllteil ist ein Strang über höchstens 3 Spiegel, wenn keine Stellung eines seiner drehbaren Spiegel das Licht
//   ändert, das fremde Strahlen auf andere Ziele bringen. Fremd sind die Strahlen der übrigen Quellen; die Quelle des
//   Strangs steht dafür als Blocker im Feld. Gedreht wird je ein Spiegel, die übrigen Elemente bleiben in der Lösung.
// - Ein fremder Strahl spielt so nur eine Rolle, wenn er einen drehbaren Spiegel des Strangs trifft; dann ist der Strang
//   ein Einstieg. Kreuzt er nur den Weg des Strangs in einer leeren Zelle, schafft das keine Abhängigkeit, und der
//   Strang bleibt ein Füllteil. Verglichen wird die Farbe auf den Zielen: Kommt nur eine Farbe dazu, die ein Ziel schon
//   hat, ändert sich nichts.
import { L, getRot, setRot } from '../../solver.mjs';
import { brettInLoesung, jeQuelle } from '../loesungsstellung.mjs';
import { giltAbMittel, zusatzOhneGrad } from './ab-mittel.mjs';

const MAX_SPIEGEL = 3;

/**
 * Strang im Strahlbild einer Quelle allein, oder null: { ziel, spiegel } als Ids der Elemente, die Spiegel in
 * Laufrichtung. idBei: Zelle → Id des Elements dort.
 */
function strangIn(ctx, strahlbild, idBei) {
  const events = strahlbild.events;
  if (!events.every(e => e.kind === 'reflect' || e.kind === 'filter' || e.kind === 'hit')) return null;
  const hits = events.filter(e => e.kind === 'hit');
  if (hits.length !== 1) return null;
  const spiegel = new Set(events.filter(e => e.kind === 'reflect').map(e => idBei.get(ctx.feldform.zelleBei(e))));
  return { ziel: hits[0].target, spiegel: [...spiegel] };
}

/** Füllteile der Lösungsstellung, je { begruendung, strang: { quelle, spiegel, ziel } } mit Zellen. */
export function fuellteile(ctx) {
  if (!giltAbMittel(ctx)) return [];
  const { level, feldform } = ctx;
  const idBei = new Map(level.elements.map((e, i) => [feldform.zelle(e), i]));
  const zelleVon = (id) => feldform.zelle(level.elements[id]);
  const ziele = level.elements.flatMap((e, i) => (e.type === 'target' ? [i] : []));
  const quellen = jeQuelle(ctx);
  const funde = [];
  for (const q of quellen) {
    const strang = strangIn(ctx, q.strahlbild, idBei);
    if (!strang || strang.spiegel.length > MAX_SPIEGEL) continue;
    if (quellen.some(p => p !== q && p.strahlbild.hits.get(strang.ziel))) continue; // kein eigenes Ziel
    // Fremde Strahlen: Alle übrigen Quellen leuchten, die Quelle des Strangs steht als Blocker im Feld. Das Brett gehört
    // nur dieser Prüfung; die Stellung in der Lösung ändert nichts, darum wird sie einfach mitgeprüft.
    const brett = brettInLoesung(ctx, level.elements.map((e, i) => (i === idBei.get(q.quelle) ? { ...e, type: 'blocker' } : e)));
    const vorher = L.traceBeams(brett).hits;
    const andere = ziele.filter(t => t !== strang.ziel);
    const spieltRolle = strang.spiegel.some((id) => {
      const el = brett.elements[id], inLoesung = getRot(el);
      const aendert = feldform.stellungen(el).some((stellung) => {
        setRot(el, stellung);
        const nachher = L.traceBeams(brett).hits;
        return andere.some(t => (nachher.get(t) || 0) !== (vorher.get(t) || 0));
      });
      setRot(el, inLoesung);
      return aendert;
    });
    if (spieltRolle) continue;
    const s = { quelle: q.quelle, spiegel: strang.spiegel.map(zelleVon), ziel: zelleVon(strang.ziel) };
    const weg = s.spiegel.length ? `über ${s.spiegel.length} Spiegel (${s.spiegel.join(' ')})` : 'ohne Spiegel';
    funde.push({
      begruendung: `Strang von der Quelle ${s.quelle} ${weg} zum eigenen Ziel ${s.ziel}: Keine Stellung seiner Spiegel ` +
        `ändert das Licht, das fremde Strahlen auf andere Ziele bringen.${zusatzOhneGrad(ctx)}`,
      strang: s,
    });
  }
  return funde;
}

export default { teil: 'ausschluesse', begriff: 'Füllteil', beurteile: fuellteile };
