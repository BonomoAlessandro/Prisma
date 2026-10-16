// Suche ohne Abschneiden: alle Strahlbilder, die beim Drehen entstehen können, mit dem Löser (solve mit prune: false).
// Jedes Blatt der Suche ist ein Strahlbild; drehbare Elemente ohne Licht bleiben darin offen. Die Suche ist teuer (auf
// den 150 heutigen Leveln bis 1,5 Mio. Knoten), darum rechnet ctx.merke sie einmal je Beurteilung. Was Regeln über
// diese Strahlbilder wissen müssen, sammelt sie hier in einem Durchgang.
import { L, solve, getRot } from '../solver.mjs';

/** Höchstens so viele Knoten (wie im Vorsieb der Reviews); die grösste Suche der 150 heutigen Level hat 1,5 Mio. */
export const MAX_KNOTEN = 4e6;

/**
 * Die Suche ohne Abschneiden: { strahlbilder, knoten, abgebrochen, fastLoesungen }.
 *   strahlbilder:  Zahl der Blätter, also der verschiedenen Strahlbilder
 *   abgebrochen:   bei MAX_KNOTEN abgebrochen; dann gelten alle Zahlen nur für den durchsuchten Teil
 *   fastLoesungen: die Strahlbilder, in denen genau ein Ziel nicht stimmt, je { ziel: Zelle des Ziels, stellung:
 *                  { Zelle: Stellung } der entschiedenen drehbaren Elemente, abstand: wie viele davon anders stehen als in
 *                  der Lösung }
 */
export const sucheOhneAbschneiden = (ctx) => ctx.merke(sucheOhneAbschneiden, () => {
  const { level, feldform } = ctx;
  const zahlZiele = level.elements.filter(e => e.type === 'target').length;
  const fastLoesungen = [];
  const res = solve(level, {
    prune: false, collect: 0, maxNodes: MAX_KNOTEN,
    onLeaf: (r, brett) => {
      if (r.satisfied.size !== zahlZiele - 1) return;
      const stellung = {};
      let abstand = 0;
      for (const el of brett.elements) {
        const moeglich = feldform.stellungen(el).length, v = getRot(el);
        if (!moeglich || v === L.OPEN) continue;
        const zelle = feldform.zelle(el);
        stellung[zelle] = v;
        if (v % moeglich !== level.solution[zelle] % moeglich) abstand++;
      }
      const ziel = brett.elements.find(t => t.type === 'target' && !r.satisfied.has(t.id));
      fastLoesungen.push({ ziel: feldform.zelle(ziel), stellung, abstand });
    },
  });
  return { strahlbilder: res.leaves, knoten: res.nodes, abgebrochen: res.aborted, fastLoesungen };
});
