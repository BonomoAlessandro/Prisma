// Kernidee „Lockvogel“ (Glossar): ein festes Teil abseits der Lösung, das beim Probieren Licht bekommt. Review 4 zu
// 125 Halo: „2 Lockvögel wirken.“
// - Muster, übernommen aus quality.mjs (decoysRead): Ein festes Teil (Blocker, Filter, fester Spiegel, festes Prisma
//   oder fester Kombinator) bekommt in der Lösung kein Licht, aber in mindestens ANTEIL der Strahlbilder der Suche ohne
//   Abschneiden (suche.mjs, licht). Quellen und Ziele zählen nicht als feste Teile. Neu sind die Filter: quality.mjs
//   zählte nur Blocker und Elemente mit fixed, und kein Filter der heutigen Level trägt fixed. Die Funde auf den 150
//   ändert das nicht.
// - Nötig ist er, wenn beides gilt (Entscheid des Nutzers vom 16.10.2026: Ein Lockvogel muss auch locken):
//   - Er führt beim Probieren in die Irre: Er bekommt in mindestens ANTEIL_HOLZWEGE der Holzwege Licht, mindestens in
//     einem. Ein Holzweg ist eine weite Fast-Lösung der Suche ohne Abschneiden (mindestens WEIT Elemente anders als in
//     der Lösung, schliessen.mjs), wie bei der Falle. Ein lockendes Teil bekommt ohnehin in vielen Strahlbildern Licht,
//     also auch in einzelnen Holzwegen; erst ein merklicher Teil zeigt, dass Holzwege über es führen. Die Grenze ist
//     dieselbe wie beim Locken überhaupt. Bei wenigen Holzwegen genügt einer.
//   - Ohne das Teil hätte das Level eine zweite Lösung. Dafür steht an seiner Stelle ein weisser Filter, der alles
//     durchlässt, und der Löser sucht eine zweite Lösung. Die Lösung bleibt dabei eine: Das Teil bekommt in ihr kein
//     Licht.
//   Ein Blocker, der nur eine zweite Lösung verhindert, ohne in Holzwegen Licht zu bekommen, zählt nicht. Solche Blocker
//   setzt der heutige Generator, um mehrdeutige Level eindeutig zu machen (makeUnique). Auf den 150 heutigen Leveln
//   fallen so 72 Rubin, 75 Bumerang und 111 Lichtschleife weg (gar kein Holzweg), dazu 131 Korona und 147 Farbmühle
//   (5 bzw. 9 % der Holzwege führen über den Blocker).
//   Bleibt die Lösung ohne das Teil eindeutig, lockt es zwar, aber die Lösung hängt nicht von ihm ab. So die festen
//   Spiegel, die Review 4 „Deko“ nennt, in 124 Brennglas (0,6) und 131 Korona (2,4); die in 133 Sternbild (6,1) und
//   139 Singularität (2,6) bekommen nicht einmal in 10 % der Strahlbilder Licht.
// - Teuer: wegen der Suche ohne Abschneiden und weil der Löser je Teil, das lockt und in die Irre führt, das ganze
//   Level nach einer zweiten Lösung absucht.
import { solve } from '../../solver.mjs';
import { sucheOhneAbschneiden } from '../suche.mjs';
import { WEIT } from '../schliessen.mjs';
import { liste } from '../noetig.mjs';

/** Ein festes Teil lockt, wenn es in mindestens so vielen der Strahlbilder Licht bekommt (wie in quality.mjs). */
export const ANTEIL = 0.1;
/** Es führt in die Irre, wenn es in mindestens so vielen der Holzwege Licht bekommt, mindestens in einem. */
export const ANTEIL_HOLZWEGE = 0.1;

/** Name und Fürwort eines festen Teils für die Begründung. */
const NAME = {
  blocker: ['Der Blocker', 'ihn'], filter: ['Der Filter', 'ihn'], mirror: ['Der feste Spiegel', 'ihn'],
  prism: ['Das feste Prisma', 'es'], combiner: ['Der feste Kombinator', 'ihn'],
};

/**
 * Nötige Lockvögel, je { element: Zelle, strahlbilder: { licht: Zahl der Strahlbilder mit Licht darauf, alle },
 * holzwege: { licht: Zahl der Holzwege mit Licht darauf, alle }, zweiteLoesung: { Zelle: Stellung } der drehbaren
 * Elemente, die in der zweiten Lösung ohne das Teil anders stehen, begruendung }, in der Reihenfolge des Levels.
 */
export const lockvoegel = (ctx) => ctx.merke(lockvoegel, () => {
  const { level, feldform } = ctx;
  const suche = sucheOhneAbschneiden(ctx);
  const holzwege = suche.fastLoesungen.filter(f => f.abstand >= WEIT);
  const funde = [];
  for (const [element, licht] of suche.licht) {
    if (licht < ANTEIL * suche.strahlbilder) continue;
    const irre = holzwege.filter(f => f.feste.includes(element)).length;
    if (!irre || irre < ANTEIL_HOLZWEGE * holzwege.length) continue;
    const elemente = level.elements.map(e => (feldform.zelle(e) === element ? { ...e, type: 'filter', color: 'white' } : e));
    const r = solve({ ...level, elements: elemente }, { unique: true, collect: 2 });
    if (r.count < 2) continue;
    // Die zweite Lösung: die gefundene, die nicht die Lösung des Levels ist; gleich wirkende Stellungen zählen gleich
    const periode = (z) => feldform.stellungen(level.elements.find(e => feldform.zelle(e) === z)).length;
    const anders = (set) => Object.entries(set).filter(([z, v]) => v % periode(z) !== level.solution[z] % periode(z));
    const andere = r.solutions.find(s => anders(s.set).length || Object.keys(s.set).length !== Object.keys(level.solution).length);
    const zweiteLoesung = Object.fromEntries(anders(andere.set));
    const beliebig = Object.keys(level.solution).filter(z => !(z in andere.set));
    const teile = Object.entries(zweiteLoesung).map(([z, v]) => `(${z}) auf ${v}`);
    if (beliebig.length) teile.push(`${liste(beliebig)} beliebig`);
    const [name, ihn] = NAME[level.elements.find(e => feldform.zelle(e) === element).type];
    const begruendung = `${name} (${element}) liegt abseits der Lösung und bekommt beim Probieren Licht, in ${licht} von `
      + `${suche.strahlbilder} Strahlbildern der Suche ohne Abschneiden, darunter in ${irre} von ${holzwege.length} `
      + `Holzwegen. Ohne ${ihn} hätte das Level eine zweite Lösung: ${teile.join(', ')}.`;
    const strahlbilder = { licht, alle: suche.strahlbilder };
    funde.push({ element, strahlbilder, holzwege: { licht: irre, alle: holzwege.length }, zweiteLoesung, begruendung });
  }
  return funde;
});

export default { teil: 'kernideen', begriff: 'Lockvogel', teuer: true, beurteile: lockvoegel };
