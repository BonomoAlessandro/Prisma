// Kernidee „Falle“ (Glossar): eine naheliegende Stellung eines Prismas oder Spiegels, die in die Irre führt. Review 6
// zu einem Kandidaten: „Falle «Rot direkt ins Gelb». Richtig ist Grün direkt und Rot über einen Spiegel.“
// - Naheliegend ist eine Stellung wie beim Abschalten (zwischenstaende, abschalten.mjs): Eine Quelle erfüllt ein Ziel
//   allein über einen kurzen Strang, kürzer als der Weg zum Ziel in der Lösung, und kein Ziel bekommt dabei falsches
//   Licht. Mindestens ein Spiegel oder Prisma darin steht in der Lösung anders: Diese Stellung führt in die Irre.
// - Abgrenzung gegen Abschalten: Beide gehen von demselben Zwischenstand aus, und es entscheidet, was die Lösung mit
//   seinem Licht macht. Nimmt sie es dem Ziel weg (die Quelle erfüllt es in der Lösung nicht mehr), ist es Abschalten:
//   Das leuchtende Ziel ist falsch. Bringt sie dasselbe Licht derselben Quelle auf einem anderen, längeren Weg hin, ist
//   es eine Falle: Das Ziel ist richtig, nur der kurze Weg nicht. So gilt für einen Zwischenstand nie beides, und
//   Abschalten bleibt, wie es Ticket 10 zählt.
// - In die Irre führt sie (nötig), wenn sie in einen Holzweg führt und Folgern sie nicht gleich verrät:
//   - Eine weite Fast-Lösung der Suche ohne Abschneiden enthält sie (suche.mjs, mindestens WEIT Elemente anders als in
//     der Lösung, schliessen.mjs): Wer bei ihr bleibt, bringt alle Ziele bis auf eines zum Leuchten und steht doch weit
//     von der Lösung.
//   - Das Spielermodell mit Horizont 2 widerlegt sie nicht auf den ersten Blick (aufDenErstenBlick, spielermodell.mjs):
//     Sonst sähe ein Spieler, der zwei Elemente weit denkt, sofort, dass ein Ziel dann sein Licht nicht mehr bekommt.
//   Sonst ist die Falle bloss dekorativ.
// - Teuer wegen der Suche ohne Abschneiden.
import { L } from '../../solver.mjs';
import { loesung } from '../loesungsstellung.mjs';
import { zwischenstaende } from './abschalten.mjs';
import { gegenprobe, nurQuelle, FARBNAME, liste } from '../noetig.mjs';
import { sucheOhneAbschneiden } from '../suche.mjs';
import { aufDenErstenBlick } from '../spielermodell.mjs';
import { WEIT } from '../schliessen.mjs';

/**
 * Nötige Fallen, je Ziel die mit dem kürzesten Zwischenstand: { ziel, farbe, quelle, stellung: { Zelle: Stellung } des
 * Zwischenstands, falsch: Zellen der Spiegel und Prismen darin, die in der Lösung anders stehen, holzweg: { ziel: Zelle des
 * Ziels, das dort nicht leuchtet, abstand } der weitesten Fast-Lösung mit dieser Stellung, begruendung }.
 */
export const fallen = (ctx) => ctx.merke(fallen, () => {
  const { level, feldform } = ctx;
  const element = new Map(level.elements.map(e => [feldform.zelle(e), e]));
  const gleich = (z, a, b) => a % feldform.stellungen(element.get(z)).length === b % feldform.stellungen(element.get(z)).length;
  const { fastLoesungen } = sucheOhneAbschneiden(ctx);
  const funde = new Map();
  for (const z of zwischenstaende(ctx)) {
    const bisher = funde.get(z.ziel);
    if (bisher && Object.keys(bisher.stellung).length <= Object.keys(z.stellung).length) continue;
    if (gegenprobe(ctx, nurQuelle(ctx, z.quelle)).includes(z.ziel)) continue; // Abschalten
    const falsch = Object.keys(z.stellung)
      .filter(c => ['mirror', 'prism'].includes(element.get(c).type) && !gleich(c, z.stellung[c], level.solution[c]));
    if (!falsch.length) continue;
    const enthalten = (f) => Object.entries(z.stellung).every(([c, v]) => f.stellung[c] !== undefined && gleich(c, f.stellung[c], v));
    const holzwege = fastLoesungen.filter(f => f.abstand >= WEIT && enthalten(f));
    if (!holzwege.length || aufDenErstenBlick(ctx, z.stellung)) continue;
    const weitester = holzwege.reduce((a, b) => (b.abstand > a.abstand ? b : a));
    funde.set(z.ziel, { ...z, falsch, holzweg: { ziel: weitester.ziel, abstand: weitester.abstand } });
  }
  return [...funde.values()].map(({ ziel, quelle, stellung, wegLoesung, falsch, holzweg }) => {
    const farbe = loesung(ctx).brett.elements.find(e => feldform.zelle(e) === ziel).color;
    const art = (c) => (element.get(c).type === 'prism' ? 'das Prisma' : 'der Spiegel');
    const begruendung = `Ziel (${ziel}) leuchtet schon in seinem ${FARBNAME[farbe]}, wenn Quelle (${quelle}) es über `
      + `${liste(Object.keys(stellung))} beliefert. Naheliegend, aber falsch: In der Lösung ${falsch.length === 1 ? 'steht' : 'stehen'} `
      + `${falsch.map(c => `${art(c)} (${c})`).join(' und ')} anders, und dasselbe Licht kommt über ${liste(wegLoesung)}. `
      + `Wer bei dieser Stellung bleibt, bringt alle Ziele ausser (${holzweg.ziel}) zum Leuchten und steht doch mit `
      + `${holzweg.abstand} Elementen anders als in der Lösung.`;
    return { ziel, farbe: L.COLOR_NAMES[farbe], quelle, stellung, falsch, holzweg, begruendung };
  });
});

export default { teil: 'kernideen', begriff: 'Falle', teuer: true, beurteile: fallen };
