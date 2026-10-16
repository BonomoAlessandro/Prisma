// Kernidee „Abschalten“ (Glossar): Ein Ziel bekommt falsches Licht, und die Lösung verlangt, dieses Licht wegzunehmen.
// Review 6 zu 141 Morgenröte: „Das erfüllte Ziel muss man zerstören.“
// - Zwischenstand: Eine Quelle erfüllt das Ziel allein (allein, noetig.mjs). Er besteht aus den drehbaren Elementen auf
//   dem Weg ihres Lichts zum Ziel (wegZu); alle übrigen sind noch offen.
// - Naheliegend ist er, wenn er ein kurzer Strang ist wie beim Füllteil (höchstens drei drehbare Elemente), weniger
//   drehbare Elemente braucht als der Weg des Lichts zum Ziel in der Lösung und kein Ziel dabei falsches Licht bekommt:
//   weder vom Zwischenstand noch von Licht, das ohnehin fliesst (die offenen Elemente schlucken dabei wie Blocker).
//   Ohne die Grenze von drei zählten auch Zwischenstände mit bis zu sieben Elementen (34 statt 24 Level).
// - Nötig (Gegenprobe mit nur dieser Quelle): In der Lösung erfüllt die Quelle das Ziel nicht mehr, ihr Licht muss also
//   weg; es war falsches Licht. Führt die Lösung dasselbe Licht nur auf anderem Weg zum Ziel, ist der Zwischenstand bloss
//   dekorativ (eher eine Falle, Ticket 11).
// - Licht in einer falschen Farbe ist kein naheliegender Zwischenstand: Das Ziel zeigt es sofort, und die Startstellung,
//   in der es oft vorkommt, ist zufällig verdreht.
import { L } from '../../solver.mjs';
import { jeQuelle } from '../loesungsstellung.mjs';
import { allein, brettIn, gegenprobe, nurQuelle, quellen, wegZu, FARBNAME, liste } from '../noetig.mjs';

/** Ein kurzer Strang hat höchstens so viele drehbare Elemente (Glossar „Füllteil“: höchstens drei Spiegel). */
const KURZ = 3;

/**
 * Naheliegende Zwischenstände, je Ziel und Quelle der kürzeste: [{ ziel, quelle, stellung: { Zelle: Stellung } der
 * Elemente auf dem Weg, wegLoesung: Zellen der drehbaren Elemente auf dem Weg zum Ziel in der Lösung }], auch die bloss
 * dekorativen (die Lösung bringt dem Ziel dasselbe Licht). Reihenfolge: Ziele und Quellen wie im Level.
 */
export const zwischenstaende = (ctx) => ctx.merke(zwischenstaende, () => {
  const moeglich = allein(ctx), out = [];
  for (const ziel of ctx.level.elements.filter(e => e.type === 'target').map(ctx.feldform.zelle)) {
    const wegLoesung = wegZu(ctx, ziel, ctx.level.elements, ctx.level.solution);
    if (wegLoesung.length < 2) continue; // kürzer geht es nicht: Ein Zwischenstand braucht mindestens ein Element
    for (const quelle of quellen(ctx)) {
      const elemente = ctx.level.elements.map(nurQuelle(ctx, quelle));
      const gesehen = new Set();
      let best = null;
      for (const voll of moeglich.get(quelle).belieferungen.get(ziel) || []) {
        const weg = wegZu(ctx, ziel, elemente, voll);
        const schluessel = weg.map(z => z + ':' + voll[z]).join(' ');
        const grenze = Math.min(best ? best.weg.length : wegLoesung.length, KURZ + 1);
        if (!weg.length || weg.length >= grenze || gesehen.has(schluessel)) continue;
        gesehen.add(schluessel);
        const stellung = Object.fromEntries(weg.map(z => [z, voll[z]]));
        if (naheliegend(ctx, ziel, stellung)) best = { weg, stellung };
      }
      if (best) out.push({ ziel, quelle, stellung: best.stellung, wegLoesung });
    }
  }
  return out;
});

/** Mit allen Quellen, nur der Stellung gesetzt und den übrigen drehbaren Elementen als Blocker: kein falsches Licht, Ziel erfüllt. */
function naheliegend(ctx, ziel, stellung) {
  const offen = (e) => L.isRotatable(e) && !(ctx.feldform.zelle(e) in stellung);
  const brett = brettIn(ctx, ctx.level.elements.map(e => (offen(e) ? { ...e, type: 'blocker' } : e)), stellung);
  const { hits } = L.traceBeams(brett);
  const ziele = brett.elements.filter(t => t.type === 'target');
  return ziele.every(t => !((hits.get(t.id) || 0) & ~t.color))
    && ziele.some(t => ctx.feldform.zelle(t) === ziel && hits.get(t.id) === t.color);
}

/**
 * Nötiges Abschalten: je Ziel der kürzeste Zwischenstand, dessen Licht die Lösung wegnimmt, als { ziel, farbe, quelle,
 * zwischenstand: { Zelle: Stellung }, licht: was die Quelle dem Ziel in der Lösung nicht mehr bringt, begruendung }.
 */
export const abschalten = (ctx) => ctx.merke(abschalten, () => {
  const funde = new Map();
  for (const z of zwischenstaende(ctx)) {
    const bisher = funde.get(z.ziel);
    if (bisher && Object.keys(bisher.stellung).length <= Object.keys(z.stellung).length) continue;
    if (gegenprobe(ctx, nurQuelle(ctx, z.quelle)).includes(z.ziel)) funde.set(z.ziel, z);
  }
  return [...funde.values()].map(({ ziel, quelle, stellung, wegLoesung }) => {
    const auf = (q) => jeQuelle(ctx).find(j => j.quelle === q);
    const beleuchtet = ({ brett, strahlbild }) => brett.elements.filter(t => t.type === 'target' && strahlbild.hits.get(t.id)).map(ctx.feldform.zelle);
    const { brett, strahlbild } = auf(quelle);
    const t = brett.elements.find(e => ctx.feldform.zelle(e) === ziel);
    const weg = t.color & ~(strahlbild.hits.get(t.id) || 0);
    const dort = beleuchtet({ brett, strahlbild });
    const von = jeQuelle(ctx).filter(j => beleuchtet(j).includes(ziel)).map(j => j.quelle);
    const n = Object.keys(stellung).length;
    const begruendung = `Ziel (${ziel}) leuchtet schon in seinem ${FARBNAME[t.color]}, wenn Quelle (${quelle}) es über `
      + `${liste(Object.keys(stellung))} beliefert, mit ${n === 1 ? 'einem drehbaren Element' : `${n} drehbaren Elementen`}; `
      + `die Lösung braucht dafür ${wegLoesung.length}: ${liste(wegLoesung)}. Sie nimmt ihm das ${FARBNAME[weg]} von (${quelle}) `
      + `wieder weg: (${quelle}) beliefert dort ${dort.length ? liste(dort) : 'kein Ziel'}, und (${ziel}) bekommt sein Licht `
      + `von ${liste(von)}.`;
    return { ziel, farbe: L.COLOR_NAMES[t.color], quelle, zwischenstand: stellung, licht: L.COLOR_NAMES[weg], begruendung };
  });
});

export default { teil: 'kernideen', begriff: 'Abschalten', beurteile: abschalten };
