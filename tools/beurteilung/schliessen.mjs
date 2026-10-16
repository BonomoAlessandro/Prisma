// Schliessen (Glossar): die Teilwerte dazu, wie weit Folgern trägt und wie viel zum Probieren verleitet. Sie sind die
// Grundlage für den Ausschlussgrund Probieren und später für Schwierigkeit und Spielwert (Spec: „Schliessen misst das
// Spielermodell“).
// - Aus dem Spielermodell (spielermodell.mjs): die Horizonte k2 und kInf als Zahl der Fallunterscheidungen mit Horizont
//   2 bzw. mit vollem Überblick, die längste Kette mit vollem Überblick und die Fallunterscheidungen selbst.
// - Aus der Suche ohne Abschneiden (suche.mjs): die weiten Fast-Lösungen, Strahlbilder mit genau einem falschen Ziel,
//   in denen mindestens WEIT drehbare Elemente anders stehen als in der Lösung, und ihr Anteil an allen Strahlbildern.
// Wegen der Suche ist Schliessen eine teure Regel. Wer nur die Werte des Spielermodells braucht, etwa die Schwierigkeit,
// ruft spielermodell(ctx) selbst auf: Das rechnet auf den 150 heutigen Leveln zusammen gut 1 s, die Suche rund 25 s.
import { spielermodell } from './spielermodell.mjs';
import { sucheOhneAbschneiden } from './suche.mjs';

/** Eine Fast-Lösung ist weit, wenn so viele drehbare Elemente anders stehen als in der Lösung (wie im Vorsieb). */
export const WEIT = 3;

/**
 * Teilwerte zum Schliessen, einmal je Beurteilung:
 *   k2, kInf:             Fallunterscheidungen mit Horizont 2 bzw. mit vollem Überblick
 *   steckt:               mit Horizont 2 bringt keine Fallunterscheidung das Spielermodell weiter (k2 zählt bis dahin)
 *   kette:                längste Kette mit vollem Überblick (Folgerungen bis zum Widerspruch eines Falls), 0 ohne
 *   geloest:              mit vollem Überblick sind am Ende alle drehbaren Elemente entschieden
 *   fallunterscheidungen: { k2, kInf }, je [{ element: Zelle, faelle, widerlegt: Stellungen, ketten }]
 *   fastLoesungen:        { alle, weite, strahlbilder, promille: Anteil der weiten an allen Strahlbildern in ‰, abgebrochen }
 */
export const schliessen = (ctx) => ctx.merke(schliessen, () => {
  const { k2, kInf } = spielermodell(ctx);
  const suche = sucheOhneAbschneiden(ctx);
  const weite = suche.fastLoesungen.filter(f => f.abstand >= WEIT).length;
  return {
    k2: k2.fallunterscheidungen.length,
    steckt: k2.steckt,
    kInf: kInf.fallunterscheidungen.length,
    kette: Math.max(0, ...kInf.fallunterscheidungen.flatMap(f => f.ketten)),
    geloest: kInf.geloest,
    fallunterscheidungen: { k2: k2.fallunterscheidungen, kInf: kInf.fallunterscheidungen },
    fastLoesungen: {
      alle: suche.fastLoesungen.length, weite, strahlbilder: suche.strahlbilder,
      promille: (1000 * weite) / suche.strahlbilder, abgebrochen: suche.abgebrochen,
    },
  };
});

export default { teil: 'schliessen', teuer: true, beurteile: schliessen };
