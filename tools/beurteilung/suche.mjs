// Suche ohne Abschneiden: alle Strahlbilder, die beim Drehen entstehen können, mit dem Löser (solve mit prune: false).
// Jedes Blatt der Suche ist ein Strahlbild; drehbare Elemente ohne Licht bleiben darin offen. Die Suche ist teuer (auf
// den 150 heutigen Leveln bis 1,5 Mio. Knoten), darum rechnet ctx.merke sie einmal je Beurteilung. Was Regeln über
// diese Strahlbilder wissen müssen, sammelt sie hier in einem Durchgang.
import { L, solve, getRot } from '../solver.mjs';
import { loesung } from './loesungsstellung.mjs';

/** Höchstens so viele Knoten (wie im Vorsieb der Reviews); die grösste Suche der 150 heutigen Level hat 1,5 Mio. */
export const MAX_KNOTEN = 4e6;

/**
 * Zellen der Elemente, mit denen Licht in einem Strahlbild in Berührung kommt (wie litCells im Löser, aber über die
 * Feldform): Ein Spiegel nennt sein Element nicht, wenn er spiegelt, nur die Stelle.
 */
export function beleuchtet(feldform, brett, strahlbild) {
  const out = new Set();
  for (const e of strahlbild.events) {
    const id = e.element ?? e.target;
    if (id !== undefined) out.add(feldform.zelle(brett.elements[id]));
    else if (e.kind === 'reflect') out.add(feldform.zelleBei(e));
  }
  return out;
}

/**
 * Die Suche ohne Abschneiden: { strahlbilder, knoten, abgebrochen, fastLoesungen, licht }.
 *   strahlbilder:  Zahl der Blätter, also der verschiedenen Strahlbilder
 *   abgebrochen:   bei MAX_KNOTEN abgebrochen; dann gelten alle Zahlen nur für den durchsuchten Teil
 *   fastLoesungen: die Strahlbilder, in denen genau ein Ziel nicht stimmt, je { ziel: Zelle des Ziels, stellung:
 *                  { Zelle: Stellung } der entschiedenen drehbaren Elemente, abstand: wie viele davon anders stehen als in
 *                  der Lösung, feste: Zellen der festen Teile abseits der Lösung (siehe licht), die dort Licht bekommen }
 *   licht:         Map Zelle → in wie vielen Strahlbildern das feste Teil dort Licht bekommt, für jedes feste Teil
 *                  abseits der Lösung (nicht drehbar, keine Quelle und kein Ziel, in der Lösung ohne Licht; für den
 *                  Lockvogel, Ticket 11)
 */
export const sucheOhneAbschneiden = (ctx) => ctx.merke(sucheOhneAbschneiden, () => {
  const { level, feldform } = ctx;
  const zahlZiele = level.elements.filter(e => e.type === 'target').length;
  const fastLoesungen = [];
  // Feste Teile abseits der Lösung, durchnummeriert; nach Id (die Ids sind die Plätze im Level) und, weil ein Spiegel
  // beim Spiegeln nur die Stelle nennt, nach Zelle. Die Suche hat auf den 150 heutigen Leveln über 9 Mio. Blätter, darum
  // zählt jedes Blatt ohne neue Objekte.
  const inLoesung = beleuchtet(feldform, loesung(ctx).brett, loesung(ctx).strahlbild);
  const teile = level.elements.flatMap((e, id) => (feldform.stellungen(e).length || e.type === 'source' || e.type === 'target'
    || inLoesung.has(feldform.zelle(e)) ? [] : [{ id, zelle: feldform.zelle(e), spiegel: e.type === 'mirror' }]));
  const nachId = new Int32Array(level.elements.length).fill(-1);
  teile.forEach((t, i) => { nachId[t.id] = i; });
  const spiegel = new Map(teile.flatMap((t, i) => (t.spiegel ? [[t.zelle, i]] : [])));
  const zahl = new Float64Array(teile.length), zuletzt = new Float64Array(teile.length).fill(-1);
  let blatt = 0;
  const res = solve(level, {
    prune: false, collect: 0, maxNodes: MAX_KNOTEN,
    onLeaf: (r, brett) => {
      if (teile.length) {
        blatt++;
        for (const e of r.events) {
          let i = -1;
          if (e.element !== undefined) i = nachId[e.element];
          else if (spiegel.size && e.kind === 'reflect') i = spiegel.get(feldform.zelleBei(e)) ?? -1;
          if (i >= 0 && zuletzt[i] !== blatt) { zuletzt[i] = blatt; zahl[i]++; }
        }
      }
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
      const feste = teile.filter((_, i) => zuletzt[i] === blatt).map(t => t.zelle);
      fastLoesungen.push({ ziel: feldform.zelle(ziel), stellung, abstand, feste });
    },
  });
  const licht = new Map(teile.map((t, i) => [t.zelle, zahl[i]]));
  return { strahlbilder: res.leaves, knoten: res.nodes, abgebrochen: res.aborted, fastLoesungen, licht };
});
