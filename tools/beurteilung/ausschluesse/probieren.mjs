// Ausschlussgrund Probieren (Glossar, Spec „Beurteilung“, Tabelle der Ausschlussgründe), in allen Graden: Lösen durch
// Drehen, bis es passt, weil es viele Fast-Lösungen gibt und Folgern nicht weiterhilft. Zwei Fälle, je strikt grösser
// als die Schwelle:
// - Fast-Lösungen: Die weiten Fast-Lösungen machen mehr als 60 ‰ aller Strahlbilder der Suche ohne Abschneiden aus.
// - Raten: Das Spielermodell braucht mit vollem Überblick mehr als 6 Fallunterscheidungen oder eine Kette von mehr als
//   38 Folgerungen.
// Die Werte kommen aus den Teilwerten zum Schliessen (schliessen.mjs).
import { schliessen } from '../schliessen.mjs';

/**
 * Schwellen der Spec, an den heutigen Höchstwerten: Weite Fast-Lösungen haben höchstens 55,5 ‰ (74 Lichtnetz). Beim
 * Raten liegen 144 Spiegelkabinett mit kInf 6 und 135 Pulsar mit Kette 38 genau auf der Schwelle und bestehen.
 * Entscheid vom 16.10.2026 (Ticket 09): Vorher galten 4 und 28 aus dem Spielermodell der Reviews. Es ging die Elemente
 * in der Reihenfolge der Leveldaten durch, und seine Werte hingen davon ab. Die Beurteilung nimmt die feste Reihenfolge
 * der Zellen.
 */
export const SCHWELLEN = { promille: 60, kInf: 6, kette: 38 };

const zahl = (x) => x.toFixed(1).replace('.', ',');

export default {
  teil: 'ausschluesse', begriff: 'Probieren', teuer: true,
  beurteile(ctx) {
    const s = schliessen(ctx), f = s.fastLoesungen;
    const funde = [];
    if (f.promille > SCHWELLEN.promille) {
      funde.push({
        fall: 'Fast-Lösungen',
        begruendung: `${f.weite} von ${f.strahlbilder} Strahlbildern der Suche ohne Abschneiden sind weite Fast-Lösungen `
          + `(${zahl(f.promille)} ‰, mehr als ${SCHWELLEN.promille} ‰)${f.abgebrochen ? ', gezählt im durchsuchten Teil' : ''}`,
      });
    }
    const raten = [];
    if (s.kInf > SCHWELLEN.kInf) raten.push(`mit vollem Überblick ${s.kInf} Fallunterscheidungen (mehr als ${SCHWELLEN.kInf})`);
    if (s.kette > SCHWELLEN.kette) raten.push(`eine Kette von ${s.kette} Folgerungen (mehr als ${SCHWELLEN.kette})`);
    if (raten.length) funde.push({ fall: 'Raten', begruendung: `Raten: Das Spielermodell braucht ${raten.join(' und ')}` });
    return funde;
  },
};
