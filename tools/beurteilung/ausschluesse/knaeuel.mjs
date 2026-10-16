// Knäuel (Glossar): so viele Elemente so dicht beieinander, dass das Feld unübersichtlich wird. Gilt in allen
// Schwierigkeitsgraden. Zwei Fälle (Spec, Tabelle der Ausschlussgründe), beide über die Nachbarn der Feldform:
// - benachbart: Paare benachbarter drehbarer Elemente (auch schräg) je drehbares Element, über 1,30;
// - kurz: Anteil kurzer Strahlabschnitte in der Lösungsstellung über 0,85, nur bei Leveln mit mindestens 12
//   Abschnitten. Kurz ist ein Abschnitt, der in einer Nachbarzelle seines Anfangs endet (auch schräg). Gezählt werden
//   die Abschnitte im Feld, ohne das Auslaufen über die Feldkante.
// Beide Werte sind wie in der Neuzählung der Spec auf zwei Stellen gerundet; genau 1,30 und genau 0,85 bestehen.
import { loesung } from '../loesungsstellung.mjs';

const GRENZE_BENACHBART = 1.3, GRENZE_KURZ = 0.85, MIN_ABSCHNITTE = 12;
const zweiStellen = (x) => Math.round(x * 100) / 100;
const komma = (x) => x.toFixed(2).replace('.', ',');

/** Knäuel der Lösungsstellung, je Fall { fall: 'benachbart' oder 'kurz', wert, begruendung }. */
function knaeuel(ctx) {
  const { feldform } = ctx;
  const funde = [];
  const drehbar = ctx.level.elements.filter(e => feldform.stellungen(e).length).map(feldform.zelle);
  const drehbareNachbarn = drehbar.map(z => feldform.nachbarn(z).filter(n => drehbar.includes(n)).length);
  const benachbart = zweiStellen(drehbareNachbarn.reduce((a, b) => a + b, 0) / 2 / Math.max(1, drehbar.length));
  if (benachbart > GRENZE_BENACHBART) {
    const i = drehbareNachbarn.indexOf(Math.max(...drehbareNachbarn));
    const begruendung = `Benachbarte drehbare Elemente: ${komma(benachbart)} Paare je drehbares Element, über `
      + `${komma(GRENZE_BENACHBART)}; am dichtesten ${drehbar[i]} mit ${drehbareNachbarn[i]} drehbaren Nachbarn`;
    funde.push({ fall: 'benachbart', wert: benachbart, begruendung });
  }
  const abschnitte = loesung(ctx).strahlbild.segments.map(feldform.abschnitt).filter(a => a.bis !== null);
  const kurze = abschnitte.filter(a => feldform.nachbarn(a.von).includes(a.bis)).length;
  const kurz = zweiStellen(kurze / Math.max(1, abschnitte.length));
  if (abschnitte.length >= MIN_ABSCHNITTE && kurz > GRENZE_KURZ) {
    const begruendung = `Kurze Strahlabschnitte: Anteil ${komma(kurz)}, über ${komma(GRENZE_KURZ)}, `
      + `bei ${abschnitte.length} Abschnitten im Feld`;
    funde.push({ fall: 'kurz', wert: kurz, begruendung });
  }
  return funde;
}

export default { teil: 'ausschluesse', begriff: 'Knäuel', beurteile: knaeuel };
