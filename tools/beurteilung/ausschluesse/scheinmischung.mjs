// Scheinmischung (Glossar): eine Mischung, die nichts bewirkt; sie sieht nach Farblogik aus, ist aber keine. Gilt in
// allen Schwierigkeitsgraden. Gemessen in der Lösungsstellung, je Kombinator mit Licht, in drei Fällen (Spec, Tabelle
// der Ausschlussgründe):
// (a) Er gibt einen Eingang unverändert aus oder hat nur einen beleuchteten Eingang. Beides zeigt seine Ausgabe: Sie
//     hat die Farbe eines Eingangsstrahls. Aus einer Richtung trifft ihn im Strahlbild nur ein Strahl (derselbe Strahl
//     läuft nur einmal, und zwei Farben laufen nie denselben Weg in dieselbe Richtung); einen einzigen Eingang gibt er
//     also unverändert aus.
// (b) Seine Mischung läuft direkt, ohne Spiegel dazwischen, in ein Prisma, das genau die eingehenden Strahlen wieder
//     trennt: Jeder Eingangsstrahl hat eine Grundfarbe. Gezählt wird nach Strahlen, nicht nach Quellen; drei Strahlen
//     Rot, Grün und Blau, zwei davon aus derselben Quelle, trennt das Prisma genau wieder (Fall Zenit). Bringt ein
//     Eingang schon eine Mischung, zerlegt das Prisma mehr, als hineinkam: Das besteht.
// (c) Seine Mischung läuft, auch über Spiegel, in einen Filter, der davon nur die Farbe eines Eingangsstrahls
//     durchlässt.
// Trägt nur eine Quelle die Mischung, ist das kein Ausschluss: Die Quellen zählen hier nicht.
import { L, getRot } from '../../solver.mjs';
import { brettInLoesung, loesung } from '../loesungsstellung.mjs';

const FARBEN = ['keine', 'Rot', 'Grün', 'Gelb', 'Blau', 'Magenta', 'Cyan', 'Weiss'];
/** Genau eine Grundfarbe. */
const isPrimary = (farbe) => farbe !== 0 && (farbe & (farbe - 1)) === 0;
/** „Rot, Grün und Blau“ */
const aufzaehlung = (farben) => farben.map(f => FARBEN[f]).join(', ').replace(/, ([^,]*)$/, ' und $1');

/**
 * Wohin die Mischung eines Kombinators läuft: { ereignis, spiegel } mit dem ersten Ereignis der Strahlregel nach ihm,
 * das keine Spiegelung ist (am ersten Element, das kein Spiegel ist, oder an der Feldkante), und der Zahl der Spiegel
 * davor; null nur, wenn die Strahlregel vorher an ihrer Obergrenze abbricht. kombinator: vom Brett der Lösungsstellung.
 * Gerechnet im Strahlbild, in dem nur die Mischung leuchtet: Der Kombinator wird zur Quelle in ihrer Farbe und seiner
 * Richtung, die übrigen Quellen und Kombinatoren werden zu Blockern. Dort folgen die Ereignisse dem einen Strahl: erst
 * die Spiegel, dann dieses Element (oder die Feldkante).
 */
function weg(ctx, kombinator, farbe) {
  const elemente = ctx.level.elements.map((e, i) => {
    if (i === kombinator.id) return { ...ctx.feldform.quelleStatt(e, getRot(kombinator)), color: L.COLOR_NAMES[farbe] };
    return e.type === 'source' || e.type === 'combiner' ? { ...e, type: 'blocker' } : e;
  });
  const { events } = L.traceBeams(brettInLoesung(ctx, elemente));
  const spiegel = events.findIndex(e => e.kind !== 'reflect');
  return spiegel < 0 ? null : { ereignis: events[spiegel], spiegel };
}

/** Scheinmischungen der Lösungsstellung, je Kombinator und Fall { element (seine Zelle), fall, begruendung }. */
function scheinmischungen(ctx) {
  const { brett, strahlbild } = loesung(ctx);
  const zelle = (id) => ctx.feldform.zelle(brett.elements[id]);
  const funde = [];
  for (const k of brett.elements.filter(e => e.type === 'combiner')) {
    const ein = strahlbild.events.filter(e => e.kind === 'merge' && e.element === k.id).map(e => e.color).sort((a, b) => a - b);
    if (!ein.length) continue;
    const aus = strahlbild.mixes.get(k.id), element = zelle(k.id), name = `Kombinator ${element}`;
    if (ein.includes(aus)) {
      const begruendung = ein.length === 1
        ? `${name} hat nur einen beleuchteten Eingang (${FARBEN[aus]}) und gibt ihn unverändert aus (Fall a)`
        : `${name} gibt seinen Eingang ${FARBEN[aus]} unverändert aus (${ein.map(f => FARBEN[f]).join(' + ')} = ${FARBEN[aus]}) (Fall a)`;
      funde.push({ element, fall: 'a', begruendung });
    }
    if (isPrimary(aus)) continue;
    const w = weg(ctx, k, aus);
    if (!w) continue;
    const { ereignis, spiegel } = w, mischung = `${name}: Die Mischung ${FARBEN[aus]} läuft`;
    if (ereignis.kind === 'refract' && spiegel === 0 && ein.every(isPrimary)) {
      const begruendung = `${mischung} direkt in das Prisma ${zelle(ereignis.element)}, das sie wieder in die eingehenden `
        + `Strahlen ${aufzaehlung([...new Set(ein)])} trennt (Fall b)`;
      funde.push({ element, fall: 'b', begruendung });
    }
    if (ereignis.kind === 'filter' && ereignis.color !== aus && ein.includes(ereignis.color)) {
      const begruendung = `${mischung} ${spiegel ? `über ${spiegel} Spiegel ` : ''}in den Filter ${zelle(ereignis.element)}, `
        + `der nur den Eingang ${FARBEN[ereignis.color]} durchlässt (Fall c)`;
      funde.push({ element, fall: 'c', begruendung });
    }
  }
  return funde;
}

export default { teil: 'ausschluesse', begriff: 'Scheinmischung', beurteile: scheinmischungen };
