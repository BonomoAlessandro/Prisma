// Haupt-Kernidee (Spec „Beurteilung“: nötige Kernideen, eine davon als Haupt-Kernidee; dieselbe kommt höchstens zweimal
// je 10 Level vor, Ticket 15). Sie ist eine eigene Regel mit eigenem Teil, weil sie die Funde aller sechs Kernideen
// braucht (Hinweis aus Ticket 06).
// - Regel: Unter den nötigen Kernideen ist es die, die dem Schliessen am meisten abverlangt, nach der festen RANGFOLGE.
//   Sie geht davon aus, wie viel der Spieler folgern muss, statt es am Feld abzulesen:
//   - Falle: Das Feld führt aktiv in die Irre; die naheliegende Stellung führt in einen Holzweg, und das Spielermodell
//     widerlegt sie nicht auf den ersten Blick (so verlangt es die Erkennung).
//   - Abschalten: Die Lösung zerstört ein Ziel, das schon leuchtet, gegen den Augenschein (Review 6 zu 141 Morgenröte:
//     „stärkstes Aha“).
//   - Farben abzählen: Der Verlust zeigt sich an keinem einzelnen Ziel, nur das Abzählen über alle zeigt ihn.
//   - Sammelstelle: Ein Prisma muss mehreren Zuläufen zugleich dienen; das koppelt Stränge, ist aber an ihm zu sehen.
//   - Lockvogel: Der falsche Weg zeigt sein Ende, sobald Licht auf das Teil fällt.
//   - Mischziel aus zwei Quellen: Die Farbe des Ziels und der Quellen verrät es.
//   Unter mehreren Funden derselben Kernidee zählt der erste.
// - Warum keine gemessene Rangfolge: Gibt man dem Spielermodell die Elemente einer Kernidee vor, fallen auf den 150
//   heutigen Leveln immer alle Fallunterscheidungen weg, gleich welche Kernidee; das trennt nicht. Zählt man
//   Folgerungen oder Fast-Lösungen an ihren Elementen oder Zielen, misst man vor allem ihre Grösse, und Farben abzählen
//   mit drei und mehr Zielen gewönne fast immer. Die Gewichte des Spielwerts (Ticket 13) können die Rangfolge ersetzen.
// - Ohne nötige Kernidee gibt es keine Haupt-Kernidee (begriff null). Weil sie Falle und Lockvogel braucht, ist die
//   Regel teuer.
import { mischzieleAusZweiQuellen } from './kernideen/mischziel-zwei-quellen.mjs';
import { abschalten } from './kernideen/abschalten.mjs';
import { farbenAbzaehlen } from './kernideen/farben-abzaehlen.mjs';
import { sammelstellen } from './kernideen/sammelstelle.mjs';
import { fallen } from './kernideen/falle.mjs';
import { lockvoegel } from './kernideen/lockvogel.mjs';

/** Rangfolge der Kernideen für die Haupt-Kernidee, die erste zuerst (Begründung oben). */
export const RANGFOLGE = [
  ['Falle', fallen], ['Abschalten', abschalten], ['Farben abzählen', farbenAbzaehlen], ['Sammelstelle', sammelstellen],
  ['Lockvogel', lockvoegel], ['Mischziel aus zwei Quellen', mischzieleAusZweiQuellen],
];

const und = (namen) => (namen.length > 1 ? `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)}` : namen.join(''));

/**
 * Die Haupt-Kernidee eines Levels, einmal je Beurteilung: { begriff: Glossarbegriff oder null, fund: ihr Fund wie in
 * kernideen (mit begriff) oder null, weitere: Begriffe der übrigen nötigen Kernideen in der Rangfolge, begruendung }.
 */
export const hauptKernidee = (ctx) => ctx.merke(hauptKernidee, () => {
  const noetig = RANGFOLGE.map(([begriff, funde]) => [begriff, funde(ctx)]).filter(([, f]) => f.length);
  if (!noetig.length) {
    return { begriff: null, fund: null, weitere: [], begruendung: 'Das Level hat keine nötige Kernidee, also keine Haupt-Kernidee.' };
  }
  const [[begriff, [fund]], ...rest] = noetig;
  const weitere = rest.map(([b]) => b);
  const begruendung = `${begriff}${weitere.length ? ` vor ${und(weitere)}` : ''}: ${fund.begruendung}`;
  return { begriff, fund: { begriff, ...fund }, weitere, begruendung };
});

export default { teil: 'hauptKernidee', teuer: true, beurteile: hauptKernidee };
